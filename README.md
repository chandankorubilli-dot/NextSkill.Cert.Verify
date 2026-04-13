# NextSkill Academy — Internal Operations Suite

Built for NextSkill Academy's internal operations.
A lightweight web-based toolset connecting to Google Sheets via Apps Script.

## Project Overview
This repository currently contains the certificate verification module used by students and internal team members to validate issued certificates in real time.

### 🎓 Certificate Verification (verify.html)
Public-facing page for students to verify their certificates.
- Enter Certificate ID and verify instantly against the database
- Shows student name, program, issue date, batch, issuer, and status
- Clean, professional UI with responsive mobile support
- Uses JSONP to connect with Google Apps Script (CORS-safe)

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript (ES5-compatible browser script)
- Google Apps Script Web App API
- Google Sheets (data source)

## API Flow (Apps Script)
The frontend calls the Apps Script endpoint using JSONP:
- Request: `SCRIPT_URL?action=verify&id=CERTIFICATE_ID&callback=FUNCTION_NAME`
- Success response:
  - `success: true`
  - `certificate_id`, `student_name`, `batch_name`, `issue_date`, `program_name`, `issued_by`, `status`
- Error response:
  - `error: "message"`

## Repository Structure
```text
.
|-- verify.html
`-- assets
    |-- css
    |   `-- styles.css
    `-- js
        `-- verify.js
```

## Run Locally
1. Clone this repository.
2. Open `verify.html` in a browser.
3. Enter a valid Certificate ID and click **Verify Certificate**.

## Deployment
You can deploy this as a static site using:
- GitHub Pages
- Netlify
- Vercel (static)

Make sure the Apps Script URL in `assets/js/verify.js` is correct and publicly accessible.

## Built by
Chandan korubilli  
Founder, NextSkill Academy

## Notes
- This project is intended for NextSkill Academy operations.
- Certificate verification confirms course completion only and does not indicate government or academic accreditation.
