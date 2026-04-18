/**
 * NextSkill Academy - Certificate Verification Apps Script
 *
 * Sheet layout:
 * A = Certificate ID
 * B = Student ID
 * C = Student Full Name
 * D = Phone
 * E = Batch Name
 * F = Issue Date
 * G = Program Code
 * H = Program Name
 * I = Status
 * J = Auto Name(Helper)
 *
 * Public response fields:
 * certificate_id, student_name, issue_date, program_name, batch_name, issued_by, status
 */

// Paste your Google Spreadsheet ID here.
// You can also paste the full Google Sheets URL; the script will extract the ID.
var SPREADSHEET_ID = "1XxEf68ueFd5ic7Suh-F6Ge_GuLtVgu3U0AQndw7bdfc";

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action ? String(params.action).trim() : "";

  if (action === "verify") {
    return verifyCertificate(params);
  }

  return jsonOrJsonp_(
    {
      success: false,
      error: "Invalid action"
    },
    params.callback
  );
}

function doPost(e) {
  var params = (e && e.parameter) ? e.parameter : {};

  return jsonOrJsonp_(
    {
      success: false,
      error: "POST is not supported for verification"
    },
    params.callback
  );
}

function verifyCertificate(params) {
  var callback = params.callback;
  var certId = params.id ? String(params.id).trim() : "";

  if (!certId) {
    return jsonOrJsonp_(
      {
        success: false,
        error: "No record found"
      },
      callback
    );
  }

  var normalizedSpreadsheetId = normalizeSpreadsheetId_(SPREADSHEET_ID);

  if (!normalizedSpreadsheetId) {
    return jsonOrJsonp_(
      {
        success: false,
        error: "Server configuration error"
      },
      callback
    );
  }

  var ss = SpreadsheetApp.openById(normalizedSpreadsheetId);
  var sheet = ss.getSheetByName("CERTIFICATES");

  if (!sheet) {
    return jsonOrJsonp_(
      {
        success: false,
        error: "No record found"
      },
      callback
    );
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonOrJsonp_(
      {
        success: false,
        error: "No record found"
      },
      callback
    );
  }

  // Read A:I only. J is helper and intentionally ignored.
  var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var rowCertId = row[0] !== null && row[0] !== undefined ? String(row[0]).trim() : "";

    if (rowCertId !== certId) {
      continue;
    }

    var studentName = row[2];
    var batchName = row[4];
    var issueDate = row[5];
    var programName = row[7];
    var status = row[8] !== null && row[8] !== undefined ? String(row[8]).trim() : "";

    if (status !== "Verified &valid") {
      return jsonOrJsonp_(
        {
          success: false,
          error: "Certificate is not valid"
        },
        callback
      );
    }

    return jsonOrJsonp_(
      {
        success: true,
        certificate_id: rowCertId,
        student_name: studentName,
        issue_date: formatIssueDate_(issueDate),
        program_name: programName,
        batch_name: batchName,
        issued_by: "NextSkill Academy",
        status: status
      },
      callback
    );
  }

  return jsonOrJsonp_(
    {
      success: false,
      error: "No record found"
    },
    callback
  );
}

function formatIssueDate_(value) {
  if (!value && value !== 0) {
    return "";
  }

  // For date cells, format to a stable MM/dd/yyyy string to avoid timezone shifts.
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "MM/dd/yyyy");
  }

  var text = String(value).trim();
  var isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[2] + "/" + isoMatch[3] + "/" + isoMatch[1];
  }

  return text;
}

function normalizeSpreadsheetId_(input) {
  if (!input) {
    return "";
  }

  var raw = String(input).trim();
  var match = raw.match(/\/d\/([a-zA-Z0-9-_]+)/);

  if (match && match[1]) {
    return match[1];
  }

  // If it is already an ID, return as-is.
  return raw;
}

function jsonOrJsonp_(obj, callback) {
  var json = JSON.stringify(obj);

  if (callback && String(callback).trim()) {
    return ContentService
      .createTextOutput(String(callback).trim() + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
