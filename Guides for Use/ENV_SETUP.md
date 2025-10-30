# Environment Variables Setup Guide

## Quick Setup

### 1. Create Local .env File
```bash
# Copy the template
cp env-template.txt .env

# Edit with your actual values
nano .env
```

### 2. Manual Sync (Recommended for beginners)

#### To Vercel:
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add VITE_LIFF_ID
vercel env add VITE_GOOGLE_SHEET_ID_DEV
vercel env add VITE_GOOGLE_SHEET_ID_PROD
```

#### To Heroku:
```bash
# Install Heroku CLI if not installed
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Set environment variables
heroku config:set LINE_CHANNEL_ACCESS_TOKEN=your_token --app liff-ot-app-raksaard-2de47d0ac48c
heroku config:set LINE_GROUP_ID_DEV=your_group_id --app liff-ot-app-raksaard-2de47d0ac48c
heroku config:set LINE_GROUP_ID_PROD=your_group_id --app liff-ot-app-raksaard-2de47d0ac48c
heroku config:set MANAGER_USER_IDS_DEV=user_id1,user_id2 --app liff-ot-app-raksaard-2de47d0ac48c
heroku config:set MANAGER_USER_IDS_PROD=user_id1,user_id2 --app liff-ot-app-raksaard-2de47d0ac48c
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY=your_base64_key --app liff-ot-app-raksaard-2de47d0ac48c
```

### 3. Automated Sync (Advanced)

#### Using the sync script:
```bash
# Make script executable
chmod +x sync-env.js

# Sync to all platforms
node sync-env.js --all

# Sync to specific platform
node sync-env.js --vercel
node sync-env.js --heroku
```

#### Using GitHub Actions:
1. Add secrets to your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add all your environment variables as secrets

2. Run the workflow:
   - Go to Actions tab
   - Select "Sync Environment Variables"
   - Click "Run workflow"
   - Choose what to sync (all, vercel, or heroku)

## Environment Variables Reference

### Frontend (Vite) - Vercel
- `VITE_LIFF_ID` - Your LINE LIFF ID
- `VITE_GOOGLE_SHEET_ID_DEV` - Development Google Sheet ID
- `VITE_GOOGLE_SHEET_ID_PROD` - Production Google Sheet ID

### Backend (Node.js) - Heroku
- `LINE_CHANNEL_ACCESS_TOKEN` - LINE Messaging API token
- `LINE_GROUP_ID_DEV` - Development LINE group ID
- `LINE_GROUP_ID_PROD` - Production LINE group ID
- `MANAGER_USER_IDS_DEV` - Comma-separated manager user IDs for dev
- `MANAGER_USER_IDS_PROD` - Comma-separated manager user IDs for prod
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Base64 encoded Google service account key

## Tips

1. **Never commit .env files** - They're in .gitignore
2. **Use different values for dev/prod** - Keep environments separate
3. **Rotate secrets regularly** - Especially API keys
4. **Test locally first** - Make sure .env works before deploying

## Troubleshooting

### Vercel Issues:
```bash
# Check current environment variables
vercel env ls

# Remove and re-add if needed
vercel env rm VITE_LIFF_ID
vercel env add VITE_LIFF_ID
```

### Heroku Issues:
```bash
# Check current config
heroku config --app liff-ot-app-raksaard-2de47d0ac48c

# Restart app after config changes
heroku restart --app liff-ot-app-raksaard-2de47d0ac48c
``` 