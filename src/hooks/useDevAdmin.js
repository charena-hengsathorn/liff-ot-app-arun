import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to check DevAdmin status based on logged-in Strapi user
 *
 * IMPORTANT: This does NOT create separate authentication!
 * - Checks the existing Strapi user from localStorage
 * - If username matches DevAdmin criteria, isDevAdmin = true
 * - No separate login required
 *
 * @returns {Object} DevAdmin state
 * - isDevAdmin: boolean - Whether current Strapi user is DevAdmin
 * - loading: boolean - Whether check is in progress
 * - user: object|null - Current Strapi user info
 */
export function useDevAdmin() {
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  /**
   * Check if current user is DevAdmin
   * Based on isDevAdmin flag set during login
   */
  const checkAuth = useCallback(() => {
    try {
      setLoading(true);

      // Get user from localStorage (set during login)
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        // Not logged in
        setIsDevAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = JSON.parse(storedUser);
      setUser(userData);

      // Check isDevAdmin flag (set during login after backend validation)
      // Backend validates credentials against env vars
      if (userData.isDevAdmin === true) {
        setIsDevAdmin(true);
        console.log('✅ DevAdmin user detected');
      } else {
        setIsDevAdmin(false);
        console.log('ℹ️ Regular user');
      }

    } catch (err) {
      console.error('❌ DevAdmin check failed:', err);
      setIsDevAdmin(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);


  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isDevAdmin,
    loading,
    user,
    checkAuth
  };
}

export default useDevAdmin;
