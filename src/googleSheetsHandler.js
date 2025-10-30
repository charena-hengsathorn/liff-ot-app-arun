import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString()) : undefined,
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Spreadsheet IDs from environment
const SPREADSHEET_ID_DEV = process.env.VITE_GOOGLE_SHEET_ID_DEV;
const SPREADSHEET_ID_PROD = process.env.VITE_GOOGLE_SHEET_ID_PROD;

// Helper function to get spreadsheet ID by environment
function getSpreadsheetId(env) {
  const targetEnv = env === 'dev' ? 'dev' : 'prod';
  const result = targetEnv === 'dev' ? SPREADSHEET_ID_DEV : SPREADSHEET_ID_PROD;
  console.log(`🔧 getSpreadsheetId(${env}) -> ${result}`);
  return result;
}

// Helper function to get current Bangkok time
function getBangkokTime() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Helper function to format date for Bangkok timezone
function formatBangkokDate(date) {
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Helper function to format sheet range with proper quoting
function formatSheetRange(targetSheetName, range) {
  return `'${targetSheetName}'!${range}`;
}

// Helper function to get day of week from Thai date
function getDayOfWeek(thaiDate) {
  try {
    // Parse Thai date format (e.g., "1/8/2568" -> day/month/year)
    const parts = thaiDate.split('/');
    if (parts.length !== 3) {
      console.log('⚠️ Invalid Thai date format, using current date');
      return new Date().toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const thaiYear = parseInt(parts[2]);
    // Support both Thai Buddhist years (>= 2400) and Gregorian years
    const gregorianYear = (isNaN(thaiYear) ? new Date().getFullYear() : (thaiYear >= 2400 ? thaiYear - 543 : thaiYear));
    
    // Create date object
    const date = new Date(gregorianYear, month - 1, day);
    
    // Get day of week in English
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log(`📅 Date: ${thaiDate} -> Day: ${dayOfWeek}`);
    return dayOfWeek;
  } catch (error) {
    console.log('⚠️ Error calculating day of week:', error.message);
    return 'Unknown';
  }
}

// Helper function to translate day of week to Thai
function translateDayOfWeek(dayOfWeek, language) {
  const dayTranslations = {
    en: {
      'Monday': 'Monday',
      'Tuesday': 'Tuesday', 
      'Wednesday': 'Wednesday',
      'Thursday': 'Thursday',
      'Friday': 'Friday',
      'Saturday': 'Saturday',
      'Sunday': 'Sunday'
    },
    th: {
      'Monday': 'วันจันทร์',
      'Tuesday': 'วันอังคาร',
      'Wednesday': 'วันพุธ', 
      'Thursday': 'วันพฤหัสบดี',
      'Friday': 'วันศุกร์',
      'Saturday': 'วันเสาร์',
      'Sunday': 'วันอาทิตย์'
    }
  };
  
  return dayTranslations[language]?.[dayOfWeek] || dayOfWeek;
}

// Helper function to check if OT calculation is allowed based on business rules
function isOTCalculationAllowed(thaiDate) {
  try {
    console.log(`🔍 Checking business rule for date: "${thaiDate}"`);
    
    // Parse Thai date format (e.g., "1/8/2568" -> day/month/year)
    const parts = thaiDate.split('/');
    console.log(`📅 Parsed date parts:`, parts);
    
    if (parts.length !== 3) {
      console.log('⚠️ Invalid Thai date format, allowing OT calculation');
      return true;
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const thaiYear = parseInt(parts[2]);
    
    console.log(`📊 Parsed values - Day: ${day}, Month: ${month}, Year: ${thaiYear}`);
    
    // Business rule: No OT calculation from 25th to end of month
    if (day >= 25) {
      console.log(`🚫 OT calculation disabled: Day ${day} is on or after 25th of month ${month}/${thaiYear}`);
      return false;
    }
    
    console.log(`✅ OT calculation allowed: Day ${day} is before 25th of month ${month}/${thaiYear}`);
    return true;
  } catch (error) {
    console.log('⚠️ Error checking OT calculation rule, allowing OT calculation:', error.message);
    return true; // Default to allowing OT calculation if there's an error
  }
}

// Helper function to detect if sheet has new column structure (with Day of Week)
async function detectSheetStructure(spreadsheetId, targetSheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: formatSheetRange(targetSheetName, 'A1:K1'),
    });
    
    const headers = response.data.values?.[0] || [];
    console.log('📋 Sheet headers:', headers);
    
    // Check if column C (index 2) contains "Day of Week" (handle variations)
    const hasDayOfWeekColumn = headers[2] && headers[2].toLowerCase().includes('day') && headers[2].toLowerCase().includes('week');
    
    console.log(`🔍 Sheet structure detected: ${hasDayOfWeekColumn ? 'NEW (with Day of Week)' : 'OLD (without Day of Week)'}`);
    return hasDayOfWeekColumn;
  } catch (error) {
    console.log('⚠️ Error detecting sheet structure, assuming old structure:', error.message);
    return false; // Default to old structure if detection fails
  }
}

// Helper function to get sheet name from date
export function getSheetNameFromDate(thaiDate) {
  // Parse Thai date format (e.g., "1/8/2568" -> day/month/year)
  const parts = thaiDate.split('/');
  if (parts.length !== 3) {
    console.log('⚠️ Invalid Thai date format, using current date');
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()} Attendance`;
  }
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const thaiYear = parseInt(parts[2]);
  // Support both Thai Buddhist years (>= 2400) and Gregorian years
  const gregorianYear = (isNaN(thaiYear) ? new Date().getFullYear() : (thaiYear >= 2400 ? thaiYear - 543 : thaiYear));
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const targetSheetName = `${monthNames[month - 1]} ${gregorianYear} Attendance`;
  console.log(`📅 Date: ${thaiDate} -> Sheet: ${targetSheetName}`);
  return targetSheetName;
}

// Check if entry exists in Google Sheets
export async function checkExistingEntry(driverName, thaiDate, env = 'prod') {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    const targetSheetName = getSheetNameFromDate(thaiDate);
    const range = formatSheetRange(targetSheetName, 'A:B'); // Driver name and date columns
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    
    console.log(`🔍 Checking for driver: "${driverName}", date: "${thaiDate}"`);
    
    // Check for existing row with same driver and date
    for (let i = 1; i < values.length; i++) { // skip header
      const rowDriver = values[i][0];
      const rowDate = values[i][1];
      
      console.log(`Row ${i + 1}: driver="${rowDriver}", date="${rowDate}"`);
      console.log(`Comparing: "${rowDriver}" === "${driverName}" && "${rowDate}" === "${thaiDate}"`);
      
      if (rowDriver === driverName && rowDate === thaiDate) {
        console.log(`✅ Found match at row ${i + 1}`);
        return { 
          success: true,
          exists: true, 
          row: i + 1 
        };
      }
    }
    
    console.log(`❌ No match found`);
    return { 
      success: true,
      exists: false 
    };
  } catch (error) {
    console.error('Error checking existing entry:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Submit with clock times
export async function submitWithClockTimes(data) {
  try {
    const {
      driverName,
      thaiDate,
      clockIn,
      clockOut,
      otStart,
      otEnd,
      otHours,
      comments,
      env = 'prod',
      isAutoSubmitted = false,
      isOTUpdate = false,
      language = 'en'
    } = data;

    const spreadsheetId = getSpreadsheetId(env);
    const submittedAt = getBangkokTime();
    
    // Calculate OT hours if clock out time is provided and after 17:00
    let calculatedOTStart = otStart;
    let calculatedOTEnd = otEnd;
    let calculatedOTHours = otHours;
    
    if (clockOut && !isOTUpdate) {
      console.log(`🔍 Calculating OT for clock out time: ${clockOut}`);
      
      // Check business rule: No OT calculation from 25th to end of month
      if (!isOTCalculationAllowed(thaiDate)) {
        console.log(`🚫 OT calculation skipped due to business rule: Date ${thaiDate} is on or after 25th of month`);
        calculatedOTStart = '';
        calculatedOTEnd = '';
        calculatedOTHours = '';
      } else {
        const clockInTimeObj = new Date(`2000-01-01T${clockIn}:00`);
        const clockOutTimeObj = new Date(`2000-01-01T${clockOut}:00`);
        const morningOTEndTimeObj = new Date(`2000-01-01T08:00:00`);
        const eveningOTStartTimeObj = new Date(`2000-01-01T17:00:00`);
        
        let morningOTHours = 0;
        let eveningOTHours = 0;
        let totalOTHours = 0;
        let otStartTime = '';
        let otEndTime = '';
        
        // Calculate early morning OT (if clock in before 8:00 AM)
        if (clockInTimeObj < morningOTEndTimeObj) {
          const morningDiffMs = morningOTEndTimeObj.getTime() - clockInTimeObj.getTime();
          morningOTHours = morningDiffMs / (1000 * 60 * 60);
          console.log(`🌅 Early morning OT: Clock in ${clockIn} to 08:00 = ${morningOTHours.toFixed(2)} hours`);
        }
        
        // Calculate evening OT (if clock out after 17:00 PM)
        if (clockOutTimeObj > eveningOTStartTimeObj) {
          const eveningDiffMs = clockOutTimeObj.getTime() - eveningOTStartTimeObj.getTime();
          eveningOTHours = eveningDiffMs / (1000 * 60 * 60);
          console.log(`🌆 Evening OT: 17:00 to clock out ${clockOut} = ${eveningOTHours.toFixed(2)} hours`);
        }
        
        // Calculate total OT hours
        totalOTHours = morningOTHours + eveningOTHours;
        
        if (totalOTHours > 0) {
          // Set OT start and end times based on what OT periods exist
          if (morningOTHours > 0 && eveningOTHours > 0) {
            // Both morning and evening OT
            otStartTime = clockIn; // Start from actual clock in time
            otEndTime = clockOut; // End at actual clock out time
            console.log(`🕐 Combined OT: Morning ${morningOTHours.toFixed(2)}h + Evening ${eveningOTHours.toFixed(2)}h = ${totalOTHours.toFixed(2)}h total`);
          } else if (morningOTHours > 0) {
            // Only morning OT
            otStartTime = clockIn;
            otEndTime = '08:00';
            console.log(`🌅 Morning OT only: ${morningOTHours.toFixed(2)} hours`);
          } else if (eveningOTHours > 0) {
            // Only evening OT
            otStartTime = '17:00';
            otEndTime = clockOut;
            console.log(`🌆 Evening OT only: ${eveningOTHours.toFixed(2)} hours`);
          }
          
          calculatedOTStart = otStartTime;
          calculatedOTEnd = otEndTime;
          calculatedOTHours = totalOTHours.toFixed(2); // Round to 2 decimal places
          
          console.log(`🧮 Total OT calculation: ${calculatedOTHours} hours (Start: ${calculatedOTStart}, End: ${calculatedOTEnd})`);
        } else {
          console.log(`❌ No OT hours: Clock in ${clockIn} and clock out ${clockOut} are within standard hours`);
          calculatedOTStart = '';
          calculatedOTEnd = '';
          calculatedOTHours = '';
        }
      }
    }

    // Check for existing entry
    const existingCheck = await checkExistingEntry(driverName, thaiDate, env);
    const targetSheetName = getSheetNameFromDate(thaiDate);
    
    // Detect sheet structure to determine column positions
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    
    if (existingCheck.exists) {
      // Update existing row
      const updates = [];
      
      // Define column positions based on sheet structure
      const clockInCol = hasNewStructure ? 'D' : 'C';
      const clockOutCol = hasNewStructure ? 'E' : 'D';
      const otStartCol = hasNewStructure ? 'F' : 'E';
      const otEndCol = hasNewStructure ? 'G' : 'F';
      const commentsCol = hasNewStructure ? 'H' : 'G';
      const otHoursCol = hasNewStructure ? 'J' : 'I';
      
      // For OT updates, only update OT-related fields
      if (isOTUpdate) {
        if (otStart) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${otStartCol}${existingCheck.row}`),
            values: [[otStart]]
          });
        }
        
        if (otEnd) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${otEndCol}${existingCheck.row}`),
            values: [[otEnd]]
          });
        }
        
        if (otHours) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${otHoursCol}${existingCheck.row}`),
            values: [[otHours]]
          });
        }
      } else {
        // For regular updates, update all fields
        if (clockIn) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${clockInCol}${existingCheck.row}`),
            values: [[clockIn]]
          });
        }
        
        if (clockOut) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${clockOutCol}${existingCheck.row}`),
            values: [[clockOut]]
          });
        }
        
        // Update OT fields if provided or calculated
        if (calculatedOTStart) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${otStartCol}${existingCheck.row}`),
            values: [[calculatedOTStart]]
          });
        }
        
        if (calculatedOTEnd) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${otEndCol}${existingCheck.row}`),
            values: [[calculatedOTEnd]]
          });
        }
        
        if (calculatedOTHours) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${otHoursCol}${existingCheck.row}`),
            values: [[calculatedOTHours]]
          });
        }
        
        if (comments) {
          updates.push({
            range: formatSheetRange(targetSheetName, `${commentsCol}${existingCheck.row}`),
            values: [[comments]]
          });
        }
      }

      if (updates.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: updates
          }
        });
      }

      return {
        success: true,
        message: isOTUpdate ? 'OT Time updated in existing row' : 
                (isAutoSubmitted ? 'Existing row updated with auto-submitted clock times' : 'Existing row updated with clock times'),
        row: existingCheck.row,
        updatedClockIn: clockIn || '',
        updatedClockOut: clockOut || '',
        updatedOtStart: calculatedOTStart || '',
        updatedOtEnd: calculatedOTEnd || '',
        updatedOtHours: calculatedOTHours || '',
        updatedComments: comments || '',
        isAutoSubmitted,
        isOTUpdate
      };
    } else {
      // Append new row - adapt structure based on sheet type
      const newRow = hasNewStructure ? [
        driverName || '',
        thaiDate || '',
        translateDayOfWeek(getDayOfWeek(thaiDate || ''), language), // Day of Week (only for new structure)
        clockIn || '',
        clockOut || '',
        calculatedOTStart || '', // OT Start (17:00 if applicable)
        calculatedOTEnd || '', // OT End (clock out time if applicable)
        comments || '',
        submittedAt,
        calculatedOTHours || '' // OT Hours (calculated)
      ] : [
        // Old structure without Day of Week column
        driverName || '',
        thaiDate || '',
        clockIn || '',
        clockOut || '',
        calculatedOTStart || '', // OT Start (17:00 if applicable)
        calculatedOTEnd || '', // OT End (clock out time if applicable)
        comments || '',
        submittedAt,
        calculatedOTHours || '' // OT Hours (calculated)
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J'),
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow]
        }
      });

      return {
        success: true,
        message: isAutoSubmitted ? 'New row created with auto-submitted clock times' : 'New row created with clock times',
        newRow,
        otStart: calculatedOTStart || '',
        otEnd: calculatedOTEnd || '',
        otHours: calculatedOTHours || '',
        isAutoSubmitted
      };
    }
  } catch (error) {
    console.error('Error submitting with clock times:', error);
    throw error;
  }
}

// Handle clock events (for backward compatibility)
export async function handleClockEvent(data) {
  try {
    const {
      driverName,
      thaiDate,
      type,
      timestamp,
      comments = '',
      env = 'prod',
      language = 'en'
    } = data;

    const spreadsheetId = getSpreadsheetId(env);
    const submittedAt = getBangkokTime();
    
    // Initialize OT variables at function level
    let otStart = '';
    let otEnd = '';
    let otHours = '';

    // Check for existing entry
    const existingCheck = await checkExistingEntry(driverName, thaiDate, env);
    const targetSheetName = getSheetNameFromDate(thaiDate);
    
    // Detect sheet structure to determine column positions
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    
    if (existingCheck.exists) {
      // Update existing row - use correct column based on sheet structure
      const column = type === 'clockIn' ? (hasNewStructure ? 'D' : 'C') : (hasNewStructure ? 'E' : 'D');
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: formatSheetRange(targetSheetName, `${column}${existingCheck.row}`),
        valueInputOption: 'RAW',
        requestBody: {
          values: [[timestamp]]
        }
      });

      // If clocking out, calculate and save OT hours
      if (type === 'clockOut') {
        console.log(`🔍 Processing clock out for ${driverName} at ${timestamp}`);
        
        // Get the current row data to check clock in time
        const rowResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: formatSheetRange(targetSheetName, hasNewStructure ? `A${existingCheck.row}:K${existingCheck.row}` : `A${existingCheck.row}:J${existingCheck.row}`),
        });

        const rowData = rowResponse.data.values[0];
        const clockInTime = hasNewStructure ? rowData[3] : rowData[2]; // Column D for new structure, C for old
        const clockOutTime = timestamp;

        console.log(`📊 Row data: Clock In=${clockInTime}, Clock Out=${clockOutTime}`);

        // Calculate OT hours if clock out time is after 17:00
        if (clockOutTime) {
          // Check business rule: No OT calculation from 25th to end of month
          if (!isOTCalculationAllowed(thaiDate)) {
            console.log(`🚫 OT calculation skipped due to business rule: Date ${thaiDate} is on or after 25th of month`);
            otStart = '';
            otEnd = '';
            otHours = '';
          } else {
            const clockInTimeObj = new Date(`2000-01-01T${clockInTime}:00`);
            const clockOutTimeObj = new Date(`2000-01-01T${clockOutTime}:00`);
            const morningOTEndTimeObj = new Date(`2000-01-01T08:00:00`);
            const eveningOTStartTimeObj = new Date(`2000-01-01T17:00:00`);
            
            let morningOTHours = 0;
            let eveningOTHours = 0;
            let totalOTHours = 0;
            let otStartTime = '';
            let otEndTime = '';
            
            // Calculate early morning OT (if clock in before 8:00 AM)
            if (clockInTimeObj < morningOTEndTimeObj) {
              const morningDiffMs = morningOTEndTimeObj.getTime() - clockInTimeObj.getTime();
              morningOTHours = morningDiffMs / (1000 * 60 * 60);
              console.log(`🌅 Early morning OT: Clock in ${clockInTime} to 08:00 = ${morningOTHours.toFixed(2)} hours`);
            }
            
            // Calculate evening OT (if clock out after 17:00 PM)
            if (clockOutTimeObj > eveningOTStartTimeObj) {
              const eveningDiffMs = clockOutTimeObj.getTime() - eveningOTStartTimeObj.getTime();
              eveningOTHours = eveningDiffMs / (1000 * 60 * 60);
              console.log(`🌆 Evening OT: 17:00 to clock out ${clockOutTime} = ${eveningOTHours.toFixed(2)} hours`);
            }
            
            // Calculate total OT hours
            totalOTHours = morningOTHours + eveningOTHours;
            
            if (totalOTHours > 0) {
              // Set OT start and end times based on what OT periods exist
              if (morningOTHours > 0 && eveningOTHours > 0) {
                // Both morning and evening OT
                otStartTime = clockInTime; // Start from actual clock in time
                otEndTime = clockOutTime; // End at actual clock out time
                console.log(`🕐 Combined OT: Morning ${morningOTHours.toFixed(2)}h + Evening ${eveningOTHours.toFixed(2)}h = ${totalOTHours.toFixed(2)}h total`);
              } else if (morningOTHours > 0) {
                // Only morning OT
                otStartTime = clockInTime;
                otEndTime = '08:00';
                console.log(`🌅 Morning OT only: ${morningOTHours.toFixed(2)} hours`);
              } else if (eveningOTHours > 0) {
                // Only evening OT
                otStartTime = '17:00';
                otEndTime = clockOutTime;
                console.log(`🌆 Evening OT only: ${eveningOTHours.toFixed(2)} hours`);
              }
              
              otStart = otStartTime;
              otEnd = otEndTime;
              otHours = totalOTHours.toFixed(2); // Round to 2 decimal places
              
              console.log(`🧮 Total OT calculation: ${otHours} hours (Start: ${otStart}, End: ${otEnd})`);
            } else {
              console.log(`❌ No OT hours: Clock in ${clockInTime} and clock out ${clockOutTime} are within standard hours`);
            }
          }
        } else {
          console.log(`❌ No clock out time provided`);
        }

        // Update OT fields if there are OT hours
        if (otHours && parseFloat(otHours) > 0) {
          console.log(`💾 Saving OT data: Start=${otStart}, End=${otEnd}, Hours=${otHours}`);
          console.log(`📍 Row number: ${existingCheck.row}`);
          
          // Define column positions based on sheet structure
          const otStartCol = hasNewStructure ? 'F' : 'E';
          const otEndCol = hasNewStructure ? 'G' : 'F';
          const otHoursCol = hasNewStructure ? 'J' : 'I';
          
          const updates = [
            {
              range: formatSheetRange(targetSheetName, `${otStartCol}${existingCheck.row}`), // otStart
              values: [[otStart]]
            },
            {
              range: formatSheetRange(targetSheetName, `${otEndCol}${existingCheck.row}`), // otEnd
              values: [[otEnd]]
            },
            {
              range: formatSheetRange(targetSheetName, `${otHoursCol}${existingCheck.row}`), // Calculated OT Hours
              values: [[otHours]]
            }
          ];

          console.log(`📝 Batch update data:`, JSON.stringify(updates, null, 2));

          try {
            const batchUpdateResult = await sheets.spreadsheets.values.batchUpdate({
              spreadsheetId,
              requestBody: {
                valueInputOption: 'RAW',
                data: updates
              }
            });
            
            console.log(`✅ Batch update result:`, JSON.stringify(batchUpdateResult.data, null, 2));
            console.log(`✅ OT hours calculated and saved: ${otHours} hours for ${driverName} on ${thaiDate}`);
          } catch (error) {
            console.error(`❌ Error in batch update:`, error);
            throw error;
          }
        } else {
          console.log(`⚠️ No OT hours to save: otHours=${otHours}`);
        }

        // Update comments if provided
        if (comments) {
          const commentsCol = hasNewStructure ? 'H' : 'G';
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: formatSheetRange(targetSheetName, `${commentsCol}${existingCheck.row}`), // comments column
            valueInputOption: 'RAW',
            requestBody: {
              values: [[comments]]
            }
          });
        }

        // Update Submitted At timestamp only for clock-in events (not clock-out)
        if (type === 'clockIn') {
          const submittedAtCol = hasNewStructure ? 'I' : 'H';
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: formatSheetRange(targetSheetName, `${submittedAtCol}${existingCheck.row}`), // submitted at column
            valueInputOption: 'RAW',
            requestBody: {
              values: [[submittedAt]]
            }
          });
        }
      }

      return {
        success: true,
        message: 'Clock event updated in existing row',
        row: existingCheck.row,
        updatedColumn: column,
        timestamp,
        otHours: type === 'clockOut' ? otHours : undefined
      };
    } else {
      console.log(`🆕 Creating new row for ${driverName} with ${type} time ${timestamp}`);
      
      // Calculate OT hours for new row if clocking out
      if (type === 'clockOut') {
        console.log(`🔍 Calculating OT for new row: clock out at ${timestamp}`);
        
        // Check business rule: No OT calculation from 25th to end of month
        if (!isOTCalculationAllowed(thaiDate)) {
          console.log(`🚫 OT calculation skipped due to business rule: Date ${thaiDate} is on or after 25th of month`);
          otStart = '';
          otEnd = '';
          otHours = '';
        } else {
          const clockOutTimeObj = new Date(`2000-01-01T${timestamp}:00`);
          const eveningOTStartTimeObj = new Date(`2000-01-01T17:00:00`);
          
          // For new rows, we can only calculate evening OT since there's no clock-in time yet
          // Early morning OT will be calculated when the clock-in time is added later
          if (clockOutTimeObj > eveningOTStartTimeObj) {
            otStart = '17:00';
            otEnd = timestamp;
            
            // Calculate hours between 17:00 and clock out time
            const diffMs = clockOutTimeObj.getTime() - eveningOTStartTimeObj.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            otHours = diffHours.toFixed(2); // Round to 2 decimal places
            
            console.log(`🌆 Evening OT calculation: ${diffMs}ms = ${diffHours} hours = ${otHours} hours`);
          } else {
            console.log(`❌ No evening OT hours: Clock out time ${timestamp} is not after 17:00`);
            otStart = '';
            otEnd = '';
            otHours = '';
          }
        }
      }

      // Append new row - adapt structure based on sheet type
      const newRow = hasNewStructure ? [
        driverName || '',
        thaiDate || '',
        translateDayOfWeek(getDayOfWeek(thaiDate || ''), language), // Day of Week (only for new structure)
        type === 'clockIn' ? timestamp : '',
        type === 'clockOut' ? timestamp : '',
        otStart, // otStart
        otEnd, // otEnd
        comments || '', // comments
        submittedAt,
        otHours || '', // Calculated OT Hours
        '' // approval (empty)
      ] : [
        // Old structure without Day of Week column
        driverName || '',
        thaiDate || '',
        type === 'clockIn' ? timestamp : '',
        type === 'clockOut' ? timestamp : '',
        otStart, // otStart
        otEnd, // otEnd
        comments || '', // comments
        submittedAt,
        otHours || '', // Calculated OT Hours
        '' // approval (empty)
      ];

      console.log(`📝 New row data:`, newRow);

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J'),
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow]
        }
      });

      console.log(`✅ New row created with OT hours: ${otHours || 'none'}`);

      return {
        success: true,
        message: 'Clock event added as new row',
        newRow,
        otHours: type === 'clockOut' ? otHours : undefined
      };
    }
  } catch (error) {
    console.error('Error handling clock event:', error);
    throw error;
  }
}

// Approve most recent unapproved request
export async function approveMostRecent(env = 'prod', thaiDate = null) {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    
    // If thaiDate is provided, use the specific monthly sheet
    // Otherwise, we need to search across all sheets (this is a limitation)
    if (thaiDate) {
      const targetSheetName = getSheetNameFromDate(thaiDate);
      const range = formatSheetRange(targetSheetName, 'A:K');
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      
      // Find most recent unapproved request
      for (let i = values.length - 1; i > 0; i--) { // start from last row, skip header
        if (!values[i][9]) { // column J (index 9) is empty for approval
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: formatSheetRange(targetSheetName, `J${i + 1}`),
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Approve']]
            }
          });

          return {
            success: true,
            message: 'Most recent approval updated',
            row: i + 1,
            targetSheetName
          };
        }
      }
    } else {
      // Fallback: search in the first sheet (legacy behavior)
      const range = 'A:K';
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      
      // Find most recent unapproved request
      for (let i = values.length - 1; i > 0; i--) { // start from last row, skip header
        if (!values[i][9]) { // column J (index 9) is empty for approval
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `J${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Approve']]
            }
          });

          return {
            success: true,
            message: 'Most recent approval updated (legacy mode)',
            row: i + 1
          };
        }
      }
    }
    
    return {
      success: false,
      error: 'No unapproved requests found'
    };
  } catch (error) {
    console.error('Error approving most recent:', error);
    throw error;
  }
}

// Update approval
export async function updateApproval(submittedAt, approval, env = 'prod', thaiDate = null) {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    
    // If thaiDate is provided, use the specific monthly sheet
    if (thaiDate) {
      const targetSheetName = getSheetNameFromDate(thaiDate);
      
      // Detect sheet structure first
      const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
      const range = formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J');
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      
      // Find row by submittedAt (different column index for old vs new structure)
      const submittedAtIndex = hasNewStructure ? 8 : 7; // column I (new) vs column H (old)
      const approvalColumn = hasNewStructure ? 'K' : 'J'; // column K (new) vs column J (old)
      
      for (let i = 1; i < values.length; i++) { // skip header
        if (values[i][submittedAtIndex] === submittedAt) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: formatSheetRange(targetSheetName, `${approvalColumn}${i + 1}`),
            valueInputOption: 'RAW',
            requestBody: {
              values: [[approval]]
            }
          });

          return {
            success: true,
            message: 'Approval updated',
            row: i + 1,
            targetSheetName,
            hasNewStructure
          };
        }
      }
    } else {
      // Fallback: search in the first sheet (legacy behavior)
      const range = 'A:K';
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      
      // Find row by submittedAt (try both old and new structures)
      for (let i = 1; i < values.length; i++) { // skip header
        // Check both possible positions for submittedAt
        if (values[i][7] === submittedAt || values[i][8] === submittedAt) {
          const hasNewStructure = values[i][8] === submittedAt;
          const approvalColumn = hasNewStructure ? 'K' : 'J'; // column K (new) vs column J (old)
          
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${approvalColumn}${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[approval]]
            }
          });

          return {
            success: true,
            message: 'Approval updated (legacy mode)',
            row: i + 1,
            hasNewStructure
          };
        }
      }
    }
    
    throw new Error('Row not found for submittedAt: ' + submittedAt);
  } catch (error) {
    console.error('Error updating approval:', error);
    throw error;
  }
}

// Default form submission (prevent duplicates)
export async function submitForm(data) {
  try {
    const {
      driverName,
      thaiDate,
      clockIn,
      clockOut,
      comments,
      env = 'prod'
    } = data;

    const spreadsheetId = getSpreadsheetId(env);
    const submittedAt = getBangkokTime();

    // Check for existing entry
    const existingCheck = await checkExistingEntry(driverName, thaiDate, env);
    
    if (existingCheck.exists) {
      return {
        success: false,
        error: `An entry for driver "${driverName}" on date "${thaiDate}" already exists.`
      };
    }

    // Get the correct monthly sheet name
    const targetSheetName = getSheetNameFromDate(thaiDate);
    
    // Detect sheet structure to determine column positions
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    
    // Append new row - adapt structure based on sheet type
    const newRow = hasNewStructure ? [
      driverName || '',
      thaiDate || '',
      getDayOfWeek(thaiDate || ''), // Day of Week (only for new structure)
      clockIn || '',
      clockOut || '',
      '', // otStart (empty)
      '', // otEnd (empty)
      comments || '',
      submittedAt,
      '' // approval (empty)
    ] : [
      // Old structure without Day of Week column
      driverName || '',
      thaiDate || '',
      clockIn || '',
      clockOut || '',
      '', // otStart (empty)
      '', // otEnd (empty)
      comments || '',
      submittedAt,
      '' // approval (empty)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J'),
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow]
      }
    });

    return {
      success: true,
      message: 'Data saved successfully',
      rowAdded: newRow,
      usedSpreadsheet: spreadsheetId,
      targetSheetName
    };
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
}

// Get row by submittedAt
export async function getRowBySubmittedAt(submittedAt, env = 'prod', thaiDate = null) {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    
    // If thaiDate is provided, use the specific monthly sheet
    if (thaiDate) {
      const targetSheetName = getSheetNameFromDate(thaiDate);
      
      // Detect sheet structure first
      const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
      const range = formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J');
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      
      // Find row by submittedAt (different column index for old vs new structure)
      const submittedAtIndex = hasNewStructure ? 8 : 7; // column I (new) vs column H (old)
      
      for (let i = 1; i < values.length; i++) { // skip header
        if (values[i][submittedAtIndex] === submittedAt) {
          // If old structure, add empty day of week to maintain consistent data structure
          const row = hasNewStructure ? values[i] : [
            values[i][0], // Driver Name
            values[i][1], // Date
            getDayOfWeek(values[i][1] || ''), // Day of Week (calculated for old sheets)
            values[i][2] || '', // Clock In (was C, now D)
            values[i][3] || '', // Clock Out (was D, now E)
            values[i][4] || '', // OT Start (was E, now F)
            values[i][5] || '', // OT End (was F, now G)
            values[i][6] || '', // Comments (was G, now H)
            values[i][7] || '', // Submitted At (was H, now I)
            values[i][8] || '', // OT Hours (was I, now J)
            values[i][9] || ''  // Approval (was J, now K)
          ];
          
          return {
            success: true,
            row: row,
            targetSheetName,
            hasNewStructure
          };
        }
      }
    } else {
      // Fallback: search in the first sheet (legacy behavior)
      const range = 'A:K';
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      
      // Find row by submittedAt (try both old and new structures)
      for (let i = 1; i < values.length; i++) { // skip header
        // Check both possible positions for submittedAt
        if (values[i][7] === submittedAt || values[i][8] === submittedAt) {
          const hasNewStructure = values[i][8] === submittedAt;
          
          // If old structure, add empty day of week to maintain consistent data structure
          const row = hasNewStructure ? values[i] : [
            values[i][0], // Driver Name
            values[i][1], // Date
            getDayOfWeek(values[i][1] || ''), // Day of Week (calculated for old sheets)
            values[i][2] || '', // Clock In (was C, now D)
            values[i][3] || '', // Clock Out (was D, now E)
            values[i][4] || '', // OT Start (was E, now F)
            values[i][5] || '', // OT End (was F, now G)
            values[i][6] || '', // Comments (was G, now H)
            values[i][7] || '', // Submitted At (was H, now I)
            values[i][8] || '', // OT Hours (was I, now J)
            values[i][9] || ''  // Approval (was J, now K)
          ];
          
          return {
            success: true,
            row: row,
            hasNewStructure
          };
        }
      }
    }
    
    return {
      success: false,
      error: 'Row not found'
    };
  } catch (error) {
    console.error('Error getting row by submittedAt:', error);
    throw error;
  }
}

// Get row by driver name and date
export async function getRowByDriverAndDate(driverName, thaiDate, env = 'prod', language = 'en') {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    const targetSheetName = getSheetNameFromDate(thaiDate);
    
    // Detect sheet structure first
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    const range = formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    
    // Find row by driver name and date
    for (let i = 1; i < values.length; i++) { // skip header
      if (values[i][0] === driverName && values[i][1] === thaiDate) { // column A: driverName, column B: thaiDate
        // Ensure we have a consistent structure regardless of sheet type
        const rawRow = values[i];
        
        if (hasNewStructure) {
          // For new structure, ensure we have all 11 columns
          const row = [
            rawRow[0] || '', // Driver Name
            rawRow[1] || '', // Date
            translateDayOfWeek(rawRow[2] || '', language), // Day of Week (translated)
            rawRow[3] || '', // Clock In
            rawRow[4] || '', // Clock Out
            rawRow[5] || '', // OT Start
            rawRow[6] || '', // OT End
            rawRow[7] || '', // Comments
            rawRow[8] || '', // Submitted At
            rawRow[9] || '', // OT Hours
            rawRow[10] || '' // Approval
          ];
          
          console.log(`Google Sheets response:`, {
            success: true,
            row,
            rowIndex: i + 1,
            targetSheetName,
            hasNewStructure
          });
          
          return {
            success: true,
            row,
            rowIndex: i + 1,
            targetSheetName,
            hasNewStructure
          };
        } else {
          // For old structure, add empty day of week to maintain consistent data structure
          const row = [
            rawRow[0] || '', // Driver Name
            rawRow[1] || '', // Date
            translateDayOfWeek(getDayOfWeek(thaiDate), language), // Day of Week (calculated for old sheets, translated)
            rawRow[2] || '', // Clock In (was C, now D)
            rawRow[3] || '', // Clock Out (was D, now E)
            rawRow[4] || '', // OT Start (was E, now F)
            rawRow[5] || '', // OT End (was F, now G)
            rawRow[6] || '', // Comments (was G, now H)
            rawRow[7] || '', // Submitted At (was H, now I)
            rawRow[8] || '', // OT Hours (was I, now J)
            rawRow[9] || ''  // Approval (was J, now K)
          ];
          
          console.log(`Google Sheets response:`, {
            success: true,
            row,
            rowIndex: i + 1,
            targetSheetName,
            hasNewStructure
          });
          
          return {
            success: true,
            row,
            rowIndex: i + 1,
            targetSheetName,
            hasNewStructure
          };
        }
      }
    }
    
    return {
      success: false,
      error: 'Row not found'
    };
  } catch (error) {
    console.error('Error getting row by driver and date:', error);
    throw error;
  }
}

// Update a specific field in Google Sheets
export async function updateField(driverName, thaiDate, field, value, env = 'prod', language = 'en') {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    
    console.log(`🔍 Looking for existing entry: driver="${driverName}", date="${thaiDate}"`);
    
    // First, find the row using the same method as checkExistingEntry
    const existingCheck = await checkExistingEntry(driverName, thaiDate, env);
    
    console.log('Existing check result:', existingCheck);
    
    if (!existingCheck.exists) {
      console.log(`🆕 No existing row found, creating new row for ${driverName} on ${thaiDate}`);
      
      // Create a new row with the field value
      const targetSheetName = getSheetNameFromDate(thaiDate);
      const submittedAt = getBangkokTime();
      
      // Detect sheet structure to determine column positions
      const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
      
      // Create new row with empty values except for the specified field - adapt structure based on sheet type
      const newRow = hasNewStructure ? [
        driverName || '',           // A: Driver Name
        thaiDate || '',            // B: Date
        translateDayOfWeek(getDayOfWeek(thaiDate || ''), language), // C: Day of Week (only for new structure)
        field === 'clockIn' ? value : '',     // D: Clock In
        field === 'clockOut' ? value : '',    // E: Clock Out
        field === 'otStart' ? value : '',     // F: OT Start
        field === 'otEnd' ? value : '',       // G: OT End
        field === 'comments' ? value : '',    // H: Comments
        submittedAt,               // I: Submitted At
        '',                        // J: Calculated OT Hours
        ''                         // K: Approval
      ] : [
        // Old structure without Day of Week column
        driverName || '',           // A: Driver Name
        thaiDate || '',            // B: Date
        field === 'clockIn' ? value : '',     // C: Clock In
        field === 'clockOut' ? value : '',    // D: Clock Out
        field === 'otStart' ? value : '',     // E: OT Start
        field === 'otEnd' ? value : '',       // F: OT End
        field === 'comments' ? value : '',    // G: Comments
        submittedAt,               // H: Submitted At
        '',                        // I: Calculated OT Hours
        ''                         // J: Approval
      ];

      console.log(`📝 Creating new row with ${field}="${value}":`, newRow);

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J'),
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow]
        }
      });

      console.log(`✅ Created new row with ${field}="${value}" for ${driverName} on ${thaiDate}`);
      
      return {
        success: true,
        message: `Created new row with ${field}="${value}"`
      };
    }
    
    // Detect sheet structure to determine correct column positions
    const targetSheetName = getSheetNameFromDate(thaiDate);
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    
    // Map field names to column letters based on sheet structure
    const fieldToColumn = hasNewStructure ? {
      'clockIn': 'D',      // Column D in new structure
      'clockOut': 'E',     // Column E in new structure
      'otStart': 'F',      // Column F in new structure
      'otEnd': 'G',        // Column G in new structure
      'comments': 'H'      // Column H in new structure
    } : {
      'clockIn': 'C',      // Column C in old structure
      'clockOut': 'D',     // Column D in old structure
      'otStart': 'E',      // Column E in old structure
      'otEnd': 'F',        // Column F in old structure
      'comments': 'G'      // Column G in old structure
    };
    
    const column = fieldToColumn[field];
    if (!column) {
      return {
        success: false,
        error: `Invalid field: ${field}`
      };
    }
    
    const range = formatSheetRange(targetSheetName, `${column}${existingCheck.row}`);
    console.log(`📝 Updating range ${range} with value: "${value}"`);
    console.log(`🔍 Sheet structure: ${hasNewStructure ? 'NEW (with Day of Week)' : 'OLD (without Day of Week)'}`);
    console.log(`📍 Field "${field}" mapped to column ${column} for ${hasNewStructure ? 'new' : 'old'} structure`);
    
    // Update the specific cell
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: [[value]]
      }
    });
    
    console.log(`✅ Updated ${field} to "${value}" for ${driverName} on ${thaiDate}`);
    
    return {
      success: true,
      message: `Updated ${field} successfully`
    };
    
  } catch (error) {
    console.error('Error updating field:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create new monthly sheet (dev only)
export async function createMonthlySheet(env = 'dev', force = false, month = null, year = null) {
  try {
    console.log('🔄 Starting monthly sheet creation process...');
    
    // Allow both dev and prod environments when called from dev backend
    if (env !== 'dev' && env !== 'prod') {
      console.log('❌ Monthly sheet creation blocked: Only dev and prod environments allowed');
      return {
        success: false,
        error: 'Monthly sheet creation is only available for dev and prod environments'
      };
    }
    
    const currentDate = new Date();
    const bangkokTime = new Date(currentDate.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    // Use provided month/year or current date
    const targetMonth = month !== null ? month : bangkokTime.getMonth();
    const targetYear = year !== null ? year : bangkokTime.getFullYear();
    
    // Check if it's the first day of the month (skip check if force=true for manual testing)
    if (!force && bangkokTime.getDate() !== 1) {
      console.log('⏰ Not the first day of the month for monthly sheet creation');
      return {
        success: false,
        error: 'Monthly sheet creation only runs on the 1st of each month. Use force=true for manual testing.'
      };
    }
    
    const spreadsheetId = getSpreadsheetId(env);
    
    console.log(`🔧 Environment: ${env}`);
    console.log(`🔧 Spreadsheet ID: ${spreadsheetId}`);
    console.log(`🔧 Using IDs from env: dev=${SPREADSHEET_ID_DEV}, prod=${SPREADSHEET_ID_PROD}`);
    
    // Generate sheet name from provided month/year or current date
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const targetSheetName = `${monthNames[targetMonth]} ${targetYear} Attendance`;
    
    console.log(`📅 Creating new sheet: "${targetSheetName}" in environment: ${env}`);
    
    // Get the current spreadsheet to copy the first row
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ['A1:K1'] // Get header row
    });
    
    // Check if we have data and create fallback header
    let headerRow;
    try {
      if (response.data.sheets && 
          response.data.sheets[0] && 
          response.data.sheets[0].data && 
          response.data.sheets[0].data[0] && 
          response.data.sheets[0].data[0].rowData && 
          response.data.sheets[0].data[0].rowData[0] && 
          response.data.sheets[0].data[0].rowData[0].values) {
        
        headerRow = response.data.sheets[0].data[0].rowData[0].values.map(cell => cell.formattedValue || '');
      } else {
        // Fallback header if no data exists
        headerRow = [
          'Driver Name',
          'Date',
          'Day of Week',
          'Clock In',
          'Clock Out',
          'OT Start',
          'OT End',
          'Comments',
          'Submitted At',
          'OT Hours',
          'Approval'
        ];
      }
    } catch (error) {
      console.log('⚠️ Error reading header row, using fallback:', error.message);
      // Fallback header
      headerRow = [
        'Driver Name',
        'Date',
        'Day of Week',
        'Clock In',
        'Clock Out',
        'OT Start',
        'OT End',
        'Comments',
        'Submitted At',
        'OT Hours',
        'Approval'
      ];
    }
    
    console.log('📋 Header row:', headerRow);
    
    // Get existing sheets info for deletion and formatting
    let existingSheets = null;
    let currentSheet = null;
    
    try {
      existingSheets = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetExists = existingSheets.data.sheets.some(sheet => sheet.properties.title === targetSheetName);
      
      if (sheetExists) {
        console.log(`⚠️ Sheet "${targetSheetName}" already exists, deleting it first...`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteSheet: {
                  sheetId: existingSheets.data.sheets.find(sheet => sheet.properties.title === targetSheetName).properties.sheetId
                }
              }
            ]
          }
        });
        console.log(`🗑️ Deleted existing sheet "${targetSheetName}"`);
      }
      
      // Get the first sheet for formatting reference
      currentSheet = existingSheets.data.sheets[0];
    } catch (error) {
      console.log('⚠️ Error checking/deleting existing sheet:', error.message);
    }
    
    // Create new sheet
    const createResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: targetSheetName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10
                }
              }
            }
          }
        ]
      }
    });
    
    const newSheetId = createResponse.data.replies[0].addSheet.properties.sheetId;
    console.log(`✅ Created new sheet with ID: ${newSheetId}`);
    
        // Get formatting from the current sheet (first sheet)
    let formattingRequests = [];
    try {
      if (currentSheet && currentSheet.data && currentSheet.data[0]) {
        const currentSheetData = currentSheet.data[0];
        
        // Copy cell formatting for first two rows
        if (currentSheetData.rowData && currentSheetData.rowData.length >= 2) {
          const row1Formats = currentSheetData.rowData[0]?.values || [];
          const row2Formats = currentSheetData.rowData[1]?.values || [];
          
          // Copy formatting for row 1 (header)
          row1Formats.forEach((cell, index) => {
            if (cell.userEnteredFormat) {
              formattingRequests.push({
                repeatCell: {
                  range: {
                    sheetId: newSheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: index,
                    endColumnIndex: index + 1
                  },
                  cell: {
                    userEnteredFormat: cell.userEnteredFormat
                  },
                  fields: 'userEnteredFormat'
                }
              });
            }
          });
          
          // Copy formatting for row 2 (data)
          row2Formats.forEach((cell, index) => {
            if (cell.userEnteredFormat) {
              formattingRequests.push({
                repeatCell: {
                  range: {
                    sheetId: newSheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: index,
                    endColumnIndex: index + 1
                  },
                  cell: {
                    userEnteredFormat: cell.userEnteredFormat
                  },
                  fields: 'userEnteredFormat'
                }
              });
            }
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Error getting formatting from current sheet:', error.message);
    }
    
    // Copy header row to new sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: formatSheetRange(targetSheetName, 'A1:K1'),
      valueInputOption: 'RAW',
      resource: {
        values: [headerRow]
      }
    });
    
    console.log('📋 Copied header row to new sheet');
    
    // Apply formatting if we have any
    if (formattingRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: formattingRequests
        }
      });
      console.log('🎨 Applied cell formatting from previous sheet');
    }
    
    // Copy row heights and other formatting using copyPaste
    try {
      if (currentSheet) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                copyPaste: {
                  source: {
                    sheetId: currentSheet.properties.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: 10
                  },
                  destination: {
                    sheetId: newSheetId,
                    startRowIndex: 0,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: 10
                  },
                  pasteType: 'PASTE_FORMAT',
                  pasteOrientation: 'NORMAL'
                }
              }
            ]
          }
        });
        console.log('📏 Copied row heights and formatting from previous sheet');
      }
    } catch (error) {
      console.log('⚠️ Error copying row heights:', error.message);
    }
    
    // Add test driver data in second row
    const testData = [
      'Test Driver',
      bangkokTime.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }),
      '08:00',
      '17:00',
      '',
      '',
      'Monthly sheet creation test entry',
      bangkokTime.toLocaleString('en-US', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      '',
      'AUTO'
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: formatSheetRange(targetSheetName, 'A2:J2'),
      valueInputOption: 'RAW',
      resource: {
        values: [testData]
      }
    });
    
    console.log('🧪 Added test driver data');
    
    // Send LINE notification
    const message = `📅 NEW MONTHLY SHEET CREATED\n\n📊 Sheet: ${targetSheetName}\n📅 Date: ${bangkokTime.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}\n🕐 Time: ${bangkokTime.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}\n\n✅ Header row copied from previous sheet\n🧪 Test entry added for verification\n\n📄 View in Google Sheets:\nhttps://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    // Send notification to LINE (optional - don't fail if this doesn't work)
    try {
      const lineResponse = await fetch(`${process.env.BACKEND_URL || 'https://liff-ot-app-positive.herokuapp.com'}/notify-line`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          env
        })
      });
      
      if (lineResponse.ok) {
        console.log('📱 LINE notification sent successfully');
      } else {
        console.log('⚠️ Failed to send LINE notification');
      }
    } catch (error) {
      console.log('⚠️ LINE notification failed (continuing anyway):', error.message);
    }
    
    return {
      success: true,
      message: `Monthly sheet "${targetSheetName}" created successfully`,
      targetSheetName,
      testData
    };
    
  } catch (error) {
    console.error('❌ Error creating monthly sheet:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main handler function
export async function handleGoogleSheetsRequest(data) {
  try {
    console.log('Received data:', JSON.stringify(data));
    
    const { action, env = 'prod' } = data;
    
    switch (action) {
      case 'checkExisting':
        return await checkExistingEntry(data.driverName, data.thaiDate, env);
        
      case 'submitWithClockTimes':
        return await submitWithClockTimes(data);
        
      case 'clockEvent':
        return await handleClockEvent(data);
        
      case 'approveMostRecent':
        return await approveMostRecent(env, data.thaiDate);
        
      case 'updateApproval':
        return await updateApproval(data.submittedAt, data.approval, env, data.thaiDate);
        
      case 'getRowBySubmittedAt':
        return await getRowBySubmittedAt(data.submittedAt, env, data.thaiDate);
        
      case 'getRowByDriverAndDate':
        return await getRowByDriverAndDate(data.driverName, data.thaiDate, env, data.language || 'en');
        
      case 'updateField':
        return await updateField(data.driverName, data.thaiDate, data.field, data.value, env, data.language || 'en');
        
      case 'createMonthlySheet':
        return await createMonthlySheet(env);
        
      case 'submit':
      default:
        return await submitForm(data);
    }
  } catch (error) {
    console.error('Error in handleGoogleSheetsRequest:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Manual OT calculation function (development only)
export async function calculateOTManually(driverName, thaiDate, clockIn, clockOut, env = 'dev') {
  try {
    console.log(`🧮 Manual OT calculation for ${driverName} on ${thaiDate}`);
    console.log(`⏰ Clock In: ${clockIn}, Clock Out: ${clockOut}`);
    console.log(`📅 Thai Date being checked: "${thaiDate}"`);
    
    // Check business rule: No OT calculation from 25th to end of month
    const isAllowed = isOTCalculationAllowed(thaiDate);
    console.log(`🔍 Business rule check result: ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
    
    if (!isAllowed) {
      console.log(`🚫 OT calculation skipped due to business rule: Date ${thaiDate} is on or after 25th of month`);
      return {
        success: true,
        message: 'OT calculation disabled due to end-of-month rule',
        otStart: '',
        otEnd: '',
        otHours: '0.00',
        morningOTHours: 0,
        eveningOTHours: 0,
        totalOTHours: 0,
        businessRule: 'disabled'
      };
    }
    
    const clockInTimeObj = new Date(`2000-01-01T${clockIn}:00`);
    const clockOutTimeObj = new Date(`2000-01-01T${clockOut}:00`);
    const morningOTEndTimeObj = new Date(`2000-01-01T08:00:00`);
    const eveningOTStartTimeObj = new Date(`2000-01-01T17:00:00`);
    
    let morningOTHours = 0;
    let eveningOTHours = 0;
    let totalOTHours = 0;
    let otStartTime = '';
    let otEndTime = '';
    
    // Calculate early morning OT (if clock in before 8:00 AM)
    if (clockInTimeObj < morningOTEndTimeObj) {
      const morningDiffMs = morningOTEndTimeObj.getTime() - clockInTimeObj.getTime();
      morningOTHours = morningDiffMs / (1000 * 60 * 60);
      console.log(`🌅 Early morning OT: Clock in ${clockIn} to 08:00 = ${morningOTHours.toFixed(2)} hours`);
    }
    
    // Calculate evening OT (if clock out after 17:00 PM)
    if (clockOutTimeObj > eveningOTStartTimeObj) {
      const eveningDiffMs = clockOutTimeObj.getTime() - eveningOTStartTimeObj.getTime();
      eveningOTHours = eveningDiffMs / (1000 * 60 * 60);
      console.log(`🌆 Evening OT: 17:00 to clock out ${clockOut} = ${eveningOTHours.toFixed(2)} hours`);
    }
    
    // Calculate total OT hours
    totalOTHours = morningOTHours + eveningOTHours;
    
    if (totalOTHours > 0) {
      // Set OT start and end times based on what OT periods exist
      if (morningOTHours > 0 && eveningOTHours > 0) {
        // Both morning and evening OT
        otStartTime = clockIn; // Start from actual clock in time
        otEndTime = clockOut; // End at actual clock out time
        console.log(`🕐 Combined OT: Morning ${morningOTHours.toFixed(2)}h + Evening ${eveningOTHours.toFixed(2)}h = ${totalOTHours.toFixed(2)}h total`);
      } else if (morningOTHours > 0) {
        // Only morning OT
        otStartTime = clockIn;
        otEndTime = '08:00';
        console.log(`🌅 Morning OT only: ${morningOTHours.toFixed(2)} hours`);
      } else if (eveningOTHours > 0) {
        // Only evening OT
        otStartTime = '17:00';
        otEndTime = clockOut;
        console.log(`🌆 Evening OT only: ${eveningOTHours.toFixed(2)} hours`);
      }
      
      console.log(`🧮 Total OT calculation: ${totalOTHours.toFixed(2)} hours (Start: ${otStartTime}, End: ${otEndTime})`);
      
      return {
        success: true,
        message: 'OT calculation completed successfully',
        otStart: otStartTime,
        otEnd: otEndTime,
        otHours: totalOTHours.toFixed(2),
        morningOTHours: morningOTHours.toFixed(2),
        eveningOTHours: eveningOTHours.toFixed(2),
        totalOTHours: totalOTHours.toFixed(2),
        businessRule: 'enabled',
        calculation: {
          clockIn,
          clockOut,
          morningOTPeriod: morningOTHours > 0 ? `${clockIn} → 08:00` : 'N/A',
          eveningOTPeriod: eveningOTHours > 0 ? `17:00 → ${clockOut}` : 'N/A',
          totalOTPeriod: `${otStartTime} → ${otEndTime}`
        }
      };
    } else {
      console.log(`❌ No OT hours: Clock in ${clockIn} and clock out ${clockOut} are within standard hours`);
      
      return {
        success: true,
        message: 'No OT hours calculated - times are within standard hours',
        otStart: '',
        otEnd: '',
        otHours: '0.00',
        morningOTHours: '0.00',
        eveningOTHours: '0.00',
        totalOTHours: '0.00',
        businessRule: 'enabled',
        calculation: {
          clockIn,
          clockOut,
          morningOTPeriod: 'N/A',
          eveningOTPeriod: 'N/A',
          totalOTPeriod: 'N/A'
        }
      };
    }
  } catch (error) {
    console.error('Error in manual OT calculation:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Read row data and update OT Hours column
export async function readRowAndUpdateOT(driverName, thaiDate, env = 'dev') {
  try {
    console.log(`📖 Reading row data for ${driverName} on ${thaiDate} in ${env} environment`);
    
    const spreadsheetId = getSpreadsheetId(env);
    const targetSheetName = getSheetNameFromDate(thaiDate);
    
    // Detect sheet structure to determine column positions
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    
    // Get the row data
    const rowData = await getRowByDriverAndDate(driverName, thaiDate, env);
    
    if (!rowData.success) {
      return {
        success: false,
        error: `Row not found for driver "${driverName}" on date "${thaiDate}"`
      };
    }
    
    const row = rowData.row;
    console.log(`📊 Found row data:`, row);
    
    // Extract clock-in and clock-out times
    const clockIn = hasNewStructure ? row[3] : row[2]; // Column D (new) or C (old)
    const clockOut = hasNewStructure ? row[4] : row[3]; // Column E (new) or D (old)
    
    console.log(`⏰ Clock In: ${clockIn}, Clock Out: ${clockOut}`);
    
    if (!clockIn || !clockOut) {
      return {
        success: false,
        error: `Missing clock-in or clock-out data. Clock In: "${clockIn}", Clock Out: "${clockOut}"`
      };
    }
    
    // Calculate OT using the same logic as manual calculation
    const otResult = await calculateOTManually(driverName, thaiDate, clockIn, clockOut, env);
    
    if (!otResult.success) {
      return {
        success: false,
        error: `OT calculation failed: ${otResult.error}`
      };
    }
    
    // Update the OT Hours column (Column J in new structure, Column I in old structure)
    const otHoursCol = hasNewStructure ? 'J' : 'I';
    const range = formatSheetRange(targetSheetName, `${otHoursCol}${rowData.rowIndex}`);
    
    console.log(`📝 Updating OT Hours column ${otHoursCol} at row ${rowData.rowIndex} with value: ${otResult.totalOTHours}`);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: [[otResult.totalOTHours]]
      }
    });
    
    console.log(`✅ Successfully updated OT Hours to ${otResult.totalOTHours} hours`);
    
    return {
      success: true,
      message: `Successfully updated OT Hours for ${driverName} on ${thaiDate}`,
      rowIndex: rowData.rowIndex,
      targetSheetName,
      clockIn,
      clockOut,
      calculatedOT: {
        totalOTHours: otResult.totalOTHours,
        morningOTHours: otResult.morningOTHours,
        eveningOTHours: otResult.eveningOTHours,
        otPeriod: otResult.calculation?.totalOTPeriod,
        businessRule: otResult.businessRule
      },
      updatedColumn: otHoursCol
    };
    
  } catch (error) {
    console.error('Error reading row and updating OT:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Read row data by row number and update OT Hours column
export async function readRowAndUpdateOTByRowNumber(rowNumber, thaiDate, env = 'dev', sheetName = null) {
  try {
    console.log(`📖 Reading row ${rowNumber} data for date ${thaiDate} in ${env} environment`);
    
    const spreadsheetId = getSpreadsheetId(env);
    const targetSheetName = sheetName || getSheetNameFromDate(thaiDate);
    
    // Detect sheet structure to determine column positions
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    
    // Get the row data by row number
    const range = formatSheetRange(targetSheetName, hasNewStructure ? `A${rowNumber}:K${rowNumber}` : `A${rowNumber}:J${rowNumber}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values;
    
    if (!values || values.length === 0) {
      return {
        success: false,
        error: `Row ${rowNumber} not found in sheet "${targetSheetName}"`
      };
    }
    
    const row = values[0];
    console.log(`📊 Found row ${rowNumber} data:`, row);
    
    // Extract driver name, clock-in and clock-out times
    const driverName = row[0] || '';
    const clockIn = hasNewStructure ? (row[3] || '') : (row[2] || ''); // Column D (new) or C (old)
    const clockOut = hasNewStructure ? (row[4] || '') : (row[3] || ''); // Column E (new) or D (old)
    
    console.log(`👤 Driver: ${driverName}, ⏰ Clock In: ${clockIn}, Clock Out: ${clockOut}`);
    
    if (!driverName) {
      return {
        success: false,
        error: `Row ${rowNumber} has no driver name`
      };
    }
    
    if (!clockIn || !clockOut) {
      return {
        success: false,
        error: `Row ${rowNumber} is missing clock-in or clock-out data. Clock In: "${clockIn}", Clock Out: "${clockOut}"`
      };
    }
    
    // Calculate OT using the same logic as manual calculation
    const otResult = await calculateOTManually(driverName, thaiDate, clockIn, clockOut, env);
    
    if (!otResult.success) {
      return {
        success: false,
        error: `OT calculation failed: ${otResult.error}`
      };
    }
    
    // Update the OT Hours column (Column J in new structure, Column I in old structure)
    const otHoursCol = hasNewStructure ? 'J' : 'I';
    const updateRange = formatSheetRange(targetSheetName, `${otHoursCol}${rowNumber}`);
    
    console.log(`📝 Updating OT Hours column ${otHoursCol} at row ${rowNumber} with value: ${otResult.totalOTHours}`);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      resource: {
        values: [[otResult.totalOTHours]]
      }
    });
    
    console.log(`✅ Successfully updated OT Hours to ${otResult.totalOTHours} hours`);
    
    return {
      success: true,
      message: `Successfully updated OT Hours for row ${rowNumber}`,
      rowNumber: parseInt(rowNumber),
      targetSheetName,
      driverName,
      clockIn,
      clockOut,
      calculatedOT: {
        totalOTHours: otResult.totalOTHours,
        morningOTHours: otResult.morningOTHours,
        eveningOTHours: otResult.eveningOTHours,
        otPeriod: otResult.calculation?.totalOTPeriod,
        businessRule: otResult.businessRule
      },
      updatedColumn: otHoursCol
    };
    
  } catch (error) {
    console.error('Error reading row by number and updating OT:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Get available sheets for OT calculation
export async function getAvailableSheetsForOT(env = 'dev') {
  try {
    console.log(`📋 Getting available sheets for OT calculation in ${env} environment`);
    
    const spreadsheetId = getSpreadsheetId(env);
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheets = response.data.sheets || [];
    const availableSheets = sheets
      .filter(sheet => sheet.properties.title && !sheet.properties.title.includes('Template'))
      .map(sheet => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId,
        rowCount: sheet.properties.gridProperties?.rowCount || 0,
        columnCount: sheet.properties.gridProperties?.columnCount || 0
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    console.log(`📋 Found ${availableSheets.length} available sheets:`, availableSheets.map(s => s.title));

    return {
      success: true,
      sheets: availableSheets,
      count: availableSheets.length
    };
    
  } catch (error) {
    console.error('Error getting available sheets for OT:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Update OT Hours column directly without re-reading data
export async function updateOTHoursDirectly(sheetName, rowNumber, otHours, env = 'dev') {
  try {
    console.log(`📝 Updating OT Hours to ${otHours} for row ${rowNumber} in sheet "${sheetName}" (${env})`);
    
    const spreadsheetId = getSpreadsheetId(env);
    
    // Detect sheet structure to determine column positions
    const hasNewStructure = await detectSheetStructure(spreadsheetId, sheetName);
    
    // Update the OT Hours column (Column J in new structure, Column I in old structure)
    const otHoursCol = hasNewStructure ? 'J' : 'I';
    const updateRange = formatSheetRange(sheetName, `${otHoursCol}${rowNumber}`);
    
    console.log(`📝 Updating OT Hours column ${otHoursCol} at row ${rowNumber} with value: ${otHours}`);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      resource: {
        values: [[otHours]]
      }
    });
    
    console.log(`✅ Successfully updated OT Hours to ${otHours} hours`);
    
    return {
      success: true,
      message: `Successfully updated OT Hours to ${otHours} hours`,
      rowNumber: parseInt(rowNumber),
      sheetName,
      otHours,
      updatedColumn: otHoursCol
    };
    
  } catch (error) {
    console.error('Error updating OT hours directly:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

// Read row data for auto-population
export async function readRowDataForOT(targetSheetName, rowNumber, env = 'dev') {
  try {
    console.log(`📖 Reading row ${rowNumber} data from sheet "${targetSheetName}" in ${env} environment`);
    
    const spreadsheetId = getSpreadsheetId(env);
    
    // Detect sheet structure to determine column positions
    const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
    
    // Get the row data by row number
    const range = formatSheetRange(targetSheetName, hasNewStructure ? `A${rowNumber}:K${rowNumber}` : `A${rowNumber}:J${rowNumber}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values;
    
    if (!values || values.length === 0) {
      return {
        success: false,
        error: `Row ${rowNumber} not found in sheet "${targetSheetName}"`
      };
    }
    
    const row = values[0];
    console.log(`📊 Found row ${rowNumber} data:`, row);
    
    // Extract data based on sheet structure
    const driverName = row[0] || '';
    const thaiDate = row[1] || ''; // Column B - Thai date
    const clockIn = hasNewStructure ? (row[3] || '') : (row[2] || ''); // Column D (new) or C (old)
    const clockOut = hasNewStructure ? (row[4] || '') : (row[3] || ''); // Column E (new) or D (old)
    
    console.log(`🔍 Sheet structure: ${hasNewStructure ? 'NEW' : 'OLD'}`);
    console.log(`📊 Raw row data:`, row);
    console.log(`📊 Row length: ${row.length}`);
    console.log(`👤 Driver: ${driverName}, 📅 Date: ${thaiDate}, ⏰ Clock In: "${clockIn}", Clock Out: "${clockOut}"`);
    
    // Convert time format if needed (handle various formats)
    const formatTime = (timeValue) => {
      if (!timeValue) return '';
      
      // Handle numeric time values (Google Sheets stores times as decimals)
      if (typeof timeValue === 'number') {
        const totalMinutes = Math.round(timeValue * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      const timeStr = String(timeValue).trim();
      
      // If it's already in HH:MM format, ensure proper padding
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [hours, minutes] = timeStr.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      
      // If it's in "H:MM AM/PM" format, convert to 24-hour
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let [, hours, minutes, period] = timeMatch;
        hours = parseInt(hours);
        
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      
      console.log(`⚠️ Could not parse time value: "${timeValue}" (type: ${typeof timeValue})`);
      return timeStr; // Return as-is if we can't parse it
    };
    
    const formattedClockIn = formatTime(clockIn);
    const formattedClockOut = formatTime(clockOut);
    
    console.log(`🕐 Formatted Clock In: "${formattedClockIn}", Clock Out: "${formattedClockOut}"`);
    
    return {
      success: true,
      rowNumber: parseInt(rowNumber),
      targetSheetName,
      data: {
        driverName,
        thaiDate,
        clockIn: formattedClockIn,
        clockOut: formattedClockOut
      },
      hasNewStructure,
      message: `Successfully read row ${rowNumber} data`
    };
    
  } catch (error) {
    console.error('Error reading row data for OT:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}