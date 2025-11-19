import { createContext, useContext } from 'react';
import { useDevAdmin } from '../hooks/useDevAdmin';

/**
 * DevAdmin Context
 * Provides global access to DevAdmin authentication state
 *
 * Usage:
 * 1. Wrap your app with <DevAdminProvider>
 * 2. Use useDevAdminContext() hook to access state
 *
 * Example:
 * ```jsx
 * import { DevAdminProvider, useDevAdminContext } from './contexts/DevAdminContext';
 *
 * function App() {
 *   return (
 *     <DevAdminProvider>
 *       <YourComponents />
 *     </DevAdminProvider>
 *   );
 * }
 *
 * function SomeComponent() {
 *   const { isDevAdmin, login, logout } = useDevAdminContext();
 *   return <div>{isDevAdmin ? 'Dev Tools' : 'Hidden'}</div>;
 * }
 * ```
 */

const DevAdminContext = createContext(null);

/**
 * DevAdmin Provider Component
 * Wraps app and provides DevAdmin state to all children
 */
export function DevAdminProvider({ children }) {
  const devAdminState = useDevAdmin();

  return (
    <DevAdminContext.Provider value={devAdminState}>
      {children}
    </DevAdminContext.Provider>
  );
}

/**
 * Hook to access DevAdmin context
 * Must be used within DevAdminProvider
 *
 * @returns {Object} DevAdmin state and functions
 * - isDevAdmin: boolean
 * - loading: boolean
 * - user: object|null
 * - error: string|null
 * - login: function(username, password)
 * - logout: function()
 * - checkAuth: function()
 *
 * @throws {Error} If used outside DevAdminProvider
 */
export function useDevAdminContext() {
  const context = useContext(DevAdminContext);

  if (!context) {
    throw new Error(
      'useDevAdminContext must be used within DevAdminProvider. ' +
      'Wrap your app with <DevAdminProvider>...</DevAdminProvider>'
    );
  }

  return context;
}

// Export both named and default
export default DevAdminProvider;
