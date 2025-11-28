import { google } from 'googleapis';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from .env.local only if file exists (local development)
// On Heroku/production, environment variables are set directly in the platform
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (process.env.NODE_ENV !== 'production') {
  // Try loading default .env file for local development
  dotenv.config();
}

// Google Sheets API setup
// Priority: GOOGLE_SERVICE_ACCOUNT_KEY (base64 env var) > GOOGLE_SERVICE_ACCOUNT_KEY_FILE > google-credentials.json
const auth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString())
    : undefined,
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || (existsSync('./google-credentials.json') ? './google-credentials.json' : undefined),
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
// Note: Currently unused but kept for potential future use
function _FORMAT_BANGKOK_DATE(date) {
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

// Check if entry exists in Google Sheets (optimized - now uses checkAndGetRowByDriverAndDate)
// Original implementation removed - see checkAndGetRowByDriverAndDate for the optimized version

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

    console.log(`📝 submitWithClockTimes called for ${env} environment`);
    console.log(`📝 Driver: ${driverName}, Date: ${thaiDate}, Clock In: ${clockIn}, Clock Out: ${clockOut}`);

    const spreadsheetId = getSpreadsheetId(env);
    if (!spreadsheetId) {
      console.error(`❌ No spreadsheet ID found for ${env} environment`);
      return {
        success: false,
        error: `No spreadsheet ID configured for ${env} environment`
      };
    }
    console.log(`📊 Using spreadsheet ID: ${spreadsheetId} for ${env} environment`);

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

    // For manual tests, use the provided targetSheetName; otherwise calculate from date
    const targetSheetName = data.targetSheetName || getSheetNameFromDate(thaiDate);

    console.log(`📊 Using sheet: "${targetSheetName}" (${data.targetSheetName ? 'manually specified' : 'calculated from date'})`);

    // Check for existing entry (pass targetSheetName for manual tests)
    const existingCheck = await checkExistingEntry(driverName, thaiDate, env, targetSheetName);

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

      console.log(`📝 Appending new row to sheet "${targetSheetName}" in ${env} environment`);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J'),
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow]
        }
      });

      console.log(`✅ Successfully appended row to sheet "${targetSheetName}"`);

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

    // Optimized: Use checkAndGetRowByDriverAndDate to get row data AND existence in one call
    const rowCheck = await checkAndGetRowByDriverAndDate(driverName, thaiDate, env, language);
    const targetSheetName = rowCheck.targetSheetName || getSheetNameFromDate(thaiDate);
    const hasNewStructure = rowCheck.hasNewStructure || false;

    if (rowCheck.exists && rowCheck.row) {
      // We already have the row data, so no need to fetch it again!
      const rowData = rowCheck.row;
      const rowIndex = rowCheck.rowIndex;

      // Extract clock in time from existing row data
      const clockInTime = hasNewStructure ? rowData[3] : rowData[2]; // Column D for new structure, C for old
      const currentClockOutTime = hasNewStructure ? rowData[4] : rowData[3]; // Column E for new structure, D for old
      const clockOutTime = type === 'clockOut' ? timestamp : currentClockOutTime;

      console.log(`📊 Row data: Clock In=${clockInTime}, Clock Out=${clockOutTime}`);

      // Prepare all updates in a single batch
      const updates = [];

      // Update clock in or clock out
      const timeColumn = type === 'clockIn' ? (hasNewStructure ? 'D' : 'C') : (hasNewStructure ? 'E' : 'D');
      updates.push({
        range: formatSheetRange(targetSheetName, `${timeColumn}${rowIndex}`),
        values: [[timestamp]]
      });

      // Calculate OT hours if clocking out
      if (type === 'clockOut' && clockOutTime) {
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

            // Add OT updates to batch
            const otStartCol = hasNewStructure ? 'F' : 'E';
            const otEndCol = hasNewStructure ? 'G' : 'F';
            const otHoursCol = hasNewStructure ? 'J' : 'I';

            updates.push(
              { range: formatSheetRange(targetSheetName, `${otStartCol}${rowIndex}`), values: [[otStart]] },
              { range: formatSheetRange(targetSheetName, `${otEndCol}${rowIndex}`), values: [[otEnd]] },
              { range: formatSheetRange(targetSheetName, `${otHoursCol}${rowIndex}`), values: [[otHours]] }
            );
          } else {
            console.log(`❌ No OT hours: Clock in ${clockInTime} and clock out ${clockOutTime} are within standard hours`);
          }
        }
      }

      // Add comments update if provided
      if (comments) {
        const commentsCol = hasNewStructure ? 'H' : 'G';
        updates.push({
          range: formatSheetRange(targetSheetName, `${commentsCol}${rowIndex}`),
          values: [[comments]]
        });
      }

      // Update Submitted At timestamp only for clock-in events (not clock-out)
      if (type === 'clockIn') {
        const submittedAtCol = hasNewStructure ? 'I' : 'H';
        updates.push({
          range: formatSheetRange(targetSheetName, `${submittedAtCol}${rowIndex}`),
          values: [[submittedAt]]
        });
      }

      // Execute all updates in a single batch call
      if (updates.length > 0) {
        console.log(`📝 Batch updating ${updates.length} cells`);
        try {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
              valueInputOption: 'RAW',
              data: updates
            }
          });
          console.log(`✅ Batch update completed successfully`);
        } catch (error) {
          console.error(`❌ Error in batch update:`, error);
          throw error;
        }
      }

      return {
        success: true,
        message: 'Clock event updated in existing row',
        row: rowIndex,
        updatedColumn: timeColumn,
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

      // Detect sheet structure first
      const hasNewStructure = await detectSheetStructure(spreadsheetId, targetSheetName);
      const range = formatSheetRange(targetSheetName, hasNewStructure ? 'A:K' : 'A:J');
      const approvalColumnIndex = hasNewStructure ? 10 : 9; // column K (index 10) for new, column J (index 9) for old
      const approvalColumn = hasNewStructure ? 'K' : 'J';

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];

      // Find most recent unapproved request
      for (let i = values.length - 1; i > 0; i--) { // start from last row, skip header
        if (!values[i][approvalColumnIndex]) { // Check correct approval column based on structure
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: formatSheetRange(targetSheetName, `${approvalColumn}${i + 1}`),
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Approve']]
            }
          });

          return {
            success: true,
            message: 'Most recent approval updated',
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

      // Find most recent unapproved request (check both structures)
      for (let i = values.length - 1; i > 0; i--) { // start from last row, skip header
        // Detect structure: if column I (index 8) looks like a timestamp, it's NEW structure
        const hasNewStructure = values[i][8] && values[i][8].includes('/') && values[i][8].includes(':');
        const approvalColumnIndex = hasNewStructure ? 10 : 9; // column K (index 10) for new, column J (index 9) for old
        const approvalColumn = hasNewStructure ? 'K' : 'J';

        if (!values[i][approvalColumnIndex]) { // Check correct approval column based on structure
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${approvalColumn}${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Approve']]
            }
          });

          return {
            success: true,
            message: 'Most recent approval updated (legacy mode)',
            row: i + 1,
            hasNewStructure
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

// Optimized: Check if entry exists AND get row data in one call
// This replaces the two-call pattern (checkExisting + getRowByDriverAndDate)
export async function checkAndGetRowByDriverAndDate(driverName, thaiDate, env = 'prod', language = 'en', targetSheetName = null) {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    // Use provided targetSheetName (for manual tests) or calculate from date
    const sheetName = targetSheetName || getSheetNameFromDate(thaiDate);

    // Detect sheet structure (1 API call)
    const hasNewStructure = await detectSheetStructure(spreadsheetId, sheetName);
    const range = formatSheetRange(sheetName, hasNewStructure ? 'A:K' : 'A:J');

    // Get all data in one call (1 API call)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    // Find row by driver name and date
    for (let i = 1; i < values.length; i++) { // skip header
      if (values[i][0] === driverName && values[i][1] === thaiDate) { // column A: driverName, column B: thaiDate
        // Found it! Return both existence check and row data
        const rawRow = values[i];

        if (hasNewStructure) {
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

          return {
            success: true,
            exists: true,
            row,
            rowIndex: i + 1,
            targetSheetName: sheetName,
            hasNewStructure
          };
        } else {
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

          return {
            success: true,
            exists: true,
            row,
            rowIndex: i + 1,
            targetSheetName: sheetName,
            hasNewStructure
          };
        }
      }
    }

    // Not found
    return {
      success: true,
      exists: false,
      row: null,
      error: 'Row not found',
      targetSheetName: sheetName,  // ✅ Include sheet name
      hasNewStructure              // ✅ Include structure detection result
    };
  } catch (error) {
    console.error('Error checking and getting row by driver and date:', error);

    // Try to get basic info even on error
    const spreadsheetId = getSpreadsheetId(env);
    const sheetName = targetSheetName || getSheetNameFromDate(thaiDate);
    let hasNewStructure = false;
    try {
      hasNewStructure = await detectSheetStructure(spreadsheetId, sheetName);
    } catch (detectError) {
      console.error('Error detecting structure on error path:', detectError.message);
    }

    return {
      success: false,
      exists: false,
      error: error.message,
      targetSheetName: sheetName,  // ✅ Include sheet name
      hasNewStructure              // ✅ Include structure detection result
    };
  }
}

// Get row by driver name and date (kept for backwards compatibility)
export async function getRowByDriverAndDate(driverName, thaiDate, env = 'prod', language = 'en') {
  const result = await checkAndGetRowByDriverAndDate(driverName, thaiDate, env, language);

  if (result.exists && result.row) {
    return {
      success: true,
      row: result.row,
      rowIndex: result.rowIndex,
      targetSheetName: result.targetSheetName,
      hasNewStructure: result.hasNewStructure
    };
  }

  return {
    success: false,
    error: result.error || 'Row not found'
  };
}

// Legacy function - now optimized to use checkAndGetRowByDriverAndDate
export async function checkExistingEntry(driverName, thaiDate, env = 'prod', targetSheetName = null) {
  const result = await checkAndGetRowByDriverAndDate(driverName, thaiDate, env, 'en', targetSheetName);

  return {
    success: result.success,
    exists: result.exists || false,
    row: result.exists ? result.rowIndex : undefined
  };
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
                  columnCount: 11  // Updated from 10 to 11 to match NEW structure (A-K)
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
                    endColumnIndex: 11  // Fixed: Changed from 10 to 11 to match NEW structure (A-K = 11 columns)
                  },
                  destination: {
                    sheetId: newSheetId,
                    startRowIndex: 0,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: 11  // Fixed: Changed from 10 to 11 to match NEW structure (A-K = 11 columns)
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
    const testDate = bangkokTime.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' });
    const testData = [
      'Test Driver',                  // Column A: Driver Name
      testDate,                       // Column B: Date
      translateDayOfWeek(getDayOfWeek(testDate), 'en'),  // Column C: Day of Week (FIXED: Added missing column)
      '08:00',                        // Column D: Clock In
      '17:00',                        // Column E: Clock Out
      '',                             // Column F: OT Start
      '',                             // Column G: OT End
      'Monthly sheet creation test entry',  // Column H: Comments
      bangkokTime.toLocaleString('en-US', { // Column I: Submitted At
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      '',                             // Column J: OT Hours
      'AUTO'                          // Column K: Approval
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: formatSheetRange(targetSheetName, 'A2:K2'),  // Fixed: Changed from A2:J2 to A2:K2 for NEW structure (11 columns)
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
      const lineResponse = await fetch(`${process.env.BACKEND_URL || 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com'}/notify-line`, {
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
        // Optimized: Use combined function that checks AND gets data
        return await checkAndGetRowByDriverAndDate(data.driverName, data.thaiDate, env, data.language || 'en');

      case 'checkAndGetRow':
        // New optimized endpoint that does both operations
        return await checkAndGetRowByDriverAndDate(data.driverName, data.thaiDate, env, data.language || 'en');

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
// eslint-disable-next-line no-unused-vars
export async function calculateOTManually(driverName, thaiDate, clockIn, clockOut, _env = 'dev') {
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

// Read login history data from Google Sheets
// Assumes a sheet named "Login History" or "Logins" with columns:
// Username, Login Date/Time, Status, IP Address, User Agent, etc.
export async function readLoginHistoryFromSheet(env = 'prod', sheetName = 'Login History') {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    console.log(`📖 Reading login history from sheet "${sheetName}" in ${env} environment`);

    // Try to get all data from the login sheet
    const range = formatSheetRange(sheetName, 'A:Z'); // Read all columns

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    if (!values || values.length === 0) {
      return {
        success: false,
        error: `No data found in sheet "${sheetName}"`
      };
    }

    // First row is header - try to detect column positions
    const headers = values[0].map(h => h?.toLowerCase() || '');
    const usernameIndex = headers.findIndex(h => h.includes('username') || h.includes('user') || h.includes('identifier'));
    const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('login') || h.includes('attempt'));
    const statusIndex = headers.findIndex(h => h.includes('status') || h.includes('success') || h.includes('failed'));
    const ipIndex = headers.findIndex(h => h.includes('ip') || h.includes('address'));
    const userAgentIndex = headers.findIndex(h => (h.includes('user') && h.includes('agent')) || h.includes('browser') || h.includes('device'));
    const rememberMeIndex = headers.findIndex(h => h.includes('remember') || h.includes('rememberme'));
    const failureReasonIndex = headers.findIndex(h => h.includes('reason') || h.includes('error') || h.includes('failure'));

    console.log(`📊 Detected columns:`, {
      username: usernameIndex >= 0 ? headers[usernameIndex] : 'not found',
      date: dateIndex >= 0 ? headers[dateIndex] : 'not found',
      status: statusIndex >= 0 ? headers[statusIndex] : 'not found',
      ip: ipIndex >= 0 ? headers[ipIndex] : 'not found',
      userAgent: userAgentIndex >= 0 ? headers[userAgentIndex] : 'not found'
    });

    if (usernameIndex < 0 || dateIndex < 0) {
      return {
        success: false,
        error: `Required columns not found. Need: Username/User, Login Date/Time`
      };
    }

    // Parse rows into login records
    const loginRecords = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row || row.length === 0) continue;

      const username = row[usernameIndex]?.trim() || '';
      const dateTime = row[dateIndex]?.trim() || '';
      const status = statusIndex >= 0 ? (row[statusIndex]?.trim() || 'success') : 'success';
      const ipAddress = ipIndex >= 0 ? (row[ipIndex]?.trim() || '') : '';
      const userAgent = userAgentIndex >= 0 ? (row[userAgentIndex]?.trim() || '') : '';
      const rememberMe = rememberMeIndex >= 0 ? (row[rememberMeIndex]?.toLowerCase() === 'true' || row[rememberMeIndex]?.toLowerCase() === 'yes') : false;
      const failureReason = failureReasonIndex >= 0 ? (row[failureReasonIndex]?.trim() || '') : '';

      if (!username || !dateTime) continue; // Skip rows without required data

      // Parse date/time - try various formats
      let loginDate;
      try {
        // Try ISO format first
        loginDate = new Date(dateTime);
        if (isNaN(loginDate.getTime())) {
          // Try other formats
          loginDate = new Date(dateTime.replace(/\//g, '-'));
        }
        if (isNaN(loginDate.getTime())) {
          console.warn(`⚠️ Could not parse date: ${dateTime}`);
          continue;
        }
      } catch (e) {
        console.warn(`⚠️ Error parsing date: ${dateTime}`, e);
        continue;
      }

      loginRecords.push({
        username,
        loginAttemptAt: loginDate.toISOString(),
        loginStatus: status.toLowerCase().includes('fail') ? 'failed' : (status.toLowerCase().includes('block') ? 'blocked' : 'success'),
        ipAddress,
        userAgent,
        rememberMe,
        failureReason: status.toLowerCase().includes('fail') ? (failureReason || 'Invalid credentials') : '',
        deviceInfo: userAgent ? {
          browser: userAgent,
          platform: 'unknown'
        } : null
      });
    }

    console.log(`✅ Parsed ${loginRecords.length} login records from sheet`);

    return {
      success: true,
      records: loginRecords,
      total: loginRecords.length
    };
  } catch (error) {
    console.error('Error reading login history from Google Sheets:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get last clock-ins for multiple drivers efficiently (batch operation)
// This is much more efficient than calling getLastClockInForDriver for each driver
// eslint-disable-next-line no-unused-vars
export async function getLastClockInsForDrivers(driverNames, env = 'prod', _maxSheetsToCheck = 3) {
  try {
    const spreadsheetId = getSpreadsheetId(env);
    console.log(`📖 Getting last clock-ins for ${driverNames.length} drivers from Google Sheets`);
    console.log(`📖 Driver names to search:`, driverNames);

    // Get all sheet names once (1 API call)
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const allSheetNames = spreadsheet.data.sheets
      .map(sheet => sheet.properties.title)
      .sort()
      .reverse(); // Most recent first

    console.log(`📊 All available sheets:`, allSheetNames);

    // Only check the most recent sheet for faster performance
    const sheetNames = allSheetNames.slice(0, 1); // Only check the latest sheet
    if (sheetNames.length === 0) {
      console.error(`❌ No sheets found in spreadsheet`);
      return {};
    }
    console.log(`📊 Checking latest sheet:`, sheetNames[0]);

    const results = {};
    driverNames.forEach(name => {
      results[name] = { success: false, date: null, time: null, dateTimestamp: null };
    });

    // Helper function to parse Thai date and get timestamp for comparison
    const parseThaiDate = (thaiDateStr) => {
      try {
        const parts = thaiDateStr.split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const thaiYear = parseInt(parts[2]);
        const gregorianYear = thaiYear >= 2400 ? thaiYear - 543 : thaiYear;
        const date = new Date(gregorianYear, month - 1, day);
        return date.getTime();
      } catch {
        return null;
      }
    };

    // Search through sheets from most recent to oldest
    for (const sheetName of sheetNames) {
      try {
        // Detect sheet structure (1 API call per sheet)
        const hasNewStructure = await detectSheetStructure(spreadsheetId, sheetName);
        const range = formatSheetRange(sheetName, hasNewStructure ? 'A:K' : 'A:J');

        // Get all values for this sheet (1 API call per sheet)
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });

        const values = response.data.values || [];
        console.log(`📊 Sheet "${sheetName}" has ${values.length} total rows (including header)`);
        if (values.length <= 1) {
          console.log(`⚠️ Sheet "${sheetName}" is empty or has no data rows, skipping`);
          continue; // Skip empty sheets
        }

        // Search through ALL rows to find the most recent date for each driver
        console.log(`📊 Searching sheet "${sheetName}" for ${driverNames.length} drivers:`, driverNames);
        console.log(`📊 Sheet has ${values.length - 1} data rows (excluding header)`);

        // Log all driver names found in the sheet for debugging
        const sheetDriverNames = [];
        for (let i = 1; i < Math.min(values.length, 10); i++) { // Check first 10 rows for debugging
          if (values[i] && values[i][0]) {
            sheetDriverNames.push(values[i][0]?.trim() || '');
          }
        }
        console.log(`📊 Sample driver names in sheet (first 10 rows):`, sheetDriverNames);

        for (let i = 1; i < values.length; i++) {
          const row = values[i];
          if (!row || row.length === 0) continue;

          const rowDriverName = row[0]?.trim() || '';

          // Case-insensitive matching for driver names
          const matchingDriverName = driverNames.find(dn =>
            dn.toLowerCase() === rowDriverName.toLowerCase()
          );

          if (!matchingDriverName) {
            // Log when we're looking for a specific driver but it doesn't match
            if (driverNames.length === 1 && driverNames[0].toLowerCase() === 'charena') {
              console.log(`🔍 Row ${i}: Looking for "Charena" but found "${rowDriverName}" (similarity check)`);
            }
            continue;
          }

          const thaiDate = row[1]?.trim() || '';
          const clockIn = hasNewStructure ? (row[3]?.trim() || '') : (row[2]?.trim() || ''); // Column D (new) or C (old)

          // Debug logging - show full row data for matching driver
          if (matchingDriverName) {
            console.log(`🔍 Found matching driver "${matchingDriverName}" in row ${i}:`);
            console.log(`   Full row data:`, row);
            console.log(`   hasNewStructure: ${hasNewStructure}`);
            console.log(`   Column indexes: driver=0, date=1, clockIn=${hasNewStructure ? '3' : '2'}`);
            console.log(`   Extracted - date="${thaiDate}", clockIn="${clockIn}"`);
            console.log(`   Row length: ${row.length}`);
          }

          // Only process if we have both clock-in time and date
          if (clockIn && thaiDate) {
            const dateTimestamp = parseThaiDate(thaiDate);

            if (!dateTimestamp) {
              console.warn(`⚠️ Could not parse date for ${matchingDriverName}: ${thaiDate}`);
              continue;
            }

            // Only update if this is a more recent date than what we already have
            // OR if we haven't found any data for this driver yet
            // Use matchingDriverName (from driverNames array) as key to preserve original casing
            if (!results[matchingDriverName].dateTimestamp || dateTimestamp > results[matchingDriverName].dateTimestamp) {
              console.log(`✅ Found clock-in for ${matchingDriverName}: ${thaiDate} ${clockIn} (timestamp: ${dateTimestamp})`);
              results[matchingDriverName] = {
                success: true,
                date: thaiDate,
                time: clockIn,
                dateTimestamp: dateTimestamp
              };
            } else {
              console.log(`⏭️ Skipping older clock-in for ${matchingDriverName}: ${thaiDate} (already have: ${new Date(results[matchingDriverName].dateTimestamp).toISOString()})`);
            }
          } else if (matchingDriverName) {
            console.log(`⚠️ Missing data for ${matchingDriverName}: clockIn=${clockIn}, thaiDate=${thaiDate}`);
          }
        }
      } catch (err) {
        console.warn(`⚠️ Error reading sheet "${sheetName}":`, err.message);
        continue;
      }
    }

    // Clean up results - remove dateTimestamp before returning
    const cleanedResults = {};
    driverNames.forEach(name => {
      if (results[name] && results[name].success) {
        cleanedResults[name] = {
          success: true,
          date: results[name].date,
          time: results[name].time
        };
      } else {
        cleanedResults[name] = {
          success: false,
          date: null,
          time: null
        };
      }
    });

    console.log(`✅ Found clock-ins for ${Object.values(cleanedResults).filter(r => r.success).length}/${driverNames.length} drivers`);
    return cleanedResults;
  } catch (error) {
    console.error('Error getting last clock-ins from Google Sheets:', error);
    return {};
  }
}

// Get the most recent clock-in for a single driver (less efficient, but kept for backwards compatibility)
export async function getLastClockInForDriver(driverName, env = 'prod') {
  const results = await getLastClockInsForDrivers([driverName], env, 3);
  const result = results[driverName];

  if (result && result.success) {
    return {
      success: true,
      date: result.date,
      time: result.time
    };
  }

  return {
    success: false,
    error: 'No clock-in found for this driver'
  };
}