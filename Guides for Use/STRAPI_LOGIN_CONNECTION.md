# How Strapi Connects to the Login System

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   Frontend      │ ──────▶ │   Express       │ ──────▶ │    Strapi      │
│   (React)       │         │   Backend       │         │   (Port 1337)  │
│                 │         │   (Port 3001)   │         │                 │
│  LoginForm      │         │  authRoutes.js  │         │  /api/auth/    │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## The Connection Flow

### 1. **Frontend (LoginForm) → Backend (Express)**

**File:** `src/login/LoginForm.standalone.jsx`

```javascript
// User submits login form
fetch(`${API_BASE_URL}/login`, {
  method: 'POST',
  body: JSON.stringify({
    identifier: formData.email,
    password: formData.password
  })
})
```

**API_BASE_URL comes from:** `login.config.js`
- Development: `http://localhost:3001`
- Production: Your Heroku URL

### 2. **Backend (Express) → Strapi**

**File:** `src/login/authRoutes.js`

```javascript
// Express proxies to Strapi
const strapiResponse = await fetch(`${strapiUrl}/api/auth/local`, {
  method: 'POST',
  body: JSON.stringify({ identifier, password })
})
```

**strapiUrl comes from:** `process.env.STRAPI_URL` or defaults to `http://localhost:1337`

### 3. **Strapi Response → Backend → Frontend**

```
Strapi returns: { jwt, user }
     ↓
Backend stores JWT in httpOnly cookie
     ↓
Backend returns: { success: true, jwt, user }
     ↓
Frontend stores user in localStorage
     ↓
User redirected to main app
```

## What's Already Set Up ✅

### 1. Frontend Connection
- ✅ `LoginForm.standalone.jsx` - Sends login request to backend
- ✅ `login.config.js` - Configures API URL
- ✅ Route protection in `App.jsx` - Redirects to login if not authenticated

### 2. Backend Connection
- ✅ `authRoutes.js` - Handles `/login`, `/logout`, `/me` endpoints
- ✅ `server.mjs` - Imports and sets up auth routes
- ✅ Cookie parser middleware - For JWT cookies

### 3. Strapi Configuration
- ⚠️ **You need to configure Strapi** (see below)

## What You Need to Configure

### Step 1: Set Environment Variables

**Create/Update `.env.local` in project root:**

```env
# Strapi URL (where your Strapi is running)
STRAPI_URL=http://localhost:1337

# For production, update to your Strapi URL
# STRAPI_URL=https://your-strapi-app.herokuapp.com
```

**In Heroku (for production):**

```bash
heroku config:set STRAPI_URL=https://your-strapi-app.herokuapp.com \
  --app liff-ot-app-raksaard-2de47d0ac48c
```

### Step 2: Configure Strapi CORS

Strapi needs to allow requests from your Express backend.

**Option A: Via Strapi Admin UI**
1. Go to: `http://localhost:1337/admin`
2. Navigate: **Settings** → **Users & Permissions plugin** → **Advanced Settings**
3. Add to CORS origins:
   ```
   http://localhost:3001
   https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com
   ```
4. Save

**Option B: Edit Strapi Config File**

Create/Edit `strapi/config/plugins.js`:

```javascript
module.exports = {
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
      cors: {
        enabled: true,
        origin: [
          'http://localhost:3001',        // Your Express backend (dev)
          'http://localhost:5173',        // Your Vite frontend (dev)
          'https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com', // Production backend
        ],
      },
    },
  },
};
```

### Step 3: Enable Local Provider in Strapi

1. Go to: `http://localhost:1337/admin`
2. Navigate: **Settings** → **Users & Permissions plugin** → **Providers**
3. Ensure **"Local Provider"** is enabled (should be enabled by default)

### Step 4: Create Users in Strapi

You need users to log in with!

**Via Strapi Admin:**
1. Go to: **Content Manager** → **User** → **Create new entry**
2. Fill in username, email, password
3. Set **Confirmed** to `true`
4. Save and Publish

**Via API:**
```bash
curl -X POST http://localhost:1337/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Testing the Connection

### 1. Start All Services

**Terminal 1 - Start Strapi:**
```bash
cd strapi
npm run develop
# Should see: Server running on http://localhost:1337
```

**Terminal 2 - Start Express Backend:**
```bash
cd /Users/charena/Projects/liff-ot-app-arun
npm start
# Should see: Server running on port 3001
```

**Terminal 3 - Start Frontend:**
```bash
cd /Users/charena/Projects/liff-ot-app-arun
npm run dev
# Should see: Local: http://localhost:5173
```

### 2. Test Each Connection Point

**Test 1: Is Strapi running?**
```bash
curl http://localhost:1337/api
# Should return: {"status": 200}
```

**Test 2: Can Express reach Strapi?**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
# Should return: {"success": true, "jwt": "...", "user": {...}}
```

**Test 3: Can Frontend reach Express?**
- Open browser: `http://localhost:5173/login`
- Enter email/password
- Should redirect to main app if successful

### 3. Check Connection Issues

**Problem: Frontend can't reach backend**
- ✅ Check `VITE_API_BASE_URL_DEV` in `.env.local` (or uses default `http://localhost:3001`)
- ✅ Check backend is running on port 3001
- ✅ Check CORS is enabled in `server.mjs`

**Problem: Backend can't reach Strapi**
- ✅ Check `STRAPI_URL` in `.env.local` (or `.env`)
- ✅ Check Strapi is running on port 1337
- ✅ Check Strapi CORS allows `http://localhost:3001`

**Problem: Login fails with 401**
- ✅ Check user exists in Strapi
- ✅ Check password is correct
- ✅ Check user is confirmed (`confirmed: true`)

## Connection Flow Example

```
1. User visits: http://localhost:5173/login
   ↓
2. User enters: email@example.com / password123
   ↓
3. LoginForm sends POST to: http://localhost:3001/login
   ↓
4. Express (authRoutes.js) receives request
   ↓
5. Express proxies to: http://localhost:1337/api/auth/local
   ↓
6. Strapi validates credentials
   ↓
7. Strapi returns: { jwt: "...", user: {...} }
   ↓
8. Express stores JWT in httpOnly cookie
   ↓
9. Express returns: { success: true, user: {...} }
   ↓
10. LoginForm stores user in localStorage
   ↓
11. User redirected to: http://localhost:5173/
   ↓
12. ProtectedRoute checks localStorage
   ↓
13. User sees main app ✅
```

## Summary Checklist

- [ ] Strapi is installed and running on port 1337
- [ ] `.env.local` has `STRAPI_URL=http://localhost:1337`
- [ ] Strapi CORS allows `http://localhost:3001`
- [ ] Strapi Local Provider is enabled
- [ ] At least one test user exists in Strapi
- [ ] Express backend is running on port 3001
- [ ] Frontend can access `http://localhost:5173/login`
- [ ] Login form works and redirects after login

## Quick Test Command

```bash
# Test full connection chain
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your@email.com","password":"yourpassword"}' \
  -c cookies.txt -v

# Should see:
# - Connection to localhost:3001 ✅
# - Connection to localhost:1337 ✅
# - Response: {"success":true,"jwt":"...","user":{...}}
```

## Environment Variables Reference

### Development (`.env.local`)
```env
STRAPI_URL=http://localhost:1337
```

### Production (Heroku)
```bash
heroku config:set STRAPI_URL=https://your-strapi-app.herokuapp.com
```

### Frontend (already configured in `login.config.js`)
- Development: `http://localhost:3001` (default)
- Production: Your Heroku backend URL

---

**That's it!** The connection is already built, you just need to:
1. Set `STRAPI_URL` environment variable
2. Configure Strapi CORS
3. Create users in Strapi
4. Start all three services and test!


