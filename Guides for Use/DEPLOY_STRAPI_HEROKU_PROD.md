# Deploy Strapi to Heroku for Production

## Complete Step-by-Step Guide

This guide will walk you through deploying Strapi to Heroku for production use.

## Prerequisites

- ✅ Heroku CLI installed: `heroku --version`
- ✅ Logged into Heroku: `heroku login`
- ✅ Git initialized in Strapi directory

## Step 1: Install PostgreSQL Driver

The PostgreSQL driver is required for Heroku:

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi
npm install pg
```

✅ **Already done!** The `pg` package is now installed.

## Step 2: Create Heroku App

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi

# Create a new Heroku app (choose a unique name)
heroku create your-strapi-app-name

# Example:
heroku create liff-ot-app-strapi-prod
```

**Important:** Write down your Heroku app name - you'll need it for all commands!

## Step 3: Add PostgreSQL Database

Heroku requires PostgreSQL (not SQLite):

```bash
# Add PostgreSQL add-on (free tier: mini)
heroku addons:create heroku-postgresql:mini --app your-strapi-app-name

# This automatically sets DATABASE_URL environment variable
```

Verify:
```bash
heroku config:get DATABASE_URL --app your-strapi-app-name
```

## Step 4: Set Required Environment Variables

Strapi needs several security keys for production:

### Option A: Quick Method (Recommended)

```bash
# Generate all secrets at once
node -e "
const crypto = require('crypto');
const gen = () => crypto.randomBytes(32).toString('base64');
console.log('ADMIN_JWT_SECRET=' + gen());
console.log('API_TOKEN_SALT=' + gen());
console.log('TRANSFER_TOKEN_SALT=' + gen());
console.log('ENCRYPTION_KEY=' + gen());
console.log('APP_KEYS=' + Array(4).fill().map(() => gen()).join(','));
" > /tmp/strapi-secrets.txt

# Set on Heroku (replace 'your-strapi-app-name' with your app name)
APP_NAME=your-strapi-app-name
heroku config:set $(grep ADMIN_JWT_SECRET /tmp/strapi-secrets.txt) --app $APP_NAME
heroku config:set $(grep API_TOKEN_SALT /tmp/strapi-secrets.txt) --app $APP_NAME
heroku config:set $(grep TRANSFER_TOKEN_SALT /tmp/strapi-secrets.txt) --app $APP_NAME
heroku config:set $(grep ENCRYPTION_KEY /tmp/strapi-secrets.txt) --app $APP_NAME
heroku config:set APP_KEYS="$(grep APP_KEYS /tmp/strapi-secrets.txt | cut -d'=' -f2)" --app $APP_NAME
heroku config:set NODE_ENV=production --app $APP_NAME
```

### Option B: Manual Method

```bash
APP_NAME=your-strapi-app-name

# Generate secrets manually
heroku config:set ADMIN_JWT_SECRET=$(openssl rand -base64 32) --app $APP_NAME
heroku config:set API_TOKEN_SALT=$(openssl rand -base64 32) --app $APP_NAME
heroku config:set TRANSFER_TOKEN_SALT=$(openssl rand -base64 32) --app $APP_NAME
heroku config:set ENCRYPTION_KEY=$(openssl rand -base64 32) --app $APP_NAME
heroku config:set APP_KEYS="$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)" --app $APP_NAME
heroku config:set NODE_ENV=production --app $APP_NAME
```

### Verify All Environment Variables

```bash
heroku config --app your-strapi-app-name
```

You should see:
- `ADMIN_JWT_SECRET`
- `API_TOKEN_SALT`
- `TRANSFER_TOKEN_SALT`
- `ENCRYPTION_KEY`
- `APP_KEYS` (4 comma-separated values)
- `DATABASE_URL` (auto-set by Postgres add-on)
- `NODE_ENV=production`

## Step 5: Update CORS Configuration (if needed)

Check `config/plugins.ts` - it should already include your production URLs:

```typescript
export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
      cors: {
        enabled: true,
        origin: [
          'https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com', // Main backend
          'https://liff-ot-app-positive.vercel.app', // Frontend
          'https://liff-ot-app-arun-c4kr6e91j-charenas-projects.vercel.app', // New Vercel URL
          'http://localhost:3001', // Local dev
          'http://localhost:5173', // Local frontend
        ],
      },
    },
  },
});
```

**If you need to add your new Heroku Strapi URL:**
```bash
# Update config/plugins.ts to include your Strapi URL in CORS
# Then rebuild and redeploy
```

## Step 6: Build Strapi

Build Strapi before deploying:

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi
npm run build
```

This creates the `dist/` folder with compiled files.

## Step 7: Prepare Git Repository

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi

# Check git status
git status

# If not initialized, initialize git
git init

# Add all files (except those in .gitignore)
git add .

# Commit
git commit -m "Prepare Strapi for Heroku production deployment"
```

## Step 8: Deploy to Heroku

```bash
# Add Heroku remote (replace with your app name)
heroku git:remote -a your-strapi-app-name

# Deploy
git push heroku main

# If your default branch is 'master':
git push heroku master
```

Heroku will:
1. Install dependencies (`npm install`)
2. Run build script (`npm run build`)
3. Start the app (`npm start`)

## Step 9: Create Admin User

After deployment, create your first admin user:

```bash
# Open Strapi admin panel
heroku open --app your-strapi-app-name

# Or visit directly:
# https://your-strapi-app-name.herokuapp.com/admin
```

1. Fill in the registration form
2. Create your admin account
3. Login to Strapi admin panel

## Step 10: Set Up Content Types and Permissions

1. **Set Public Permissions:**
   - Go to Settings → Users & Permissions → Roles → Public
   - Enable permissions for:
     - `Driver`: find, findOne, create, update, delete
     - `Attendance`: find, findOne, create, update
     - `Login History`: find, findOne
     - `Month`: find, findOne

2. **Set Upload Permissions:**
   - Go to Settings → Users & Permissions → Roles → Public
   - Enable `upload` permission

3. **Create Test Users (optional):**
   - Go to Content Manager → User
   - Create users for testing

## Step 11: Update Main App to Use Heroku Strapi

Update your main app's environment variables:

```bash
cd /Users/charena/Projects/liff-ot-app-arun

# Set STRAPI_URL to your Heroku Strapi URL
heroku config:set STRAPI_URL=https://your-strapi-app-name.herokuapp.com \
  --app liff-ot-app-raksaard-2de47d0ac48c

# If you also have a Vercel deployment, set it there too:
# In Vercel dashboard → Settings → Environment Variables
# Add: STRAPI_URL=https://your-strapi-app-name.herokuapp.com
```

## Step 12: Test the Connection

```bash
# Test Strapi API is accessible
curl https://your-strapi-app-name.herokuapp.com/api

# Test login through your main app
curl -X POST https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your-username",
    "password": "your-password"
  }'

# Test Strapi health
curl https://your-strapi-app-name.herokuapp.com/_health
```

## Step 13: Monitor Your Deployment

```bash
# View logs in real-time
heroku logs --tail --app your-strapi-app-name

# Check app status
heroku ps --app your-strapi-app-name

# Restart app if needed
heroku restart --app your-strapi-app-name
```

## Troubleshooting

### Issue: Build fails on Heroku

**Solution:**
```bash
# Build locally first
npm run build

# Commit the dist folder
git add dist/
git commit -m "Add build files"
git push heroku main
```

### Issue: Database connection errors

**Solution:**
```bash
# Check PostgreSQL add-on
heroku addons --app your-strapi-app-name

# Verify DATABASE_URL
heroku config:get DATABASE_URL --app your-strapi-app-name

# Check database config
# Ensure config/database.ts uses DATABASE_URL for postgres
```

### Issue: CORS errors

**Solution:**
1. Update `config/plugins.ts` with your frontend/backend URLs
2. Rebuild: `npm run build`
3. Redeploy: `git push heroku main`

### Issue: Environment variables missing

**Solution:**
```bash
# Check all config vars
heroku config --app your-strapi-app-name

# Set missing ones
heroku config:set VARIABLE_NAME=value --app your-strapi-app-name

# Restart app
heroku restart --app your-strapi-app-name
```

### Issue: App crashes on start

**Solution:**
```bash
# Check logs for errors
heroku logs --tail --app your-strapi-app-name

# Common fixes:
# 1. Ensure all environment variables are set
# 2. Check DATABASE_URL is correct
# 3. Verify Procfile exists: web: npm start
# 4. Restart app
heroku restart --app your-strapi-app-name
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Ensure package.json has all dependencies
npm install

# Commit package.json and package-lock.json
git add package.json package-lock.json
git commit -m "Update dependencies"
git push heroku main
```

## Quick Reference Commands

```bash
# Deploy updates
cd /Users/charena/Projects/liff-ot-app-arun/strapi
npm run build
git add .
git commit -m "Update Strapi"
git push heroku main

# View logs
heroku logs --tail --app your-strapi-app-name

# Check config
heroku config --app your-strapi-app-name

# Restart app
heroku restart --app your-strapi-app-name

# Open admin panel
heroku open --app your-strapi-app-name

# Run console commands
heroku run npm run strapi console --app your-strapi-app-name
```

## Environment Variables Summary

### Required for Strapi Heroku App:
- ✅ `ADMIN_JWT_SECRET` - JWT secret for admin
- ✅ `API_TOKEN_SALT` - API token salt
- ✅ `TRANSFER_TOKEN_SALT` - Transfer token salt
- ✅ `ENCRYPTION_KEY` - Encryption key
- ✅ `APP_KEYS` - Comma-separated, 4 random values
- ✅ `DATABASE_URL` - Auto-set by Postgres add-on
- ✅ `NODE_ENV=production` - Production mode

### Required for Main App:
- ✅ `STRAPI_URL=https://your-strapi-app-name.herokuapp.com`

## Next Steps After Deployment

1. ✅ Create admin user in Strapi
2. ✅ Set up content type permissions (Public role)
3. ✅ Create test users
4. ✅ Update main app STRAPI_URL
5. ✅ Test login from production frontend
6. ✅ Test manager view with driver data
7. ✅ Monitor logs and performance

## Production Checklist

- [ ] PostgreSQL driver (`pg`) installed
- [ ] Heroku app created
- [ ] PostgreSQL add-on added
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Strapi built successfully
- [ ] Deployed to Heroku
- [ ] Admin user created
- [ ] Permissions configured
- [ ] Main app STRAPI_URL updated
- [ ] Connection tested
- [ ] Logs monitored

---

**Your Strapi will be available at:**
`https://your-strapi-app-name.herokuapp.com`

**Admin panel:**
`https://your-strapi-app-name.herokuapp.com/admin`

**API endpoint:**
`https://your-strapi-app-name.herokuapp.com/api`

