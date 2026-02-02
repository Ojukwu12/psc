# Napss Backend - Past Questions Management System

Production-ready REST API for managing past question files (PDF, Word, Images) with admin-only uploads and public downloads. Supports AWS S3 cloud storage with local fallback.

## Features

- 🔐 **Admin Authentication**: Login system with 24-hour token-based sessions
- 📤 **File Upload**: Admin-only uploads (PDF, Word, JPG, PNG, GIF, WebP)
- 📥 **Public Downloads**: Anyone can download without authentication
- 🔍 **Search & Filter**: Full-text search by title, subject, year, class
- ☁️ **Cloud Storage**: AWS S3 (eu-north-1) with local file fallback
- 📊 **Metadata**: JSON database with pagination support
- 🔒 **Security**: Filename sanitization, MIME validation, secure headers
- ✅ **Tested**: Comprehensive test suite with 25+ tests

## Quick Start

### 1. Setup

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

API runs on `http://localhost:4000`

### 2. Admin Login

```bash
curl -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"change-me"}'
```

Response:
```json
{
  "token": "abc123xyz...",
  "expiresAt": "2026-02-03T12:00:00.000Z"
}
```

### 3. Upload File (Admin Only)

```bash
curl -X POST http://localhost:4000/api/admin/past-questions \
  -H "Authorization: Bearer abc123xyz..." \
  -F "title=Biology Final Exam 2024" \
  -F "subject=Biology" \
  -F "year=2024" \
  -F "className=SS3" \
  -F "file=@biology-exam.pdf"
```

### 4. Public List/Search (No Login)

```bash
curl http://localhost:4000/api/past-questions?q=biology&year=2024&limit=10
```

### 5. Public Download (No Login)

```bash
curl http://localhost:4000/api/past-questions/1/download -o exam.pdf
```

## Configuration

Create `.env` from `.env.example`:

```env
PORT=4000
ADMIN_API_KEY=your-secure-password
STORAGE_BACKEND=s3              # or "local"
DB_PATH=data/app.json
MAX_FILE_SIZE_MB=20

# S3 Configuration (AWS)
S3_REGION=eu-north-1
S3_BUCKET=polscience124
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=                     # optional
S3_FORCE_PATH_STYLE=false        # for MinIO compatibility
```

## API Endpoints

### Authentication (No Auth Required)

#### Login
```
POST /api/auth/admin/login
Content-Type: application/json

{
  "password": "ADMIN_API_KEY"
}
```

**Response (200)**
```json
{
  "token": "string",
  "expiresAt": "ISO8601 timestamp",
  "message": "Logged in successfully"
}
```

#### Verify Token
```
GET /api/auth/admin/verify
Authorization: Bearer <token>
```

#### Logout
```
POST /api/auth/admin/logout
Authorization: Bearer <token>
```

---

### Past Questions - Admin Only

#### Upload File
```
POST /api/admin/past-questions
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
- file* (required): PDF, DOCX, JPG, PNG, GIF, WebP (max 20MB)
- title* (required): String (e.g., "Biology Final 2024")
- subject (optional): String (e.g., "Biology")
- year (optional): String (e.g., "2024")
- className (optional): String (e.g., "SS3")
```

**Response (201)**
```json
{
  "id": 1,
  "title": "Biology Final 2024",
  "subject": "Biology",
  "class_name": "SS3",
  "year": "2024",
  "file_key": "past-questions/2026-02-02/uuid.pdf",
  "file_name": "biology.pdf",
  "mime_type": "application/pdf",
  "size": 1024000,
  "created_at": "2026-02-02T15:30:00.000Z"
}
```

---

### Past Questions - Public (No Auth Required)

#### List All
```
GET /api/past-questions?limit=20&offset=0
```

#### Search/Filter
```
GET /api/past-questions?q=biology&year=2024&subject=Biology&className=SS3&limit=20&offset=0

Query Parameters:
- q: Text search (title, subject, year, class)
- year: Filter by year (2024)
- subject: Filter by subject (Biology, Mathematics, etc)
- className: Filter by class (SS1, SS2, SS3, etc)
- limit: Page size (default: 20, max: 100)
- offset: Pagination offset (default: 0)
```

**Response (200)**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Biology Final 2024",
      "subject": "Biology",
      "class_name": "SS3",
      "year": "2024",
      "file_name": "biology.pdf",
      "mime_type": "application/pdf",
      "size": 1024000,
      "created_at": "2026-02-02T15:30:00.000Z"
    }
  ],
  "total": 42
}
```

#### Get Single Question
```
GET /api/past-questions/:id
```

#### Download File
```
GET /api/past-questions/:id/download

Response:
- Status: 200
- Content-Type: application/pdf (or appropriate type)
- Content-Disposition: attachment; filename="..."
- File content as binary
```

---

## Frontend Integration Guide

### 1. Admin Dashboard

```javascript
// Login
const loginResponse = await fetch('/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'your-password' })
});
const { token } = await loginResponse.json();
localStorage.setItem('adminToken', token);

// Upload
const formData = new FormData();
formData.append('title', 'Biology Final 2024');
formData.append('subject', 'Biology');
formData.append('year', '2024');
formData.append('className', 'SS3');
formData.append('file', fileInput.files[0]);

await fetch('/api/admin/past-questions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  },
  body: formData
});
```

### 2. Public Question List

```javascript
// Fetch questions
const response = await fetch('/api/past-questions?q=biology&limit=20');
const { items, total } = await response.json();

// Display items
items.forEach(item => {
  console.log(`${item.title} - ${item.subject} (${item.year})`);
});

// Download
window.location.href = `/api/past-questions/${item.id}/download`;
```

### 3. Search Implementation

```javascript
async function searchQuestions(query, filters = {}) {
  const params = new URLSearchParams({
    q: query,
    limit: filters.limit || 20,
    offset: filters.offset || 0
  });
  
  if (filters.year) params.append('year', filters.year);
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.className) params.append('className', filters.className);

  return fetch(`/api/past-questions?${params}`).then(r => r.json());
}
```

## Supported File Types

| Type | MIME Types | Extensions |
|------|-----------|-----------|
| PDF | application/pdf | .pdf |
| Word | application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document | .doc, .docx |
| Images | image/jpeg, image/png, image/gif, image/webp | .jpg, .jpeg, .png, .gif, .webp |

## Security

- ✅ Token-based authentication (24-hour expiry)
- ✅ Filename sanitization (path traversal protection)
- ✅ MIME type validation
- ✅ File size limits (configurable, default 20MB)
- ✅ Secure download headers (X-Content-Type-Options: nosniff)
- ✅ CORS enabled for cross-origin requests
- ✅ Environment variables protected (.env in .gitignore)

## Error Handling

All errors return JSON with status codes:

```json
{
  "error": "Description of error"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing fields, invalid file) |
| 401 | Unauthorized (invalid token, no auth) |
| 404 | Not found |
| 500 | Server error |

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- test/auth.test.js
npm test -- test/s3.test.js
npm test -- test/multifile.test.js
npm test -- test/routes.test.js
```

Tests include:
- ✅ Admin authentication flow
- ✅ Public access (no auth required)
- ✅ File upload validation
- ✅ Multi-file type support
- ✅ S3 cloud storage
- ✅ Pagination & filtering
- ✅ Download security

## Development

```bash
# Start dev server with auto-reload
npm run dev

# Run production server
npm start

# Run tests with watch
npm test -- --watch
```

## Database

Data stored in `data/app.json` (JSON format for portability):

```json
{
  "past_questions": [
    {
      "id": 1,
      "title": "Biology Final 2024",
      "subject": "Biology",
      "class_name": "SS3",
      "year": "2024",
      "file_key": "past-questions/2026-02-02/uuid.pdf",
      "file_name": "biology.pdf",
      "mime_type": "application/pdf",
      "size": 1024000,
      "created_at": "2026-02-02T15:30:00.000Z"
    }
  ]
}
```

## Deployment

### Environment Variables (Required)
- `ADMIN_API_KEY` - Set to a strong password
- `S3_BUCKET`, `S3_REGION` - If using S3
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` - If using S3

### Cloud Deployment
Can be deployed to:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS Lambda
- Vercel (serverless)

All storage methods supported (local + S3).

## License

MIT
