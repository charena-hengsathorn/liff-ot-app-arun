# 🚀 Heroku Backend Consolidation Guide

## 📋 Overview

This guide will help you consolidate **Express + Strapi** into a **single Heroku app**.

**Before:**
```
┌─────────────────────────┐
│ liff-ot-app-arun        │ ← Express + Frontend
└─────────────────────────┘

┌─────────────────────────┐
│ liff-ot-app-arun-strapi │ ← Strapi CMS
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│ liff-ot-app-arun        │ ← Express + Strapi
│ (Consolidated!)         │    (Both running together)
└─────────────────────────┘
```

---

## ✅ Changes Already Made

1. ✅ **Procfile** - Now runs both Express + Strapi
   ```
   web: npm run start:all
   ```

2. ✅ **package.json** - Build script optimized for backend-only
   ```json
   "build": "cd strapi && npm run build"  // Removed frontend build
   ```

3. ✅ **Architecture** - Code already supports this (uses STRAPI_PORT!)

---

## 📍 Step 1: Set Heroku Environment Variables

Run these commands in your terminal:

```bash
# Set Strapi to use port 1337 (so it doesn't conflict with Express)
heroku config:set STRAPI_PORT=1337 --app liff-ot-app-arun

# Tell Express where Strapi is (localhost because they're on same dyno)
heroku config:set STRAPI_URL=http://localhost:1337 --app liff-ot-app-arun

# Set Node environment
heroku config:set NODE_ENV=production --app liff-ot-app-arun

# Verify it's set
heroku config --app liff-ot-app-arun
```

**Expected output:**
```
=== liff-ot-app-arun Config Vars
DATABASE_URL:              postgresql://...
STRAPI_PORT:               1337
STRAPI_URL:                http://localhost:1337
NODE_ENV:                  production
LINE_CHANNEL_ACCESS_TOKEN: ...
... (all your other existing vars)
```

---

## 📍 Step 2: Ensure All Backend Env Vars Are Set

Make sure these are in Heroku (should already be there):

```bash
# Check if these exist
heroku config --app liff-ot-app-arun | grep -E "DATABASE_URL|GOOGLE_SERVICE_ACCOUNT_KEY|LINE_CHANNEL_ACCESS_TOKEN|JWT_SECRET|DEVADMIN"
```

**Required variables:**
- ✅ `DATABASE_URL` - PostgreSQL (Heroku auto-manages this)
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` - Base64-encoded Google credentials
- ✅ `LINE_CHANNEL_ACCESS_TOKEN` - LINE messaging API
- ✅ `LINE_GROUP_ID_DEV` / `LINE_GROUP_ID_PROD`
- ✅ `MANAGER_USER_IDS_DEV` / `MANAGER_USER_IDS_PROD`
- ✅ `DEVADMIN_USERNAME` / `DEVADMIN_PASSWORD_HASH`
- ✅ `JWT_SECRET` / `JWT_EXPIRY`
- ✅ `ADMIN_JWT_SECRET`

**If any are missing**, set them:
```bash
heroku config:set VARIABLE_NAME=value --app liff-ot-app-arun
```

---

## 📍 Step 3: Test Locally (Optional but Recommended)

Test that Express + Strapi can run together on your machine:

```bash
# 1. Install dependencies
npm install
cd strapi && npm install
cd ..

# 2. Set local env vars
# Edit .env.local and add:
echo "STRAPI_PORT=1337" >> .env.local
echo "STRAPI_URL=http://localhost:1337" >> .env.local

# 3. Run both together
npm run start:all

# You should see:
# ✅ [Express] Server running on port 3001
# ✅ [Strapi] Server running on port 1337
```

**Test endpoints:**
- Express: http://localhost:3001/health
- Strapi Admin: http://localhost:3001/admin (proxied through Express!)
- Strapi API: http://localhost:3001/api/drivers

**Press Ctrl+C to stop when done testing**

---

## 📍 Step 4: Deploy to Heroku

```bash
# 1. Make sure you're on the right branch
git status

# 2. Add all changes
git add Procfile package.json

# 3. Commit
git commit -m "feat: Consolidate Express + Strapi on single Heroku dyno

- Update Procfile to run both Express and Strapi together
- Optimize build script to skip frontend (Vercel handles that)
- Use STRAPI_PORT=1337 for Strapi, PORT for Express
- STRAPI_URL=http://localhost:1337 for internal communication"

# 4. Push to Heroku (this deploys!)
git push heroku main

# Watch the deployment logs
heroku logs --tail --app liff-ot-app-arun
```

**Expected output in logs:**
```
heroku[web.1]: Starting process with command `npm run start:all`
app[web.1]: [Express] Server running on port 12345
app[web.1]: [Strapi] Server running on port 1337
app[web.1]: ✅ Both services started successfully
```

---

## 📍 Step 5: Verify Deployment

Test the consolidated backend:

```bash
# 1. Check health endpoint
curl https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/health

# Expected: {"status":"healthy","timestamp":"...","env":"production"}

# 2. Check Strapi admin is accessible
# Open in browser:
https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/admin

# Expected: Strapi admin login page

# 3. Check API endpoint
curl https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/api/drivers

# Expected: JSON response with drivers data
```

---

## 📍 Step 6: Update Vercel Environment Variable

**Ask PM to update Vercel env var:**

Old value (pointing to separate Strapi):
```
VITE_API_BASE_URL_PROD=https://liff-ot-app-arun-strapi.herokuapp.com
```

**New value (pointing to consolidated backend):**
```
VITE_API_BASE_URL_PROD=https://liff-ot-app-arun-d0ff4972332c.herokuapp.com
```

**Steps for PM:**
1. Go to Vercel Dashboard
2. Project: liff-ot-app-arun
3. Settings → Environment Variables
4. Find: `VITE_API_BASE_URL_PROD`
5. Edit and change to: `https://liff-ot-app-arun-d0ff4972332c.herokuapp.com`
6. Save
7. Deployments → Latest → Redeploy

---

## 📍 Step 7: Shut Down Old Strapi App (Optional)

**After verifying everything works**, you can shut down the old separate Strapi app:

```bash
# Scale down to save costs
heroku ps:scale web=0 --app liff-ot-app-arun-strapi

# Or delete it entirely (CAREFUL!)
# heroku apps:destroy --app liff-ot-app-arun-strapi --confirm liff-ot-app-arun-strapi
```

**⚠️ WARNING:** Don't do this until you've verified the consolidated deployment works!

---

## 🔍 Troubleshooting

### Issue: "Port already in use"

**Cause:** Both Express and Strapi trying to use the same port

**Solution:** Make sure `STRAPI_PORT=1337` is set in Heroku
```bash
heroku config:set STRAPI_PORT=1337 --app liff-ot-app-arun
```

---

### Issue: "Strapi admin redirecting incorrectly"

**Cause:** STRAPI_URL pointing to wrong location

**Solution:** Should be `http://localhost:1337` for internal communication
```bash
heroku config:set STRAPI_URL=http://localhost:1337 --app liff-ot-app-arun
```

---

### Issue: "Build failed - out of memory"

**Cause:** Heroku free tier has limited memory

**Solution:** Upgrade to Hobby dyno ($7/month):
```bash
heroku dyno:type hobby --app liff-ot-app-arun
```

---

### Issue: "Frontend not loading"

**Cause:** Frontend should be served by Vercel now, not Heroku

**Solution:**
1. Make sure Vercel env vars are set correctly
2. Push your updated code to GitHub (Vercel auto-deploys)
3. Visit: https://liff-ot-app-arun.vercel.app

---

## ✅ Final Architecture

```
┌─────────────────────────────────┐
│ Vercel (Frontend)               │
│ https://liff-ot-app-arun        │
│ .vercel.app                     │
│                                 │
│ - React SPA                     │
│ - API calls to Heroku backend   │
└────────────┬────────────────────┘
             │
             │ VITE_API_BASE_URL_PROD
             ↓
┌─────────────────────────────────┐
│ Heroku (Consolidated Backend)  │
│ https://liff-ot-app-arun-       │
│ d0ff4972332c.herokuapp.com      │
│                                 │
│ ┌─────────────┐ ┌─────────────┐│
│ │  Express    │ │  Strapi CMS ││
│ │  (PORT)     │ │  (1337)     ││
│ │             │→│             ││
│ └─────────────┘ └─────────────┘│
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│ Heroku PostgreSQL               │
│ (Shared Database)               │
└─────────────────────────────────┘
```

**Benefits:**
- ✅ 50% cost reduction (1 dyno instead of 2)
- ✅ Simpler management
- ✅ Faster internal communication (Express ↔ Strapi on same machine)
- ✅ Shared database connection pool

---

## 📊 Cost Comparison

**Before:**
- Heroku Express: $7/month (Hobby)
- Heroku Strapi: $7/month (Hobby)
- **Total: $14/month**

**After:**
- Heroku Consolidated: $7/month (Hobby)
- Vercel Frontend: $0/month (Free)
- **Total: $7/month**

**💰 Savings: $7/month = $84/year**

---

## ✅ Deployment Checklist

- [ ] Set `STRAPI_PORT=1337` in Heroku
- [ ] Set `STRAPI_URL=http://localhost:1337` in Heroku
- [ ] Verify all backend env vars exist in Heroku
- [ ] Test locally with `npm run start:all` (optional)
- [ ] Commit Procfile and package.json changes
- [ ] Push to Heroku: `git push heroku main`
- [ ] Verify deployment: Check logs and test endpoints
- [ ] Ask PM to update Vercel `VITE_API_BASE_URL_PROD`
- [ ] Test full flow: Vercel → Heroku → Database
- [ ] Shut down old Strapi app (after verification)

---

## 🆘 Need Help?

**Check logs:**
```bash
heroku logs --tail --app liff-ot-app-arun
```

**Check running processes:**
```bash
heroku ps --app liff-ot-app-arun
```

**Restart if needed:**
```bash
heroku restart --app liff-ot-app-arun
```

**Rollback if something breaks:**
```bash
heroku releases --app liff-ot-app-arun
heroku rollback v123 --app liff-ot-app-arun  # Replace v123 with previous version
```
