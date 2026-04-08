# Vercel Deployment Guide

## Quick Deploy (Easiest Method)

### Step 1: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Chat app with AI"

# Add remote
git remote add origin https://github.com/HamidDark-Team/Master-Chat-Community.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository: `Master-Chat-Community`
5. Configure project:
   - Framework Preset: **Other**
   - Root Directory: **Leave as is (root)**
   - Build Command: **Leave empty**
   - Output Directory: **Leave empty**
6. Click "Deploy"

### Step 3: Add Environment Variables

After deployment, go to your project settings:

1. Project Settings → Environment Variables
2. Add these variables:

```
GROQ_API_KEY=your_groq_api_key_here
SUPERADMIN_EMAIL=your_email@example.com
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
```

**Note:** Copy these values from your `backend/.env` file (which is gitignored and won't be pushed to GitHub).

3. Replace `your-app` in `GOOGLE_REDIRECT_URI` with your actual Vercel app name
4. Click "Save"

### Step 4: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URI:
   - `https://your-app.vercel.app/auth/google/callback`
5. Save

### Step 5: Redeploy

1. Go to Vercel dashboard
2. Click "Redeploy" to apply environment variables
3. Wait for deployment to complete

### Step 6: Update Supabase

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;
```

## Your App is Live! 🎉

Visit: `https://your-app.vercel.app`

## Testing

1. Open your Vercel URL
2. Click "Join as Guest"
3. Send a message: "Hey ai, help me write hello world in Python"
4. AI should respond automatically in the chat
5. Test file upload
6. Test SuperAdmin login with your email

## Important Notes

### Vercel Limitations

⚠️ **Socket.IO on Vercel has limitations:**
- Vercel uses serverless functions (no persistent connections)
- Socket.IO works but may have connection issues
- For production, consider using Vercel for frontend + Railway/Render for backend

### Alternative: Hybrid Deployment (Recommended)

**Frontend on Vercel + Backend on Railway:**

1. Deploy backend to Railway (see DEPLOYMENT.md)
2. Update `frontend/app.js`:
   ```javascript
   const BACKEND_URL = 'https://your-backend.railway.app';
   ```
3. Deploy frontend to Vercel

This gives you:
- ✅ Fast frontend (Vercel CDN)
- ✅ Reliable WebSocket connections (Railway)
- ✅ Better performance

## Troubleshooting

### Socket.IO not connecting
- Check browser console for errors
- Verify environment variables are set
- Try hybrid deployment (Vercel + Railway)

### AI not responding
- Check Vercel function logs
- Verify Groq API key
- Check if "ai" keyword is in message

### File uploads failing
- Verify Google credentials
- Check refresh token is valid
- Ensure redirect URI matches

## Monitoring

- Vercel Dashboard → Your Project → Logs
- Check function execution time
- Monitor bandwidth usage

## Cost

- Vercel Free Tier:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Serverless function execution included

## Support

If Socket.IO doesn't work well on Vercel, use the hybrid approach:
- Frontend: Vercel (free)
- Backend: Railway (free tier: 500 hours/month)

This is the recommended production setup!
