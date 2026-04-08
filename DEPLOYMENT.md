# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (for frontend)
- Railway/Render/Fly.io account (for backend)
- Supabase project (already set up)
- Google Cloud project (already set up)

## Step 1: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Chat app with AI moderation"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/HamidDark-Team/Master-Chat-Community.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend (Railway - Recommended)

### Option A: Railway (Easiest)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Node.js
6. Add environment variables:
   - Click on your service → Variables tab
   - Add all variables from `.env.example`
   - Set `PORT` to `3000` (Railway will override with $PORT)
7. Set root directory to `backend`:
   - Settings → Root Directory → `backend`
8. Deploy!
9. Copy your Railway URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Name: `chat-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables (same as Railway)
6. Create Web Service
7. Copy your Render URL

### Option C: Fly.io

```bash
cd backend
fly launch
# Follow prompts
fly secrets set GROQ_API_KEY=your_key
fly secrets set SUPABASE_URL=your_url
# ... set all other secrets
fly deploy
```

## Step 3: Deploy Frontend (Vercel)

### Update Frontend Configuration

1. Open `frontend/app.js`
2. Replace `http://localhost:3000` with your backend URL:

```javascript
const socket = io('https://your-backend-url.railway.app');

// Also update in upload function:
const response = await fetch('https://your-backend-url.railway.app/upload', {
  method: 'POST',
  body: formData
});

// And in AI chat function:
const response = await fetch('https://your-backend-url.railway.app/ai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text })
});
```

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. Settings:
   - Framework Preset: Other
   - Root Directory: `frontend`
   - Build Command: (leave empty)
   - Output Directory: `.`
5. Deploy!
6. Your app will be live at `https://your-app.vercel.app`

### Alternative: Netlify

1. Go to [netlify.com](https://netlify.com)
2. New site from Git
3. Select your repo
4. Settings:
   - Base directory: `frontend`
   - Build command: (leave empty)
   - Publish directory: `frontend`
5. Deploy!

## Step 4: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URI:
   - `https://your-backend-url.railway.app/auth/google/callback`
5. Update `GOOGLE_REDIRECT_URI` in Railway environment variables

## Step 5: Update CORS (Backend)

In `backend/server.js`, update CORS to allow your frontend:

```javascript
const io = new Server(httpServer, {
  cors: { 
    origin: ['https://your-app.vercel.app', 'http://localhost:*'],
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 10e6
});

app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:*']
}));
```

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Join as guest
3. Send a message
4. Try "ai help me write a hello world in Python"
5. Upload a file
6. Test SuperAdmin login

## Troubleshooting

### Backend not connecting
- Check Railway/Render logs
- Verify all environment variables are set
- Check if backend URL is correct in frontend

### File uploads failing
- Verify Google OAuth credentials
- Check refresh token is valid
- Ensure Google Drive API is enabled

### AI not responding
- Check Groq API key is valid
- Check backend logs for errors
- Verify Groq API quota

### Database errors
- Verify Supabase credentials
- Check if messages table exists
- Run the SQL schema from README.md

## Cost Breakdown (Free Tiers)

- Railway: 500 hours/month free ($5 credit)
- Vercel: Unlimited deployments
- Supabase: 500MB database, 2GB bandwidth
- Groq API: Free tier available
- Google Drive: 15GB free storage

## Production Checklist

- [ ] Environment variables set on Railway/Render
- [ ] Frontend updated with backend URL
- [ ] Google OAuth redirect URI updated
- [ ] CORS configured properly
- [ ] Supabase database created
- [ ] Test all features in production
- [ ] Monitor logs for errors

## Scaling Considerations

For high traffic:
- Upgrade Railway to Pro ($5/month)
- Use Redis for session management
- Add rate limiting
- Implement message pagination
- Use CDN for file uploads
- Add database indexes

## Support

If you encounter issues:
1. Check Railway/Render logs
2. Check browser console
3. Verify all environment variables
4. Test API endpoints directly
