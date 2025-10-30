var tz = "Asia/Bangkok";
var submittedAt = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ss") + "+07:00";

function getSpreadsheetIdByEnv(env) {
  const devSpreadsheetId = '1diiYf4TaTLwsLA0O48xjwBSTC76BvOAS2woezN_Z4lQ'; // DEV
  const prodSpreadsheetId = '1_ObqjB3eMOgbKmf3xvzQHeCttjyAUIn5meiu4nT0z34'; // PROD
  return env === 'dev' ? devSpreadsheetId : prodSpreadsheetId;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    Logger.log('Received data: ' + JSON.stringify(data));
    Logger.log('thaiDate value: ' + data.thaiDate);
    Logger.log('env value: ' + data.env);
    Logger.log('action value: ' + data.action);
    Logger.log('isAutoSubmitted: ' + (data.isAutoSubmitted || false));

    const env = data.env || 'prod';
    const spreadsheetId = getSpreadsheetIdByEnv(env);
    Logger.log('Using spreadsheetId: ' + spreadsheetId);

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getActiveSheet();

    // --- Handle checkExisting action (NEW) ---
    if (data.action === 'checkExisting') {
      Logger.log('Processing checkExisting action');
      Logger.log('Driver: ' + data.driverName + ', Date: ' + data.thaiDate);
      
      const values = sheet.getDataRange().getValues();
      let exists = false;
      
      // Check for existing row with same driver and date
      for (let i = 1; i < values.length; i++) { // skip header
        if (
          values[i][0] === data.driverName && // column A: driverName
          values[i][1] === data.thaiDate      // column B: thaiDate
        ) {
          exists = true;
          Logger.log('Found existing entry at row: ' + (i + 1));
          break;
        }
      }
      
      Logger.log('Entry exists: ' + exists);
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true,
          exists: exists,
          message: exists ? 'Entry found' : 'No existing entry found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // --- END checkExisting ---

    // --- Handle submitWithClockTimes action ---
    if (data.action === 'submitWithClockTimes') {
      Logger.log('Processing submitWithClockTimes action');
      Logger.log('Driver: ' + data.driverName + ', Date: ' + data.thaiDate);
      Logger.log('Clock In: ' + data.clockIn + ', Clock Out: ' + data.clockOut);
      Logger.log('Auto-submitted: ' + (data.isAutoSubmitted || false));
      
      // Calculate OT hours if clock out time is provided and after 17:00
      let calculatedOTStart = '';
      let calculatedOTEnd = '';
      let calculatedOTHours = '';
      
      if (data.clockOut) {
        Logger.log('Calculating OT for clock out time: ' + data.clockOut);
        
        const clockOutTime = new Date('2000-01-01T' + data.clockOut + ':00');
        const otStartTime = new Date('2000-01-01T17:00:00');
        
        Logger.log('Comparing: ' + data.clockOut + ' > 17:00 = ' + (clockOutTime > otStartTime));
        
        if (clockOutTime > otStartTime) {
          calculatedOTStart = '17:00';
          calculatedOTEnd = data.clockOut;
          
          // Calculate hours between 17:00 and clock out time
          const diffMs = clockOutTime.getTime() - otStartTime.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          calculatedOTHours = diffHours.toFixed(2); // Round to 2 decimal places
          
          Logger.log('OT calculation: ' + diffMs + 'ms = ' + diffHours + ' hours = ' + calculatedOTHours + ' hours');
        } else {
          Logger.log('No OT hours: Clock out time ' + data.clockOut + ' is not after 17:00');
        }
      }
      
      const values = sheet.getDataRange().getValues();
      let found = false;
      
      // Check for existing row with same driver and date
      for (let i = 1; i < values.length; i++) { // skip header
        if (
          values[i][0] === data.driverName && // column A: driverName
          values[i][1] === data.thaiDate      // column B: thaiDate
        ) {
          Logger.log('Found existing row at index: ' + i + ', updating with clock times');
          
          // Update clock times if provided
          if (data.clockIn) {
            sheet.getRange(i + 1, 3).setValue(data.clockIn); // column C: clockIn
            Logger.log('Updated clockIn at column C, row ' + (i + 1) + ' with value: ' + data.clockIn);
          }
          if (data.clockOut) {
            sheet.getRange(i + 1, 4).setValue(data.clockOut); // column D: clockOut
            Logger.log('Updated clockOut at column D, row ' + (i + 1) + ' with value: ' + data.clockOut);
          }
          
          // Update OT fields if calculated
          if (calculatedOTStart) {
            sheet.getRange(i + 1, 5).setValue(calculatedOTStart); // column E: otStart
            Logger.log('Updated otStart at column E, row ' + (i + 1) + ' with value: ' + calculatedOTStart);
          }
          if (calculatedOTEnd) {
            sheet.getRange(i + 1, 6).setValue(calculatedOTEnd); // column F: otEnd
            Logger.log('Updated otEnd at column F, row ' + (i + 1) + ' with value: ' + calculatedOTEnd);
          }
          if (calculatedOTHours) {
            sheet.getRange(i + 1, 9).setValue(calculatedOTHours); // column I: Calculated OT Hours
            Logger.log('Updated otHours at column I, row ' + (i + 1) + ' with value: ' + calculatedOTHours);
          }
          
          // Update comments if provided
          if (data.comments) {
            sheet.getRange(i + 1, 7).setValue(data.comments); // column G: comments
            Logger.log('Updated comments at column G, row ' + (i + 1) + ' with value: ' + data.comments);
          }
          
          found = true;
          return ContentService
            .createTextOutput(JSON.stringify({ 
              success: true,
              message: data.isAutoSubmitted ? 'Existing row updated with auto-submitted clock times' : 'Existing row updated with clock times',
              row: i + 1,
              updatedClockIn: data.clockIn || '',
              updatedClockOut: data.clockOut || '',
              updatedComments: data.comments || '',
              isAutoSubmitted: data.isAutoSubmitted || false
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      // If not found, append a new row
      if (!found) {
        Logger.log('No existing row found, creating new row with clock times');
        const newRow = [
          data.driverName || '',
          data.thaiDate || '',
          data.clockIn || '', // column C: clockIn
          data.clockOut || '', // column D: clockOut
          calculatedOTStart || '', // column E: otStart (calculated)
          calculatedOTEnd || '', // column F: otEnd (calculated)
          data.comments || '', // column G: comments
          data.submittedAt || (Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd'T'HH:mm:ss") + "+07:00"), // column H: submittedAt
          calculatedOTHours || '', // column I: Calculated OT Hours (calculated)
          '' // column J: approval (empty)
        ];
        sheet.appendRow(newRow);
        Logger.log('Appended new row with clock times: ' + JSON.stringify(newRow));
        Logger.log('Auto-submitted: ' + (data.isAutoSubmitted || false));
        
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: true,
            message: data.isAutoSubmitted ? 'New row created with auto-submitted clock times' : 'New row created with clock times',
            newRow: newRow,
            rowNumber: sheet.getLastRow(),
            isAutoSubmitted: data.isAutoSubmitted || false
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    // --- END submitWithClockTimes ---

    // --- Handle clockEvent action (for backward compatibility) ---
    if (data.action === 'clockEvent') {
      Logger.log('Processing clockEvent action');
      Logger.log('Driver: ' + data.driverName + ', Date: ' + data.thaiDate + ', Type: ' + data.type + ', Timestamp: ' + data.timestamp);
      
      const values = sheet.getDataRange().getValues();
      let found = false;
      
      for (let i = 1; i < values.length; i++) { // skip header
        if (
          values[i][0] === data.driverName && // column A: driverName
          values[i][1] === data.thaiDate      // column B: thaiDate
        ) {
          Logger.log('Found existing row at index: ' + i);
          // Update the correct column
          if (data.type === 'clockIn') {
            sheet.getRange(i + 1, 3).setValue(data.timestamp); // column C: clockIn
            Logger.log('Updated clockIn at column C, row ' + (i + 1) + ' with value: ' + data.timestamp);
          } else if (data.type === 'clockOut') {
            sheet.getRange(i + 1, 4).setValue(data.timestamp); // column D: clockOut
            Logger.log('Updated clockOut at column D, row ' + (i + 1) + ' with value: ' + data.timestamp);
          }
          found = true;
          return ContentService
            .createTextOutput(JSON.stringify({ 
              success: true,
              message: 'Clock event updated in existing row',
              row: i + 1,
              updatedColumn: data.type === 'clockIn' ? 'C' : 'D',
              timestamp: data.timestamp
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      // If not found, append a new row
      if (!found) {
        Logger.log('No existing row found, creating new row');
        const newRow = [
          data.driverName || '',
          data.thaiDate || '',
          data.type === 'clockIn' ? data.timestamp : '', // column C: clockIn
          data.type === 'clockOut' ? data.timestamp : '', // column D: clockOut
          '', // column E: otStart (empty)
          '', // column F: otEnd (empty)
          '', // column G: comments (empty)
          data.submittedAt || (Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd'T'HH:mm:ss") + "+07:00"), // column H: submittedAt
          '', // column I: Calculated OT Hours (empty)
          '' // column J: approval (empty)
        ];
        sheet.appendRow(newRow);
        Logger.log('Appended new row: ' + JSON.stringify(newRow));
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: true,
            message: 'Clock event added as new row',
            newRow: newRow,
            rowNumber: sheet.getLastRow()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    // --- END clockEvent ---

    // Approve most recent unapproved request
    if (data.action === 'approveMostRecent') {
      const values = sheet.getDataRange().getValues();
      for (let i = values.length - 1; i > 0; i--) { // start from last row, skip header
        if (!values[i][9]) { // column J (index 9) is empty for approval
          sheet.getRange(i + 1, 10).setValue('Approve'); // column J (index 10)
          return ContentService
            .createTextOutput(JSON.stringify({ 
              success: true,
              message: 'Most recent approval updated',
              row: i + 1
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false,
          error: 'No unapproved requests found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- Handle update approval action ---
    if (data.action === 'updateApproval') {
      const submittedAt = data.submittedAt;
      const approval = data.approval;
      if (!submittedAt || !approval) {
        throw new Error('Missing submittedAt or approval for updateApproval');
      }
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) { // skip header
        if (values[i][7] === submittedAt) { // column H (index 7) is submittedAt
          sheet.getRange(i + 1, 10).setValue(approval); // column J (index 10)
          return ContentService
            .createTextOutput(JSON.stringify({ 
              success: true,
              message: 'Approval updated',
              row: i + 1
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      throw new Error('Row not found for submittedAt: ' + submittedAt);
    }
    // --- END ---

    // --- Default: Handle form submission (prevent duplicates) ---
    if (!data.action || data.action === 'submit') {
      Logger.log('Processing default form submission');
      
      // Check for existing entry for same driver and date
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) { // skip header
        if (
          values[i][0] === data.driverName && // column A: driverName
          values[i][1] === data.thaiDate      // column B: thaiDate
        ) {
          // Entry already exists for this driver and date
          Logger.log('Duplicate found for driver: ' + data.driverName + ' on date: ' + data.thaiDate);
          return ContentService
            .createTextOutput(JSON.stringify({ 
              success: false,
              error: `An entry for driver "${data.driverName}" on date "${data.thaiDate}" already exists.`
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      // If not found, append new row
      const row = [
        data.driverName || '',
        data.thaiDate || '',
        data.clockIn || '',
        data.clockOut || '',
        '', // otStart (removed from form)
        '', // otEnd (removed from form)
        data.comments || '',
        data.submittedAt || (Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd'T'HH:mm:ss") + "+07:00"),
        '' // approval (empty)
      ];
      sheet.appendRow(row);
      Logger.log('Appended new form submission row: ' + JSON.stringify(row));

      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true,
          message: 'Data saved successfully',
          rowAdded: row,
          usedSpreadsheet: spreadsheetId
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // --- END ---

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var env = (e && e.parameter && e.parameter.env) ? e.parameter.env : 'prod';
  var spreadsheetId = getSpreadsheetIdByEnv(env);

  // Add this block to support fetching a row by submittedAt
  if (e && e.parameter && e.parameter.action === 'getRowBySubmittedAt' && e.parameter.submittedAt) {
    var sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) { // skip header
      if (values[i][7] === e.parameter.submittedAt) { // column H
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          row: values[i]
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Row not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Default: status check
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'API is working!',
      timestamp: Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd'T'HH:mm:ss") + "+07:00",
      env: env,
      spreadsheetId: spreadsheetId
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function testDoPost() {
  // Simulate a checkExisting request
  var checkPayload = {
    action: 'checkExisting',
    driverName: 'Test Driver',
    thaiDate: '06/01/2568',
    env: 'dev'
  };
  Logger.log('--- Testing checkExisting ---');
  Logger.log(doPost({postData: {contents: JSON.stringify(checkPayload)}}).getContent());

  // Simulate a manual submitWithClockTimes event
  var manualSubmitPayload = {
    action: 'submitWithClockTimes',
    driverName: 'Test Driver',
    thaiDate: '06/01/2568',
    clockIn: '08:30',
    clockOut: '17:30',
    comments: 'Test manual submission',
    submittedAt: Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ss") + "+07:00",
    env: 'dev',
    isAutoSubmitted: false
  };
  Logger.log('--- Testing manual submitWithClockTimes ---');
  Logger.log(doPost({postData: {contents: JSON.stringify(manualSubmitPayload)}}).getContent());

  // Simulate an auto-submitted event
  var autoSubmitPayload = {
    action: 'submitWithClockTimes',
    driverName: 'Test Driver',
    thaiDate: '06/01/2568',
    clockIn: '08:30',
    clockOut: '17:30',
    comments: 'Auto-submitted at 11:59 PM',
    submittedAt: Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ss") + "+07:00",
    env: 'dev',
    isAutoSubmitted: true
  };
  Logger.log('--- Testing auto-submitted submitWithClockTimes ---');
  Logger.log(doPost({postData: {contents: JSON.stringify(autoSubmitPayload)}}).getContent());

  // Simulate a clock in event (for backward compatibility)
  var clockInPayload = {
    action: 'clockEvent',
    driverName: 'Test Driver',
    thaiDate: '06/01/2568',
    type: 'clockIn',
    timestamp: '08:30',
    submittedAt: Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ss") + "+07:00",
    env: 'dev'
  };
  Logger.log('--- Testing clockIn event ---');
  Logger.log(doPost({postData: {contents: JSON.stringify(clockInPayload)}}).getContent());

  // Simulate a new OT request (append)
  var submittedAt = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ss") + "+07:00";
  var appendPayload = {
    driverName: 'Test',
    thaiDate: '06/01/2568',
    clockIn: '08:00',
    clockOut: '17:00',
    comments: 'Test',
    submittedAt: submittedAt,
    env: 'dev' // Change to 'prod' to test production
    // No action field means default append
  };
  Logger.log('--- Testing append (new OT request) ---');
  Logger.log(doPost({postData: {contents: JSON.stringify(appendPayload)}}).getContent());

  // Simulate a manager approval update (updateApproval)
  var updatePayload = {
    action: 'updateApproval',
    env: 'dev', // Change to 'prod' to test production
    submittedAt: submittedAt, // Use the same submittedAt as above
    approval: 'Approve' // or 'Deny: Reason'
  };
  Logger.log('--- Testing updateApproval (manager reply) ---');
  Logger.log(doPost({postData: {contents: JSON.stringify(updatePayload)}}).getContent());
}

function debugRowData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = 47; // Change as needed
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (var i = 0; i < rowData.length; i++) {
    Logger.log("Column " + (i+1) + ": " + rowData[i] + " (type: " + typeof rowData[i] + ")");
  }
}

function parseBuddhistIsoStringToParts(val) {
  // Example: "2568-02-06T17:00:00.000Z"
  if (typeof val === "string" && val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)) {
    var m = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return {
      year: m[1],
      month: m[2],
      day: m[3],
      hour: m[4],
      minute: m[5]
    };
  }
  return null;
}

function formatBuddhistDateString(val) {
  var parts = parseBuddhistIsoStringToParts(val);
  if (parts) {
    return parts.day + "/" + parts.month + "/" + parts.year;
  }
  return "";
}

function formatBuddhistTimeString(val) {
  var parts = parseBuddhistIsoStringToParts(val);
  if (parts) {
    return parts.hour + ":" + parts.minute;
  }
  return "";
}

function notifyProdServerForRow() {
  function extractDate(val) {
    val = val ? val.toString() : "";
    // ISO string: "2568-04-06T17:00:00.000Z"
    if (val.match(/^\d{4}-\d{2}-\d{2}T/)) {
      var parts = val.split("T")[0].split("-");
      return parts[2] + "/" + parts[1] + "/" + parts[0];
    }
    // Full Date string: "Thu Apr 07 2568 00:00:00 GMT+0700 (Indochina Time)"
    var dateMatch = val.match(/(\w{3}) (\w{3}) (\d{2}) (\d{4})/);
    if (dateMatch) {
      var day = dateMatch[3];
      var monthStr = dateMatch[2];
      var year = dateMatch[4];
      var monthMap = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
      var month = monthMap[monthStr] || "00";
      return day + "/" + month + "/" + year;
    }
    return val;
  }

  function extractTime(val) {
    val = val ? val.toString() : "";
    // ISO string: "2568-04-06T17:00:00.000Z"
    if (val.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return val.split("T")[1].substring(0,5);
    }
    // Full Date string: "Sat Dec 30 1899 00:00:00 GMT+0642 (Indochina Time)"
    var timeMatch = val.match(/(\d{2}):(\d{2}):\d{2}/);
    if (timeMatch) {
      return timeMatch[1] + ":" + timeMatch[2];
    }
    return val;
  }

  var env = "prod"; // or "prod"
  var spreadsheetId = getSpreadsheetIdByEnv(env);
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getActiveSheet();
  var row = 3; // Change as needed
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  Logger.log("RowData: " + JSON.stringify(rowData));

  var driverName = rowData[0] || "";
  var thaiDate = extractDate(rowData[1]);
  var clockIn = extractTime(rowData[2]);
  var clockOut = extractTime(rowData[3]);
  var otStart = extractTime(rowData[4]);
  var otEnd = extractTime(rowData[5]);
  var comments = rowData[6] || "";
  var submittedAt = rowData[7] || "";

  var message =
    "🚗 Driver: " + driverName + "\n" +
    "📅 Date: " + thaiDate + "\n" +
    "🕒 Clock In: " + clockIn + "\n" +
    "🕔 Clock Out: " + clockOut + "\n" +
    (otStart ? "⏱️ OT Start: " + otStart + "\n" : "") +
    (otEnd ? "⏱️ OT End: " + otEnd + "\n" : "") +
    (comments ? "💬 Comments: " + comments + "\n" : "") +
    "📝 Submitted At: " + submittedAt;

  var payload = {
    message: message,
    env: env
  };

  Logger.log("Payload: " + JSON.stringify(payload));
  Logger.log("Message: " + message);

  var url = "https://liff-ot-app-positive.herokuapp.com/notify-line";
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  Logger.log("About to send payload: " + JSON.stringify(payload));
  try {
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("Fetch response: " + response.getContentText());
  } catch (e) {
    Logger.log("Fetch error: " + e.toString());
  }
  Logger.log("Script finished.");
} 