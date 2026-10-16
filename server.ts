import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Create unified HTTP Server to attach WebSockets alongside Express
const server = http.createServer(app);

// WebSocket Server attached for instant multi-user bidirectional real-time sync
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const host = request.headers.host || `localhost:${PORT}`;
  const { pathname } = new URL(request.url || '', `http://${host}`);
  if (pathname === '/ws' || pathname === '/api/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Global CORS & preflight header support for custom domains, reverse proxies, and browsers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

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
  avatar_url: '',
  role: 'admin',
  daily_limit: 9999,
  used_limit_today: 0,
  last_limit_reset: new Date().toISOString(),
  created_at: new Date().toISOString()
};

const DEFAULT_REDEEM_CODES = [
  { code: 'ALCAPRO2026', limit_reward: 10, created_at: new Date().toISOString() },
  { code: 'ALCAW44', limit_reward: 15, created_at: new Date().toISOString() },
  { code: 'VIPKREATORMU', limit_reward: 20, created_at: new Date().toISOString() }
];

export interface ClaimedCodeRecord {
  id: string;
  user_id: string;
  email: string;
  code: string;
  reward: number;
  claimed_at: string;
}

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
  users: Array<RealtimeUser>;
  redeemCodes: Array<{
    code: string;
    limit_reward: number;
    created_at: string;
  }>;
  claimedCodes: Array<ClaimedCodeRecord>;
}

// Initial state
let realtimeState: RealtimeState = {
  chats: [],
  presets: [],
  gallery: [],
  amLogs: [],
  redeemCodes: DEFAULT_REDEEM_CODES,
  claimedCodes: [],
  users: [DEFAULT_ADMIN_USER]
};

// Load saved state if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed) {
      realtimeState = {
        chats: (Array.isArray(parsed.chats) ? parsed.chats : []).filter((c: any) => 
          c && c.message && 
          !c.message.toLowerCase().includes('mbak siti') &&
          !c.message.toLowerCase().includes('sound kane') &&
          !c.message.toLowerCase().includes('preset jj')
        ),
        presets: Array.isArray(parsed.presets) ? parsed.presets : [],
        gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
        amLogs: Array.isArray(parsed.amLogs) ? parsed.amLogs : [],
        redeemCodes: Array.isArray(parsed.redeemCodes) && parsed.redeemCodes.length > 0 
          ? parsed.redeemCodes 
          : DEFAULT_REDEEM_CODES,
        claimedCodes: Array.isArray(parsed.claimedCodes) ? parsed.claimedCodes : [],
        users: Array.isArray(parsed.users) && parsed.users.length > 0 
          ? parsed.users.map((u: any): RealtimeUser => ({
              ...u,
              role: (u.email === 'wahidrahmannn1324@gmail.com' ? 'admin' : (u.role || 'free')) as 'admin' | 'free' | 'vip',
              username: u.email === 'wahidrahmannn1324@gmail.com' ? 'AlcaW44' : u.username,
              daily_limit: u.email === 'wahidrahmannn1324@gmail.com' ? 9999 : (u.daily_limit || 5)
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

// Connected SSE clients for secondary push
const sseClients = new Set<express.Response>();

// Universal Real-Time Broadcaster: Pushes to all WebSockets & SSE clients simultaneously
function broadcastRealtime(type: string, data: any) {
  const payloadString = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

  // 1. Instant WebSocket push (zero buffering delay)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payloadString);
      } catch (err) {
        console.error('[WS] Push error:', err);
      }
    }
  });

  // 2. SSE fallback push with immediate flush
  const sseChunk = `data: ${payloadString}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(sseChunk);
      (client as any).flush?.();
    } catch {
      sseClients.delete(client);
    }
  }
}

// WebSocket Connection Lifecycle
wss.on('connection', (ws: WebSocket) => {
  console.log(`[WS] Client connected. Total active WS connections: ${wss.clients.size}`);

  // Send full initial state snapshot immediately upon connection
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: realtimeState,
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      } else if (msg.type === 'SEND_CHAT') {
        const chat = handleNewChatMessage(msg.payload);
        if (chat) {
          ws.send(JSON.stringify({ type: 'CHAT_SENT_ACK', chat }));
        }
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected. Total active WS connections: ${wss.clients.size}`);
  });
});

// Core Chat Handler
function handleNewChatMessage(payload: any) {
  if (!payload || !payload.message || !String(payload.message).trim()) {
    return null;
  }

  const cleanMessage = String(payload.message).trim();
  const lower = cleanMessage.toLowerCase();
  if (lower.includes('mbak siti') || lower.includes('sound kane') || lower.includes('preset jj')) {
    return null;
  }

  const newChat = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    user_id: payload.user_id || 'anonymous',
    username: payload.username || 'User',
    avatar_url: payload.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.username || 'anon'}`,
    role: (payload.role === 'admin' ? 'admin' : payload.role === 'vip' ? 'vip' : 'free') as 'free' | 'vip' | 'admin',
    message: cleanMessage,
    created_at: new Date().toISOString()
  };

  realtimeState.chats.push(newChat);
  if (realtimeState.chats.length > 300) {
    realtimeState.chats = realtimeState.chats.slice(-300);
  }
  persistState();

  // Instant real-time broadcast to all connected clients!
  broadcastRealtime('NEW_CHAT', { chat: newChat, chats: realtimeState.chats });

  console.log(`[Chat] Real-time message from ${newChat.username}: "${cleanMessage.substring(0, 30)}..." pushed to ${wss.clients.size} WS + ${sseClients.size} SSE clients`);

  return newChat;
}

// 1. POST /api/am/send-link
app.post('/api/am/send-link', async (req, res) => {
  try {
    const { email, userId, dailyLimit, usedToday } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Alamat email target tidak valid.' });
    }

    if (typeof dailyLimit === 'number' && typeof usedToday === 'number') {
      if (usedToday >= dailyLimit) {
        return res.status(403).json({
          success: false,
          message: 'Limit harian Anda sudah habis. Silakan tukarkan kode redeem atau upgrade ke VIP!'
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

// GET /api/realtime/stream -> SSE Stream
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: realtimeState, timestamp: new Date().toISOString() })}\n\n`);
  (res as any).flush?.();

  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
      (res as any).flush?.();
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 10000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// GET /api/realtime/sync -> Full realtime state snapshot
app.get('/api/realtime/sync', (req, res) => {
  res.json({
    success: true,
    data: realtimeState,
    activeWsConnections: wss.clients.size,
    activeSseConnections: sseClients.size,
    timestamp: new Date().toISOString()
  });
});

// POST /api/realtime/chat -> Add new chat message & broadcast INSTANTLY to all users
app.post('/api/realtime/chat', (req, res) => {
  const newChat = handleNewChatMessage(req.body);
  if (!newChat) {
    return res.status(400).json({ success: false, message: 'Pesan tidak valid atau kosong' });
  }
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

  broadcastRealtime('PRESETS_UPDATED', { presets: realtimeState.presets, newPreset });
  res.json({ success: true, preset: newPreset, presets: realtimeState.presets });
});

// DELETE /api/realtime/preset/:id
app.delete('/api/realtime/preset/:id', (req, res) => {
  const { id } = req.params;
  realtimeState.presets = realtimeState.presets.filter(p => p.id !== id);
  persistState();
  broadcastRealtime('PRESETS_UPDATED', { presets: realtimeState.presets });
  res.json({ success: true, presets: realtimeState.presets });
});

// POST /api/realtime/preset/:id/download
app.post('/api/realtime/preset/:id/download', (req, res) => {
  const { id } = req.params;
  const p = realtimeState.presets.find(item => item.id === id);
  if (p) {
    p.downloads = (p.downloads || 0) + 1;
    persistState();
    broadcastRealtime('PRESETS_UPDATED', { presets: realtimeState.presets });
  }
  res.json({ success: true, presets: realtimeState.presets });
});

// POST /api/realtime/gallery
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
  broadcastRealtime('GALLERY_UPDATED', { gallery: realtimeState.gallery, newItem });
  res.json({ success: true, item: newItem, gallery: realtimeState.gallery });
});

// POST /api/realtime/gallery/:id/like
app.post('/api/realtime/gallery/:id/like', (req, res) => {
  const { id } = req.params;
  const g = realtimeState.gallery.find(item => item.id === id);
  if (g) {
    g.likes = (g.likes || 0) + 1;
    persistState();
    broadcastRealtime('GALLERY_UPDATED', { gallery: realtimeState.gallery });
  }
  res.json({ success: true, gallery: realtimeState.gallery });
});

// POST /api/realtime/am-log
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

  if (userId) {
    const userIndex = realtimeState.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      realtimeState.users[userIndex].used_limit_today = (realtimeState.users[userIndex].used_limit_today || 0) + 1;
    }
  }

  persistState();
  broadcastRealtime('AM_LOGS_UPDATED', { log: newLog, amLogs: realtimeState.amLogs, users: realtimeState.users });
  res.json({ success: true, log: newLog, amLogs: realtimeState.amLogs, users: realtimeState.users });
});

// POST & PUT /api/realtime/users/sync & /api/realtime/profile
const handleUserSync = (req: express.Request, res: express.Response) => {
  const user = req.body?.user || req.body;
  if (!user || (!user.id && !user.email)) {
    return res.status(400).json({ success: false, message: 'Invalid user payload' });
  }

  const existingIdx = realtimeState.users.findIndex(u => 
    (user.id && u.id === user.id) || 
    (user.email && u.email && u.email.toLowerCase() === String(user.email).toLowerCase())
  );

  const cleanAvatar = user.avatar_url && typeof user.avatar_url === 'string' && user.avatar_url.trim() 
    ? user.avatar_url.trim() 
    : undefined;

  if (existingIdx !== -1) {
    const existing = realtimeState.users[existingIdx];
    const isWahid = (user.email && user.email.toLowerCase() === 'wahidrahmannn1324@gmail.com') || 
                    (existing.email && existing.email.toLowerCase() === 'wahidrahmannn1324@gmail.com');

    // CRITICAL FIX: Ensure user's earned limit (from redeem codes or admin) is NEVER downgraded!
    const incomingLimit = typeof user.daily_limit === 'number' && user.daily_limit > 0 ? user.daily_limit : 0;
    const finalDailyLimit = isWahid ? 9999 : Math.max(existing.daily_limit || 5, incomingLimit || 5);

    realtimeState.users[existingIdx] = {
      ...existing,
      ...user,
      avatar_url: cleanAvatar || existing.avatar_url,
      used_limit_today: Math.max(existing.used_limit_today || 0, user.used_limit_today || 0),
      daily_limit: finalDailyLimit,
      role: isWahid ? 'admin' : (user.role || existing.role || 'free'),
      username: isWahid ? 'AlcaW44' : (user.username || existing.username)
    };
  } else {
    const isWahid = user.email && user.email.toLowerCase() === 'wahidrahmannn1324@gmail.com';
    realtimeState.users.push({
      id: user.id || 'user-' + Date.now(),
      email: user.email || '',
      username: isWahid ? 'AlcaW44' : (user.username || 'User'),
      avatar_url: cleanAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'user'}`,
      role: isWahid ? 'admin' : (user.role || 'free'),
      daily_limit: isWahid ? 9999 : (user.daily_limit || 5),
      used_limit_today: user.used_limit_today || 0,
      last_limit_reset: user.last_limit_reset || new Date().toISOString(),
      created_at: user.created_at || new Date().toISOString()
    });
  }

  persistState();
  broadcastRealtime('USERS_UPDATED', { users: realtimeState.users });
  res.json({ success: true, users: realtimeState.users });
};

app.post('/api/realtime/users/sync', handleUserSync);
app.put('/api/realtime/users/sync', handleUserSync);
app.post('/api/realtime/profile', handleUserSync);
app.put('/api/realtime/profile', handleUserSync);

// POST /api/realtime/users/admin-action
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
  broadcastRealtime('USERS_UPDATED', { users: realtimeState.users });
  res.json({ success: true, users: realtimeState.users });
});

// Redeem Codes CRUD & Claim
app.post('/api/realtime/redeem-code', (req, res) => {
  const { code, limit_reward } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Kode redeem tidak valid' });
  }

  const cleanCode = code.trim().toUpperCase();
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
  broadcastRealtime('REDEEM_CODES_UPDATED', { redeemCodes: realtimeState.redeemCodes });
  res.json({ success: true, redeemCode: newCode, redeemCodes: realtimeState.redeemCodes });
});

app.delete('/api/realtime/redeem-code/:code', (req, res) => {
  const { code } = req.params;
  const cleanCode = decodeURIComponent(code).trim().toUpperCase();
  realtimeState.redeemCodes = realtimeState.redeemCodes.filter(r => r.code.toUpperCase() !== cleanCode);
  persistState();
  broadcastRealtime('REDEEM_CODES_UPDATED', { redeemCodes: realtimeState.redeemCodes });
  res.json({ success: true, redeemCodes: realtimeState.redeemCodes });
});

// Dedicated Server-Authoritative Endpoint: POST /api/realtime/redeem-code/claim
app.post('/api/realtime/redeem-code/claim', (req, res) => {
  const { code, userId, email, username } = req.body;
  if (!code || !String(code).trim()) {
    return res.status(400).json({ success: false, message: 'Silakan masukkan kode redeem.' });
  }
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu untuk klaim kode redeem.' });
  }

  const cleanCode = String(code).trim().toUpperCase();
  const foundCode = realtimeState.redeemCodes.find(r => r.code.toUpperCase() === cleanCode);

  if (!foundCode) {
    return res.status(404).json({ success: false, message: `Kode redeem "${cleanCode}" tidak valid atau belum terdaftar.` });
  }

  // Check if this specific user already claimed this code
  const alreadyClaimed = realtimeState.claimedCodes.some(c => 
    c.code.toUpperCase() === cleanCode && 
    (c.user_id === userId || (email && c.email && c.email.toLowerCase() === String(email).toLowerCase()))
  );

  if (alreadyClaimed) {
    return res.status(400).json({ success: false, message: `Kode redeem "${cleanCode}" sudah pernah Anda pakai.` });
  }

  // Find or register user
  let user = realtimeState.users.find(u => 
    u.id === userId || (email && u.email.toLowerCase() === String(email).toLowerCase())
  );

  if (!user) {
    const isWahid = email && email.toLowerCase() === 'wahidrahmannn1324@gmail.com';
    user = {
      id: userId,
      email: email || '',
      username: username || 'User',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'user'}`,
      role: isWahid ? 'admin' : 'free',
      daily_limit: isWahid ? 9999 : 5,
      used_limit_today: 0,
      last_limit_reset: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    realtimeState.users.push(user);
  }

  const reward = Number(foundCode.limit_reward) || 5;
  user.daily_limit = (user.daily_limit || 5) + reward;

  const claimRecord: ClaimedCodeRecord = {
    id: 'claim-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    user_id: userId,
    email: user.email,
    code: cleanCode,
    reward,
    claimed_at: new Date().toISOString()
  };

  realtimeState.claimedCodes.push(claimRecord);
  persistState();

  // Instant broadcast to all clients so UI updates immediately without reload
  broadcastRealtime('USERS_UPDATED', { users: realtimeState.users });
  broadcastRealtime('CLAIMED_CODES_UPDATED', { claimedCodes: realtimeState.claimedCodes });

  console.log(`[Redeem] User ${user.username} (${user.email}) claimed ${cleanCode} for +${reward} limit. New limit: ${user.daily_limit}`);

  return res.status(200).json({
    success: true,
    message: `Selamat! Kode redeem "${cleanCode}" berhasil diklaim. Kuota harian Anda bertambah +${reward} limit!`,
    reward,
    newDailyLimit: user.daily_limit,
    claimedCodes: realtimeState.claimedCodes,
    user
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    creator: 'Alca W44',
    service: 'Alight Pro AM Realtime Proxy with WebSockets',
    stats: {
      users: realtimeState.users.length,
      chats: realtimeState.chats.length,
      presets: realtimeState.presets.length,
      gallery: realtimeState.gallery.length,
      logs: realtimeState.amLogs.length,
      redeemCodes: realtimeState.redeemCodes.length,
      claimedCodes: realtimeState.claimedCodes.length,
      wsClients: wss.clients.size,
      sseClients: sseClients.size
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT} with WebSockets on ws://localhost:${PORT}/ws (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
