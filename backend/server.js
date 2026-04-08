import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { google } from 'googleapis';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 10e6,
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Google Drive setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Storage
const upload = multer({ dest: 'uploads/' });

// In-memory user tracking
const users = new Map();
const userWarnings = new Map();

// Generate random username
function generateUsername() {
  const adjectives = ['Happy', 'Clever', 'Swift', 'Bright', 'Cool', 'Smart', 'Quick', 'Bold'];
  const nouns = ['Panda', 'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Hawk'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 1000)}`;
}

// AI moderation
async function moderateMessage(message) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'system',
        content: 'You are a chat moderator. Analyze if the message contains spam, vulgar language, or inappropriate content. Respond with only "VIOLATION" if it violates rules, or "OK" if acceptable.'
      }, {
        role: 'user',
        content: message
      }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 10
    });
    
    return completion.choices[0]?.message?.content?.trim() === 'VIOLATION';
  } catch (error) {
    console.error('AI moderation error:', error);
    return false;
  }
}

// Upload to Google Drive
async function uploadToDrive(filePath, fileName, mimeType) {
  try {
    const fileMetadata = { name: fileName };
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });
    
    // Make file accessible
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    
    fs.unlinkSync(filePath);
    return file.data;
  } catch (error) {
    console.error('Drive upload error:', error);
    throw error;
  }
}

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', async ({ email }) => {
    try {
      const isSuperAdmin = email === process.env.SUPERADMIN_EMAIL;
      const username = isSuperAdmin ? '👑 SuperAdmin' : generateUsername();
      
      users.set(socket.id, {
        id: socket.id,
        username,
        email,
        isSuperAdmin,
        banned: false
      });
      
      console.log(`User joined: ${username} (${socket.id})`);
      
      // Load chat history from Supabase
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) {
        console.error('Supabase error loading messages:', error);
      } else {
        console.log(`Loaded ${messages?.length || 0} messages from database`);
      }
      
      socket.emit('init', {
        user: users.get(socket.id),
        messages: messages || []
      });
      
      io.emit('userJoined', { username, userCount: users.size });
    } catch (error) {
      console.error('Join error:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });
  
  socket.on('message', async (data) => {
    const user = users.get(socket.id);
    if (!user || user.banned) return;
    
    try {
      // Skip moderation for superadmin
      if (!user.isSuperAdmin) {
        const isViolation = await moderateMessage(data.text);
        
        if (isViolation) {
          const warnings = (userWarnings.get(socket.id) || 0) + 1;
          userWarnings.set(socket.id, warnings);
          
          if (warnings >= 5) {
            user.banned = true;
            socket.emit('banned', { reason: 'Multiple violations', permanent: true });
            socket.disconnect();
            return;
          } else if (warnings >= 3) {
            socket.emit('warning', { count: warnings, message: 'Your message violated chat rules' });
            setTimeout(() => socket.emit('tempBan', { duration: 60000 }), 0);
            return;
          } else {
            socket.emit('warning', { count: warnings, message: 'Please follow chat rules' });
            return;
          }
        }
      }
      
      const message = {
        id: Date.now().toString() + socket.id,
        user_id: socket.id,
        username: user.username,
        text: data.text,
        is_superadmin: user.isSuperAdmin,
        is_ai: false,
        created_at: new Date().toISOString()
      };
      
      // Save to Supabase
      const { error: insertError } = await supabase.from('messages').insert(message);
      if (insertError) {
        console.error('Error saving message:', insertError);
      } else {
        console.log('Message saved:', message.id);
      }
      
      io.emit('message', message);
      
      // Check if message mentions AI
      if (data.text.toLowerCase().includes('ai')) {
        // Extract the question (remove "ai" and clean up)
        const question = data.text.replace(/\bai\b/gi, '').trim();
        
        if (question.length > 0) {
          try {
            const completion = await groq.chat.completions.create({
              messages: [{
                role: 'system',
                content: 'You are an expert coding assistant in a chat room. Provide clear, concise, and helpful responses. Format code with proper syntax.'
              }, {
                role: 'user',
                content: question
              }],
              model: 'llama-3.3-70b-versatile',
              temperature: 0.7,
              max_tokens: 1500
            });
            
            const aiResponse = completion.choices[0]?.message?.content;
            
            if (aiResponse) {
              const aiMessage = {
                id: Date.now().toString() + 'ai',
                user_id: 'ai-bot',
                username: '🤖 AI Assistant',
                text: aiResponse,
                is_superadmin: false,
                is_ai: true,
                created_at: new Date().toISOString()
              };
              
              const { error: aiInsertError } = await supabase.from('messages').insert(aiMessage);
              if (aiInsertError) {
                console.error('Error saving AI message:', aiInsertError);
              } else {
                console.log('AI message saved:', aiMessage.id);
              }
              
              io.emit('message', aiMessage);
            }
          } catch (error) {
            console.error('AI response error:', error);
          }
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  });
  
  socket.on('deleteMessage', async (messageId) => {
    const user = users.get(socket.id);
    if (!user?.isSuperAdmin) return;
    
    await supabase.from('messages').delete().eq('id', messageId);
    io.emit('messageDeleted', messageId);
  });
  
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      io.emit('userLeft', { username: user.username, userCount: users.size - 1 });
    }
    users.delete(socket.id);
    userWarnings.delete(socket.id);
  });
});

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const socketId = req.body.socketId;
    const user = users.get(socketId);
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Upload to Google Drive
    const driveFile = await uploadToDrive(
      file.path,
      file.originalname,
      file.mimetype
    );
    
    const message = {
      id: Date.now() + socketId,
      user_id: socketId,
      username: user?.username || 'Anonymous',
      text: `Uploaded: ${file.originalname}`,
      file_url: driveFile.webViewLink,
      file_name: file.originalname,
      file_type: file.mimetype,
      is_superadmin: user?.isSuperAdmin || false,
      created_at: new Date().toISOString()
    };
    
    await supabase.from('messages').insert(message);
    io.emit('message', message);
    
    res.json({ success: true, file: driveFile });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

export default httpServer;
