import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { handleGoogleSheetsRequest, createMonthlySheet, readLoginHistoryFromSheet, getLastClockInForDriver, getLastClockInsForDrivers } from './src/googleSheetsHandler.js';
import { setupAuthRoutes } from './src/login/authRoutes.js';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Monthly sheet creation scheduler
function scheduleMonthlySheetCreation() {
  console.log('🕐 Setting up monthly sheet creation scheduler...');

  // Check every minute if it's time to create a new sheet
  setInterval(async () => {
    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

    // Check if it's the first day of the month at 00:00 (Bangkok time)
    if (bangkokTime.getDate() === 1 && bangkokTime.getHours() === 0 && bangkokTime.getMinutes() === 0) {
      console.log('🎯 Time to create monthly sheet!');

      try {
        // Only create sheet in dev environment for safety
        const devResult = await createMonthlySheet('dev');
        console.log('Dev monthly sheet result:', devResult);

        // Note: Production sheets should be created manually or through a separate process
        console.log('⚠️ Production monthly sheets must be created manually for safety');

      } catch (error) {
        console.error('❌ Error in monthly sheet creation:', error);
      }
    }
  }, 60000); // Check every minute
}

// Start the scheduler
scheduleMonthlySheetCreation();

// Middleware
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Vite dev server (alternative)
  'http://localhost:5175', // Vite dev server (alternative)
  'http://localhost:3000', // Alternative dev port
  'https://liff-ot-app-arun.vercel.app', // Production Vercel frontend
  'https://liff-ot-app-arun-c4kr6e91j-charenas-projects.vercel.app', // Vercel deployment preview (specific)
  'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com', // Heroku backend (for same-origin requests)
  'https://liff-ot-app-raksaard-2d847d0ac48c.herokuapp.com' // Alternative Heroku app
];

// Vercel preview URL patterns (for dynamic branch/PR previews)
const vercelPreviewPatterns = [
  /^https:\/\/liff-ot-app-arun-.*\.vercel\.app$/, // Any Vercel preview for liff-ot-app-arun
];

// Check if origin is allowed (exact match or pattern match)
function isOriginAllowed(origin) {
  if (!origin) return false;

  // Check exact matches first
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check Vercel preview patterns
  return vercelPreviewPatterns.some(pattern => pattern.test(origin));
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    if (!origin || isOriginAllowed(origin)) {
      return res.status(204).end();
    }
    return res.status(403).end();
  }
  next();
});

// Body parser configuration
// IMPORTANT: Only parse JSON for non-admin routes - proxy needs raw body stream
const jsonParser = express.json();

app.use((req, res, next) => {
  // Skip JSON parsing for /admin routes (let proxy handle raw body stream)
  if (req.path.startsWith('/admin')) {
    return next();
  }
  // For all other routes, parse JSON body
  jsonParser(req, res, next);
});

app.use(cookieParser());

// Configure multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Strapi URL configuration (needed for driver endpoints)
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

// Helper function to determine environment
// Priority: NODE_ENV > STRAPI_URL > default to 'dev' for localhost
function getEnvironment() {
  // Check NODE_ENV first (most reliable)
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
    return 'dev';
  }
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
    return 'prod';
  }

  // Check STRAPI_URL to infer environment
  if (STRAPI_URL.includes('localhost') || STRAPI_URL.includes('127.0.0.1')) {
    return 'dev';
  }

  // Default to prod for safety (production environments)
  return 'prod';
}

// Setup authentication routes (login, logout, /me)
setupAuthRoutes(app, {
  strapiUrl: STRAPI_URL
});

// GET /login - serve React app (POST /login is handled by setupAuthRoutes)
app.get('/login', (req, res) => {
  console.log('=== LOGIN PAGE: Serving React app ===');
  res.sendFile('dist/index.html', { root: '.' });
});

// LINE Messaging API configuration
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_GROUP_ID_DEV = process.env.LINE_GROUP_ID_DEV;
const LINE_GROUP_ID_PROD = process.env.LINE_GROUP_ID_PROD;
const MANAGER_USER_IDS_DEV = process.env.MANAGER_USER_IDS_DEV;
const MANAGER_USER_IDS_PROD = process.env.MANAGER_USER_IDS_PROD;

// Language-specific endpoints - serve the app with URL-based language
app.get('/th', (req, res) => {
  console.log('=== TH ENDPOINT: Serving Thai version ===');
  res.sendFile('dist/index.html', { root: '.' });
});

app.get('/en', (req, res) => {
  console.log('=== EN ENDPOINT: Serving English version ===');
  res.sendFile('dist/index.html', { root: '.' });
});

// Production form preview endpoint
app.get('/prod', (req, res) => {
  console.log('=== PROD PREVIEW: Serving production form preview ===');
  res.sendFile('dist/index.html', { root: '.' });
});

// Root route
app.get('/', (req, res) => {
  console.log('=== ROOT: Serving default version ===');
  res.sendFile('dist/index.html', { root: '.' });
});

// Serve static files from the dist directory (for production) - AFTER specific routes
app.use(express.static('dist'));

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'LIFF Attendance OT App Backend',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Manual monthly sheet creation endpoint
app.post('/create-monthly-sheet', async (req, res) => {
  console.log('=== CREATE-MONTHLY-SHEET: Manual trigger ===');

  try {
    const { env = 'dev', force = false, month = null, year = null } = req.body;

    console.log(`📥 Received request with env: ${env}`);
    console.log(`📥 Full request body:`, req.body);

    // Allow both dev and prod environments when called from dev
    const safeEnv = env === 'prod' ? 'prod' : 'dev';

    console.log(`🔄 Creating sheet for environment: ${safeEnv}`);

    const result = await createMonthlySheet(safeEnv, force, month, year);

    console.log('Monthly sheet creation result:', result);
    res.json(result);
  } catch (error) {
    console.error('Monthly sheet creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Note: Catch-all route moved to end of file (before app.listen)

// Unified endpoint for all Google Sheets operations
app.post('/sheets', async (req, res) => {
  console.log('=== SHEETS: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Ensure environment is set correctly
    // Priority: request body > NODE_ENV > STRAPI_URL detection
    const env = req.body.env || getEnvironment();
    const requestBody = { ...req.body, env };

    console.log(`[Sheets] Using environment: ${env} (from ${req.body.env ? 'request' : 'detection'})`);

    const result = await handleGoogleSheetsRequest(requestBody);
    console.log('Google Sheets response:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Sheets proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Legacy endpoints for backward compatibility
app.post('/submit', async (req, res) => {
  console.log('=== SUBMIT: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Ensure environment is set correctly
    const env = req.body.env || getEnvironment();
    const requestBody = { ...req.body, env };

    // First, save to Google Sheets
    const result = await handleGoogleSheetsRequest(requestBody);
    console.log('Submit response (Google Sheets):', JSON.stringify(result, null, 2));

    // If Google Sheets save was successful, also save to Strapi
    if (result.success && req.body.driverName && req.body.thaiDate) {
      try {
        const fetch = (await import('node-fetch')).default;

        // Find driver by name to get driver ID
        const driverResponse = await fetch(
          `${STRAPI_URL}/api/drivers?filters[name][$eq]=${encodeURIComponent(req.body.driverName)}&populate=*`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const driverData = await driverResponse.json();
        let driverId = null;

        if (driverData.data && driverData.data.length > 0) {
          driverId = driverData.data[0].id;
        }

        // Prepare attendance data for Strapi
        const attendanceData = {
          thaiDate: req.body.thaiDate,
          clockIn: req.body.clockIn || null,
          clockOut: req.body.clockOut || null,
          comments: req.body.comments || null,
          submittedAt: req.body.submittedAt || new Date().toISOString(),
          driverName: req.body.driverName, // Keep for backward compatibility
          approved: false
        };

        // Add driver relationship if driver found
        if (driverId) {
          attendanceData.driver = driverId;
        }

        console.log('Saving attendance to Strapi:', JSON.stringify(attendanceData, null, 2));

        // Save to Strapi
        const strapiResponse = await fetch(`${STRAPI_URL}/api/attendances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: attendanceData
          })
        });

        const strapiResult = await strapiResponse.json();

        if (strapiResponse.ok) {
          console.log('Attendance saved to Strapi successfully:', JSON.stringify(strapiResult, null, 2));
        } else {
          console.error('Failed to save attendance to Strapi:', strapiResponse.status, strapiResult);
          // Don't fail the whole request if Strapi save fails, just log it
        }
      } catch (strapiError) {
        console.error('Error saving attendance to Strapi:', strapiError);
        // Don't fail the whole request if Strapi save fails, just log it
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Submit proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/clock-event', async (req, res) => {
  console.log('=== CLOCK-EVENT: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Ensure environment is set correctly
    const env = req.body.env || getEnvironment();
    const requestBody = { ...req.body, env };

    // First, save to Google Sheets
    const result = await handleGoogleSheetsRequest(requestBody);
    console.log('Clock event response (Google Sheets):', JSON.stringify(result, null, 2));

    // Return response immediately - don't wait for Strapi operations
    res.json(result);

    // Update Strapi asynchronously (non-blocking) after sending response
    if (result.success && req.body.driverName && req.body.thaiDate) {
      try {
        const fetch = (await import('node-fetch')).default;

        // Find driver by name to get driver ID
        const driverResponse = await fetch(
          `${STRAPI_URL}/api/drivers?filters[name][$eq]=${encodeURIComponent(req.body.driverName)}&populate=*`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const driverData = await driverResponse.json();
        let driverId = null;

        if (driverData.data && driverData.data.length > 0) {
          driverId = driverData.data[0].id;
        }

        // Check if attendance record already exists for this driver and date
        const existingAttendanceResponse = await fetch(
          driverId
            ? `${STRAPI_URL}/api/attendances?filters[driver][id][$eq]=${driverId}&filters[thaiDate][$eq]=${req.body.thaiDate}&populate=*`
            : `${STRAPI_URL}/api/attendances?filters[driverName][$eq]=${encodeURIComponent(req.body.driverName)}&filters[thaiDate][$eq]=${req.body.thaiDate}&populate=*`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const existingData = await existingAttendanceResponse.json();

        if (existingData.data && existingData.data.length > 0) {
          // Update existing attendance record
          const attendanceId = existingData.data[0].id;
          const updateData = {};

          if (req.body.type === 'clockIn') {
            updateData.clockIn = req.body.timestamp;
          } else if (req.body.type === 'clockOut') {
            updateData.clockOut = req.body.timestamp;
          }

          if (req.body.comments) {
            updateData.comments = req.body.comments;
          }

          if (driverId) {
            updateData.driver = driverId;
          }

          console.log('Updating attendance in Strapi:', attendanceId, updateData);

          const updateResponse = await fetch(`${STRAPI_URL}/api/attendances/${attendanceId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: updateData
            })
          });

          const updateResult = await updateResponse.json();

          if (updateResponse.ok) {
            console.log('Attendance updated in Strapi successfully:', JSON.stringify(updateResult, null, 2));
          } else {
            console.error('Failed to update attendance in Strapi:', updateResponse.status, updateResult);
          }
        } else {
          // Create new attendance record
          const attendanceData = {
            thaiDate: req.body.thaiDate,
            driverName: req.body.driverName,
            submittedAt: req.body.submittedAt || new Date().toISOString(),
            approved: false
          };

          if (req.body.type === 'clockIn') {
            attendanceData.clockIn = req.body.timestamp;
          } else if (req.body.type === 'clockOut') {
            attendanceData.clockOut = req.body.timestamp;
          }

          if (req.body.comments) {
            attendanceData.comments = req.body.comments;
          }

          if (driverId) {
            attendanceData.driver = driverId;
          }

          console.log('Creating attendance in Strapi:', JSON.stringify(attendanceData, null, 2));

          const createResponse = await fetch(`${STRAPI_URL}/api/attendances`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: attendanceData
            })
          });

          const createResult = await createResponse.json();

          if (createResponse.ok) {
            console.log('Attendance created in Strapi successfully:', JSON.stringify(createResult, null, 2));
          } else {
            console.error('Failed to create attendance in Strapi:', createResponse.status, createResult);
          }
        }
      } catch (strapiError) {
        console.error('Error saving clock event to Strapi:', strapiError);
        // Don't fail the whole request if Strapi save fails, just log it
      }
    }
  } catch (error) {
    console.error('Clock event proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/check-existing', async (req, res) => {
  console.log('=== CHECK-EXISTING: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Ensure environment is set correctly
    const env = req.body.env || getEnvironment();
    const requestBody = { ...req.body, env };
    const result = await handleGoogleSheetsRequest(requestBody);
    console.log('Check existing response:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Check-existing proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to get manager user IDs by environment
function getManagerUserIds(env) {
  if (env === 'dev') {
    return (MANAGER_USER_IDS_DEV || '').split(',').map(id => id.trim()).filter(Boolean);
  } else {
    return (MANAGER_USER_IDS_PROD || '').split(',').map(id => id.trim()).filter(Boolean);
  }
}

// LINE Webhook endpoint for handling group chat responses
app.post('/webhook', async (req, res) => {
  const events = req.body.events || [];

  // Debug: Log all incoming webhook data
  console.log('=== WEBHOOK DEBUG ===');
  console.log('Full webhook body:', JSON.stringify(req.body, null, 2));

  for (const event of events) {
    console.log('Processing event:', JSON.stringify(event, null, 2));

    if (event.source && event.source.type === 'group') {
      console.log('🎯 GROUP ID FOUND:', event.source.groupId);
      console.log('👤 USER ID:', event.source.userId);
      console.log('📝 MESSAGE:', event.message?.text || 'No text message');
    }

    if (
      event.type === 'message' &&
      event.message.type === 'text' &&
      event.source.type === 'group'
    ) {
      // Determine env by groupId
      const groupId = event.source.groupId;
      const env = (groupId === LINE_GROUP_ID_DEV) ? 'dev' : 'prod';

      const MANAGER_USER_IDS = getManagerUserIds(env);

      if (MANAGER_USER_IDS.includes(event.source.userId)) {
        const text = event.message.text.trim();

        // Only process if message starts with Approve or Deny (case-insensitive)
        if (/^(Approve|Deny)\b/i.test(text)) {
          const match = text.match(/^Approve\s+([^\s,]+)$/i);
          if (match) {
            const submittedAt = match[1];
            console.log('Sending updateApproval for submittedAt:', submittedAt);

            try {
              const result = await handleGoogleSheetsRequest({
                action: 'updateApproval',
                env,
                submittedAt,
                approval: 'Approve',
              });
              console.log('updateApproval result:', result);

              if (result.success) {
                // Fetch the row data and re-trigger submission
                const rowData = await handleGoogleSheetsRequest({
                  action: 'getRowBySubmittedAt',
                  env,
                  submittedAt
                });

                if (rowData.success) {
                  const [driverName, thaiDate, dayOfWeek, clockIn, clockOut, otStart, otEnd, comments, submittedAtValue] = rowData.row;
                  const payload = {
                    driverName,
                    thaiDate,
                    clockIn,
                    clockOut,
                    otStart,
                    otEnd,
                    comments,
                    submittedAt: submittedAtValue,
                    env
                  };

                  // Re-trigger submission
                  await handleGoogleSheetsRequest(payload);
                }
              }
            } catch (error) {
              console.error('Error processing approval:', error);
            }
          }

          if (/^Approve$/i.test(text)) {
            console.log('Sending approveMostRecent');
            try {
              const result = await handleGoogleSheetsRequest({
                action: 'approveMostRecent',
                env,
              });
              console.log('approveMostRecent result:', result);
            } catch (error) {
              console.error('Error processing approveMostRecent:', error);
            }
          }
          // You can add Deny logic here later
        }
      }
    }
  }
  res.sendStatus(200);
});

// Simple in-memory cache to prevent duplicate notifications
const notificationCache = new Map();
const NOTIFICATION_CACHE_TTL = 30000; // 30 seconds

app.post('/notify-line', async (req, res) => {
  console.log('=== NOTIFY-LINE: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { message, env } = req.body;

    // Create a unique key for this notification to prevent duplicates
    const notificationKey = `${env}-${message.substring(0, 100)}`; // Use first 100 chars as key
    const now = Date.now();

    // Check if this notification was sent recently
    if (notificationCache.has(notificationKey)) {
      const lastSent = notificationCache.get(notificationKey);
      if (now - lastSent < NOTIFICATION_CACHE_TTL) {
        console.log('⚠️ Duplicate notification detected, skipping...');
        return res.json({
          success: true,
          message: 'Duplicate notification skipped',
          duplicate: true
        });
      }
    }

    // Store this notification in cache
    notificationCache.set(notificationKey, now);

    // Clean up old cache entries (older than 1 minute)
    for (const [key, timestamp] of notificationCache.entries()) {
      if (now - timestamp > 60000) {
        notificationCache.delete(key);
      }
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.error('LINE configuration missing');
      return res.status(500).json({
        success: false,
        error: 'LINE configuration not set'
      });
    }

    let lineResponse;
    let lineResult;

    if (env === 'prod') {
      if (!LINE_GROUP_ID_PROD) {
        console.error('LINE_GROUP_ID_PROD not set');
        return res.status(500).json({
          success: false,
          error: 'LINE group ID for production not set'
        });
      }
      lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: LINE_GROUP_ID_PROD,
          messages: [
            {
              type: 'text',
              text: message
            }
          ]
        })
      });
      lineResult = await lineResponse.json();
      console.log('LINE notification sent successfully to production group:', lineResult);
    } else { // dev environment
      if (!LINE_GROUP_ID_DEV) {
        console.error('LINE_GROUP_ID_DEV not set');
        return res.status(500).json({
          success: false,
          error: 'LINE group ID for development not set'
        });
      }
      lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: LINE_GROUP_ID_DEV,
          messages: [
            {
              type: 'text',
              text: message
            }
          ]
        })
      });
      lineResult = await lineResponse.json();
      console.log('LINE notification sent successfully to development group:', lineResult);
    }

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      throw new Error(`LINE API error: ${lineResponse.status} - ${errorText}`);
    }

    res.json({
      success: true,
      message: 'LINE notification sent successfully',
      lineResult
    });

  } catch (error) {
    console.error('LINE notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available sheets for an environment
app.post('/get-sheets', async (req, res) => {
  try {
    const { environment } = req.body;

    if (!environment) {
      return res.status(400).json({ error: 'Environment is required' });
    }

    // Get spreadsheet ID based on environment
    const spreadsheetId = environment === 'prod'
      ? process.env.VITE_GOOGLE_SHEET_ID_PROD
      : process.env.VITE_GOOGLE_SHEET_ID_DEV;

    if (!spreadsheetId) {
      return res.status(400).json({ error: `No spreadsheet ID configured for ${environment} environment` });
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      keyFile: './google-credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const sheetNames = response.data.sheets.map(sheet => sheet.properties.title);

    res.json({ sheets: sheetNames });
  } catch (error) {
    console.error('❌ Error fetching sheets:', error);
    res.status(500).json({ error: `Failed to fetch sheets: ${error.message}` });
  }
});

// Update Day of Week column for a specific sheet
app.post('/update-day-of-week', async (req, res) => {
  try {
    const { environment, sheetName } = req.body;

    if (!environment || !sheetName) {
      return res.status(400).json({ error: 'Environment and sheet name are required' });
    }

    // Get spreadsheet ID based on environment
    const spreadsheetId = environment === 'prod'
      ? process.env.VITE_GOOGLE_SHEET_ID_PROD
      : process.env.VITE_GOOGLE_SHEET_ID_DEV;

    if (!spreadsheetId) {
      return res.status(400).json({ error: `No spreadsheet ID configured for ${environment} environment` });
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      keyFile: './google-credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get current sheet structure
    const sheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const sheet = sheetResponse.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) {
      return res.status(404).json({ error: `Sheet "${sheetName}" not found` });
    }

    // Get current headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!1:1`
    });

    const headers = headerResponse.data.values?.[0] || [];
    const hasDayOfWeek = headers[2]?.toLowerCase().includes('day') && headers[2]?.toLowerCase().includes('week');

    console.log(`📋 Sheet "${sheetName}" headers:`, headers);
    console.log(`🔍 Has Day of Week column:`, hasDayOfWeek);

    if (!hasDayOfWeek) {
      // Add Day of Week column
      console.log(`🔧 Adding "Day of Week" column to sheet "${sheetName}"...`);

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            insertDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'COLUMNS',
                startIndex: 2, // Insert after column B (index 2)
                endIndex: 3
              },
              inheritFromBefore: false
            }
          }]
        }
      });

      // Add header
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!C1`,
        valueInputOption: 'RAW',
        resource: {
          values: [['Day of Week']]
        }
      });

      console.log(`✅ Added "Day of Week" column header to sheet "${sheetName}"`);
    }

    // Get all data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`
    });

    const rows = dataResponse.data.values || [];
    if (rows.length <= 1) {
      return res.json({ message: `Sheet "${sheetName}" has no data rows to update` });
    }

    console.log(`📊 Found ${rows.length - 1} data rows to update`);

    // Helper function to get Thai day of week
    const getDayOfWeek = (thaiDate) => {
      try {
        const parts = thaiDate.split('/');
        if (parts.length !== 3) return 'Unknown';

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const thaiYear = parseInt(parts[2]);

        // Convert Thai year to Gregorian year
        const gregorianYear = thaiYear - 543;

        const date = new Date(gregorianYear, month - 1, day);
        const dayOfWeek = date.toLocaleDateString('th-TH', { weekday: 'long' });

        console.log(`📅 ${thaiDate} -> ${dayOfWeek}`);
        return dayOfWeek;
      } catch (error) {
        console.error(`❌ Error parsing date ${thaiDate}:`, error);
        return 'Unknown';
      }
    };

    // Prepare updates
    const updates = [];
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      const dateValue = row[1]; // Column B (Date)

      if (dateValue) {
        const dayOfWeek = getDayOfWeek(dateValue);
        updates.push({
          range: `${sheetName}!C${i + 1}`,
          values: [[dayOfWeek]]
        });
      }
    }

    if (updates.length === 0) {
      return res.json({ message: `No valid dates found in sheet "${sheetName}"` });
    }

    console.log(`🔄 Updating ${updates.length} Day of Week values...`);

    // Batch update all values
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        valueInputOption: 'RAW',
        data: updates
      }
    });

    console.log(`✅ Updated ${updates.length} Day of Week values in sheet "${sheetName}"`);

    res.json({
      message: `Successfully updated Day of Week column for sheet "${sheetName}". Updated ${updates.length} rows.`,
      updatedRows: updates.length,
      environment: environment
    });

  } catch (error) {
    console.error('❌ Error updating Day of Week:', error);
    res.status(500).json({ error: `Failed to update Day of Week: ${error.message}` });
  }
});

// Manual OT calculation endpoint (development only)
app.post('/calculate-ot-manual', async (req, res) => {
  console.log('=== CALCULATE-OT-MANUAL: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { driverName, thaiDate, clockIn, clockOut, env = 'dev' } = req.body;

    // Allow manual OT calculation in both dev and prod environments

    if (!driverName || !thaiDate || !clockIn || !clockOut) {
      return res.status(400).json({
        success: false,
        error: 'Driver name, Thai date, clock in, and clock out times are required'
      });
    }

    // Import the OT calculation function
    const { calculateOTManually } = await import('./src/googleSheetsHandler.js');

    const result = await calculateOTManually(driverName, thaiDate, clockIn, clockOut, env);

    console.log('Manual OT calculation result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Manual OT calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Read row data and update OT Hours endpoint
app.post('/read-and-update-ot', async (req, res) => {
  console.log('=== READ-AND-UPDATE-OT: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { driverName, thaiDate, env = 'dev' } = req.body;

    if (!driverName || !thaiDate) {
      return res.status(400).json({
        success: false,
        error: 'Driver name and Thai date are required'
      });
    }

    // Import the function
    const { readRowAndUpdateOT } = await import('./src/googleSheetsHandler.js');

    const result = await readRowAndUpdateOT(driverName, thaiDate, env);

    console.log('Read and update OT result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Read and update OT error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Read row data by row number and update OT Hours endpoint
app.post('/read-and-update-ot-by-row', async (req, res) => {
  console.log('=== READ-AND-UPDATE-OT-BY-ROW: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { rowNumber, thaiDate, env = 'dev', sheetName } = req.body;

    if (!rowNumber || !thaiDate) {
      return res.status(400).json({
        success: false,
        error: 'Row number and Thai date are required'
      });
    }

    // Import the function
    const { readRowAndUpdateOTByRowNumber } = await import('./src/googleSheetsHandler.js');

    const result = await readRowAndUpdateOTByRowNumber(rowNumber, thaiDate, env, sheetName);

    console.log('Read and update OT by row result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Read and update OT by row error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available sheets for OT calculation
app.post('/get-ot-sheets', async (req, res) => {
  console.log('=== GET-OT-SHEETS: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { env = 'dev' } = req.body;

    // Import the function
    const { getAvailableSheetsForOT } = await import('./src/googleSheetsHandler.js');

    const result = await getAvailableSheetsForOT(env);

    console.log('Get OT sheets result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Get OT sheets error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Read row data for auto-population
app.post('/read-row-data', async (req, res) => {
  console.log('=== READ-ROW-DATA: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { sheetName, rowNumber, env = 'dev' } = req.body;

    if (!sheetName || !rowNumber) {
      return res.status(400).json({
        success: false,
        error: 'Sheet name and row number are required'
      });
    }

    // Import the function
    const { readRowDataForOT } = await import('./src/googleSheetsHandler.js');

    const result = await readRowDataForOT(sheetName, rowNumber, env);

    console.log('Read row data result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Read row data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update OT Hours column directly
app.post('/update-ot-hours', async (req, res) => {
  console.log('=== UPDATE-OT-HOURS: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { sheetName, rowNumber, otHours, env = 'dev' } = req.body;

    if (!sheetName || !rowNumber || otHours === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Sheet name, row number, and OT hours are required'
      });
    }

    // Import the function
    const { updateOTHoursDirectly } = await import('./src/googleSheetsHandler.js');

    const result = await updateOTHoursDirectly(sheetName, rowNumber, otHours, env);

    console.log('Update OT hours result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Update OT hours error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ==========================================
// STRAPI CONTENT API EXAMPLES
// ==========================================
// These examples show how to connect to Strapi tables
// Note: STRAPI_URL is defined at the top of the file (line 91)

// Example 1: Get all attendance records from Strapi
app.get('/api/attendances', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STRAPI_URL}/api/attendances?populate=*`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example 2: Get a single attendance by ID
app.get('/api/attendances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STRAPI_URL}/api/attendances/${id}?populate=*`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example 3: Create a new attendance record in Strapi
app.post('/api/attendances', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STRAPI_URL}/api/attendances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: req.body
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example 4: Update an attendance record
app.put('/api/attendances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STRAPI_URL}/api/attendances/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: req.body
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example 5: Delete an attendance record
app.delete('/api/attendances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STRAPI_URL}/api/attendances/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example 6: Query with filters (find attendances by driver name - legacy support)
app.get('/api/attendances/driver/:driverName', async (req, res) => {
  try {
    const { driverName } = req.params;
    const fetch = (await import('node-fetch')).default;

    // First try to find driver by name
    const driverResponse = await fetch(
      `${STRAPI_URL}/api/drivers?filters[name][$eq]=${encodeURIComponent(driverName)}&populate=*`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const driverData = await driverResponse.json();

    if (driverData.data && driverData.data.length > 0) {
      const driverId = driverData.data[0].id;

      // Find attendances by driver relation
      const response = await fetch(
        `${STRAPI_URL}/api/attendances?filters[driver][id][$eq]=${driverId}&populate=*`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      res.json(data);
    } else {
      // Fallback to driverName string field for backward compatibility
      const response = await fetch(
        `${STRAPI_URL}/api/attendances?filters[driverName][$eq]=${encodeURIComponent(driverName)}&populate=*`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Error fetching attendances by driver:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DRIVER API ENDPOINTS
// ==========================================

// Get all drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    console.log('Fetching drivers from Strapi:', `${STRAPI_URL}/api/drivers?populate=*`);

    const response = await fetch(`${STRAPI_URL}/api/drivers?populate=*`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    console.log('Strapi drivers response status:', response.status);
    console.log('Strapi drivers response:', JSON.stringify(data, null, 2));

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: error.message });
  }
});

// Get all drivers with manager view data (name, age, account created, last clock in)
app.get('/api/drivers/manager-view', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    console.log(`[Manager View] Fetching drivers from Strapi: ${STRAPI_URL}/api/drivers?populate=*`);

    // Fetch all drivers with populated relations
    const driversResponse = await fetch(`${STRAPI_URL}/api/drivers?populate=*`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const driversData = await driversResponse.json();

    console.log(`[Manager View] Strapi response status: ${driversResponse.status}`);
    console.log(`[Manager View] Drivers found: ${driversData.data?.length || 0}`);

    if (!driversResponse.ok) {
      console.error(`[Manager View] Strapi error:`, driversData);
      return res.status(driversResponse.status).json(driversData);
    }

    // Process each driver to get additional info
    const driversArray = driversData.data || [];
    console.log(`[Manager View] Processing ${driversArray.length} drivers`);

    // First, try to get all last clock-ins from Strapi in batch
    // Then batch fetch from Google Sheets for drivers without Strapi data
    const driversNeedingGoogleSheets = [];

    // Process drivers and collect those that need Google Sheets lookup
    const driversWithInfo = await Promise.all(
      driversArray.map(async (driver) => {
        console.log(`[Manager View] Processing driver: ${driver.id}, name: ${driver.attributes?.name || driver.name}`);
        // Build photo URL - prepend Strapi URL if it's a relative path
        let photoUrl = null;
        if (driver.attributes?.photo?.data) {
          const photoPath = driver.attributes.photo.data.attributes?.url || driver.attributes.photo.data.url;
          if (photoPath) {
            // If it's already a full URL, use it; otherwise prepend Strapi URL
            photoUrl = photoPath.startsWith('http')
              ? photoPath
              : `${STRAPI_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
          }
        }

        const driverInfo = {
          id: driver.id,
          name: driver.attributes?.name || driver.name || '',
          age: driver.attributes?.age || driver.age || null,
          createdAt: driver.attributes?.createdAt || driver.createdAt || null,
          photo: photoUrl ? {
            id: driver.attributes.photo.data.id,
            url: photoUrl
          } : null,
          user: null,
          lastClockIn: null
        };

        // Get user info if driver has a user relation
        if (driver.attributes?.user?.data || driver.user) {
          const userId = driver.attributes?.user?.data?.id || driver.user?.id || driver.user;
          if (userId) {
            try {
              const userResponse = await fetch(`${STRAPI_URL}/api/users/${userId}?populate=*`, {
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              const userData = await userResponse.json();
              if (userResponse.ok && userData) {
                driverInfo.user = {
                  id: userData.id,
                  username: userData.username || '',
                  email: userData.email || '',
                  createdAt: userData.createdAt || null,
                  confirmed: userData.confirmed || false
                };
              }
            } catch (err) {
              console.error(`Error fetching user ${userId}:`, err);
            }
          }
        }

        // Get last attendance (clock in) for this driver
        // Always check Google Sheets since it's the source of truth, but also check Strapi for comparison
        const driverName = driver.attributes?.name || driver.name || '';

        if (driverName) {
          // Always mark for Google Sheets lookup (it's the source of truth)
          driversNeedingGoogleSheets.push({ driverName, driverInfo });

          // Also try Strapi for comparison (optional - we'll use Google Sheets result anyway)
          try {
            const driverId = driver.id;
            const attendanceResponse = await fetch(
              `${STRAPI_URL}/api/attendances?filters[driver][id][$eq]=${driverId}&sort=clockIn:desc&pagination[limit]=1&populate=*`,
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            const attendanceData = await attendanceResponse.json();

            if (attendanceResponse.ok && attendanceData.data && attendanceData.data.length > 0) {
              const lastAttendance = attendanceData.data[0];
              console.log(`[Manager View] Found Strapi attendance for ${driverName} (for comparison):`, {
                date: lastAttendance.attributes?.thaiDate || lastAttendance.thaiDate,
                time: lastAttendance.attributes?.clockIn || lastAttendance.clockIn
              });
              // Store Strapi data temporarily, but Google Sheets will override if it's more recent
              driverInfo.strapiLastClockIn = {
                date: lastAttendance.attributes?.thaiDate || lastAttendance.thaiDate || null,
                time: lastAttendance.attributes?.clockIn || lastAttendance.clockIn || null,
                submittedAt: lastAttendance.attributes?.submittedAt || lastAttendance.submittedAt || null
              };
            }
          } catch (err) {
            console.error(`Error fetching Strapi attendance for driver ${driver.id}:`, err);
            // Continue - we'll use Google Sheets data
          }
        }

        return driverInfo;
      })
    );

    // Batch fetch last clock-ins from Google Sheets for drivers without Strapi data
    if (driversNeedingGoogleSheets.length > 0) {
      console.log(`[Manager View] Batch fetching ${driversNeedingGoogleSheets.length} drivers from Google Sheets`);
      console.log(`[Manager View] Driver names:`, driversNeedingGoogleSheets.map(d => d.driverName));

      // Determine environment based on NODE_ENV or request origin
      // Priority: NODE_ENV > request origin detection
      let env = 'prod'; // Default to prod for safety

      // Check NODE_ENV first (most reliable)
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
        env = 'dev';
      } else if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
        env = 'prod';
      } else {
        // Fallback: detect from request origin
        const origin = req.headers.origin || req.headers.referer || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        env = isLocalhost ? 'dev' : 'prod';
      }

      console.log(`[Manager View] NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`[Manager View] Request origin: ${req.headers.origin || req.headers.referer || 'N/A'}`);
      console.log(`[Manager View] Using environment: ${env}`);

      const driverNames = driversNeedingGoogleSheets.map(d => d.driverName);
      // Check only the latest sheet for faster performance
      const googleSheetsResults = await getLastClockInsForDrivers(driverNames, env, 1); // Check only latest sheet with correct env

      console.log(`[Manager View] Google Sheets results:`, JSON.stringify(googleSheetsResults, null, 2));

      // Update driver info with Google Sheets data
      // Use case-insensitive lookup to handle casing differences
      driversNeedingGoogleSheets.forEach(({ driverName, driverInfo }) => {
        // Try exact match first
        let result = googleSheetsResults[driverName];

        // If not found, try case-insensitive lookup
        if (!result) {
          const matchingKey = Object.keys(googleSheetsResults).find(key =>
            key.toLowerCase() === driverName.toLowerCase()
          );
          if (matchingKey) {
            result = googleSheetsResults[matchingKey];
            console.log(`[Manager View] Found case-insensitive match: "${driverName}" -> "${matchingKey}"`);
          }
        }

        console.log(`[Manager View] Processing result for ${driverName}:`, result);
        if (result && result.success) {
          console.log(`[Manager View] Setting lastClockIn for ${driverName}: date=${result.date}, time=${result.time}`);
          driverInfo.lastClockIn = {
            date: result.date,
            time: result.time,
            submittedAt: null
          };
        } else {
          console.log(`[Manager View] No clock-in found for ${driverName}`);
          console.log(`[Manager View] Available keys in results:`, Object.keys(googleSheetsResults));
        }
      });
    }

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    res.json({
      data: driversWithInfo,
      meta: {
        total: driversWithInfo.length
      }
    });
  } catch (error) {
    console.error('Error fetching drivers for manager view:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: error.message });
  }
});

// Get a single driver by ID
app.get('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STRAPI_URL}/api/drivers/${id}?populate=*`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get driver by name
app.get('/api/drivers/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(
      `${STRAPI_URL}/api/drivers?filters[name][$eq]=${encodeURIComponent(name)}&populate=*`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching driver by name:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload media to Strapi
app.post('/api/upload', upload.single('files'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file provided in upload request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Received file upload:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('form-data')).default;

    // Create form data to forward to Strapi
    const formData = new FormData();
    formData.append('files', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('Forwarding upload to Strapi:', `${STRAPI_URL}/api/upload`);

    const response = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const data = await response.json();

    console.log('Strapi upload response status:', response.status);
    console.log('Strapi upload response:', JSON.stringify(data, null, 2));

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: error.message });
  }
});

// Create a new driver
app.post('/api/drivers', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    // If data is already wrapped, use it; otherwise wrap it
    const bodyData = req.body.data || req.body;

    console.log('Creating driver in Strapi:', JSON.stringify(bodyData, null, 2));
    console.log('Strapi URL:', STRAPI_URL);

    const response = await fetch(`${STRAPI_URL}/api/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: bodyData
      })
    });

    const data = await response.json();

    console.log('Strapi response status:', response.status);
    console.log('Strapi response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Strapi error response:', data);
      // Set CORS headers even on error
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      return res.status(response.status).json(data);
    }

    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    res.json(data);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: error.message });
  }
});

// Handle OPTIONS preflight for drivers endpoint
app.options('/api/drivers', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// Update a driver
app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;

    // If data is already wrapped, use it; otherwise wrap it
    const bodyData = req.body.data || req.body;

    console.log('Updating driver in Strapi:', id, JSON.stringify(bodyData, null, 2));

    const response = await fetch(`${STRAPI_URL}/api/drivers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: bodyData
      })
    });

    const data = await response.json();

    console.log('Strapi update response status:', response.status);
    console.log('Strapi update response data:', JSON.stringify(data, null, 2));

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: error.message });
  }
});

// Delete a driver
app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;

    console.log('Deleting driver in Strapi:', id);

    const response = await fetch(`${STRAPI_URL}/api/drivers/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    console.log('Strapi delete response status:', response.status);
    console.log('Strapi delete response data:', JSON.stringify(data, null, 2));

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: error.message });
  }
});

// Sync login history from Google Sheets to Strapi
app.post('/api/logins/sync-from-sheets', async (req, res) => {
  try {
    const { env = 'prod', sheetName = 'Login History', month, year } = req.body;
    const fetch = (await import('node-fetch')).default;

    console.log(`[Sync Login History] Starting sync from Google Sheets`);
    console.log(`[Sync Login History] Environment: ${env}, Sheet: ${sheetName}`);

    // Read login data from Google Sheets
    const sheetData = await readLoginHistoryFromSheet(env, sheetName);

    if (!sheetData.success) {
      return res.status(400).json({
        success: false,
        error: sheetData.error
      });
    }

    // Get or create month record
    let monthRecord = null;
    if (month && year) {
      try {
        // Try to find existing month
        const monthResponse = await fetch(
          `${STRAPI_URL}/api/months?filters[year][$eq]=${year}&filters[month][$eq]=${month}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const monthData = await monthResponse.json();

        if (monthData.data && monthData.data.length > 0) {
          monthRecord = monthData.data[0];
        } else {
          // Create new month record
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          const monthName = monthNames[month - 1];
          const thaiYear = year + 543; // Convert to Thai Buddhist year

          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0);

          const createMonthResponse = await fetch(`${STRAPI_URL}/api/months`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                year,
                month,
                monthName: `${monthName} ${year}`,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                thaiYear,
                isActive: true
              }
            })
          });

          const createMonthData = await createMonthResponse.json();
          if (createMonthResponse.ok && createMonthData.data) {
            monthRecord = createMonthData.data;
          }
        }
      } catch (err) {
        console.error('[Sync Login History] Error handling month:', err);
      }
    }

    // Sync each login record to Strapi
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const record of sheetData.records) {
      try {
        // Find user by username
        const userResponse = await fetch(
          `${STRAPI_URL}/api/users?filters[username][$eq]=${encodeURIComponent(record.username)}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const userData = await userResponse.json();

        let userId = null;
        if (userData.data && userData.data.length > 0) {
          userId = userData.data[0].id;
        } else {
          // User not found - skip this record
          results.skipped++;
          continue;
        }

        // Check if login record already exists (by username and loginAttemptAt)
        const existingLoginResponse = await fetch(
          `${STRAPI_URL}/api/logins?filters[user][id][$eq]=${userId}&filters[loginAttemptAt][$eq]=${record.loginAttemptAt}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const existingLoginData = await existingLoginResponse.json();

        if (existingLoginData.data && existingLoginData.data.length > 0) {
          // Already exists - skip
          results.skipped++;
          continue;
        }

        // Create login record in Strapi
        const loginData = {
          data: {
            user: userId,
            loginStatus: record.loginStatus,
            loginAttemptAt: record.loginAttemptAt,
            ipAddress: record.ipAddress || null,
            userAgent: record.userAgent || null,
            rememberMe: record.rememberMe || false,
            failureReason: record.failureReason || null,
            deviceInfo: record.deviceInfo || null
          }
        };

        if (monthRecord) {
          loginData.data.month = monthRecord.id;
        }

        const createLoginResponse = await fetch(`${STRAPI_URL}/api/logins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        });

        if (createLoginResponse.ok) {
          results.success++;
        } else {
          const errorData = await createLoginResponse.json();
          results.failed++;
          results.errors.push({
            username: record.username,
            error: errorData.error?.message || 'Unknown error'
          });
        }
      } catch (err) {
        console.error(`[Sync Login History] Error syncing record for ${record.username}:`, err);
        results.failed++;
        results.errors.push({
          username: record.username,
          error: err.message
        });
      }
    }

    console.log(`[Sync Login History] Sync complete:`, results);

    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.json({
      success: true,
      message: `Synced ${results.success} login records`,
      results
    });
  } catch (error) {
    console.error('[Sync Login History] Error:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Determine if Strapi is running locally (on same server) or remotely (separate app)
const isLocalStrapi = STRAPI_URL.includes('localhost') || STRAPI_URL.includes('127.0.0.1');
const strapiTarget = STRAPI_URL.replace(/\/$/, ''); // Remove trailing slash

console.log(`[Strapi Proxy] Strapi URL: ${STRAPI_URL}`);
console.log(`[Strapi Proxy] Is local: ${isLocalStrapi}`);
console.log(`[Strapi Proxy] Target: ${strapiTarget}`);

// Get current server URL for redirect rewriting
const getServerUrl = () => {
  // Try to get from environment first
  if (process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  }
  // Fallback: construct from request if available
  return process.env.PUBLIC_URL || 'http://localhost:3001';
};

// Proxy Strapi admin and API routes to Strapi
// Only proxy if Strapi is running locally (same server)
// If Strapi is remote, redirect to it directly
const strapiProxy = createProxyMiddleware({
  target: strapiTarget,
  changeOrigin: true,
  ws: true, // Enable websocket proxying for Strapi admin
  logLevel: 'debug',
  followRedirects: false, // Don't follow redirects automatically
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Strapi Proxy] Proxying ${req.method} ${req.path} to ${strapiTarget}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Rewrite redirect Location headers to use the proxy path
    if (proxyRes.statusCode === 302 || proxyRes.statusCode === 301) {
      const location = proxyRes.headers.location;
      if (location) {
        const serverUrl = getServerUrl();

        // If redirecting to /admin from /admin, it's a loop - don't rewrite
        if (location === '/admin' && req.path === '/admin') {
          console.log(`[Strapi Proxy] Detected redirect loop: ${req.path} -> ${location}, allowing redirect`);
          // Keep the redirect but it will be handled by the browser
          return;
        }

        // If Strapi redirects to its own URL, rewrite it to use the proxy path
        if (location.startsWith(serverUrl)) {
          // Keep the redirect as-is (it's already pointing to the server URL)
          console.log(`[Strapi Proxy] Redirect: ${location}`);
        } else if (location.startsWith(strapiTarget)) {
          // Rewrite Strapi URLs to use the proxy path
          const newLocation = location.replace(strapiTarget, '');
          proxyRes.headers.location = `${serverUrl}${newLocation}`;
          console.log(`[Strapi Proxy] Rewrote redirect: ${location} -> ${proxyRes.headers.location}`);
        } else if (location.startsWith('/')) {
          // Relative redirects - keep them relative (browser will resolve correctly)
          console.log(`[Strapi Proxy] Relative redirect: ${location}`);
        }
      }
    }
  },
  onError: (err, req, res) => {
    console.error('[Strapi Proxy] Error:', err.message);
    console.error('[Strapi Proxy] Strapi URL:', STRAPI_URL);
    console.error('[Strapi Proxy] Is Strapi running? Check:', strapiTarget);
    res.status(503).json({
      error: 'Strapi service unavailable',
      message: `Cannot connect to Strapi at ${strapiTarget}`,
      strapiUrl: STRAPI_URL
    });
  }
});

// Proxy Strapi admin panel (all HTTP methods)
// Only proxy if Strapi is running locally
// If Strapi is remote, redirect to it directly
if (isLocalStrapi) {
  // Express strips /admin prefix, so we need to add it back for Strapi
  app.use('/admin', createProxyMiddleware({
    target: strapiTarget,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
    timeout: 25000, // 25 seconds (slightly less than Heroku's 30s timeout)
    proxyTimeout: 25000,
    // Express strips /admin prefix, so we need to reconstruct the full path
    // For /admin/login → Express gives us /login → We need /admin/login
    pathRewrite: (path, req) => {
      const originalPath = req.originalUrl || req.url;
      // If the path starts with /admin, it was stripped - add it back
      if (!path.startsWith('/admin')) {
        const newPath = `/admin${path}`;
        console.log(`[Strapi Proxy] Rewriting path: ${path} → ${newPath} (original: ${originalPath})`);
        return newPath;
      }
      return path;
    },
    onProxyReq: (proxyReq, req, res) => {
      const targetPath = proxyReq.path;
      console.log(`[Strapi Proxy] Proxying admin ${req.method} ${req.path} to ${strapiTarget}${targetPath}`);
      console.log(`[Strapi Proxy] Original URL: ${req.originalUrl || req.url}`);
      console.log(`[Strapi Proxy] Content-Type: ${req.headers['content-type'] || 'none'}`);
      console.log(`[Strapi Proxy] Content-Length: ${req.headers['content-length'] || 'none'}`);

      // Copy headers from original request
      const headers = {
        ...req.headers,
        'host': strapiTarget.replace(/^https?:\/\//, '').split(':')[0] // Set correct host
      };

      // Ensure Content-Type is preserved
      if (req.headers['content-type']) {
        proxyReq.setHeader('content-type', req.headers['content-type']);
      }

      // Set timeout on the proxy request (25 seconds, less than Heroku's 30s)
      proxyReq.setTimeout(25000, () => {
        console.error(`[Strapi Proxy] Proxy request timeout for ${req.method} ${req.path} → ${targetPath}`);
        if (!res.headersSent) {
          res.status(504).json({
            error: 'Gateway timeout',
            message: 'Strapi took too long to respond',
            path: req.path,
            targetPath: targetPath
          });
        }
      });

      // Log if request has body data
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.on('data', (chunk) => {
          console.log(`[Strapi Proxy] Received ${chunk.length} bytes of request body`);
        });
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Rewrite redirect Location headers to use the proxy path
      if (proxyRes.statusCode === 302 || proxyRes.statusCode === 301) {
        const location = proxyRes.headers.location;
        if (location) {
          const serverUrl = getServerUrl();

          // If redirecting to /admin from /admin, break the loop
          if (location === '/admin' && req.path === '/admin') {
            // This is a redirect loop - Strapi is redirecting /admin to /admin
            // Break the loop by redirecting to the login page
            console.log(`[Strapi Proxy] Breaking redirect loop: /admin -> /admin`);
            proxyRes.headers.location = '/admin/auth/login';
            console.log(`[Strapi Proxy] Changed redirect to: /admin/auth/login`);
            return;
          }

          // If Strapi redirects to its own URL, rewrite it to use the proxy path
          if (location.startsWith(serverUrl)) {
            console.log(`[Strapi Proxy] Redirect: ${location}`);
          } else if (location.startsWith(strapiTarget)) {
            const newLocation = location.replace(strapiTarget, '');
            proxyRes.headers.location = `${serverUrl}${newLocation}`;
            console.log(`[Strapi Proxy] Rewrote redirect: ${location} -> ${proxyRes.headers.location}`);
          } else if (location.startsWith('/')) {
            // Relative redirects - keep them relative
            console.log(`[Strapi Proxy] Relative redirect: ${location}`);
          }
        }
      }
    },
    onError: (err, req, res) => {
      console.error('[Strapi Proxy] Admin proxy error:', err.message);
      console.error('[Strapi Proxy] Strapi URL:', STRAPI_URL);
      res.status(503).json({
        error: 'Strapi admin service unavailable',
        message: `Cannot connect to Strapi at ${strapiTarget}`,
        strapiUrl: STRAPI_URL
      });
    }
  }));
} else {
  // Strapi is running on a remote server - redirect /admin to it directly
  app.use('/admin', (req, res) => {
    const adminUrl = `${strapiTarget}/admin${req.path === '/admin' ? '' : req.path}`;
    console.log(`[Strapi Proxy] Redirecting /admin to remote Strapi: ${adminUrl}`);
    res.redirect(adminUrl);
  });
}

// Proxy Strapi API routes (but not Express /api root)
// Only proxy if Strapi is running locally AND it's a Strapi-specific API route
// If Strapi is remote, API calls should go directly to it (no proxy needed)
if (isLocalStrapi) {
  app.use('/api', (req, res, next) => {
    // Check if this is a Strapi API route (has content type in path like /api/drivers, /api/attendances, etc.)
    const strapiApiRoutes = ['/api/drivers', '/api/attendances', '/api/login', '/api/month', '/api/upload', '/api/auth', '/api/users-permissions'];
    const isStrapiRoute = strapiApiRoutes.some(route => req.path.startsWith(route));

    if (isStrapiRoute) {
      console.log(`[Strapi Proxy] Proxying Strapi API: ${req.path}`);
      return strapiProxy(req, res, next);
    }

    // Otherwise, let Express handle it
    next();
  });
}

// Simple catch-all route for SPA - MUST BE LAST (after all API routes)
app.get('*', (req, res) => {
  console.log('=== CATCH-ALL: Serving route:', req.path);

  // Don't serve index.html for API routes - let them be handled by specific routes above
  // Note: GET /login is handled above, so it won't reach here
  // Only check for POST /login and other API endpoints
  if (req.path.startsWith('/api/') || req.path.startsWith('/sheets') || req.path.startsWith('/submit') || req.path.startsWith('/clock-event') || req.path.startsWith('/check-existing') || req.path.startsWith('/webhook') || req.path.startsWith('/notify-line') || req.path.startsWith('/health') || (req.method === 'POST' && req.path === '/login') || req.path.startsWith('/logout') || req.path.startsWith('/me')) {
    // If we reach here, the route wasn't handled by any specific route above
    console.log('API route not found, returning 404:', req.path);
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Serve the React app for all other routes
  console.log('Serving React app from dist/index.html');
  res.sendFile('dist/index.html', { root: '.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});