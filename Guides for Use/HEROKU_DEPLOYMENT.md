# Heroku Deployment Guide

## Overview
This app is now configured to use Heroku for the backend API while the frontend can be deployed on Vercel or any other platform.

## Backend (Heroku) - API Server

### Deployment Steps:
1. **Install Heroku CLI** (if not already installed)
2. **Login to Heroku**: `heroku login`
3. **Create Heroku app** (if not exists): `heroku create your-app-name`
4. **Set environment variables**:
   ```bash
   heroku config:set LINE_CHANNEL_ACCESS_TOKEN=your_line_token
   heroku config:set LINE_GROUP_ID_DEV=your_dev_group_id
   heroku config:set LINE_GROUP_ID_PROD=your_prod_group_id
   heroku config:set MANAGER_USER_IDS_DEV=user_id1,user_id2
   heroku config:set MANAGER_USER_IDS_PROD=user_id1,user_id2
   heroku config:set VITE_GOOGLE_SHEET_ID_DEV=your_dev_sheet_id
   heroku config:set VITE_GOOGLE_SHEET_ID_PROD=your_prod_sheet_id
   ```
5. **Deploy**: `git push heroku main`
6. **Start dyno**: `heroku ps:scale web=1`

### API Endpoints:
- **Health Check**: `GET /health`
- **Google Sheets**: `POST /sheets`
- **Submit**: `POST /submit`
- **Clock Event**: `POST /clock-event`
- **Check Existing**: `POST /check-existing`
- **LINE Webhook**: `POST /webhook`
- **LINE Notification**: `POST /notify-line`

## Frontend (Vercel) - React App

### Configuration:
- The frontend is configured to call the Heroku API
- API_BASE_URL is set to: `https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com`
- Language routes (`/th`, `/en`) are handled by Vercel

### Deployment:
- Push to GitHub
- Vercel will auto-deploy from the main branch

## Environment Variables

### Required for Heroku:
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Bot access token
- `LINE_GROUP_ID_DEV`: Development LINE group ID
- `LINE_GROUP_ID_PROD`: Production LINE group ID
- `MANAGER_USER_IDS_DEV`: Comma-separated manager user IDs for dev
- `MANAGER_USER_IDS_PROD`: Comma-separated manager user IDs for prod
- `VITE_GOOGLE_SHEET_ID_DEV`: Google Sheets ID for development
- `VITE_GOOGLE_SHEET_ID_PROD`: Google Sheets ID for production

### Google Sheets Setup:
- Ensure the Google Sheets service account has access to both dev and prod sheets
- The `google-credentials.json` file should be properly configured

## Troubleshooting

### Common Issues:
1. **CORS errors**: Check that the frontend URL is in the CORS origins list
2. **API not responding**: Check Heroku logs with `heroku logs --tail`
3. **Environment variables**: Verify all required env vars are set in Heroku

### Useful Commands:
```bash
# Check Heroku logs
heroku logs --tail

# Restart Heroku dyno
heroku restart

# Check Heroku config
heroku config

# Open Heroku app
heroku open
``` 