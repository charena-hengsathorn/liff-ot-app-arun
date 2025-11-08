# Strapi Heroku Deployment - Quick Start

## ✅ What's Already Done

Your Heroku app is **fully configured** and ready to deploy!

- ✅ **Heroku App Created**: `liff-ot-app-strapi-prod`
- ✅ **PostgreSQL Database**: Added (essential-0 plan)
- ✅ **Environment Variables**: All secrets configured
- ✅ **PostgreSQL Driver**: `pg` package installed

**Your Strapi URL:**
- **API**: https://liff-ot-app-strapi-prod-86024d237340.herokuapp.com/api
- **Admin**: https://liff-ot-app-strapi-prod-86024d237340.herokuapp.com/admin

## 🚀 Quick Deploy (Recommended)

Use the simple deployment script:

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi
./deploy.sh
```

This script will:
1. Build Strapi
2. Commit changes to git
3. Deploy to Heroku
4. Show you the next steps

## 📋 Full Setup Script (First Time Only)

If you need to set up a new Heroku app from scratch:

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi
./deploy-heroku.sh
```

This script will:
- Check/create Heroku app
- Add PostgreSQL database
- Set all environment variables
- Build and deploy

## 📝 Manual Deployment

If you prefer to deploy manually:

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi

# 1. Build Strapi
npm run build

# 2. Initialize git (if needed)
git init

# 3. Add Heroku remote
heroku git:remote -a liff-ot-app-strapi-prod

# 4. Commit and deploy
git add .
git commit -m "Deploy Strapi"
git push heroku main
```

## 🔐 After Deployment

### 1. Create Admin User

```bash
heroku open --app liff-ot-app-strapi-prod
```

Or visit: https://liff-ot-app-strapi-prod-86024d237340.herokuapp.com/admin

### 2. Set Permissions

In Strapi Admin Panel:
1. Go to **Settings** → **Users & Permissions** → **Roles** → **Public**
2. Enable permissions for:
   - **Driver**: `find`, `findOne`, `create`, `update`, `delete`
   - **Attendance**: `find`, `findOne`, `create`, `update`
   - **Login History**: `find`, `findOne`
   - **Month**: `find`, `findOne`
3. Enable **Upload** permission

### 3. Update Main App

Update your main app's `STRAPI_URL`:

```bash
# For Heroku backend
heroku config:set STRAPI_URL=https://liff-ot-app-strapi-prod-86024d237340.herokuapp.com \
  --app liff-ot-app-raksaard-2de47d0ac48c

# For Vercel (if applicable)
# Go to Vercel Dashboard → Settings → Environment Variables
# Add: STRAPI_URL=https://liff-ot-app-strapi-prod-86024d237340.herokuapp.com
```

## 📊 Monitor Deployment

```bash
# View logs
heroku logs --tail --app liff-ot-app-strapi-prod

# Check app status
heroku ps --app liff-ot-app-strapi-prod

# Restart app
heroku restart --app liff-ot-app-strapi-prod

# Check environment variables
heroku config --app liff-ot-app-strapi-prod
```

## 🔄 Future Deployments

For future updates, just run:

```bash
cd /Users/charena/Projects/liff-ot-app-arun/strapi
./deploy.sh
```

## 📚 Documentation

- **Full Guide**: `Guides for Use/DEPLOY_STRAPI_HEROKU_PROD.md`
- **Quick Setup**: `Guides for Use/QUICK_STRAPI_HEROKU_SETUP.md`
- **Original Guide**: `Guides for Use/STRAPI_HEROKU_DEPLOYMENT.md`

## 🆘 Troubleshooting

### Build Fails
```bash
npm run build
git add dist/
git commit -m "Add build files"
git push heroku main
```

### Database Errors
```bash
# Check PostgreSQL
heroku addons --app liff-ot-app-strapi-prod
heroku config:get DATABASE_URL --app liff-ot-app-strapi-prod
```

### App Crashes
```bash
# Check logs
heroku logs --tail --app liff-ot-app-strapi-prod

# Restart
heroku restart --app liff-ot-app-strapi-prod
```

---

**Ready to deploy?** Run `./deploy.sh` now! 🚀

