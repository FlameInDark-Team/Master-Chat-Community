// Auto-detect environment
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin;

let socket;
let currentUser = null;
let aiChatHistory = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const guestBtn = document.getElementById('guestBtn');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const currentUserSpan = document.getElementById('currentUser');
const userCountSpan = document.getElementById('userCount');

// Initialize Socket.IO connection
function initSocket() {
  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Socket events
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showNotification('Connection lost. Reconnecting...');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    showNotification('Connection error. Please refresh the page.');
  });

  socket.on('init', (data) => {
    currentUser = data.user;
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    currentUserSpan.textContent = currentUser.username;
    
    // Load existing messages
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(msg => displayMessage(msg));
    }
  });

  socket.on('message', (msg) => {
    displayMessage(msg);
  });

  socket.on('messageDeleted', (messageId) => {
    const msgElement = document.querySelector(`[data-id="${messageId}"]`);
    if (msgElement) msgElement.remove();
  });

  socket.on('userJoined', (data) => {
    userCountSpan.textContent = `${data.userCount} users`;
    addSystemMessage(`${data.username} joined the chat`);
  });

  socket.on('userLeft', (data) => {
    userCountSpan.textContent = `${data.userCount} users`;
    addSystemMessage(`${data.username} left the chat`);
  });

  socket.on('warning', (data) => {
    showNotification(`⚠️ Warning ${data.count}/5: ${data.message}`);
  });

  socket.on('tempBan', (data) => {
    showNotification('You have been temporarily banned for 1 minute');
    messageInput.disabled = true;
    setTimeout(() => {
      messageInput.disabled = false;
      showNotification('You can chat again');
    }, data.duration);
  });

  socket.on('banned', (data) => {
    showNotification(`You have been permanently banned: ${data.reason}`);
    messageInput.disabled = true;
    sendBtn.disabled = true;
  });
}

// Initialize Google Sign-In
function initGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: '484598065249-6rp6s9res1raad2qed4m5u0tom4sdrmo.apps.googleusercontent.com',
    callback: handleGoogleSignIn
  });

  google.accounts.id.renderButton(
    document.getElementById('googleSignIn'),
    { 
      theme: 'outline', 
      size: 'large',
      text: 'signin_with',
      width: 300
    }
  );
}

// Handle Google Sign-In
function handleGoogleSignIn(response) {
  // Decode JWT token to get user info
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  const email = payload.email;
  
  console.log('Google Sign-In:', email);
  
  // Join chat with email
  socket.emit('join', { email });
}

// Login handlers
guestBtn.addEventListener('click', () => {
  socket.emit('join', { email: null });
});

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  
  socket.emit('message', { text });
  messageInput.value = '';
}

// Display message
function displayMessage(msg) {
  const div = document.createElement('div');
  div.className = `message ${msg.user_id === socket.id ? 'own' : ''} ${msg.is_ai ? 'ai-message-bubble' : ''}`;
  div.setAttribute('data-id', msg.id);
  
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  let html = `
    <div class="message-header">
      <span class="message-username ${msg.is_superadmin ? 'superadmin' : ''} ${msg.is_ai ? 'ai-username' : ''}">${escapeHtml(msg.username)}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-content">${formatMessageText(msg.text)}</div>
  `;
  
  if (msg.file_url) {
    html += `
      <div class="file-attachment">
        <span>${msg.file_type && msg.file_type.includes('image') ? '🖼️' : '📄'}</span>
        <a href="${msg.file_url}" target="_blank">${escapeHtml(msg.file_name)}</a>
      </div>
    `;
  }
  
  if (currentUser?.isSuperAdmin && !msg.is_ai) {
    html += `
      <div class="message-actions">
        <button class="btn-delete" onclick="deleteMessage('${msg.id}')">Delete</button>
      </div>
    `;
  }
  
  div.innerHTML = html;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Format message text with code blocks
function formatMessageText(text) {
  // Escape HTML first
  const escaped = escapeHtml(text);
  
  // Format code blocks (```code```)
  let formatted = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Format inline code (`code`)
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Preserve line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.style.textAlign = 'center';
  div.style.color = '#999';
  div.style.fontSize = '0.875rem';
  div.style.margin = '1rem 0';
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function deleteMessage(messageId) {
  socket.emit('deleteMessage', messageId);
}

// File upload
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('socketId', socket.id);
  
  try {
    showNotification('Uploading...');
    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showNotification('File uploaded successfully!');
    } else {
      showNotification('Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Upload failed');
  }
  
  fileInput.value = '';
});

// Utilities
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message) {
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = message;
  document.body.appendChild(notif);
  
  setTimeout(() => notif.remove(), 3000);
}

// Initialize on page load
window.addEventListener('load', () => {
  initSocket();
  initGoogleSignIn();
});