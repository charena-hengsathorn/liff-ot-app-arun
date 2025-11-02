# Strapi Setup Guide for Login System

## Overview

Strapi will run as a separate service on port 1337 and handle user authentication for your LIFF OT App. This guide will walk you through setting up Strapi from scratch.

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- A database (SQLite for development, PostgreSQL/MySQL for production)

## Step 1: Create Strapi Project

### Option A: In your project root `strapi/` folder (Recommended for this project)

The `strapi/` folder has already been created at the project root. Install Strapi there:

```bash
# You're already in the project root
cd /Users/charena/Projects/liff-ot-app-arun

# Create Strapi in the strapi folder
npx create-strapi-app@latest strapi

# When prompted:
# - Choose "Quickstart (recommended)" for SQLite (easiest for development)
#   OR "Custom (manual settings)" for PostgreSQL/MySQL (better for production)
# - Project name: strapi
```

**Note:** This keeps everything in one repository but Strapi will have its own `node_modules`, `package.json`, etc.

### Option B: Separate directory (Alternative - recommended for production)

If you prefer a completely separate project:

```bash
# Navigate to your projects directory
cd /Users/charena/Projects

# Create a new Strapi app
npx create-strapi-app@latest liff-ot-app-strapi

# When prompted:
# - Choose "Quickstart (recommended)" for SQLite (easiest for development)
#   OR "Custom (manual settings)" for PostgreSQL/MySQL (better for production)
# - Project name: liff-ot-app-strapi
```

**Why separate?** Easier deployment, separate repos, cleaner structure.

### ⚠️ Important: Don't put Strapi in `src/login/`

The `src/login/` folder contains frontend React components. Strapi is a full backend application and needs its own root directory.

## Step 2: Initial Setup

After installation completes:

1. **Start Strapi development server:**
   ```bash
   cd liff-ot-app-strapi
   npm run develop
   ```

2. **Access Strapi Admin:**
   - Open browser: `http://localhost:1337/admin`
   - Create your first admin user:
     - Email: your-email@example.com
     - Password: (choose a strong password)
     - Confirm password

## Step 3: Configure Authentication

### 3.1 Enable Users-Permissions Plugin

1. Go to Strapi Admin: `http://localhost:1337/admin`
2. Navigate to: **Plugins** → **Users & Permissions**
3. The plugin should already be enabled by default

### 3.2 Configure Local Provider (Email/Password)

1. Go to: **Settings** → **Users & Permissions plugin** → **Providers**
2. Ensure **"Local"** provider is enabled (should be enabled by default)

### 3.3 Configure CORS (Important!)

Your Express backend needs to communicate with Strapi:

1. Go to: **Settings** → **Users & Permissions plugin** → **Advanced settings**
2. Scroll to **CORS** section
3. Add your backend origins:
   ```
   http://localhost:3001
   https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com
   ```
4. Click **Save**

Alternatively, edit `config/middlewares.js` (or `config/middlewares.ts`):

```js
module.exports = [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

And create/update `config/plugins.js`:

```js
module.exports = {
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
      cors: {
        enabled: true,
        origin: [
          'http://localhost:3001',
          'http://localhost:5173',
          'https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com',
        ],
      },
    },
  },
};
```

## Step 4: Create Test Users

### Option A: Via Strapi Admin

1. Go to: **Content Manager** → **User** → **Create new entry**
2. Fill in:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **Password**: (set a password)
   - **Confirmed**: `true`
3. Click **Save**
4. Click **Publish**

### Option B: Via API (for testing)

```bash
curl -X POST http://localhost:1337/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Step 5: Configure Environment Variables

### Development (.env.local in main app)

Add to `/Users/charena/Projects/liff-ot-app-arun/.env.local`:

```env
# Strapi Configuration
STRAPI_URL=http://localhost:1337
```

### Production (Heroku)

```bash
heroku config:set STRAPI_URL=https://your-strapi-instance.herokuapp.com \
  --app liff-ot-app-raksaard-2de47d0ac48c
```

## Step 6: Test the Integration

### 6.1 Start Strapi

**If you installed in project root (`strapi/` folder):**
```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi
npm run develop
```

**If you installed in separate directory:**
```bash
cd /Users/charena/Projects/liff-ot-app-strapi
npm run develop
```

### 6.2 Start Your Backend

```bash
cd liff-ot-app-arun
npm start
```

### 6.3 Test Login Endpoint

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

You should receive:
```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### 6.4 Test /me Endpoint

```bash
curl http://localhost:3001/me -b cookies.txt
```

## Step 7: Production Deployment

### Option A: Deploy Strapi to Heroku

1. **Add buildpacks:**
   ```bash
   heroku buildpacks:set heroku/nodejs --app your-strapi-app
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set DATABASE_URL=your_postgres_url --app your-strapi-app
   heroku config:set NODE_ENV=production --app your-strapi-app
   ```

3. **Update STRAPI_URL in your main app:**
   ```bash
   heroku config:set STRAPI_URL=https://your-strapi-app.herokuapp.com \
     --app liff-ot-app-raksaard-2de47d0ac48c
   ```

### Option B: Deploy to Railway/Render/etc.

Similar process - deploy Strapi separately and update STRAPI_URL in your main app.

## Troubleshooting

### Issue: CORS Errors

**Solution:** Make sure CORS is configured in Strapi to allow your backend origin.

### Issue: 401 Unauthorized

**Solution:** 
1. Check if user exists in Strapi
2. Verify password is correct
3. Check JWT secret hasn't changed
4. Ensure cookies are being sent with requests

### Issue: Cannot Connect to Strapi

**Solution:**
1. Verify Strapi is running: `http://localhost:1337/api`
2. Check STRAPI_URL environment variable
3. Test Strapi directly: `POST http://localhost:1337/api/auth/local`

### Issue: User Creation Fails

**Solution:**
1. Check if email is already registered
2. Ensure password meets requirements (minimum length, etc.)
3. Check Strapi admin logs for errors

## Next Steps

1. ✅ Strapi is running and accessible
2. ✅ Users can be created
3. ✅ Login endpoint works
4. ⏭️ Configure user roles and permissions (optional)
5. ⏭️ Add custom fields to User model (optional)
6. ⏭️ Set up email verification (optional)

## Reference Commands

```bash
# Start Strapi
cd liff-ot-app-strapi
npm run develop

# Build Strapi for production
npm run build

# Start Strapi in production mode
npm run start

# Create new admin user
npm run strapi admin:create-user
```

## Quick Test Checklist

- [ ] Strapi runs on `http://localhost:1337`
- [ ] Can access admin panel at `http://localhost:1337/admin`
- [ ] Created at least one test user
- [ ] CORS is configured for `http://localhost:3001`
- [ ] `/api/auth/local` endpoint works
- [ ] Login endpoint in main app works: `POST http://localhost:3001/login`
- [ ] `/me` endpoint returns user data
- [ ] Frontend login form works

---

**Need Help?** Check Strapi documentation: https://docs.strapi.io
