/**
 * Environment Guard Utilities
 *
 * Prevents non-DevAdmin users from accessing development environment
 * - Regular users are locked to 'prod' environment
 * - Only DevAdmin can access 'dev' environment
 *
 * SECURITY: This is enforced on both frontend AND backend
 * - Frontend: Prevents UI access
 * - Backend: Validates environment parameter in API calls
 */

/**
 * Get allowed environment based on DevAdmin status
 * @param {string} requestedEnv - Requested environment ('dev' or 'prod')
 * @param {boolean} isDevAdmin - Whether user is authenticated as DevAdmin
 * @returns {string} - Allowed environment ('dev' or 'prod')
 *
 * Logic:
 * - If NOT DevAdmin: Always return 'prod' (locked)
 * - If DevAdmin: Return requested environment (can choose)
 */
export function getEnvironment(requestedEnv, isDevAdmin) {
  // Non-DevAdmin users are locked to production
  if (!isDevAdmin) {
    if (requestedEnv === 'dev') {
      console.warn('⚠️ Non-DevAdmin attempting to access dev environment. Forcing prod.');
    }
    return 'prod';
  }

  // DevAdmin can choose any environment
  return requestedEnv || 'prod';
}

/**
 * Check if user can access development environment
 * @param {boolean} isDevAdmin - Whether user is authenticated as DevAdmin
 * @returns {boolean} - True if user can access dev environment
 */
export function canAccessDevEnvironment(isDevAdmin) {
  return isDevAdmin === true;
}

/**
 * Validate environment access attempt
 * @param {string} env - Requested environment ('dev' or 'prod')
 * @param {boolean} isDevAdmin - Whether user is authenticated as DevAdmin
 * @returns {boolean} - True if access is allowed
 *
 * Use this before allowing environment changes in UI
 */
export function validateEnvironmentAccess(env, isDevAdmin) {
  if (env === 'dev' && !isDevAdmin) {
    console.warn('❌ Unauthorized dev environment access attempt blocked');
    return false;
  }

  return true;
}

/**
 * Get safe environment with logging
 * Use this in API calls to ensure correct environment
 *
 * @param {string} requestedEnv - Requested environment
 * @param {boolean} isDevAdmin - DevAdmin status
 * @param {string} context - Context for logging (e.g., 'submit', 'fetchDrivers')
 * @returns {string} - Safe environment to use
 */
export function getSafeEnvironment(requestedEnv, isDevAdmin, context = 'API call') {
  const safeEnv = getEnvironment(requestedEnv, isDevAdmin);

  if (requestedEnv !== safeEnv) {
    console.log(
      `🔒 Environment guard: ${context} - ` +
      `Requested: ${requestedEnv}, ` +
      `Allowed: ${safeEnv} ` +
      `(DevAdmin: ${isDevAdmin})`
    );
  }

  return safeEnv;
}

/**
 * Environment configuration constants
 */
export const ENV_CONFIG = {
  DEV: 'dev',
  PROD: 'prod',
  DEFAULT: 'prod' // Default for non-DevAdmin
};

export default {
  getEnvironment,
  canAccessDevEnvironment,
  validateEnvironmentAccess,
  getSafeEnvironment,
  ENV_CONFIG
};
