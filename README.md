# NextSkill Academy — Internal Operations Suite

Built for NextSkill Academy operations and published as a public repository.
A lightweight web-based toolset connecting to Google Sheets via Apps Script.

## Project Overview
This repository currently contains the certificate verification module used by students and internal team members to validate issued certificates in real time.

## Public Repository Notice
- This is a public code repository.
- Do not commit secrets, API keys, private spreadsheet IDs, or personal student data.
- Keep the Apps Script endpoint configured for read-only verification behavior.

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
├── verify.html              # Main public-facing verification page
├── README.md                # This file
├── LICENSE                  # MIT License
├── CONTRIBUTING.md          # Contribution guidelines
├── .gitignore               # Git ignore rules
├── .gitattributes           # Line ending rules
└── assets/
    ├── css/
    │   └── styles.css       # Styling (Cormorant + DM Sans)
    └── js/
        └── verify.js        # JSONP verification logic
```

## Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/NextSkill/cert-verify.git
   cd cert-verify
   ```
2. Open `verify.html` in your browser (no build step needed).
3. Enter a Certificate ID and click **Verify Certificate**.

## Deployment
You can deploy this as a static site using:
- **GitHub Pages** (free, automatic from main branch)
- **Netlify** (free tier available)
- **Vercel** (static hosting)

Steps for GitHub Pages:
1. Push to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch" and choose `main`
4. Your site will be live at `https://yourusername.github.io/cert-verify`

## Backend Security Checklist
Before deploying, **configure these in your Google Apps Script**:

### Data Validation
- ✅ Validate Certificate ID format (length, allowed characters)
- ✅ Reject malformed or suspicious requests
- ✅ Log all verification requests (with timestamp, ID searched, result)

### Data Output Control
- ✅ Return ONLY: `certificate_id`, `student_name`, `issue_date`, `program_name`, `batch_name`, `issued_by`, `status`
- ✅ Never expose: phone numbers, email, internal codes, raw scores, personal details
- ✅ Verify the certificate status is "Verified &valid" before returning data

### Access Control
- ✅ Keep Google Sheet **read-only** for the Apps Script (use service account or limited permissions)
- ✅ Restrict **edit access** to Google Sheet to authorized team members only
- ✅ Use Sheet protection to lock sensitive columns

### Rate Limiting & Abuse Protection
- ✅ Implement rate limiting (e.g., 10 requests per minute per IP)
- ✅ Return `429 Too Many Requests` for exceeded limits
- ✅ Monitor for suspicious patterns (rapid-fire requests, invalid IDs)
- ✅ Have a rollback plan to redeploy the script URL if abuse occurs

### Monitoring
- ✅ Set up Google Sheets audit logging
- ✅ Review verification logs weekly for anomalies
- ✅ Document all access and changes

## Security Guidelines
- Public Apps Script URLs are expected and normal for verification services
- Security comes from **backend validation**, not hiding the endpoint
- Rate limiting and data restrictions are your primary defenses
- Rotate the script URL if significant misuse is detected

## Built by
Chandan korubilli  
Founder, NextSkill Academy

## Notes
- This repository is public for transparency and deployment convenience.
- Certificate verification confirms course completion only and does not indicate government or academic accreditation.
