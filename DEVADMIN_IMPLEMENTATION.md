# DevAdmin Authentication System - Implementation Documentation

> **Implementation Date:** November 18, 2025
> **Phase:** Phase 1 - Backend Authentication System
> **Status:** ✅ Complete and Deployed to Production
> **Deployment Version:** Heroku v75

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What Was Implemented](#what-was-implemented)
3. [File Structure & Changes](#file-structure--changes)
4. [Architecture](#architecture)
5. [API Endpoints](#api-endpoints)
6. [Security Features](#security-features)
7. [Environment Variables](#environment-variables)
8. [Testing Results](#testing-results)
9. [How to Use](#how-to-use)
10. [Next Steps](#next-steps)

---

## 🎯 Overview

**Objective:** Create a secure, environment-based DevAdmin authentication system that allows privileged access to development tools without modifying the database.

**Business Need:**
- Hide development tools from regular users in production
- Provide privileged access to developers/admins
- Use environment variables for credentials (no database changes)
- Implement industry-standard security practices

**Key Features:**
- Environment-based authentication (credentials in env vars)
- Bcrypt password hashing
- JWT tokens stored in httpOnly cookies (XSS protection)
- CSRF protection with sameSite cookies
- 24-hour token expiry
- No localStorage (secure by default)

---

## ✅ What Was Implemented

### Backend Components

1. **JWT Token Management** (`utils/jwtUtils.js`)
   - Generate JWT tokens for authenticated DevAdmin users
   - Verify and decode JWT tokens
   - Set httpOnly cookies (XSS-safe)
   - Clear cookies on logout
   - Extract tokens from requests

2. **Credential Validation** (`utils/devAdminAuth.js`)
   - Validate username/password against environment variables
   - Bcrypt password hashing and comparison
   - Check if DevAdmin is properly configured
   - Utility function to generate password hashes

3. **Authentication Endpoints** (`server.mjs`)
   - `POST /auth/devadmin` - Login endpoint
   - `GET /auth/verify-devadmin` - Token verification
   - `POST /auth/logout-devadmin` - Logout endpoint

4. **Dependencies**
   - Installed `jsonwebtoken` package
   - Already had `bcryptjs` (used for password hashing)
   - Already had `cookie-parser` (used for cookie handling)

---

## 📂 File Structure & Changes

### New Files Created

```
liff-ot-app-arun/
├── utils/                              # NEW DIRECTORY
│   ├── jwtUtils.js                     # JWT token handling utilities
│   └── devAdminAuth.js                 # DevAdmin credential validation
```

### Modified Files

```
liff-ot-app-arun/
├── server.mjs                          # MODIFIED
│   ├── + Imports for DevAdmin utilities
│   └── + 3 new authentication endpoints
├── package.json                        # MODIFIED
│   └── + jsonwebtoken dependency
├── package-lock.json                   # MODIFIED (auto-updated)
└── .env.local                          # MODIFIED
    └── + DevAdmin environment variables
```

---

## 🏗️ Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                         │
│                                                              │
│  User enters:                                               │
│  - username: "devadmin"                                     │
│  - password: "DevAdmin123!"                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ POST /auth/devadmin
                            │ { username, password }
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (server.mjs)                            │
│                                                              │
│  1. Receive credentials                                     │
│  2. Call validateDevAdminCredentials()                      │
│     ↓                                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ devAdminAuth.js                                      │   │
│  │                                                       │   │
│  │ - Compare username with DEVADMIN_USERNAME            │   │
│  │ - bcrypt.compare(password, DEVADMIN_PASSWORD_HASH)  │   │
│  │ - Return true/false                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│     ↓                                                        │
│  3. If valid:                                               │
│     - Generate JWT token (jwtUtils.js)                      │
│     - Set httpOnly cookie                                   │
│     - Return success response                               │
│  4. If invalid:                                             │
│     - Return 401 error                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Response:
                            │ { success: true, user: {...} }
                            │ + Set-Cookie: devadmin_token=...
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                         │
│                                                              │
│  Browser automatically stores httpOnly cookie                │
│  (Cookie sent automatically on all future requests)          │
└─────────────────────────────────────────────────────────────┘
```

### Token Verification Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                         │
│                                                              │
│  Makes request to verify DevAdmin status                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ GET /auth/verify-devadmin
                            │ Cookie: devadmin_token=...
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (server.mjs)                            │
│                                                              │
│  1. Extract token from httpOnly cookie                      │
│  2. Call verifyDevAdminToken()                              │
│     ↓                                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ jwtUtils.js                                          │   │
│  │                                                       │   │
│  │ - jwt.verify(token, JWT_SECRET)                     │   │
│  │ - Check if role === 'devadmin'                      │   │
│  │ - Check expiry                                       │   │
│  │ - Return decoded payload or null                    │   │
│  └─────────────────────────────────────────────────────┘   │
│     ↓                                                        │
│  3. If valid:                                               │
│     - Return user info                                      │
│  4. If invalid/expired:                                     │
│     - Return 401 error                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Response:
                            │ { success: true, user: {...} }
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                         │
│                                                              │
│  Can now show/hide dev tools based on isDevAdmin status     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1. POST /auth/devadmin

**Description:** Authenticate DevAdmin user and set httpOnly cookie with JWT token.

**Request:**
```http
POST /auth/devadmin HTTP/1.1
Host: liff-ot-app-arun-d0ff4972332c.herokuapp.com
Content-Type: application/json

{
  "username": "devadmin",
  "password": "DevAdmin123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "username": "devadmin",
    "role": "devadmin"
  }
}
```

**Response Headers:**
```http
Set-Cookie: devadmin_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...;
            HttpOnly;
            Secure;
            SameSite=Strict;
            Max-Age=86400;
            Path=/
```

**Error Responses:**

- **400 Bad Request** - Missing username or password
  ```json
  {
    "success": false,
    "message": "Username and password are required"
  }
  ```

- **401 Unauthorized** - Invalid credentials
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

- **503 Service Unavailable** - DevAdmin not configured
  ```json
  {
    "success": false,
    "message": "DevAdmin authentication is not configured on this server"
  }
  ```

---

### 2. GET /auth/verify-devadmin

**Description:** Verify if the current session has a valid DevAdmin token.

**Request:**
```http
GET /auth/verify-devadmin HTTP/1.1
Host: liff-ot-app-arun-d0ff4972332c.herokuapp.com
Cookie: devadmin_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "username": "devadmin",
    "role": "devadmin"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - No token found
  ```json
  {
    "success": false,
    "message": "No authentication token found"
  }
  ```

- **401 Unauthorized** - Invalid or expired token
  ```json
  {
    "success": false,
    "message": "Invalid or expired token"
  }
  ```

---

### 3. POST /auth/logout-devadmin

**Description:** Clear DevAdmin session and httpOnly cookie.

**Request:**
```http
POST /auth/logout-devadmin HTTP/1.1
Host: liff-ot-app-arun-d0ff4972332c.herokuapp.com
Cookie: devadmin_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response Headers:**
```http
Set-Cookie: devadmin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

---

## 🔐 Security Features

### 1. Password Security

**Bcrypt Hashing:**
- Passwords are NEVER stored in plain text
- Environment variable stores bcrypt hash with salt
- Hash uses bcrypt rounds = 10 (industry standard)
- Even if environment variables are exposed, passwords are safe

**Example:**
```javascript
// Plain password: "DevAdmin123!"
// Stored hash: "$2b$10$v5FNmeja5//fUZ5YFekN9e1SyCuQYKwTVOCIdMMgz2QSm4..3wyO2"
```

### 2. XSS Protection (httpOnly Cookies)

**Why httpOnly cookies?**
- JavaScript CANNOT access the token
- Even if XSS vulnerability exists, attacker cannot steal token
- Token only sent via HTTP headers (not accessible to client-side code)

**Comparison:**

| Storage Method | XSS Vulnerable? | How Attacker Gets Token |
|---------------|-----------------|-------------------------|
| localStorage  | ✅ YES          | `localStorage.getItem('token')` |
| sessionStorage| ✅ YES          | `sessionStorage.getItem('token')` |
| httpOnly Cookie| ❌ NO          | Cannot access via JavaScript! |

### 3. CSRF Protection (SameSite Cookies)

**SameSite=Strict:**
- Cookie only sent if request originates from same domain
- Prevents CSRF attacks from malicious third-party sites
- Even if user clicks malicious link, cookie won't be sent

### 4. Token Expiry

- Tokens expire after 24 hours
- Reduces window of opportunity if token is compromised
- Forces periodic re-authentication

### 5. Secure in Production

**Cookie Configuration:**
```javascript
{
  httpOnly: true,              // JavaScript cannot access
  secure: true,                // HTTPS only in production
  sameSite: 'strict',          // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'                    // Available across entire app
}
```

### 6. Generic Error Messages

- Login errors don't reveal if username or password is wrong
- Prevents username enumeration attacks
- Always returns: "Invalid credentials"

### 7. Environment Variable Isolation

**Security Layers:**
1. Credentials stored in Heroku config vars (encrypted at rest)
2. Never committed to git
3. Not exposed to frontend
4. Only accessible to backend process

---

## 🔧 Environment Variables

### Required Environment Variables

#### Backend (Heroku App: liff-ot-app-arun)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DEVADMIN_USERNAME` | DevAdmin username | `devadmin` | ✅ Yes |
| `DEVADMIN_PASSWORD_HASH` | Bcrypt hash of password | `$2b$10$v5FNmeja5...` | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT signing | `87283de8ccb9ea...` | ✅ Yes |
| `JWT_EXPIRY` | Token expiry duration | `24h` | ⚠️ Optional (defaults to 24h) |

### Current Configuration (Production)

**Heroku App:** `liff-ot-app-arun`

```bash
DEVADMIN_USERNAME=devadmin
DEVADMIN_PASSWORD_HASH=$2b$10$v5FNmeja5//fUZ5YFekN9e1SyCuQYKwTVOCIdMMgz2QSm4..3wyO2
JWT_SECRET=87283de8ccb9ea5efccc8adcba4a767f43ca8b2f8dbb8b5f4d43569bf337a1dea57067a257e0476f07edcbc1cc838395df64fe5856b63c463812cd42e9d7e4ac
JWT_EXPIRY=24h
```

**Test Credentials:**
- Username: `devadmin`
- Password: `DevAdmin123!`

⚠️ **IMPORTANT:** These are test credentials. Change the password in production before public deployment!

### How to Generate Password Hash

**Method 1: Using Node.js**
```bash
node -e "import bcrypt from 'bcryptjs'; const password = 'YourNewPassword'; bcrypt.hash(password, 10).then(hash => console.log(hash));"
```

**Method 2: Using the utility function**
```bash
node -e "import('./utils/devAdminAuth.js').then(m => m.generatePasswordHash('YourNewPassword'));"
```

**Method 3: Interactive Node REPL**
```javascript
// Start Node REPL
node

// Import bcrypt
import bcrypt from 'bcryptjs';

// Generate hash
const hash = await bcrypt.hash('YourNewPassword', 10);
console.log(hash);
```

### How to Update Environment Variables on Heroku

```bash
# Set new password hash
heroku config:set DEVADMIN_PASSWORD_HASH='$2b$10$newHashHere...' --app liff-ot-app-arun

# Verify it was set
heroku config:get DEVADMIN_PASSWORD_HASH --app liff-ot-app-arun

# View all DevAdmin config
heroku config --app liff-ot-app-arun | grep -E "(DEVADMIN|JWT)"
```

---

## ✅ Testing Results

### Test Environment
- **Platform:** Heroku Production
- **App:** liff-ot-app-arun
- **URL:** https://liff-ot-app-arun-d0ff4972332c.herokuapp.com
- **Deployment Version:** v75
- **Test Date:** November 18, 2025

### Test Cases

#### ✅ Test 1: Successful Login
```bash
curl -X POST https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/auth/devadmin \
  -H "Content-Type: application/json" \
  -d '{"username":"devadmin","password":"DevAdmin123!"}'
```

**Result:** ✅ PASS
```json
{
  "success": true,
  "user": {
    "username": "devadmin",
    "role": "devadmin"
  }
}
```

---

#### ✅ Test 2: Token Verification
```bash
curl -X GET https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/auth/verify-devadmin \
  -b cookies.txt
```

**Result:** ✅ PASS
```json
{
  "success": true,
  "user": {
    "username": "devadmin",
    "role": "devadmin"
  }
}
```

---

#### ✅ Test 3: Invalid Credentials
```bash
curl -X POST https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/auth/devadmin \
  -H "Content-Type: application/json" \
  -d '{"username":"devadmin","password":"WrongPassword"}'
```

**Result:** ✅ PASS (Correctly rejected)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

#### ✅ Test 4: Logout
```bash
curl -X POST https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/auth/logout-devadmin \
  -b cookies.txt
```

**Result:** ✅ PASS
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### ✅ Test 5: Verification After Logout
```bash
curl -X GET https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/auth/verify-devadmin \
  -b cookies-after-logout.txt
```

**Result:** ✅ PASS (Correctly rejected - no token)
```json
{
  "success": false,
  "message": "No authentication token found"
}
```

---

### Test Summary

| Test Case | Expected Result | Actual Result | Status |
|-----------|----------------|---------------|--------|
| Login with correct credentials | Token set, success response | ✅ Token set | ✅ PASS |
| Verify valid token | User info returned | ✅ User info returned | ✅ PASS |
| Login with wrong password | 401 error | ✅ 401 error | ✅ PASS |
| Logout | Cookie cleared | ✅ Cookie cleared | ✅ PASS |
| Verify after logout | No token error | ✅ No token error | ✅ PASS |

**Overall Status:** ✅ **ALL TESTS PASSED**

---

## 📖 How to Use

### For Developers

#### Testing the Authentication Locally

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3001/auth/devadmin \
     -H "Content-Type: application/json" \
     -d '{"username":"devadmin","password":"DevAdmin123!"}' \
     -c cookies.txt
   ```

3. **Verify token:**
   ```bash
   curl -X GET http://localhost:3001/auth/verify-devadmin \
     -b cookies.txt
   ```

4. **Logout:**
   ```bash
   curl -X POST http://localhost:3001/auth/logout-devadmin \
     -b cookies.txt
   ```

#### Testing on Production (Heroku)

Replace `http://localhost:3001` with `https://liff-ot-app-arun-d0ff4972332c.herokuapp.com`

Example:
```bash
curl -X POST https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/auth/devadmin \
  -H "Content-Type: application/json" \
  -d '{"username":"devadmin","password":"DevAdmin123!"}' \
  -c cookies.txt
```

### For Frontend Integration (Next Steps)

The frontend will:

1. **Create a login form** that POSTs to `/auth/devadmin`
2. **Check authentication status** by calling `/auth/verify-devadmin` on app load
3. **Conditionally render dev tools** based on authentication status
4. **Provide logout functionality** by calling `/auth/logout-devadmin`

**Example Frontend Flow:**
```javascript
// Login
const response = await fetch('/auth/devadmin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important! Sends/receives cookies
  body: JSON.stringify({ username, password })
});

// Verify on app load
const checkAuth = await fetch('/auth/verify-devadmin', {
  credentials: 'include' // Important! Sends cookies
});

// Logout
const logout = await fetch('/auth/logout-devadmin', {
  method: 'POST',
  credentials: 'include'
});
```

---

## 🔄 Deployment Information

### Git Commit

**Commit Hash:** `6c13128`

**Commit Message:**
```
Add: DevAdmin authentication system with environment-based credentials

Backend Implementation:
- Add POST /auth/devadmin endpoint for login
- Add GET /auth/verify-devadmin endpoint for token verification
- Add POST /auth/logout-devadmin endpoint for logout
- Create utils/jwtUtils.js for JWT token handling (httpOnly cookies)
- Create utils/devAdminAuth.js for credential validation (bcrypt)
- Install jsonwebtoken dependency

Security Features:
- Credentials stored in environment variables (not in code)
- Passwords hashed with bcrypt (never plain text)
- JWT tokens in httpOnly cookies only (XSS protection)
- sameSite: strict for CSRF protection
- 24-hour token expiry

Environment Variables Required:
- DEVADMIN_USERNAME
- DEVADMIN_PASSWORD_HASH
- JWT_SECRET
- JWT_EXPIRY
```

### Heroku Deployment

**App:** `liff-ot-app-arun`
**Version:** v75
**Build Status:** ✅ Successful
**Deploy URL:** https://liff-ot-app-arun-d0ff4972332c.herokuapp.com

**Deployment Steps Taken:**
1. ✅ Created utility files (`utils/jwtUtils.js`, `utils/devAdminAuth.js`)
2. ✅ Added authentication endpoints to `server.mjs`
3. ✅ Installed `jsonwebtoken` dependency
4. ✅ Set environment variables on Heroku
5. ✅ Committed changes to git
6. ✅ Pushed to Heroku (`git push heroku main`)
7. ✅ Tested all endpoints on production

---

## 🎯 Next Steps

### Phase 2: Frontend Implementation

**Objective:** Create frontend components to utilize the DevAdmin authentication system.

#### Tasks to Implement:

1. **Create DevAdmin Login Component**
   - File: `src/components/DevAdminLogin.jsx`
   - Login form (username + password)
   - Error handling for failed authentication
   - Redirect after successful login

2. **Create useDevAdmin Hook**
   - File: `src/hooks/useDevAdmin.js`
   - Check authentication status on mount
   - Provide `isDevAdmin` boolean
   - Provide `login()` and `logout()` functions
   - Handle token verification

3. **Create DevAdmin Context**
   - File: `src/contexts/DevAdminContext.jsx`
   - Global state for DevAdmin status
   - Provider component for app-wide access

4. **Update StyledForm.jsx**
   - Import `useDevAdmin` hook
   - Conditionally render dev tools based on `isDevAdmin`
   - Hide environment toggle from non-devadmin users

5. **Create Environment Guard**
   - File: `src/utils/envGuard.js`
   - Force `env=prod` for non-devadmin users
   - Allow `env=dev` only for devadmin

6. **Update All Dev Tool Components**
   - Wrap all dev tools with `{isDevAdmin && ...}`
   - Manual testing forms
   - OT calculation testing
   - Day of Week updater
   - Sheet selector

#### Frontend Testing Checklist:

- [ ] DevAdmin can login successfully
- [ ] DevAdmin can see all dev tools
- [ ] DevAdmin can toggle environment (dev/prod)
- [ ] Regular users cannot see dev tools
- [ ] Regular users cannot access dev environment
- [ ] Logout works correctly
- [ ] Token persists across page refreshes
- [ ] Token expires after 24 hours

---

### Phase 3: Approval Handler Integration (Future)

**Note:** This is a separate feature and should be implemented independently from DevAdmin access control.

---

## 📚 References

### Related Files

- `utils/jwtUtils.js` - JWT token utilities
- `utils/devAdminAuth.js` - Credential validation
- `server.mjs` - Authentication endpoints (lines 148-281)
- `.env.local` - Environment variables (local development)
- `AGENTS.md` - Original implementation plan

### External Resources

- [JWT.io](https://jwt.io/) - JWT token debugger
- [Bcrypt Calculator](https://bcrypt-generator.com/) - Generate bcrypt hashes online
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [httpOnly Cookie Security](https://owasp.org/www-community/HttpOnly)

---

## 🤝 Contributing

When making changes to the DevAdmin authentication system:

1. **Test locally first** before deploying to Heroku
2. **Update this documentation** if you add new features
3. **Update environment variables** if you add new config options
4. **Run all test cases** to ensure nothing breaks
5. **Update AGENTS.md** to track implementation progress

---

## 🔒 Security Considerations

### Important Security Notes:

1. **Never commit credentials to git**
   - `.env.local` is in `.gitignore`
   - Always use environment variables

2. **Change test password before public deployment**
   - Current password `DevAdmin123!` is for development only
   - Generate strong password for production (16+ characters)

3. **Rotate JWT secret periodically**
   - Generate new secret: `node -p "require('crypto').randomBytes(64).toString('hex')"`
   - Update Heroku config: `heroku config:set JWT_SECRET='new_secret'`

4. **Monitor for failed login attempts**
   - Check Heroku logs: `heroku logs --tail --app liff-ot-app-arun | grep "DevAdmin login failed"`
   - Too many failures might indicate brute force attack

5. **Use HTTPS in production**
   - Heroku automatically provides HTTPS
   - Never disable `secure: true` in production cookies

---

## 📝 Changelog

### v1.0.0 - November 18, 2025
- ✅ Initial implementation of DevAdmin authentication backend
- ✅ Created JWT token utilities
- ✅ Created credential validation utilities
- ✅ Added 3 authentication endpoints
- ✅ Configured environment variables on Heroku
- ✅ Deployed to production (Heroku v75)
- ✅ All tests passing on production

---

**Documentation maintained by:** Claude AI Assistant
**Last Updated:** November 18, 2025
**Version:** 1.0.0
