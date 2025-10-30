# Google Sheets API Setup Guide

This guide will help you set up Google Sheets API to replace Google Apps Script functionality.

## 🚀 **Benefits of Using Google Sheets API Directly**

- ✅ **No Google Apps Script needed** - Everything runs in your Node.js backend
- ✅ **Better performance** - Direct API calls instead of web app requests
- ✅ **More control** - Full access to Google Sheets API features
- ✅ **Easier debugging** - All logs in your server console
- ✅ **Better error handling** - Native JavaScript error handling

## 📋 **Setup Steps**

### 1. **Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. **Create Service Account**

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the details:
   - **Name**: `liff-attendance-sheets`
   - **Description**: `Service account for LIFF attendance app`
4. Click "Create and Continue"
5. Skip role assignment (we'll do this manually)
6. Click "Done"

### 3. **Generate Service Account Key**

1. Click on your new service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the JSON file
6. **Rename it to** `google-credentials.json`
7. **Place it in your project root** (same level as `package.json`)

### 4. **Share Google Sheets**

1. Open your Google Sheets (both DEV and PROD)
2. Click "Share" button
3. Add your service account email: `your-service-account@your-project-id.iam.gserviceaccount.com`
4. Give it **Editor** permissions
5. Click "Send" (no need to send email)

### 5. **Update Environment Variables**

Add to your `.env.local`:

```env
# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./google-credentials.json

# Your existing variables
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_USER_ID=your_line_user_id
# ... other variables
```

### 6. **Update Heroku Config**

```bash
# Set the credentials as a config var (base64 encoded)
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY="$(base64 -i google-credentials.json)" -a your-app-name

# Or set the file path
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./google-credentials.json -a your-app-name
```

## 🔧 **File Structure**

```
your-project/
├── google-credentials.json          # Service account key (DO NOT COMMIT)
├── google-credentials-template.json # Template (safe to commit)
├── src/
│   └── googleSheetsHandler.js       # Google Sheets logic
├── server.mjs                       # Updated server
└── .env.local                       # Environment variables
```

## 🧪 **Testing**

1. **Start your server**:
   ```bash
   npm start
   ```

2. **Test the endpoints**:
   ```bash
   # Test health check
   curl http://localhost:3001/health
   
   # Test Google Sheets check
   curl -X POST http://localhost:3001/check-existing \
     -H "Content-Type: application/json" \
     -d '{"driverName":"Test","thaiDate":"06/01/2568","env":"dev"}'
   ```

## 🔒 **Security Notes**

- ⚠️ **Never commit** `google-credentials.json` to git
- ✅ Add it to `.gitignore`
- ✅ Use environment variables in production
- ✅ Rotate service account keys regularly

## 🚨 **Troubleshooting**

### **"Invalid credentials" error**
- Check that service account email has access to sheets
- Verify credentials file path is correct
- Ensure Google Sheets API is enabled

### **"Permission denied" error**
- Make sure service account has Editor access to sheets
- Check that spreadsheet IDs are correct

### **"API not enabled" error**
- Enable Google Sheets API in Google Cloud Console
- Wait a few minutes for changes to propagate

## 📊 **Migration from Google Apps Script**

Your existing Google Apps Script can be **deleted** once this is working. The new system:

- ✅ Handles all the same actions
- ✅ Uses the same spreadsheet structure
- ✅ Maintains backward compatibility
- ✅ Provides better error messages

## 🎯 **Next Steps**

1. Set up the service account
2. Test with your existing sheets
3. Deploy to Heroku
4. Remove Google Apps Script dependency
5. Enjoy faster, more reliable performance!

---

**Need help?** Check the Google Sheets API documentation or your server logs for detailed error messages. 