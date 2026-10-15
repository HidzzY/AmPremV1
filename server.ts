import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// In-Memory & File-backed Real-time state store
const DATA_DIR = path.resolve(__dirname, '.data');
const DATA_FILE = path.join(DATA_DIR, 'realtime_store.json');

export interface RealtimeUser {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  role: 'admin' | 'free' | 'vip';
  daily_limit: number;
  used_limit_today: number;
  last_limit_reset: string;
  created_at: string;
}

const DEFAULT_ADMIN_USER: RealtimeUser = {
  id: 'user-admin-wahid',
  email: 'wahidrahmannn1324@gmail.com',
  username: 'AlcaW44',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  role: 'admin',
  daily_limit: 9999,
  used_limit_today: 0,
  last_limit_reset: new Date().toISOString(),
  created_at: new Date().toISOString()
};

interface RealtimeState {
  chats: Array<{
    id: string;
    user_id: string;
    username: string;
    avatar_url: string;
    role: 'free' | 'vip' | 'admin';
    message: string;
    created_at: string;
  }>;
  presets: Array<{
    id: string;
    title: string;
    link: string;
    preview_url: string;
    category: string;
    downloads: number;
    user_id: string;
    username: string;
    avatar_url: string;
    created_at: string;
  }>;
  gallery: Array<{
    id: string;
    image_url: string;
    caption: string;
    likes: number;
    user_id: string;
    username: string;
    avatar_url: string;
    created_at: string;
  }>;
  amLogs: Array<{
    id: string;
    target_email: string;
    created_at: string;
    user_id: string;
    username: string;
    avatar: string;
  }>;
  users: Array<{
    id: string;
    email: string;
    username: string;
    avatar_url: string;
    role: 'free' | 'vip' | 'admin';
    daily_limit: number;
    used_limit_today: number;
    last_limit_reset: string;
    created_at: string;
  }>;
  redeemCodes: Array<{
    code: string;
    limit_reward: number;
    created_at: string;
  }>;
}

// Initial state: ZERO presets, ZERO chats, ZERO gallery, ZERO logs, ZERO redeem codes, only 1 Admin user (AlcaW44)
let realtimeState: RealtimeState = {
  chats: [],
  presets: [],
  gallery: [],
  amLogs: [],
  redeemCodes: [],
  users: [DEFAULT_ADMIN_USER]
};

// Load saved state if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed) {
      realtimeState = {
        chats: Array.isArray(parsed.chats) ? parsed.chats : [],
        presets: Array.isArray(parsed.presets) ? parsed.presets : [],
        gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
        amLogs: Array.isArray(parsed.amLogs) ? parsed.amLogs : [],
        redeemCodes: Array.isArray(parsed.redeemCodes) ? parsed.redeemCodes : [],
        users: Array.isArray(parsed.users) && parsed.users.length > 0 
          ? parsed.users.map((u: any): RealtimeUser => ({
              ...u,
              role: (u.email === 'wahidrahmannn1324@gmail.com' ? 'admin' : (u.role || 'free')) as 'admin' | 'free' | 'vip',
              username: u.email === 'wahidrahmannn1324@gmail.com' ? 'AlcaW44' : u.username
            }))
          : [DEFAULT_ADMIN_USER]
      };
    }
  }
} catch (e) {
  console.warn('[RealtimeStore] Using fresh initial state');
}

function persistState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(realtimeState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[RealtimeStore] Persist error:', err);
  }
}

// Whitelist email domains allowed by policy for login/register
const ALLOWED_EMAIL_DOMAINS = [
  '@gmail.com',
  '@yahoo.com',
  '@yahoo.co.id',
  '@outlook.com',
  '@hotmail.com',
  '@icloud.com'
];

function isAllowedDomain(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const lower = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(domain => lower.endsWith(domain));
}

// 1. POST /api/am/send-link
// Proxies request securely to Alight Motion Worker without leaking endpoint to client
app.post('/api/am/send-link', async (req, res) => {
  try {
    const { email, userId, dailyLimit, usedToday } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Alamat email target tidak valid.' });
    }

    // Limit check if provided
    if (typeof dailyLimit === 'number' && typeof usedToday === 'number') {
      if (usedToday >= dailyLimit) {
        return res.status(403).json({
          success: false,
          message: 'Limit harian Anda sudah habis. Silakan tunggu reset 24 jam atau upgrade ke VIP untuk 100x limit harian!'
        });
      }
    }

    const WORKER_ENDPOINT = 'https://satriam.satriadeveloperz.workers.dev/api/satriam/send-link';

    console.log(`[AM Proxy] Sending link request for ${email}`);
    
    const workerResponse = await fetch(WORKER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AlightPro-Proxy/1.0 (AlcaW44 Secure Client)'
      },
      body: JSON.stringify({ email: email.trim() })
    });

    const responseData = await workerResponse.json().catch(() => null);

    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({
        success: false,
        message: responseData?.message || responseData?.error || 'Gagal mengirim link dari server worker Alight Motion.',
        details: responseData
      });
    }

    return res.status(200).json({
      success: true,
      message: responseData?.message || 'Link verifikasi Alight Motion berhasil dikirim ke email tujuan!',
      data: responseData
    });
  } catch (err: any) {
    console.error('[AM Proxy] Send Link Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal proxy server: ' + (err?.message || 'Unknown error')
    });
  }
});

// 2. POST /api/am/verify-link
// Proxies verification of magic link to Alight Motion Worker
app.post('/api/am/verify-link', async (req, res) => {
  try {
    const { email, magicLink, userId } = req.body;

    if (!email || !magicLink) {
      return res.status(400).json({
        success: false,
        message: 'Email dan Magic Link dari Alight Motion wajib diisi.'
      });
    }

    const WORKER_ENDPOINT = 'https://satriam.satriadeveloperz.workers.dev/api/satriam/verify-link';

    console.log(`[AM Proxy] Verifying link for ${email}`);

    const workerResponse = await fetch(WORKER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AlightPro-Proxy/1.0 (AlcaW44 Secure Client)'
      },
      body: JSON.stringify({
        email: email.trim(),
        magicLink: magicLink.trim()
      })
    });

    const responseData = await workerResponse.json().catch(() => null);

    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({
        success: false,
        message: responseData?.message || responseData?.error || 'Verifikasi magic link gagal atau link kadaluarsa.',
        details: responseData
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: responseData?.message || 'Akun Alight Motion Premium berhasil diverifikasi dan aktif!',
      data: responseData,
      logEntry: {
        target_email: email,
        created_at: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error('[AM Proxy] Verify Link Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses verifikasi link: ' + (err?.message || 'Unknown error')
    });
  }
});

// ==========================================
// REAL-TIME SYNC & SSE STREAM (Instant Multi-User Chat, Preset, Gallery, Logs, Users & Limit)
// ==========================================

// Connected SSE clients for instantaneous real-time push (<50ms latency)
const sseClients = new Set<express.Response>();

function broadcastSSE(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// GET /api/realtime/stream -> Real-time Server-Sent Events stream for all connected browsers
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial snapshot immediately upon connection
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: realtimeState, timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);
  console.log(`[SSE] Client connected. Total active clients: ${sseClients.size}`);

  // Heartbeat keep-alive every 15 seconds to prevent proxy timeout
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    console.log(`[SSE] Client disconnected. Total active clients: ${sseClients.size}`);
  });
});

// GET /api/realtime/sync -> Full realtime state snapshot
app.get('/api/realtime/sync', (req, res) => {
  res.json({
    success: true,
    data: realtimeState,
    activeConnections: sseClients.size,
    timestamp: new Date().toISOString()
  });
});

// POST /api/realtime/chat -> Add new chat message & broadcast INSTANTLY to all users
app.post('/api/realtime/chat', (req, res) => {
  const { user_id, username, avatar_url, role, message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
  }

  const cleanMessage = String(message).trim();
  const newChat = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    user_id: user_id || 'anonymous',
    username: username || 'User',
    avatar_url: avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'anon'}`,
    role: (role === 'admin' ? 'admin' : role === 'vip' ? 'vip' : 'free') as 'free' | 'vip' | 'admin',
    message: cleanMessage,
    created_at: new Date().toISOString()
  };

  realtimeState.chats.push(newChat);
  // Keep last 200 chats
  if (realtimeState.chats.length > 200) {
    realtimeState.chats = realtimeState.chats.slice(-200);
  }
  persistState();

  // Instant broadcast to all connected clients!
  broadcastSSE('NEW_CHAT', { chat: newChat, chats: realtimeState.chats });

  console.log(`[Chat] Real-time message from ${newChat.username}: "${cleanMessage.substring(0, 30)}..." pushed to ${sseClients.size} clients`);

  res.json({ success: true, chat: newChat, chats: realtimeState.chats });
});

// POST /api/realtime/preset -> Upload preset & broadcast
app.post('/api/realtime/preset', (req, res) => {
  const { title, link, preview_url, category, user_id, username, avatar_url } = req.body;
  if (!title || !link) {
    return res.status(400).json({ success: false, message: 'Judul dan link preset wajib diisi' });
  }

  const newPreset = {
    id: 'preset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title: String(title).trim(),
    link: String(link).trim(),
    preview_url: preview_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    category: category || 'Jedag Jedug',
    downloads: 0,
    user_id: user_id || 'user-anon',
    username: username || 'Kreator',
    avatar_url: avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'kreator'}`,
    created_at: new Date().toISOString()
  };

  realtimeState.presets.unshift(newPreset);
  persistState();

  broadcastSSE('PRESETS_UPDATED', { presets: realtimeState.presets, newPreset });

  res.json({ success: true, preset: newPreset, presets: realtimeState.presets });
});

// DELETE /api/realtime/preset/:id -> Delete preset & broadcast
app.delete('/api/realtime/preset/:id', (req, res) => {
  const { id } = req.params;
  realtimeState.presets = realtimeState.presets.filter(p => p.id !== id);
  persistState();
  broadcastSSE('PRESETS_UPDATED', { presets: realtimeState.presets });
  res.json({ success: true, presets: realtimeState.presets });
});

// POST /api/realtime/preset/:id/download -> Increment download count & broadcast
app.post('/api/realtime/preset/:id/download', (req, res) => {
  const { id } = req.params;
  const p = realtimeState.presets.find(item => item.id === id);
  if (p) {
    p.downloads = (p.downloads || 0) + 1;
    persistState();
    broadcastSSE('PRESETS_UPDATED', { presets: realtimeState.presets });
  }
  res.json({ success: true, presets: realtimeState.presets });
});

// POST /api/realtime/gallery -> Upload gallery item & broadcast
app.post('/api/realtime/gallery', (req, res) => {
  const { image_url, caption, user_id, username, avatar_url } = req.body;
  if (!image_url) {
    return res.status(400).json({ success: false, message: 'Gambar wajib diunggah' });
  }

  const newItem = {
    id: 'gallery-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    image_url,
    caption: caption || '',
    likes: 0,
    user_id: user_id || 'user-anon',
    username: username || 'Kreator',
    avatar_url: avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'kreator'}`,
    created_at: new Date().toISOString()
  };

  realtimeState.gallery.unshift(newItem);
  persistState();
  broadcastSSE('GALLERY_UPDATED', { gallery: realtimeState.gallery, newItem });
  res.json({ success: true, item: newItem, gallery: realtimeState.gallery });
});

// POST /api/realtime/gallery/:id/like -> Toggle like & broadcast
app.post('/api/realtime/gallery/:id/like', (req, res) => {
  const { id } = req.params;
  const g = realtimeState.gallery.find(item => item.id === id);
  if (g) {
    g.likes = (g.likes || 0) + 1;
    persistState();
    broadcastSSE('GALLERY_UPDATED', { gallery: realtimeState.gallery });
  }
  res.json({ success: true, gallery: realtimeState.gallery });
});

// POST /api/realtime/am-log -> Record account creation & update real-time "Terpakai" limit!
app.post('/api/realtime/am-log', (req, res) => {
  const { targetEmail, userId, username, avatar } = req.body;
  if (!targetEmail) {
    return res.status(400).json({ success: false, message: 'Email target wajib diisi' });
  }

  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    target_email: String(targetEmail).trim(),
    created_at: new Date().toISOString(),
    user_id: userId || 'guest',
    username: username || 'Guest',
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'guest'}`
  };

  realtimeState.amLogs.unshift(newLog);

  // Update real-time "Terpakai" limit in user record!
  if (userId) {
    const userIndex = realtimeState.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      realtimeState.users[userIndex].used_limit_today = (realtimeState.users[userIndex].used_limit_today || 0) + 1;
    }
  }

  persistState();
  broadcastSSE('AM_LOGS_UPDATED', { log: newLog, amLogs: realtimeState.amLogs, users: realtimeState.users });
  res.json({ success: true, log: newLog, amLogs: realtimeState.amLogs, users: realtimeState.users });
});

// POST /api/realtime/users/sync -> Sync user profile into server user list & broadcast
app.post('/api/realtime/users/sync', (req, res) => {
  const { user } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ success: false, message: 'Invalid user payload' });
  }

  const existingIdx = realtimeState.users.findIndex(u => u.id === user.id || u.email === user.email);
  if (existingIdx !== -1) {
    // Preserve server-authoritative used_limit_today and daily_limit if already tracked
    const existing = realtimeState.users[existingIdx];
    realtimeState.users[existingIdx] = {
      ...user,
      used_limit_today: Math.max(existing.used_limit_today || 0, user.used_limit_today || 0),
      daily_limit: existing.daily_limit || user.daily_limit || 5,
      role: user.email === 'wahidrahmannn1324@gmail.com' ? 'admin' : (existing.role || user.role || 'free'),
      username: user.email === 'wahidrahmannn1324@gmail.com' ? 'AlcaW44' : user.username
    };
  } else {
    realtimeState.users.push({
      ...user,
      role: user.email === 'wahidrahmannn1324@gmail.com' ? 'admin' : (user.role || 'free'),
      username: user.email === 'wahidrahmannn1324@gmail.com' ? 'AlcaW44' : user.username
    });
  }

  persistState();
  broadcastSSE('USERS_UPDATED', { users: realtimeState.users });
  res.json({ success: true, users: realtimeState.users });
});

// POST /api/realtime/users/admin-action -> Admin changes limit, resets limit, or changes role
app.post('/api/realtime/users/admin-action', (req, res) => {
  const { action, userId, newLimit, role, broadcastAdd } = req.body;

  if (action === 'set_limit' && userId) {
    const u = realtimeState.users.find(item => item.id === userId);
    if (u) u.daily_limit = newLimit;
  } else if (action === 'reset_limit' && userId) {
    const u = realtimeState.users.find(item => item.id === userId);
    if (u) {
      u.used_limit_today = 0;
      u.last_limit_reset = new Date().toISOString();
    }
  } else if (action === 'broadcast_limit' && typeof broadcastAdd === 'number') {
    realtimeState.users.forEach(u => {
      u.daily_limit = (u.daily_limit || 5) + broadcastAdd;
    });
  } else if (action === 'change_role' && userId && role) {
    const u = realtimeState.users.find(item => item.id === userId);
    if (u && u.email !== 'wahidrahmannn1324@gmail.com') {
      u.role = role;
      u.daily_limit = role === 'vip' ? 100 : role === 'admin' ? 9999 : 5;
    }
  }

  persistState();
  broadcastSSE('USERS_UPDATED', { users: realtimeState.users });
  res.json({ success: true, users: realtimeState.users });
});

// Redeem Codes CRUD
app.post('/api/realtime/redeem-code', (req, res) => {
  const { code, limit_reward } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Kode redeem tidak valid' });
  }

  const cleanCode = code.trim().toUpperCase();
  // check exists
  if (realtimeState.redeemCodes.some(r => r.code === cleanCode)) {
    return res.status(400).json({ success: false, message: 'Kode redeem sudah terdaftar' });
  }

  const newCode = {
    code: cleanCode,
    limit_reward: Number(limit_reward) || 5,
    created_at: new Date().toISOString()
  };

  realtimeState.redeemCodes.unshift(newCode);
  persistState();
  broadcastSSE('REDEEM_CODES_UPDATED', { redeemCodes: realtimeState.redeemCodes });
  res.json({ success: true, redeemCode: newCode, redeemCodes: realtimeState.redeemCodes });
});

// DELETE /api/realtime/redeem-code/:code -> Delete redeem code & broadcast
app.delete('/api/realtime/redeem-code/:code', (req, res) => {
  const { code } = req.params;
  const cleanCode = decodeURIComponent(code).trim().toUpperCase();
  realtimeState.redeemCodes = realtimeState.redeemCodes.filter(r => r.code.toUpperCase() !== cleanCode);
  persistState();
  broadcastSSE('REDEEM_CODES_UPDATED', { redeemCodes: realtimeState.redeemCodes });
  res.json({ success: true, redeemCodes: realtimeState.redeemCodes });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    creator: 'Alca W44',
    service: 'Alight Pro AM Realtime Proxy',
    stats: {
      users: realtimeState.users.length,
      chats: realtimeState.chats.length,
      presets: realtimeState.presets.length,
      gallery: realtimeState.gallery.length,
      logs: realtimeState.amLogs.length,
      redeemCodes: realtimeState.redeemCodes.length
    }
  });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
