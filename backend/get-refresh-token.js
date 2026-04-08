import { google } from 'googleapis';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    res.send(`
      <h1>Success! 🎉</h1>
      <p>Copy this refresh token to your .env file:</p>
      <pre style="background: #f4f4f4; padding: 20px; border-radius: 5px;">
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
      </pre>
      <p>Add it to backend/.env and restart the server.</p>
    `);
    
    console.log('\n✅ Refresh Token:', tokens.refresh_token);
    console.log('\nAdd this to your .env file:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (error) {
    res.send(`<h1>Error</h1><pre>${error.message}</pre>`);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🔐 Google OAuth Setup\n`);
  console.log(`1. Open this URL in your browser:`);
  console.log(`   http://localhost:${PORT}/auth\n`);
  console.log(`2. Sign in with your Google account (${process.env.SUPERADMIN_EMAIL})`);
  console.log(`3. Grant permissions`);
  console.log(`4. Copy the refresh token to .env\n`);
});
