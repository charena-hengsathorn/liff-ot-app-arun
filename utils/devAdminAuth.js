import bcrypt from 'bcryptjs';

/**
 * Validate devadmin credentials against environment variables
 * SECURITY: Password is hashed with bcrypt, never stored in plain text
 *
 * Environment variables required:
 * - DEVADMIN_USERNAME: The devadmin username
 * - DEVADMIN_PASSWORD_HASH: Bcrypt hash of the password
 *
 * @param {string} username - Submitted username
 * @param {string} password - Submitted password (plain text)
 * @returns {Promise<boolean>} True if credentials are valid
 */
export async function validateDevAdminCredentials(username, password) {
  try {
    // Get credentials from environment variables
    const envUsername = process.env.DEVADMIN_USERNAME;
    const envPasswordHash = process.env.DEVADMIN_PASSWORD_HASH;

    // Security check: Ensure environment variables are set
    if (!envUsername || !envPasswordHash) {
      console.error('⚠️ DEVADMIN credentials not configured in environment variables');
      console.error('Please set: DEVADMIN_USERNAME and DEVADMIN_PASSWORD_HASH');
      return false;
    }

    // Check username (case-sensitive)
    if (username !== envUsername) {
      console.log('❌ DevAdmin login failed: Invalid username');
      return false;
    }

    // Check password against bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, envPasswordHash);

    if (!isPasswordValid) {
      console.log('❌ DevAdmin login failed: Invalid password');
      return false;
    }

    console.log('✅ DevAdmin login successful:', username);
    return true;

  } catch (error) {
    console.error('❌ Error validating devadmin credentials:', error);
    return false;
  }
}

/**
 * Generate bcrypt hash for a password
 * This is a utility function for setting up the initial password hash
 * Usage: node -e "import('./utils/devAdminAuth.js').then(m => m.generatePasswordHash('your_password'))"
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Bcrypt hash
 */
export async function generatePasswordHash(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('\n📋 Copy this hash to your DEVADMIN_PASSWORD_HASH environment variable:');
  console.log(hash);
  console.log('');
  return hash;
}

/**
 * Check if devadmin is properly configured
 * @returns {boolean} True if devadmin credentials are set in environment
 */
export function isDevAdminConfigured() {
  return !!(process.env.DEVADMIN_USERNAME && process.env.DEVADMIN_PASSWORD_HASH);
}
