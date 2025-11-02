# Deploy Strapi to Heroku

## Overview

This guide will help you deploy your Strapi instance to Heroku and configure it to work with your main app.

## Prerequisites

- Heroku CLI installed and logged in
- Git initialized in your Strapi directory
- Heroku account

## Step 1: Prepare Strapi for Heroku

### 1.1 Create Procfile

Create a `Procfile` in your Strapi directory:

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi
echo "web: npm start" > Procfile
```

### 1.2 Update package.json

Ensure your `package.json` has a `start` script. Strapi should already have this:

```json
{
  "scripts": {
    "start": "strapi start",
    "develop": "strapi develop",
    "build": "strapi build"
  }
}
```

### 1.3 Configure Database for Production

Heroku uses PostgreSQL, not SQLite. Update `config/database.ts`:

```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: env.bool('DATABASE_SSL', true),
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
  },
});
```

### 1.4 Update Server Configuration

Update `config/server.ts` to use Heroku's PORT:

```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
```

## Step 2: Initialize Git (if not already done)

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi

# If git is not initialized
git init
git add .
git commit -m "Initial Strapi commit"
```

## Step 3: Create Heroku App

```bash
# Create a new Heroku app for Strapi
heroku create your-strapi-app-name

# Example:
heroku create liff-ot-app-strapi
```

**Note:** Write down your Heroku app name - you'll need it later!

## Step 4: Add PostgreSQL Add-on

Strapi needs a database. Add Heroku Postgres:

```bash
heroku addons:create heroku-postgresql:mini --app your-strapi-app-name
```

This will automatically set the `DATABASE_URL` environment variable.

## Step 5: Set Environment Variables

Set all required Strapi environment variables on Heroku:

```bash
heroku config:set ADMIN_JWT_SECRET=$(openssl rand -base64 32) --app your-strapi-app-name
heroku config:set API_TOKEN_SALT=$(openssl rand -base64 32) --app your-strapi-app-name
heroku config:set TRANSFER_TOKEN_SALT=$(openssl rand -base64 32) --app your-strapi-app-name
heroku config:set ENCRYPTION_KEY=$(openssl rand -base64 32) --app your-strapi-app-name

# APP_KEYS needs 4 random values (comma-separated)
heroku config:set APP_KEYS="$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)" --app your-strapi-app-name

# Optional: Set NODE_ENV
heroku config:set NODE_ENV=production --app your-strapi-app-name
```

**Or use this easier method:**

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

# Then set them on Heroku
heroku config:set $(grep ADMIN_JWT_SECRET /tmp/strapi-secrets.txt) --app your-strapi-app-name
heroku config:set $(grep API_TOKEN_SALT /tmp/strapi-secrets.txt) --app your-strapi-app-name
heroku config:set $(grep TRANSFER_TOKEN_SALT /tmp/strapi-secrets.txt) --app your-strapi-app-name
heroku config:set $(grep ENCRYPTION_KEY /tmp/strapi-secrets.txt) --app your-strapi-app-name
heroku config:set APP_KEYS="$(grep APP_KEYS /tmp/strapi-secrets.txt | cut -d'=' -f2)" --app your-strapi-app-name
```

## Step 6: Configure CORS

Update `config/plugins.ts` to allow your main app:

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
          'https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com', // Your main backend
          'https://liff-ot-app-positive.vercel.app', // Your frontend
          'http://localhost:3001', // Local dev
          'http://localhost:5173', // Local frontend
        ],
      },
    },
  },
});
```

## Step 7: Build and Deploy

```bash
# Build Strapi
npm run build

# Add and commit built files
git add .
git commit -m "Prepare for Heroku deployment"

# Add Heroku remote
heroku git:remote -a your-strapi-app-name

# Deploy to Heroku
git push heroku main

# If your default branch is master
git push heroku master
```

## Step 8: Run Migrations and Create Admin User

After deployment:

```bash
# Open Strapi admin (first time setup)
heroku open --app your-strapi-app-name

# Or access directly:
# https://your-strapi-app-name.herokuapp.com/admin
```

1. Create your first admin user
2. Set up your content types if needed
3. Create users for your app

## Step 9: Update Main App to Use Heroku Strapi

### 9.1 Update Main App Environment Variables

In your main app (`liff-ot-app-arun`):

```bash
# Set STRAPI_URL to your Heroku Strapi URL
heroku config:set STRAPI_URL=https://your-strapi-app-name.herokuapp.com \
  --app liff-ot-app-raksaard-2de47d0ac48c
```

### 9.2 Update Local Development (Optional)

If you want to test against Heroku Strapi locally:

```bash
# In .env.local
STRAPI_URL=https://your-strapi-app-name.herokuapp.com
```

## Step 10: Test the Connection

```bash
# Test Strapi is accessible
curl https://your-strapi-app-name.herokuapp.com/api

# Test login through your main app
curl -X POST https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your-username",
    "password": "your-password"
  }'
```

## Troubleshooting

### Issue: Build fails

**Solution:** Make sure you've run `npm run build` before deploying. Heroku needs the built files.

### Issue: Database connection errors

**Solution:**
1. Check PostgreSQL add-on is created: `heroku addons --app your-strapi-app-name`
2. Verify DATABASE_URL is set: `heroku config:get DATABASE_URL --app your-strapi-app-name`
3. Check database config in `config/database.ts`

### Issue: CORS errors

**Solution:**
1. Update `config/plugins.ts` with your frontend/backend URLs
2. Redeploy: `git push heroku main`

### Issue: Environment variables missing

**Solution:**
```bash
# Check all config vars
heroku config --app your-strapi-app-name

# Set missing ones
heroku config:set VARIABLE_NAME=value --app your-strapi-app-name
```

### Issue: App crashes on start

**Solution:**
```bash
# Check logs
heroku logs --tail --app your-strapi-app-name

# Restart app
heroku restart --app your-strapi-app-name
```

## Quick Reference Commands

```bash
# Deploy updates
cd /Users/charena/Projects/liff-ot-app-arun/strapi
npm run build
git add .
git commit -m "Update Strapi"
git push heroku main

# Check logs
heroku logs --tail --app your-strapi-app-name

# Open Strapi admin
heroku open --app your-strapi-app-name

# Check environment variables
heroku config --app your-strapi-app-name

# Restart Strapi
heroku restart --app your-strapi-app-name
```

## Environment Variables Summary

### Strapi Heroku App Needs:
- `ADMIN_JWT_SECRET`
- `API_TOKEN_SALT`
- `TRANSFER_TOKEN_SALT`
- `ENCRYPTION_KEY`
- `APP_KEYS` (comma-separated, 4 values)
- `DATABASE_URL` (auto-set by Postgres add-on)
- `NODE_ENV=production` (optional)

### Main App Heroku Needs:
- `STRAPI_URL=https://your-strapi-app-name.herokuapp.com` ← **Add this!**

## Next Steps

1. ✅ Deploy Strapi to Heroku
2. ✅ Create admin user in Strapi
3. ✅ Create test users in Strapi
4. ✅ Update main app STRAPI_URL
5. ✅ Test login from production frontend

---

**Your Strapi will be available at:**
`https://your-strapi-app-name.herokuapp.com`

**Your main app will connect to it via:**
`https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com/login` → `https://your-strapi-app-name.herokuapp.com/api/auth/local`


