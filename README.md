# 💬 Master Chat Community

A real-time chat application with AI-powered moderation, file uploads to Google Drive, and an integrated coding assistant that responds when mentioned in chat.

## Features

- 💬 Real-time chat without sign-in required
- 🤖 AI moderation using Groq API (llama-3.1-70b-versatile)
- 👑 SuperAdmin controls (delete messages, immune to moderation)
- 📎 File uploads (images/PDFs) saved to Google Drive
- 🧠 AI coding assistant in sidebar
- ⚠️ Warning system (5 warnings = permanent ban)
- 📱 Responsive design for mobile and desktop

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run:

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_superadmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

4. Get your project URL and anon key from Settings > API
5. Update `backend/.env` with your Supabase credentials

### 2. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
5. Download credentials and add to `backend/.env`
6. Get refresh token (you'll need to run OAuth flow once)

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start the Server

```bash
npm start
```

### 5. Open Frontend

Open `frontend/index.html` in your browser or serve it with:

```bash
npx serve frontend
```

## Deployment Options

### Vercel (Recommended for Frontend)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy frontend: `cd frontend && vercel`

### Railway/Fly.io (Recommended for Backend)

Railway:
```bash
cd backend
railway login
railway init
railway up
```

Fly.io:
```bash
cd backend
fly launch
fly deploy
```

### Environment Variables

Make sure to set all environment variables in your deployment platform:
- `GROQ_API_KEY`
- `SUPERADMIN_EMAIL`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

## Usage

1. Click "Join as Guest" to chat anonymously
2. SuperAdmin can sign in with: `usertest2021subhradeep@gmail.com`
3. Click 🤖 to open AI coding assistant
4. Click 📎 to upload files (saved to your Google Drive)
5. SuperAdmin can delete any message

## AI Moderation Rules

- Spam detection
- Vulgar language filtering
- 3 warnings = 1 minute temporary ban
- 5 warnings = permanent ban
- SuperAdmin is immune to all rules

## Tech Stack

- Frontend: Vanilla JS, Socket.IO client
- Backend: Node.js, Express, Socket.IO
- Database: Supabase (PostgreSQL)
- AI: Groq API (llama-3.1-70b-versatile)
- Storage: Google Drive API
- Deployment: Vercel (frontend) + Railway/Fly.io (backend)

## Notes

- The Groq API key is already included in `.env`
- Update the Socket.IO connection URL in `frontend/app.js` after deployment
- Google Drive setup requires OAuth flow - follow Google's documentation
- For production, use HTTPS and update CORS settings
