#!/usr/bin/env node

/**
 * Script to add "Day of Week" column to production Google Sheet
 * and calculate days based on dates in column B
 * 
 * Usage: node update-prod-sheet-day-of-week.js
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  keyFile: './google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Configuration
const PROD_SPREADSHEET_ID = process.env.VITE_GOOGLE_SHEET_ID_PROD;

if (!PROD_SPREADSHEET_ID) {
  console.error('❌ Error: VITE_GOOGLE_SHEET_ID_PROD not found in environment variables');
  process.exit(1);
}

/**
 * Calculate day of week from Thai date format (DD/MM/YYYY)
 */
function getDayOfWeek(thaiDate) {
  try {
    const parts = thaiDate.split('/');
    if (parts.length !== 3) {
      console.log(`⚠️ Invalid Thai date format: ${thaiDate}`);
      return 'Invalid Date';
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const thaiYear = parseInt(parts[2]);
    const gregorianYear = thaiYear - 543;
    
    const date = new Date(gregorianYear, month - 1, day);
    const dayOfWeek = date.toLocaleDateString('th-TH', { weekday: 'long' });
    
    console.log(`📅 ${thaiDate} -> ${dayOfWeek}`);
    return dayOfWeek;
  } catch (error) {
    console.log(`⚠️ Error calculating day of week for ${thaiDate}:`, error.message);
    return 'Error';
  }
}

/**
 * Get all sheet names in the spreadsheet
 */
async function getSheetNames(spreadsheetId) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    return response.data.sheets.map(sheet => sheet.properties.title);
  } catch (error) {
    console.error('❌ Error getting sheet names:', error.message);
    return [];
  }
}

/**
 * Check if a sheet has the new "Day of Week" column
 */
async function hasDayOfWeekColumn(spreadsheetId, sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:K1`,
    });
    
    const headers = response.data.values?.[0] || [];
    const hasDayOfWeek = headers[2] && 
      (headers[2].toLowerCase().includes('day') && headers[2].toLowerCase().includes('week'));
    
    console.log(`📋 Sheet "${sheetName}" headers:`, headers);
    console.log(`🔍 Has Day of Week column: ${hasDayOfWeek}`);
    
    return hasDayOfWeek;
  } catch (error) {
    console.log(`⚠️ Error checking headers for sheet "${sheetName}":`, error.message);
    return false;
  }
}

/**
 * Add "Day of Week" column to a sheet
 */
async function addDayOfWeekColumn(spreadsheetId, sheetName) {
  try {
    console.log(`🔧 Adding "Day of Week" column to sheet "${sheetName}"...`);
    
    // Insert column C (index 2)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: 0, // We'll need to get the actual sheet ID
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
      spreadsheetId,
      range: `${sheetName}!C1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Day of Week']]
      }
    });
    
    console.log(`✅ Added "Day of Week" column header to sheet "${sheetName}"`);
  } catch (error) {
    console.error(`❌ Error adding Day of Week column to sheet "${sheetName}":`, error.message);
  }
}

/**
 * Update Day of Week values for all rows in a sheet
 */
async function updateDayOfWeekValues(spreadsheetId, sheetName) {
  try {
    console.log(`🔄 Updating Day of Week values for sheet "${sheetName}"...`);
    
    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:J`, // Get all columns
    });
    
    const values = response.data.values || [];
    
    if (values.length <= 1) {
      console.log(`📄 Sheet "${sheetName}" has no data rows to update`);
      return;
    }
    
    console.log(`📊 Found ${values.length - 1} data rows to update`);
    
    // Process each row (skip header)
    const updates = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const date = row[1]; // Column B (Date)
      
      if (date && date.trim()) {
        const dayOfWeek = getDayOfWeek(date);
        updates.push({
          range: `${sheetName}!C${i + 1}`, // Column C, row i+1
          values: [[dayOfWeek]]
        });
      }
    }
    
    if (updates.length === 0) {
      console.log(`📄 No valid dates found in sheet "${sheetName}"`);
      return;
    }
    
    // Batch update all Day of Week values
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
    
    console.log(`✅ Updated ${updates.length} Day of Week values in sheet "${sheetName}"`);
  } catch (error) {
    console.error(`❌ Error updating Day of Week values for sheet "${sheetName}":`, error.message);
  }
}

/**
 * Main function to update production sheet
 */
async function updateProdSheet() {
  try {
    console.log('🚀 Starting production sheet Day of Week update...');
    console.log(`📊 Spreadsheet ID: ${PROD_SPREADSHEET_ID}`);
    
    // Get all sheet names
    const sheetNames = await getSheetNames(PROD_SPREADSHEET_ID);
    console.log(`📋 Found sheets: ${sheetNames.join(', ')}`);
    
    if (sheetNames.length === 0) {
      console.log('❌ No sheets found in the spreadsheet');
      return;
    }
    
    // Process each sheet
    for (const sheetName of sheetNames) {
      console.log(`\n🔍 Processing sheet: "${sheetName}"`);
      
      // Check if sheet already has Day of Week column
      const hasDayOfWeek = await hasDayOfWeekColumn(PROD_SPREADSHEET_ID, sheetName);
      
      if (hasDayOfWeek) {
        console.log(`✅ Sheet "${sheetName}" already has Day of Week column`);
        // Still update values in case some are missing
        await updateDayOfWeekValues(PROD_SPREADSHEET_ID, sheetName);
      } else {
        console.log(`🔧 Sheet "${sheetName}" needs Day of Week column`);
        
        // Add the column
        await addDayOfWeekColumn(PROD_SPREADSHEET_ID, sheetName);
        
        // Update values
        await updateDayOfWeekValues(PROD_SPREADSHEET_ID, sheetName);
      }
    }
    
    console.log('\n🎉 Production sheet Day of Week update completed!');
    
  } catch (error) {
    console.error('❌ Error updating production sheet:', error.message);
  }
}

// Run the script
updateProdSheet();
