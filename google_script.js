// ===================================================
// YEAR 12 BUSINESS STUDIES — GOOGLE APPS SCRIPT
// Paste this code into your Google Sheet's Apps Script editor:
// 1. In Google Sheets, click Extensions -> Apps Script
// 2. Erase everything and paste this entire file
// 3. Click Deploy -> New deployment -> Select type: Web App
//    - Description: Version 2.0 Dynamic Headers
//    - Execute as: Me (your email)
//    - Who has access: Anyone
// 4. Click Deploy and copy the Web App URL if it changes.
// ===================================================

var TEACHER_PASSWORD = 'teacher2026';
var SHEET_NAME = 'Submissions';

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : '';
    if (!raw) {
      return response({ success: false, error: 'No data received' });
    }
    
    var data = JSON.parse(raw);
    var ss = getOrCreateSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    let headers = [];
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      var keys = Object.keys(data);
      keys = keys.filter(function(k) { return k !== 'studentName' && k !== 'timestamp' && k !== 'classCode'; });
      headers = ['timestamp', 'studentName', 'classCode'].concat(keys);
      
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight('bold')
           .setBackground('#1e293b')
           .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      var lastCol = sheet.getLastColumn();
      var existingHeaders = [];
      if (lastCol > 0) {
        existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
      }
      
      // Check for any new keys in data that are not yet column headers
      var dataKeys = Object.keys(data);
      var newKeys = dataKeys.filter(function(k) {
        return existingHeaders.indexOf(k) === -1;
      });

      if (newKeys.length > 0) {
        var startCol = existingHeaders.length + 1;
        var newHeadersRange = sheet.getRange(1, startCol, 1, newKeys.length);
        newHeadersRange.setValues([newKeys]);
        newHeadersRange.setFontWeight('bold')
                       .setBackground('#1e293b')
                       .setFontColor('#ffffff');
        headers = existingHeaders.concat(newKeys);
      } else {
        headers = existingHeaders;
      }
    }
    
    // Check if student has already submitted to update their existing row
    var lastRow = sheet.getLastRow();
    var studentRowIndex = -1;
    if (lastRow > 1) {
      var namesColumnIndex = headers.indexOf('studentName') + 1;
      if (namesColumnIndex > 0) {
        var names = sheet.getRange(2, namesColumnIndex, lastRow - 1, 1).getValues().map(function(r) {
          return String(r[0]).trim().toLowerCase();
        });
        var incomingName = String(data.studentName || '').trim().toLowerCase();
        if (incomingName) {
          var existingIdx = names.indexOf(incomingName);
          if (existingIdx !== -1) {
            studentRowIndex = existingIdx + 2;
          }
        }
      }
    }
    
    // Map data values to header columns
    var rowValues = headers.map(function(h) {
      if (h === 'timestamp') return new Date().toISOString();
      return data[h] !== undefined ? String(data[h]) : "";
    });
    
    if (studentRowIndex !== -1) {
      sheet.getRange(studentRowIndex, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    
    return response({ success: true });
  } catch (err) {
    return response({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var pw = (e.parameter && e.parameter.password) ? e.parameter.password : '';
    var action = (e.parameter && e.parameter.action) ? e.parameter.action : 'read';
    
    if (pw !== TEACHER_PASSWORD) {
      return response({ success: false, error: 'Unauthorized' });
    }
    
    if (action === 'read') {
      return readSubmissions();
    }
    return response({ success: false, error: 'Unknown action' });
  } catch (err) {
    return response({ success: false, error: err.toString() });
  }
}

function readSubmissions() {
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return response({ success: true, submissions: [] });
  }
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return response({ success: true, submissions: [] });
  }
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var submissions = values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i] !== undefined ? String(row[i]) : '';
    });
    obj.studentName = obj['studentName'] || '';
    obj.timestamp = obj['timestamp'] || '';
    return obj;
  });
  return response({ success: true, submissions: submissions });
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch(e) {}
  return SpreadsheetApp.openById('1YGNTtK8bIxrDdvElmiyfNoOctc-yXeQXdTvY5-OCVoE');
}
