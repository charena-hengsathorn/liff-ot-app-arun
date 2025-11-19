# 🚀 Vercel Migration Guide

## ✅ Changes Completed

### Files Created
1. **`src/config/api.js`** - Centralized API configuration
2. **`.env.example`** - Environment variable template

### Files Modified
1. **`src/StyledForm.jsx`** - Updated to use centralized API config
2. **`src/ManagerView.jsx`** - Updated to use centralized API config
3. **`src/login/LoginForm.jsx`** - Updated to use centralized API config

---

## 📋 Next Steps

### Step 1: Local Testing (Recommended)

Before pushing to GitHub, test locally:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Create .env.local file
# Copy .env.example to .env.local and fill in your values
cp .env.example .env.local

# 3. Edit .env.local with your actual values:
# VITE_LIFF_ID=2007661538-Ka1DlJ20
# VITE_GOOGLE_SHEET_ID_DEV=1diiYf4TaTLwsLA0O48xjwBSTC76BvOAS2woezN_Z4lQ
# VITE_GOOGLE_SHEET_ID_PROD=1_ObqjB3eMOgbKmf3xvzQHeCttjyAUIn5meiu4nT0z34
# VITE_API_BASE_URL_DEV=http://localhost:3001
# VITE_API_BASE_URL_PROD=https://liff-ot-app-arun-d0ff4972332c.herokuapp.com

# 4. Start development server
npm run dev

# 5. Open browser to http://localhost:5173
# 6. Test all functionality:
#    - Clock in/out
#    - Form submission
#    - Manager view
#    - DevAdmin login
```

**✅ Local Testing Checklist:**
- [ ] App loads without errors
- [ ] Console shows correct API URL (should be localhost:3001)
- [ ] Form submission works
- [ ] Clock in/out works
- [ ] Manager view loads drivers
- [ ] No CORS errors

---

### Step 2: Create Git Branch

```bash
# Create migration branch (DON'T push to main yet!)
git checkout -b feat/vercel-migration

# Check what files changed
git status

# You should see:
# - src/config/api.js (new)
# - .env.example (new)
# - src/StyledForm.jsx (modified)
# - src/ManagerView.jsx (modified)
# - src/login/LoginForm.jsx (modified)
# - VERCEL_MIGRATION_GUIDE.md (new)

# Stage the changes
git add src/config/api.js
git add .env.example
git add src/StyledForm.jsx
git add src/ManagerView.jsx
git add src/login/LoginForm.jsx
git add VERCEL_MIGRATION_GUIDE.md

# Commit with descriptive message
git commit -m "feat: Add centralized API config for Vercel migration

- Create src/config/api.js for environment-based API URLs
- Update StyledForm, ManagerView, LoginForm to use new config
- Add .env.example template for environment variables
- Support VITE_API_BASE_URL_DEV and VITE_API_BASE_URL_PROD
- Preparation for Vercel frontend deployment"
```

---

### Step 3: Push to GitHub and Create PR

```bash
# Push the branch to GitHub
git push origin feat/vercel-migration

# Then go to GitHub and create a Pull Request:
# https://github.com/charena-hengsathorn/liff-ot-app-arun/compare/feat/vercel-migration

# Title: "Vercel Migration - Frontend API Configuration"
# Description: See below
```

**PR Description Template:**
```markdown
## 🚀 Vercel Migration - Frontend API Configuration

### Changes
- ✅ Centralized API configuration in `src/config/api.js`
- ✅ Environment variable support for API URLs
- ✅ Updated all components to use new config

### Testing
- ✅ Tested locally with dev server
- ✅ All functionality working
- ✅ No breaking changes

### Environment Variables Needed in Vercel

**Production:**
```
VITE_LIFF_ID=2007661538-Ka1DlJ20
VITE_GOOGLE_SHEET_ID_PROD=1_ObqjB3eMOgbKmf3xvzQHeCttjyAUIn5meiu4nT0z34
VITE_API_BASE_URL_PROD=https://liff-ot-app-arun-d0ff4972332c.herokuapp.com
```

**Preview:**
```
VITE_LIFF_ID=2007661538-Ka1DlJ20
VITE_GOOGLE_SHEET_ID_DEV=1diiYf4TaTLwsLA0O48xjwBSTC76BvOAS2woezN_Z4lQ
VITE_API_BASE_URL_DEV=http://localhost:3001
```

### Next Steps
1. ⏳ Vercel will auto-deploy preview
2. ⏳ Configure environment variables in Vercel Dashboard
3. ⏳ Test preview deployment
4. ⏳ Merge to main when ready
```

---

### Step 4: Configure Vercel Environment Variables

**IMPORTANT:** After creating the PR, Vercel will create a preview deployment.

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `liff-ot-app-arun`
3. Go to **Settings** → **Environment Variables**

**Add these for PRODUCTION environment:**

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_LIFF_ID` | `2007661538-Ka1DlJ20` | Production |
| `VITE_GOOGLE_SHEET_ID_PROD` | `1_ObqjB3eMOgbKmf3xvzQHeCttjyAUIn5meiu4nT0z34` | Production |
| `VITE_API_BASE_URL_PROD` | `https://liff-ot-app-arun-d0ff4972332c.herokuapp.com` | Production |

**Add these for PREVIEW environment:**

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_LIFF_ID` | `2007661538-Ka1DlJ20` | Preview |
| `VITE_GOOGLE_SHEET_ID_DEV` | `1diiYf4TaTLwsLA0O48xjwBSTC76BvOAS2woezN_Z4lQ` | Preview |
| `VITE_API_BASE_URL_DEV` | `http://localhost:3001` | Preview |

4. **Trigger Redeploy** after adding env vars:
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click **"..."** → **"Redeploy"**

---

### Step 5: Test Vercel Preview Deployment

After redeployment completes, you'll get a preview URL like:
```
https://liff-ot-app-arun-git-feat-vercel-migration-[username].vercel.app
```

**✅ Preview Testing Checklist:**
- [ ] Open preview URL
- [ ] Check browser console for errors
- [ ] Verify API calls go to Heroku backend
- [ ] Test form submission
- [ ] Test clock in/out
- [ ] Test manager view
- [ ] Verify no CORS errors
- [ ] Test on mobile device

**Look for in console:**
```javascript
// Should see API calls to:
https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/api/drivers
https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/submit
// etc.
```

---

### Step 6: Merge to Production

**⚠️ ONLY proceed if Preview testing is 100% successful!**

1. **Merge the PR** on GitHub
   - Click "Merge Pull Request"
   - Vercel automatically deploys to production

2. **Production URL:**
   ```
   https://liff-ot-app-arun.vercel.app
   ```

3. **Test Production Deployment**
   - Same checklist as Preview testing

4. **Update LINE LIFF Endpoint** (CRITICAL!)
   - Go to LINE Developers Console
   - Update endpoint URL to: `https://liff-ot-app-arun.vercel.app`

5. **Monitor Logs**
   - Vercel: https://vercel.com/[username]/liff-ot-app-arun/logs
   - Heroku: `heroku logs --tail --app liff-ot-app-arun-d0ff4972332c`

---

## 🔧 Troubleshooting

### Issue: API calls failing

**Check:**
1. Vercel env vars are set correctly
2. Heroku backend is running: `heroku ps --app liff-ot-app-arun-d0ff4972332c`
3. CORS is configured (already done in server.mjs)

**Solution:**
```bash
# Check Heroku backend health
curl https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/health
```

### Issue: CORS errors

**Check:**
- Vercel URL is in server.mjs allowedOrigins (already configured)
- Preview URLs match pattern in server.mjs (already configured)

### Issue: Environment variables not loading

**Solution:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verify variables are set for correct environment (Production/Preview)
3. Redeploy: Deployments → ... → Redeploy

---

## 🔄 Rollback Plan

If anything goes wrong:

### Option 1: Revert Vercel Deployment
```
Vercel Dashboard → Deployments → Previous deployment → Promote to Production
```

### Option 2: Close PR
```
Just close the GitHub PR - production was never affected!
```

### Option 3: Revert Git Changes
```bash
git checkout main
git branch -D feat/vercel-migration
```

---

## 📊 Architecture After Migration

```
┌─────────────┐
│   Vercel    │ ← React Frontend (Static SPA)
│  (Frontend) │    https://liff-ot-app-arun.vercel.app
└──────┬──────┘
       │ API Calls (VITE_API_BASE_URL_PROD)
       ↓
┌─────────────────────┐
│   Heroku            │ ← Express Backend + Strapi CMS
│   Backend + CMS     │    https://liff-ot-app-arun-d0ff4972332c.herokuapp.com
└──────┬──────────────┘
       │
┌──────▼────────┐
│  PostgreSQL   │ ← Database
└───────────────┘
```

---

## ✅ Migration Checklist

### Phase 1: Code Changes
- [x] Create `src/config/api.js`
- [x] Update `src/StyledForm.jsx`
- [x] Update `src/ManagerView.jsx`
- [x] Update `src/login/LoginForm.jsx`
- [x] Create `.env.example`

### Phase 2: Local Testing
- [ ] Test locally with `npm run dev`
- [ ] Verify all functionality works
- [ ] No console errors

### Phase 3: Git & GitHub
- [ ] Create branch `feat/vercel-migration`
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Create Pull Request

### Phase 4: Vercel Preview
- [ ] Configure Vercel environment variables (Preview)
- [ ] Test preview deployment
- [ ] All features working

### Phase 5: Production
- [ ] Merge PR to main
- [ ] Configure Vercel environment variables (Production)
- [ ] Test production deployment
- [ ] Update LINE LIFF endpoint
- [ ] Monitor logs

### Phase 6: Cleanup
- [ ] Delete migration branch (optional)
- [ ] Update documentation (optional)
- [ ] Optimize Heroku backend (optional)

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Heroku backend logs
3. Review this guide's Troubleshooting section
4. Rollback if needed (safe and quick!)

**Estimated Total Time:** 1-2 hours
**Estimated Downtime:** ~5 minutes (during LINE LIFF endpoint update)
