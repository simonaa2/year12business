// ===================================================
// GOOGLE APPS SCRIPT BACKEND
// Paste this code into your Google Sheet's Apps Script:
// Extensions -> Apps Script
// ===================================================

const TEACHER_PASSWORD = "teacher2026"; // Must match teacher password in config.js

function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Get current headers
    let headers = [];
    if (sheet.getLastColumn() > 0) {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
    
    // If headers are empty, create them based on keys in the incoming JSON
    if (headers.length === 0 || headers[0] === "") {
      const keys = Object.keys(json);
      sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
      headers = keys;
    }
    
    // If student has already submitted, we overwrite their row to avoid duplicate rows,
    // otherwise we append a new row.
    const lastRow = sheet.getLastRow();
    let studentRowIndex = -1;
    
    if (lastRow > 1) {
      const namesColumnIndex = headers.indexOf("studentName") + 1;
      if (namesColumnIndex > 0) {
        const names = sheet.getRange(2, namesColumnIndex, lastRow - 1, 1).getValues().map(r => String(r[0]).trim().toLowerCase());
        const incomingName = String(json.studentName).trim().toLowerCase();
        const existingIdx = names.indexOf(incomingName);
        if (existingIdx !== -1) {
          studentRowIndex = existingIdx + 2; // Offset for header (1) and 0-based array index (1)
        }
      }
    }
    
    // Map JSON parameters to headers
    const rowValues = headers.map(h => json[h] !== undefined ? String(json[h]) : "");
    
    if (studentRowIndex !== -1) {
      sheet.getRange(studentRowIndex, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

function doGet(e) {
  try {
    const password = e.parameter.password;
    const action = e.parameter.action;
    
    if (password !== TEACHER_PASSWORD) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }
    
    if (action === "read") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, submissions: [] }))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
      }
      
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      
      const submissions = data.map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, submissions: submissions }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

// Handle OPTIONS preflight request (CORS support)
function doOptions(e) {
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}
