# Deploy Backend to Railway (Recommended for WebSocket Support)

Railway supports persistent WebSocket connections, making it perfect for Socket.IO.

## Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `FlameInDark-Team/Master-Chat-Community`
5. Railway will auto-detect Node.js

## Step 2: Configure Railway

1. **Set Root Directory:**
   - Click on your service
   - Settings → Root Directory → `backend`
   - Save

2. **Add Environment Variables:**
   - Click Variables tab
   - Copy these from your local `.env` file:

```
GROQ_API_KEY=your_groq_api_key
SUPERADMIN_EMAIL=your_email@example.com
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-railway-url.railway.app/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
PORT=3000
```

3. **Deploy:**
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Copy your Railway URL (e.g., `https://master-chat-community-production.up.railway.app`)

## Step 3: Update Frontend Configuration

1. Open `frontend/config.js`
2. Replace the URL with your Railway URL:

```javascript
window.BACKEND_URL = 'https://your-app.railway.app';
```

3. Commit and push:

```bash
git add frontend/config.js
git commit -m "Update backend URL for production"
git push origin main
```

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Other
   - Root Directory: `frontend`
   - Build Command: (leave empty)
   - Output Directory: `.`
4. Deploy!

## Step 5: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Add authorized redirect URIs:
   - `https://your-railway-url.railway.app/auth/google/callback`
5. Save

## Step 6: Test Your App

1. Visit your Vercel URL
2. Join as guest
3. Send messages
4. Test AI: "ai write hello world"
5. Test Google Sign-In
6. Refresh page - messages should persist

## Cost

- **Railway Free Tier:** 500 hours/month ($5 credit)
- **Vercel Free Tier:** Unlimited deployments
- **Total:** FREE for hobby projects!

## Troubleshooting

### Backend not connecting
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure `frontend/config.js` has correct Railway URL

### Messages not saving
- Run SQL in Supabase: `ALTER TABLE messages DISABLE ROW LEVEL SECURITY;`
- Check Railway logs for Supabase errors

### File uploads failing
- Verify Google OAuth credentials
- Check refresh token is valid
- Ensure Google Drive API is enabled

## Alternative: Render

If you prefer Render over Railway:

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables
6. Deploy

Note: Render free tier sleeps after inactivity, Railway is better for real-time apps.
