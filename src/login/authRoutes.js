/**
 * Reusable Authentication Routes
 * Can be imported into any Express app
 * 
 * Usage:
 * import { setupAuthRoutes } from './login/authRoutes.js';
 * setupAuthRoutes(app);
 */

/**
 * Setup authentication routes for Express app
 * @param {Express} app - Express application instance
 * @param {Object} options - Configuration options
 * @param {string} options.strapiUrl - Strapi API URL (default: process.env.STRAPI_URL or 'http://localhost:1337')
 * @param {boolean} options.enableCookie - Enable httpOnly cookie storage (default: true)
 * @param {string} options.cookieName - JWT cookie name (default: 'jwt')
 * @param {boolean} options.secureCookie - Secure cookie in production (default: true)
 */
export function setupAuthRoutes(app, options = {}) {
  const {
    strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337',
    enableCookie = true,
    cookieName = 'jwt',
    secureCookie = process.env.NODE_ENV === 'production'
  } = options;

  // Login endpoint - proxies to Strapi
  app.post('/login', async (req, res) => {
    console.log('=== LOGIN: Received POST request ===');
    console.log('Request body:', JSON.stringify({ ...req.body, password: '***' }, null, 2));
    
    try {
      const { identifier, password, rememberMe } = req.body;
      
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      // Get node-fetch dynamically
      const fetch = (await import('node-fetch')).default;
      
      // Proxy request to Strapi
      const strapiResponse = await fetch(`${strapiUrl}/api/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password
        })
      });

      const strapiData = await strapiResponse.json();

      if (!strapiResponse.ok) {
        console.error('Strapi login error:', strapiData);
        
        // Log failed login attempt to Strapi login collection
        try {
          const fetch = (await import('node-fetch')).default;
          const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'] || '';
          
          // Try to find user by identifier for failed login logging
          let userId = null;
          try {
            const userCheckResponse = await fetch(
              `${strapiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(identifier)}&filters[email][$eq]=${encodeURIComponent(identifier)}`,
              { headers: { 'Content-Type': 'application/json' } }
            );
            const userCheckData = await userCheckResponse.json();
            if (userCheckData && userCheckData.length > 0) {
              userId = userCheckData[0].id;
            }
          } catch (e) {
            // User not found, which is fine for failed login
          }
          
          await fetch(`${strapiUrl}/api/logins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: {
                user: userId, // null if user doesn't exist
                loginStatus: 'failed',
                loginAttemptAt: new Date().toISOString(),
                ipAddress: clientIp,
                userAgent: userAgent,
                failureReason: strapiData.error?.message || 'Invalid credentials',
                deviceInfo: {
                  browser: userAgent,
                  platform: req.headers['sec-ch-ua-platform'] || 'unknown'
                }
              }
            })
          });
        } catch (logError) {
          // Don't fail if logging fails
          console.error('Failed to log failed login attempt:', logError);
        }
        
        return res.status(strapiResponse.status || 400).json({
          success: false,
          error: strapiData.error?.message || 'Invalid credentials',
          details: strapiData
        });
      }

      // Strapi returns { jwt, user }
      const { jwt, user } = strapiData;

      // Set httpOnly cookie for JWT (more secure)
      if (enableCookie) {
        const cookieOptions = {
          httpOnly: true,
          secure: secureCookie,
          sameSite: 'lax',
          maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days if remember me, else 1 day
        };

        res.cookie(cookieName, jwt, cookieOptions);
      }

      // Log successful login to Strapi login collection
      try {
        const fetch = (await import('node-fetch')).default;
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        
        await fetch(`${strapiUrl}/api/logins`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              user: user.id,
              loginStatus: 'success',
              loginAttemptAt: new Date().toISOString(),
              ipAddress: clientIp,
              userAgent: userAgent,
              rememberMe: rememberMe || false,
              deviceInfo: {
                browser: userAgent,
                platform: req.headers['sec-ch-ua-platform'] || 'unknown'
              }
            }
          })
        });
      } catch (logError) {
        // Don't fail login if logging fails
        console.error('Failed to log login attempt:', logError);
      }

      console.log('✅ Login successful for user:', user.email || user.username);
      
      res.json({
        success: true,
        jwt,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login proxy error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  // Logout endpoint (optional)
  app.post('/logout', async (req, res) => {
    console.log('=== LOGOUT: Received POST request ===');
    
    // Update last login record with logout time
    try {
      const token = enableCookie 
        ? req.cookies?.[cookieName] 
        : req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        // Get current user to find their last login record
        const fetch = (await import('node-fetch')).default;
        const userResponse = await fetch(`${strapiUrl}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.ok) {
          const currentUser = await userResponse.json();
          
          // Find the most recent successful login for this user
          const loginResponse = await fetch(
            `${strapiUrl}/api/logins?filters[user][id][$eq]=${currentUser.id}&filters[loginStatus][$eq]=success&sort=loginAttemptAt:desc&pagination[limit]=1`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.data && loginData.data.length > 0) {
              const lastLogin = loginData.data[0];
              const loginAttemptAt = new Date(lastLogin.attributes.loginAttemptAt);
              const logoutAt = new Date();
              const sessionDuration = logoutAt - loginAttemptAt;
              
              // Update the login record with logout info
              await fetch(`${strapiUrl}/api/logins/${lastLogin.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  data: {
                    logoutAt: logoutAt.toISOString(),
                    sessionDuration: sessionDuration
                  }
                })
              });
            }
          }
        }
      }
    } catch (logError) {
      // Don't fail logout if logging fails
      console.error('Failed to log logout:', logError);
    }
    
    if (enableCookie) {
      res.clearCookie(cookieName);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  // Get current user endpoint (optional)
  app.get('/me', async (req, res) => {
    console.log('=== ME: Get current user ===');
    
    try {
      const token = enableCookie 
        ? req.cookies?.[cookieName] 
        : req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      // Verify token with Strapi
      const fetch = (await import('node-fetch')).default;
      const strapiResponse = await fetch(`${strapiUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!strapiResponse.ok) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      const user = await strapiResponse.json();
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  // Get login history for current user
  app.get('/login-history', async (req, res) => {
    console.log('=== LOGIN-HISTORY: Get login history ===');
    
    try {
      const token = enableCookie 
        ? req.cookies?.[cookieName] 
        : req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      // Get current user
      const fetch = (await import('node-fetch')).default;
      const userResponse = await fetch(`${strapiUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      const currentUser = await userResponse.json();
      
      // Get login history for this user
      const loginHistoryResponse = await fetch(
        `${strapiUrl}/api/logins?filters[user][id][$eq]=${currentUser.id}&sort=loginAttemptAt:desc&pagination[limit]=50&populate=user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!loginHistoryResponse.ok) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch login history'
        });
      }

      const loginHistory = await loginHistoryResponse.json();
      
      res.json({
        success: true,
        data: loginHistory.data || []
      });
    } catch (error) {
      console.error('Get login history error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  // Create user without email (custom registration endpoint)
  app.post('/register', async (req, res) => {
    console.log('=== REGISTER: Create user without email ===');
    
    try {
      const { username, password, confirmed = true } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      const fetch = (await import('node-fetch')).default;
      
      // Try to create user via Strapi API directly (bypasses email requirement)
      // First, check if username exists
      const checkResponse = await fetch(
        `${strapiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(username)}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const checkData = await checkResponse.json();
      
      if (checkData.data && checkData.data.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }

      // Create user directly via Strapi API (requires admin token or public registration enabled)
      // Option 1: Use /api/auth/local/register if email not required
      try {
        const registerResponse = await fetch(`${strapiUrl}/api/auth/local/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username,
            password: password,
            email: null, // Set to null
            confirmed: confirmed
          })
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          // If registration fails due to email requirement, create user directly
          // This requires admin access or special permissions
          throw new Error('Registration via auth endpoint failed, will try direct creation');
        }

        return res.json({
          success: true,
          user: {
            id: registerData.user?.id,
            username: registerData.user?.username,
            email: registerData.user?.email
          },
          jwt: registerData.jwt
        });
      } catch (registerError) {
        console.log('Registration via auth endpoint failed, will create via admin API');
        
        // Option 2: Create user directly (requires admin API token or public create permission)
        // Note: You'll need to enable user creation permission or use an admin token
        const createResponse = await fetch(`${strapiUrl}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // If you have admin token, add it here:
            // 'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            username: username,
            password: password,
            email: null,
            confirmed: confirmed,
            provider: 'local'
          })
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
          return res.status(createResponse.status || 400).json({
            success: false,
            error: createData.error?.message || 'Failed to create user. You may need to enable user creation permissions or make email optional in Strapi admin.',
            details: createData
          });
        }

        return res.json({
          success: true,
          user: {
            id: createData.id,
            username: createData.username,
            email: createData.email
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  console.log('✅ Auth routes configured: /login, /logout, /me, /login-history, /register');
}

/**
 * Simple login handler function (can be used standalone)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {string} strapiUrl - Strapi API URL
 */
export async function handleLogin(req, res, strapiUrl) {
  try {
    const { identifier, password, rememberMe } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const fetch = (await import('node-fetch')).default;
    const strapiResponse = await fetch(`${strapiUrl}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const strapiData = await strapiResponse.json();

    if (!strapiResponse.ok) {
      return res.status(strapiResponse.status || 400).json({
        success: false,
        error: strapiData.error?.message || 'Invalid credentials'
      });
    }

    const { jwt, user } = strapiData;
    
    res.cookie('jwt', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

