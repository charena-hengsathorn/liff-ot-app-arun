import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage DevAdmin authentication state
 *
 * SECURITY: Uses httpOnly cookies for token storage (XSS-safe)
 * - Token is NEVER stored in localStorage
 * - Token is automatically sent with all requests via cookies
 * - Frontend only tracks authentication state (true/false)
 *
 * @returns {Object} DevAdmin state and functions
 * - isDevAdmin: boolean - Whether user is authenticated as DevAdmin
 * - loading: boolean - Whether authentication check is in progress
 * - user: object|null - DevAdmin user info
 * - login: function - Login with username/password
 * - logout: function - Logout and clear session
 * - checkAuth: function - Manually check authentication status
 */
export function useDevAdmin() {
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Determine API base URL (same logic as StyledForm.jsx)
  const getApiBaseUrl = () => {
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocalDev
      ? 'http://localhost:3001'
      : 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com';
  };

  const API_BASE_URL = getApiBaseUrl();

  /**
   * Check if user is authenticated as DevAdmin
   * Called on mount and after login
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/verify-devadmin`, {
        method: 'GET',
        credentials: 'include', // IMPORTANT: Sends httpOnly cookies
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsDevAdmin(true);
          setUser(data.user);
          console.log('✅ DevAdmin authenticated:', data.user.username);
        } else {
          setIsDevAdmin(false);
          setUser(null);
        }
      } else {
        // Not authenticated (token missing, invalid, or expired)
        setIsDevAdmin(false);
        setUser(null);
      }
    } catch (err) {
      console.error('❌ DevAdmin auth check failed:', err);
      setIsDevAdmin(false);
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  /**
   * Login as DevAdmin
   * @param {string} username - DevAdmin username
   * @param {string} password - DevAdmin password
   * @returns {Promise<Object>} - Login result { success: boolean, message?: string }
   */
  const login = useCallback(async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/devadmin`, {
        method: 'POST',
        credentials: 'include', // IMPORTANT: Receives httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsDevAdmin(true);
        setUser(data.user);
        console.log('✅ DevAdmin logged in:', data.user.username);
        return { success: true };
      } else {
        setIsDevAdmin(false);
        setUser(null);
        const message = data.message || 'Login failed';
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      console.error('❌ DevAdmin login failed:', err);
      setIsDevAdmin(false);
      setUser(null);
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  /**
   * Logout DevAdmin
   * Clears httpOnly cookie on backend
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/logout-devadmin`, {
        method: 'POST',
        credentials: 'include', // IMPORTANT: Sends cookies to be cleared
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setIsDevAdmin(false);
        setUser(null);
        console.log('✅ DevAdmin logged out');
        return { success: true };
      } else {
        const data = await response.json();
        const message = data.message || 'Logout failed';
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      console.error('❌ DevAdmin logout failed:', err);
      // Even if logout fails on backend, clear frontend state
      setIsDevAdmin(false);
      setUser(null);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isDevAdmin,
    loading,
    user,
    error,
    login,
    logout,
    checkAuth
  };
}

export default useDevAdmin;
