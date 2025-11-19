/**
 * Centralized API Configuration
 *
 * This file provides a single source of truth for API endpoints.
 * All components should import and use these functions.
 *
 * Environment Variables (set in Vercel/local .env):
 * - VITE_API_BASE_URL_DEV: Development API URL (default: http://localhost:3001)
 * - VITE_API_BASE_URL_PROD: Production API URL (default: Heroku backend)
 */

/**
 * Get the base URL for API calls based on environment
 * @returns {string} The API base URL
 */
export const getAPIBaseURL = () => {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    // Development: Use VITE_API_BASE_URL_DEV or fallback to localhost
    return import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:3001';
  } else {
    // Production: Use VITE_API_BASE_URL_PROD or fallback to Heroku
    return import.meta.env.VITE_API_BASE_URL_PROD || 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com';
  }
};

/**
 * Get full API endpoint URL
 * @param {string} endpoint - The API endpoint path (e.g., '/api/drivers')
 * @returns {string} Complete URL
 */
export const getAPIEndpoint = (endpoint) => {
  const baseURL = getAPIBaseURL();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
};

/**
 * Check if we're in development mode
 * @returns {boolean}
 */
export const isDevelopment = () => import.meta.env.DEV;

/**
 * Check if we're in production mode
 * @returns {boolean}
 */
export const isProduction = () => import.meta.env.PROD;

/**
 * Get current environment name
 * @returns {string} 'development' or 'production'
 */
export const getEnvironment = () => {
  return isDevelopment() ? 'development' : 'production';
};

/**
 * Configuration object (for compatibility with existing code)
 */
export const apiConfig = {
  baseURL: getAPIBaseURL(),
  endpoints: {
    // Backend API endpoints
    submit: '/submit',
    clockEvent: '/clock-event',
    checkExisting: '/check-existing',
    sheets: '/sheets',
    notifyLine: '/notify-line',

    // Driver API endpoints
    drivers: '/api/drivers',
    driversManagerView: '/api/drivers/manager-view',
    upload: '/api/upload',

    // Auth endpoints
    auth: '/auth',
    authDevAdmin: '/auth/devadmin',
    verifyDevAdmin: '/auth/verify-devadmin',
    logoutDevAdmin: '/auth/logout-devadmin',
    login: '/login',
    logout: '/logout',
    me: '/me',

    // Strapi endpoints
    attendances: '/api/attendances',

    // Utility endpoints
    health: '/health',
    createMonthlySheet: '/create-monthly-sheet',
    getSheets: '/get-sheets',
    updateDayOfWeek: '/update-day-of-week'
  }
};

// Export default for convenience
export default {
  getAPIBaseURL,
  getAPIEndpoint,
  isDevelopment,
  isProduction,
  getEnvironment,
  ...apiConfig
};
