#!/usr/bin/env node

/**
 * Simple script to add "Day of Week" column to a specific Google Sheet
 * 
 * Usage: 
 * node update-sheet-day-of-week-simple.js [SPREADSHEET_ID] [SHEET_NAME]
 * 
 * Example:
 * node update-sheet-day-of-week-simple.js 1ABC123DEF456 your-sheet-name
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get command line arguments
const args = process.argv.slice(2);
const SPREADSHEET_ID = args[0];
const SHEET_NAME = args[1];

if (!SPREADSHEET_ID || !SHEET_NAME) {
  console.error('❌ Usage: node update-sheet-day-of-week-simple.js [SPREADSHEET_ID] [SHEET_NAME]');
  console.error('Example: node update-sheet-day-of-week-simple.js 1ABC123DEF456 "September 2024 Attendance"');
  process.exit(1);
}

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  keyFile: './google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Calculate day of week from Thai date format (DD/MM/YYYY)
 */
function getDayOfWeek(thaiDate) {
  try {
    const parts = thaiDate.split('/');
    if (parts.length !== 3) {
      return 'Invalid';
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const thaiYear = parseInt(parts[2]);
    const gregorianYear = thaiYear - 543;
    
    const date = new Date(gregorianYear, month - 1, day);
    return date.toLocaleDateString('th-TH', { weekday: 'long' });
  } catch (error) {
    return 'Error';
  }
}

/**
 * Main update function
 */
async function updateSheet() {
  try {
    console.log('🚀 Starting Day of Week column update...');
    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`);
    console.log(`📋 Sheet Name: "${SHEET_NAME}"`);
    
    // First, check if the sheet exists and get its structure
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:J1`, // Check first row
    });
    
    const headers = response.data.values?.[0] || [];
    console.log(`📋 Current headers: ${headers.join(' | ')}`);
    
    // Check if Day of Week column already exists
    const hasDayOfWeek = headers[2] && 
      headers[2].toLowerCase().includes('day') && 
      headers[2].toLowerCase().includes('week');
    
    if (hasDayOfWeek) {
      console.log('✅ Day of Week column already exists, updating values...');
    } else {
      console.log('🔧 Adding Day of Week column...');
      
      // Insert column C
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId: 0, // This might need adjustment based on actual sheet
                  dimension: 'COLUMNS',
                  startIndex: 2,
                  endIndex: 3
                },
                inheritFromBefore: false
              }
            }
          ]
        }
      });
      
      // Add header
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!C1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Day of Week']]
        }
      });
      
      console.log('✅ Added Day of Week column header');
    }
    
    // Get all data to update Day of Week values
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
    });
    
    const values = dataResponse.data.values || [];
    console.log(`📊 Found ${values.length} total rows`);
    
    if (values.length <= 1) {
      console.log('📄 No data rows to update');
      return;
    }
    
    // Update Day of Week values for each row
    const updates = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const date = row[1]; // Column B (Date)
      
      if (date && date.trim()) {
        const dayOfWeek = getDayOfWeek(date);
        updates.push({
          range: `${SHEET_NAME}!C${i + 1}`,
          values: [[dayOfWeek]]
        });
        
        if (i <= 5) { // Show first 5 calculations
          console.log(`📅 ${date} -> ${dayOfWeek}`);
        }
      }
    }
    
    if (updates.length === 0) {
      console.log('📄 No valid dates found to update');
      return;
    }
    
    console.log(`🔄 Updating ${updates.length} Day of Week values...`);
    
    // Batch update
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
    
    console.log('✅ Successfully updated all Day of Week values!');
    console.log('🎉 Sheet update completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Unable to parse range')) {
      console.error('💡 Make sure the sheet name is correct and exists in the spreadsheet');
    } else if (error.message.includes('The caller does not have permission')) {
      console.error('💡 Make sure your Google credentials have access to this spreadsheet');
    }
  }
}

// Run the script
updateSheet();
