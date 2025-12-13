# 🎯 Quick Start Guide - For Your Friend

This is a **condensed guide** to get the OCR-RAG System running from scratch. For detailed instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

---

## ⚡ 5-Minute Overview

**What you need:**
1. Firebase project (authentication + database)
2. Google Cloud project (Sheets API + Gemini AI)
3. Google Sheet (for storing documents)
4. OAuth credentials (for user-specific Sheets access)

**What you'll do:**
1. Clone the repo
2. Get all credentials (JSON files)
3. Configure environment variables
4. Run locally or deploy

---

## 📦 Step 1: Clone & Install (5 minutes)

```bash
# Clone repository
git clone <repository-url>
cd ocr_rag_system

# Create virtual environment
python -m venv myenv

# Activate (Windows)
myenv\Scripts\activate

# Activate (Linux/Mac)
source myenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
# Linux: sudo apt-get install tesseract-ocr tesseract-ocr-eng poppler-utils
# Mac: brew install tesseract poppler
```

---

## 🔥 Step 2: Firebase Setup (10 minutes)

### Create Project
1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it: `ocr-rag-system`
4. Disable Analytics (optional)

### Enable Authentication
1. **Build** → **Authentication** → **Get started**
2. Enable **Email/Password**
3. Enable **Google** (optional)

### Enable Realtime Database
1. **Build** → **Realtime Database** → **Create Database**
2. Start in **Test mode**

### Download Credentials
1. **Project Settings** ⚙️ → **Service Accounts**
2. **Generate new private key**
3. Save as: `app/config/serviceAccountKey.json`

---

## ☁️ Step 3: Google Cloud Setup (10 minutes)

### Create Project
1. Go to https://console.cloud.google.com/
2. **New Project** → Name it (same as Firebase is fine)

### Enable APIs
1. **APIs & Services** → **Library**
2. Enable these APIs:
   - ✅ Google Sheets API
   - ✅ Google Drive API
   - ✅ Generative Language API

### Create Service Account
1. **IAM & Admin** → **Service Accounts** → **Create**
2. Name: `ocr-rag-service`
3. Role: **Editor**
4. **Keys** → **Add Key** → **JSON**
5. Save as: `app/config/google_service_account.json`

---

## 🤖 Step 4: Gemini AI Setup (5 minutes)

### Get API Key
1. Go to https://aistudio.google.com/app/apikey
2. **Create API Key** → Select your Google Cloud project
3. Copy the key

### Create Credentials File
**Option 1 (Easy):** Copy the Google Cloud service account file:
```bash
cp app/config/google_service_account.json app/config/gemini-key.json
```

**Option 2:** Create new JSON with your API key structure

---

## 📊 Step 5: Google Sheets Setup (5 minutes)

### Create Sheet
1. Go to https://sheets.google.com/
2. Create **Blank** spreadsheet
3. Name it: `OCR RAG Documents`

### Share with Service Account
1. Click **Share**
2. Add email from `google_service_account.json`:
   ```
   your-service-account@your-project.iam.gserviceaccount.com
   ```
3. Grant **Editor** access

### Get Spreadsheet ID
From URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`

Copy the ID (between `/d/` and `/edit`)

---

## 🔐 Step 6: OAuth Setup (10 minutes)

### Create OAuth Credentials
1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**

### Configure Consent Screen (if prompted)
1. **External** user type
2. App name: `OCR RAG System`
3. Add scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
4. Save

### Create Client ID
1. Application type: **Web application**
2. Name: `OCR RAG Web Client`
3. Authorized redirect URIs:
   - `http://localhost:8000/api/sheets/oauth/callback`
   - (Add production URL later)
4. Copy **Client ID** and **Client Secret**

---

## 🔧 Step 7: Environment Configuration (5 minutes)

### Create .env File
```bash
cp .env.example .env
```

### Edit .env
```bash
# Environment
ENVIRONMENT=development

# Server
HOST=0.0.0.0
PORT=8000

# CORS
ALLOWED_ORIGINS=*

# Credentials (paths are already set correctly)
FIREBASE_CREDENTIALS=./app/config/serviceAccountKey.json
GOOGLE_APPLICATION_CREDENTIALS=./app/config/google_service_account.json
GEMINI_KEY_PATH=./app/config/gemini-key.json

# Google Sheets
GOOGLE_SHEETS_ID=YOUR_SPREADSHEET_ID_HERE

# OAuth
GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET

# OAuth Redirect
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/sheets/oauth/callback

# Encryption (generate new key)
ENCRYPTION_KEY=GENERATE_THIS_BELOW
```

### Generate Encryption Key
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
Copy output and paste as `ENCRYPTION_KEY` in `.env`

---

## ✅ Step 8: Verify Setup

### Check Files Exist
```
app/config/
├── serviceAccountKey.json          ✅
├── google_service_account.json     ✅
└── gemini-key.json                 ✅
```

### Check .env Variables
- [ ] `GOOGLE_SHEETS_ID` filled in
- [ ] `GOOGLE_OAUTH_CLIENT_ID` filled in
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` filled in
- [ ] `ENCRYPTION_KEY` generated and filled in

---

## 🚀 Step 9: Run the Application

```bash
# Make sure virtual environment is activated
# Windows: myenv\Scripts\activate
# Linux/Mac: source myenv/bin/activate

# Run the server
uvicorn main:app --reload
```

**Expected output:**
```
======================================================
OCR-RAG System Configuration
======================================================
Environment: development
Host: 0.0.0.0:8000
Tesseract Data: Auto-detect
Google Sheets ID: 1aQsdIOl38P8Rr1uUSWAEtbBHrV-EAaja9KNkGL1fPT8
OAuth Configured: True
======================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🧪 Step 10: Test It Works

### Visit API Docs
Open browser: http://localhost:8000/docs

### Test Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "company_name": "Test Company"
  }'
```

**Expected:** JSON response with `id_token`

### Test Upload (use token from signup)
```bash
curl -X POST http://localhost:8000/api/process-image \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test.pdf" \
  -F "document_type=invoice"
```

---

## 🐳 Step 11: Deploy (Optional)

### Build Docker Image
```bash
docker build -t your-username/ocr-rag-system:latest .
```

### Push to Docker Hub
```bash
docker login
docker push your-username/ocr-rag-system:latest
```

### Deploy to Render (Free)
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

**Quick steps:**
1. Go to https://render.com
2. New Web Service → Deploy from Docker Hub
3. Image: `your-username/ocr-rag-system:latest`
4. Add environment variables from `.env`
5. Deploy!

---

## 📚 Full Documentation

For detailed explanations, troubleshooting, and advanced configuration:

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup with troubleshooting
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deploy to Render, Railway, Fly.io, etc.
- **[API_ACCESS_GUIDE.md](API_ACCESS_GUIDE.md)** - API usage and examples
- **[DOCKER_PUSH_GUIDE.md](DOCKER_PUSH_GUIDE.md)** - Docker build and push
- **[DOCS_INDEX.md](DOCS_INDEX.md)** - All documentation index

---

## 🐛 Common Issues

### "Firebase credentials not found"
→ Check `app/config/serviceAccountKey.json` exists

### "Tesseract not found"
→ Install Tesseract OCR for your OS

### "Google Sheets API not enabled"
→ Enable in Google Cloud Console → APIs & Services

### "OAuth redirect URI mismatch"
→ Add exact URI to Google Cloud Console → Credentials

### "Permission denied on Google Sheets"
→ Share sheet with service account email

---

## ⏱️ Total Setup Time

- **Credentials setup**: ~30-40 minutes (one-time)
- **Code setup**: ~10 minutes
- **Testing**: ~5 minutes
- **Deployment**: ~10 minutes

**Total**: ~1 hour for first-time setup

---

## ✨ You're Done!

Your OCR-RAG System is now ready to:
- ✅ Process PDFs and images with OCR
- ✅ Extract structured data with AI
- ✅ Search documents semantically
- ✅ Chat with documents
- ✅ Sync to Google Sheets
- ✅ Multi-user authentication

**Need help?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting!
