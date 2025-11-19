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
   * Check if current Strapi user is DevAdmin
   * Based on username or role
   */
  const checkAuth = useCallback(() => {
    try {
      setLoading(true);

      // Get Strapi user from localStorage (existing authentication)
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

      // Check if user is DevAdmin
      // Method 1: Check username
      const isDevAdminUser = userData.username === 'devadmin' ||
                            userData.username === 'admin' ||
                            userData.email === 'devadmin@example.com';

      // Method 2: Check role (if Strapi user has role information)
      // const hasDevAdminRole = userData.role?.name === 'DevAdmin' ||
      //                         userData.role?.type === 'devadmin';

      if (isDevAdminUser) {
        setIsDevAdmin(true);
        console.log('✅ DevAdmin user detected:', userData.username);
      } else {
        setIsDevAdmin(false);
        console.log('ℹ️ Regular user:', userData.username);
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
