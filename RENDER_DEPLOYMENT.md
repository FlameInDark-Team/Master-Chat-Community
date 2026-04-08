# Deploy to Render (Free Tier Available)

Render offers a free tier that supports WebSocket connections, perfect for Socket.IO.

## Important Notes About Render Free Tier

- ✅ Supports WebSockets (Socket.IO works!)
- ✅ Completely FREE
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Takes ~30 seconds to wake up on first request
- 💡 Good for demos and hobby projects

## Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com)
2. Sign up/Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository: `FlameInDark-Team/Master-Chat-Community`

## Step 2: Configure Render Service

**Basic Settings:**
- Name: `master-chat-backend` (or any name you like)
- Region: Choose closest to you
- Branch: `main`
- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

**Instance Type:**
- Select: `Free` (0$/month)

## Step 3: Add Environment Variables

Click "Advanced" → Add Environment Variables:

```
GROQ_API_KEY=your_groq_api_key
SUPERADMIN_EMAIL=your_email@example.com
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
PORT=3000
NODE_ENV=production
```

**Important:** Copy values from your local `backend/.env` file

## Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (takes 2-5 minutes)
3. Copy your Render URL (e.g., `https://master-chat-backend.onrender.com`)

## Step 5: Update Frontend Config

1. Edit `frontend/config.js`:

```javascript
window.BACKEND_URL = 'https://your-app.onrender.com';
```

2. Commit and push:

```bash
git add frontend/config.js
git commit -m "Update backend URL for Render"
git push origin main
```

## Step 6: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Other
   - Root Directory: `frontend`
   - Build Command: (leave empty)
   - Output Directory: `.`
4. Deploy!

## Step 7: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Add authorized redirect URIs:
   - `https://your-app.onrender.com/auth/google/callback`
5. Save

## Step 8: Test Your App

1. Visit your Vercel URL
2. First load might take 30 seconds (Render waking up)
3. Join as guest and send messages
4. Test AI: "ai write hello world"
5. Refresh page - messages should persist

## Dealing with Render Sleep

The free tier sleeps after 15 minutes of inactivity. Options:

### Option 1: Accept the Sleep (Recommended for Hobby Projects)
- First user waits ~30 seconds
- After that, it's fast
- Completely free

### Option 2: Keep-Alive Ping (Extends Active Time)
Add this to your frontend to ping every 10 minutes:

```javascript
// Add to frontend/app.js
setInterval(() => {
  fetch(BACKEND_URL + '/health').catch(() => {});
}, 10 * 60 * 1000); // Every 10 minutes
```

Add health endpoint to `backend/server.js`:

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

### Option 3: Use UptimeRobot (Free External Ping)
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add your Render URL
3. Set check interval to 5 minutes
4. Keeps your app awake during the day

### Option 4: Upgrade to Paid ($7/month)
- No sleep
- Better performance
- More resources

## Alternative Free Options

### 1. Railway (Recommended if Render is too slow)
- Free tier: 500 hours/month ($5 credit)
- No sleep issues
- Better for real-time apps
- See `RAILWAY_DEPLOYMENT.md`

### 2. Fly.io
- Free tier: 3 shared VMs
- No sleep
- More complex setup

### 3. Glitch
- Free tier available
- Sleeps after 5 minutes
- Easier than Render

## Cost Comparison

| Platform | Free Tier | Sleep | WebSocket | Best For |
|----------|-----------|-------|-----------|----------|
| Render | ✅ Yes | ⚠️ 15 min | ✅ Yes | Demos |
| Railway | ✅ 500h | ❌ No | ✅ Yes | Production |
| Vercel | ✅ Yes | ❌ No | ❌ No | Frontend only |
| Fly.io | ✅ 3 VMs | ❌ No | ✅ Yes | Advanced users |

## Troubleshooting

### App takes long to load
- Normal for Render free tier (waking up from sleep)
- Use UptimeRobot to keep it awake
- Or upgrade to paid tier

### Connection errors
- Check Render logs for errors
- Verify all environment variables are set
- Ensure `frontend/config.js` has correct Render URL

### Messages not saving
- Run SQL in Supabase: `ALTER TABLE messages DISABLE ROW LEVEL SECURITY;`
- Check Render logs for Supabase errors

### File uploads failing
- Verify Google OAuth credentials
- Check refresh token is valid
- Update redirect URI in Google Console

## Recommended Setup for Free Hosting

**Best Free Option:**
- Backend: Render (free, accepts sleep)
- Frontend: Vercel (free, no sleep)
- Database: Supabase (free tier)
- Storage: Google Drive (15GB free)

**Total Cost: $0/month** ✅

**If you need no-sleep backend:**
- Use Railway (500 hours free = ~20 days)
- Or upgrade Render to $7/month
