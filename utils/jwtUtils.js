import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-please-set-env-var';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Generate JWT token for devadmin
 * @param {string} username - DevAdmin username
 * @returns {string} JWT token
 */
export function generateDevAdminToken(username) {
  return jwt.sign(
    {
      username,
      role: 'devadmin',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token payload or null if invalid
 */
export function verifyDevAdminToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure it's a devadmin token
    if (decoded.role !== 'devadmin') {
      console.warn('Token is valid but not a devadmin role');
      return null;
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('Invalid token signature');
    } else {
      console.error('Token verification error:', error.message);
    }
    return null;
  }
}

/**
 * Set httpOnly cookie with JWT token
 * IMPORTANT: This is the ONLY way tokens should be stored (no localStorage!)
 * @param {object} res - Express response object
 * @param {string} token - JWT token
 */
export function setDevAdminCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('devadmin_token', token, {
    httpOnly: true,              // Prevents XSS attacks - JavaScript cannot access
    secure: isProduction,        // HTTPS only in production
    sameSite: 'strict',          // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    path: '/'                    // Available across entire app
  });
}

/**
 * Clear devadmin cookie (for logout)
 * @param {object} res - Express response object
 */
export function clearDevAdminCookie(res) {
  res.clearCookie('devadmin_token', {
    httpOnly: true,
    path: '/'
  });
}

/**
 * Extract token from request (from cookie)
 * @param {object} req - Express request object
 * @returns {string|null} JWT token or null
 */
export function extractTokenFromRequest(req) {
  // Only get token from httpOnly cookie (secure method)
  return req.cookies?.devadmin_token || null;
}
