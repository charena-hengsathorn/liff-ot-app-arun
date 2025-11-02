import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { handleGoogleSheetsRequest, createMonthlySheet } from './src/googleSheetsHandler.js';
import { setupAuthRoutes } from './src/login/authRoutes.js';

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
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:5174', // Vite dev server (alternative)
    'http://localhost:5175', // Vite dev server (alternative)
    'http://localhost:3000', // Alternative dev port
    'https://liff-ot-app-positive.vercel.app', // Vercel frontend
    'https://liff-ot-app-positive.herokuapp.com' // Heroku production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Setup authentication routes (login, logout, /me)
setupAuthRoutes(app, {
  strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337'
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

// Simple catch-all route for SPA
app.get('*', (req, res) => {
  console.log('=== CATCH-ALL: Serving route:', req.path);
  
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/sheets') || req.path.startsWith('/submit') || req.path.startsWith('/clock-event') || req.path.startsWith('/check-existing') || req.path.startsWith('/webhook') || req.path.startsWith('/notify-line') || req.path.startsWith('/health') || req.path.startsWith('/login') || req.path.startsWith('/logout') || req.path.startsWith('/me')) {
    console.log('API route detected, returning 404');
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  

  
  // Serve the React app for all other routes
  console.log('Serving React app from dist/index.html');
  res.sendFile('dist/index.html', { root: '.' });
});

// Unified endpoint for all Google Sheets operations
app.post('/sheets', async (req, res) => {
  console.log('=== SHEETS: Received POST request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const result = await handleGoogleSheetsRequest(req.body);
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
    const result = await handleGoogleSheetsRequest(req.body);
    console.log('Submit response:', JSON.stringify(result, null, 2));
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
    const result = await handleGoogleSheetsRequest(req.body);
    console.log('Clock event response:', JSON.stringify(result, null, 2));
    res.json(result);
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
    const result = await handleGoogleSheetsRequest(req.body);
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

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

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
    
    const response = await fetch(`${STRAPI_URL}/api/drivers?populate=*`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching drivers:', error);
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

// Create a new driver
app.post('/api/drivers', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${STRAPI_URL}/api/drivers`, {
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
    console.error('Error creating driver:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a driver
app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${STRAPI_URL}/api/drivers/${id}`, {
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
    console.error('Error updating driver:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a driver
app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${STRAPI_URL}/api/drivers/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});