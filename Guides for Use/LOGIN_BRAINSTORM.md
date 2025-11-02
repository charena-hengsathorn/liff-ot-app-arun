# Login Feature - Strapi Integration Guide

## Overview

This login system provides a complete authentication solution using Strapi as the backend:
- **Frontend**: React login component (standalone, reusable)
- **Backend**: Express endpoints that proxy to Strapi
- **Integration**: Email/password authentication with JWT tokens

## Architecture

```
Frontend (React) → Express Backend (/login) → Strapi API (/api/auth/local)
```

## Quick Start Guide

### Step 1: Copy Required Files

Copy these files/folders to your project:

```
src/login/
├── LoginForm.standalone.jsx    # Main login component (use this one)
├── login.config.js            # Configuration file
└── authRoutes.js              # Backend routes (for Express server)
```

**OR** if you want the complete module:

```
src/login/
├── LoginForm.jsx              # Original (uses LoadingAnimation)
├── LoginForm.standalone.jsx   # Standalone version (recommended)
├── login.config.js            # Configuration
├── authRoutes.js              # Backend routes
├── index.js                   # Exports
├── README.md                  # Module docs
└── REUSE_GUIDE.md             # Reuse instructions
```

### Step 2: Install Dependencies

```bash
# Frontend dependencies (should already be installed)
# React is required

# Backend dependencies
npm install cookie-parser node-fetch
```

**Already installed?** Check if you have:
- `cookie-parser` - For JWT cookie handling
- `node-fetch` - For Strapi API calls

### Step 3: Configure Backend (server.mjs or your Express app)

#### Option A: Use Reusable Module (Recommended)

```js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { setupAuthRoutes } from './src/login/authRoutes.js';

const app = express();

// Required middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend.com'],
  credentials: true  // Important for cookies!
}));
app.use(express.json());
app.use(cookieParser());

// Setup authentication routes
setupAuthRoutes(app, {
  strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337'
});

// Your other routes...

app.listen(3001);
```

#### Option B: Manual Setup (Copy endpoint code)

If you prefer to keep endpoints inline, copy the `/login` endpoint code from `authRoutes.js` into your server file.

### Step 4: Configure Frontend

#### Basic Usage (Default Config)

```jsx
// App.jsx or your router
import LoginForm from './login/LoginForm.standalone';

function App() {
  return (
    <Router>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={<AttendanceForm />} />
    </Router>
  );
}
```

#### Custom Configuration

```jsx
import LoginForm from './login/LoginForm.standalone';
import { loginConfig } from './login/login.config';

// Customize for your app
const customConfig = {
  ...loginConfig,
  apiBaseURL: () => {
    // Your API URL
    return import.meta.env.DEV 
      ? 'http://localhost:3001'
      : 'https://your-production-api.com';
  },
  theme: {
    ...loginConfig.theme,
    background: "linear-gradient(135deg, #your-colors)",
    primaryColor: "#your-color"
  }
};

function App() {
  return <LoginForm config={customConfig} />;
}
```

### Step 5: Set Environment Variables

#### Backend (.env or .env.local)

```env
# Strapi Configuration
STRAPI_URL=http://localhost:1337
# OR for production:
STRAPI_URL=https://your-strapi-instance.com

# Optional: Cookie settings
NODE_ENV=production  # Auto-enables secure cookies
```

#### Frontend (.env or vite.env)

```env
# API Configuration
VITE_API_BASE_URL_DEV=http://localhost:3001
VITE_API_BASE_URL_PROD=https://your-backend-api.com
```

**Note:** The standalone component uses `login.config.js` which has default fallbacks, so env vars are optional.

### Step 6: Configure Strapi

Ensure your Strapi instance has:

1. **Users-permissions plugin enabled**
   - Should be enabled by default
   - Access at: `http://localhost:1337/admin/plugins/users-permissions`

2. **Email/Password provider enabled**
   - Go to Settings → Users-permissions → Providers
   - Ensure "Local Provider" is enabled

3. **Create a test user**
   - Register via Strapi admin or API
   - Or use: `POST http://localhost:1337/api/auth/local/register`

4. **CORS Configuration** (if Strapi and backend are on different domains)
   - Settings → Users-permissions → Advanced Settings
   - Add your backend URL to allowed origins

### Step 7: Test the Integration

1. **Start Strapi**:
   ```bash
   cd your-strapi-project
   npm run develop
   ```

2. **Start your backend**:
   ```bash
   npm run dev  # or node server.mjs
   ```

3. **Start your frontend**:
   ```bash
   npm run dev
   ```

4. **Test login**:
   - Navigate to `http://localhost:5173/login`
   - Enter email and password
   - Should redirect after successful login

## Configuration Options

### Backend Options (authRoutes.js)

```js
setupAuthRoutes(app, {
  strapiUrl: 'http://localhost:1337',      // Strapi API URL
  enableCookie: true,                       // Use httpOnly cookies
  cookieName: 'jwt',                        // Cookie name
  secureCookie: true                        // Secure in production
});
```

### Frontend Options (login.config.js)

```js
const customConfig = {
  apiBaseURL: () => 'https://your-api.com',  // API endpoint
  theme: {                                    // Styling
    background: 'linear-gradient(...)',
    primaryColor: '#3b82f6',
    // ...
  },
  labels: {                                   // Translations
    en: { title: 'Login', ... },
    th: { title: 'เข้าสู่ระบบ', ... }
  },
  redirectAfterLogin: (url) => '/dashboard',  // Redirect logic
  cookieSettings: {                           // Cookie config
    emailCookieName: 'loginEmail',
    emailCookieExpiry: 30  // days
  }
};
```

## Endpoints Created

### POST /login
**Request:**
```json
{
  "identifier": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response (Success):**
```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "role": { ... }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Cookie:** Sets httpOnly `jwt` cookie (if enabled)

### POST /logout
**Request:** None (cookie-based)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookie:** Clears `jwt` cookie

### GET /me
**Request:** Requires JWT cookie or Authorization header

**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

## File Structure

### For Single App Use:
```
your-project/
├── src/
│   └── login/
│       ├── LoginForm.standalone.jsx
│       └── login.config.js
├── server.mjs
└── package.json
```

### For Multiple Apps (Shared):
```
shared-auth-module/
├── src/
│   ├── LoginForm.standalone.jsx
│   ├── login.config.js
│   └── authRoutes.js

app1/
├── src/
│   └── login/  (copy or symlink)
└── server.mjs  (imports authRoutes)

app2/
├── src/
│   └── login/  (copy or symlink)
└── server.mjs  (imports authRoutes)
```

## Integration with React Router

If using React Router:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './login/LoginForm.standalone';
import Dashboard from './Dashboard';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## Common Issues & Solutions

### Issue: CORS Errors
**Solution:** Ensure CORS is configured with `credentials: true`:
```js
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true  // Must be true for cookies!
}));
```

### Issue: Cookie Not Being Set
**Solution:** 
1. Check `cookieParser()` middleware is added
2. Verify CORS `credentials: true`
3. Ensure frontend uses `credentials: 'include'` in fetch (already in component)

### Issue: Strapi Connection Failed
**Solution:**
1. Verify `STRAPI_URL` is correct
2. Check Strapi is running: `http://localhost:1337/api`
3. Test Strapi directly: `POST http://localhost:1337/api/auth/local`

### Issue: 401 Unauthorized After Login
**Solution:**
1. Check JWT cookie is being sent in subsequent requests
2. Verify backend cookie settings match frontend
3. Check Strapi JWT secret hasn't changed

## Testing Checklist

- [ ] Strapi is running and accessible
- [ ] Backend server starts without errors
- [ ] `/login` endpoint responds (test with curl/Postman)
- [ ] Frontend login form renders
- [ ] Can submit login form
- [ ] Receives success response
- [ ] Cookie is set (check DevTools → Application → Cookies)
- [ ] Redirects after login
- [ ] `/me` endpoint returns user data
- [ ] `/logout` clears cookie

## Example curl Commands for Testing

```bash
# Test login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Test /me (use cookie from login)
curl http://localhost:3001/me \
  -b cookies.txt

# Test logout
curl -X POST http://localhost:3001/logout \
  -b cookies.txt
```

## Next Steps After Setup

1. **Add Protected Routes** - Wrap routes that require authentication
2. **Add User Context** - Create React context for user state
3. **Implement Logout** - Add logout button/functionality
4. **Add Loading States** - Show loading during auth checks
5. **Error Handling** - Handle token expiration, invalid tokens
6. **Refresh Token** - Implement token refresh if needed

## AI Agent Instructions

When setting up this login system in another project:

1. **Identify the project structure** - Is it React? Express?
2. **Copy the login module** - Use `LoginForm.standalone.jsx` for portability
3. **Check dependencies** - Ensure React is installed, add cookie-parser
4. **Set up backend routes** - Use `setupAuthRoutes(app)` from `authRoutes.js`
5. **Configure environment** - Set `STRAPI_URL` and API URLs
6. **Test endpoints** - Verify `/login` works with Strapi
7. **Integrate frontend** - Add route for login page
8. **Test full flow** - Login → Cookie set → Access protected routes

## Support Files Reference

- `LoginForm.standalone.jsx` - Main login component (self-contained)
- `login.config.js` - Frontend configuration
- `authRoutes.js` - Backend route setup function
- `REUSE_GUIDE.md` - Detailed reuse instructions
- `BACKEND_REUSE.md` - Backend-specific guide

---

**Quick Command Reference:**

```bash
# Install dependencies
npm install cookie-parser

# Copy login module (example)
cp -r src/login /path/to/new-project/src/

# Test Strapi connection
curl http://localhost:1337/api

# Test login endpoint
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"email","password":"pass"}'
```
