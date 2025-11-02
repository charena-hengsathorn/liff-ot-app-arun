# Quick Setup: Deploy Strapi to Heroku

## Fast Track Steps

### 1. Create Heroku App and Add Database

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi

# Create Heroku app (replace 'your-app-name' with your chosen name)
heroku create your-strapi-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini --app your-strapi-app-name
```

### 2. Install PostgreSQL Driver

Strapi needs the PostgreSQL driver for Heroku:

```bash
npm install pg
npm install --save-dev @types/pg  # Optional: TypeScript types
```

### 3. Set Environment Variables

```bash
# Quick way: Generate and set all secrets
node -e "
const crypto = require('crypto');
const gen = () => crypto.randomBytes(32).toString('base64');
console.log('Setting secrets...');
console.log('ADMIN_JWT_SECRET=' + gen());
console.log('API_TOKEN_SALT=' + gen());
console.log('TRANSFER_TOKEN_SALT=' + gen());
console.log('ENCRYPTION_KEY=' + gen());
console.log('APP_KEYS=' + Array(4).fill().map(() => gen()).join(','));
" | while IFS='=' read key value; do
  heroku config:set "$key=$value" --app your-strapi-app-name
done

# Or set manually (replace values with generated secrets):
heroku config:set ADMIN_JWT_SECRET=your_secret --app your-strapi-app-name
heroku config:set API_TOKEN_SALT=your_salt --app your-strapi-app-name
heroku config:set TRANSFER_TOKEN_SALT=your_salt --app your-strapi-app-name
heroku config:set ENCRYPTION_KEY=your_key --app your-strapi-app-name
heroku config:set APP_KEYS="key1,key2,key3,key4" --app your-strapi-app-name
heroku config:set NODE_ENV=production --app your-strapi-app-name
```

### 4. Build and Deploy

```bash
# Build Strapi
npm run build

# Initialize git if needed
git init
git add .
git commit -m "Initial Strapi for Heroku"

# Add Heroku remote
heroku git:remote -a your-strapi-app-name

# Deploy
git push heroku main
```

### 5. Create Admin User

```bash
# Open Strapi admin
heroku open --app your-strapi-app-name

# Or visit:
# https://your-strapi-app-name.herokuapp.com/admin
```

Create your first admin user through the web interface.

### 6. Update Main App to Use Heroku Strapi

```bash
cd /Users/charena/Projects/liff-ot-app-arun

# Set STRAPI_URL in main app's Heroku config
heroku config:set STRAPI_URL=https://your-strapi-app-name.herokuapp.com \
  --app liff-ot-app-raksaard-2de47d0ac48c
```

### 7. Test Connection

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

## What's Already Configured ✅

- ✅ **Procfile** - Created for Heroku
- ✅ **Database Config** - Auto-detects PostgreSQL via DATABASE_URL
- ✅ **CORS** - Configured in `config/plugins.ts`
- ✅ **Package.json** - Has `build` and `start` scripts

## Troubleshooting

**Build fails?**
```bash
npm run build
git add dist/
git commit -m "Add build files"
git push heroku main
```

**Database errors?**
```bash
# Check PostgreSQL add-on
heroku addons --app your-strapi-app-name

# Check DATABASE_URL
heroku config:get DATABASE_URL --app your-strapi-app-name
```

**CORS errors?**
- Update `config/plugins.ts` with your frontend URLs
- Redeploy: `git push heroku main`

**Check logs:**
```bash
heroku logs --tail --app your-strapi-app-name
```

## Full Guide

For detailed instructions, see: `STRAPI_HEROKU_DEPLOYMENT.md`
