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
  referrals: Array<{
    id: string;
    referrer_id: string;
    referred_id: string;
    created_at: string;
  }>;
}

// Initial state
let realtimeState: RealtimeState = {
  chats: [],
  presets: [],
  gallery: [],
  amLogs: [],
  redeemCodes: [],
  referrals: [],
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
        redeemCodes: Array.isArray(parsed.redeemCodes) ? parsed.redeemCodes : [],
        referrals: Array.isArray(parsed.referrals) ? parsed.referrals : [],
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

// Whitelist email domains allowed by policy
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
app.post('/api/am/send-link', async (req, res) => {
  try {
    const { email, dailyLimit, usedToday } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Alamat email target tidak valid.' });
    }

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
app.post('/api/am/verify-link', async (req, res) => {
  try {
    const { email, magicLink } = req.body;

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

// ==========================================
// REAL-TIME SSE STREAM & BROADCAST
// ==========================================

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

app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: realtimeState, timestamp: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

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
  });
});

app.get('/api/realtime/sync', (_req, res) => {
  res.json({
    success: true,
    data: realtimeState,
    activeConnections: sseClients.size,
    timestamp: new Date().toISOString()
  });
});

// Chat Endpoint
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
  if (realtimeState.chats.length > 200) {
    realtimeState.chats = realtimeState.chats.slice(-200);
  }
  persistState();

  broadcastSSE('NEW_CHAT', { chat: newChat, chats: realtimeState.chats });
  res.json({ success: true, chat: newChat, chats: realtimeState.chats });
});

// Preset Endpoints
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

app.delete('/api/realtime/preset/:id', (req, res) => {
  const { id } = req.params;
  realtimeState.presets = realtimeState.presets.filter(p => p.id !== id);
  persistState();
  broadcastSSE('PRESETS_UPDATED', { presets: realtimeState.presets });
  res.json({ success: true, presets: realtimeState.presets });
});

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

// Gallery Endpoints
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

// AM Log Endpoint
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
  broadcastSSE('AM_LOGS_UPDATED', { log: newLog, amLogs: realtimeState.amLogs, users: realtimeState.users });
  res.json({ success: true, log: newLog, amLogs: realtimeState.amLogs, users: realtimeState.users });
});

// User Sync Endpoints
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

    realtimeState.users[existingIdx] = {
      ...existing,
      ...user,
      avatar_url: cleanAvatar || existing.avatar_url,
      used_limit_today: Math.max(existing.used_limit_today || 0, user.used_limit_today || 0),
      daily_limit: existing.daily_limit || user.daily_limit || (isWahid ? 9999 : 5),
      role: isWahid ? 'admin' : (existing.role || user.role || 'free'),
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
  broadcastSSE('USERS_UPDATED', { users: realtimeState.users });
  res.json({ success: true, users: realtimeState.users });
};

app.post('/api/realtime/users/sync', handleUserSync);
app.put('/api/realtime/users/sync', handleUserSync);
app.post('/api/realtime/profile', handleUserSync);
app.put('/api/realtime/profile', handleUserSync);

// ==========================================
// ADMIN ACTIONS & LIMIT MANAGEMENT
// ==========================================

app.post('/api/realtime/users/admin-action', (req, res) => {
  const { action, userId, newLimit, limitToAdd, addLimit, role, broadcastAdd } = req.body;

  if ((action === 'add_limit' || action === 'ADD_LIMIT_SINGLE') && userId) {
    const amount = Number(limitToAdd || addLimit) || 0;
    const u = realtimeState.users.find(item => item.id === userId);
    if (u) u.daily_limit = (u.daily_limit || 5) + amount;
  } else if (action === 'set_limit' && userId) {
    const u = realtimeState.users.find(item => item.id === userId);
    if (u) u.daily_limit = Number(newLimit) || 5;
  } else if (action === 'reset_limit' && userId) {
    const u = realtimeState.users.find(item => item.id === userId);
    if (u) {
      u.used_limit_today = 0;
      u.last_limit_reset = new Date().toISOString();
    }
  } else if ((action === 'broadcast_limit' || action === 'ADD_LIMIT_ALL') && (typeof broadcastAdd === 'number' || typeof limitToAdd === 'number')) {
    const amount = Number(broadcastAdd || limitToAdd) || 0;
    realtimeState.users.forEach(u => {
      u.daily_limit = (u.daily_limit || 5) + amount;
    });
  } else if ((action === 'change_role' || action === 'CHANGE_ROLE') && userId && role) {
    const u = realtimeState.users.find(item => item.id === userId);
    if (u && u.email !== 'wahidrahmannn1324@gmail.com') {
      const cleanRole = String(role).toLowerCase() as 'free' | 'vip' | 'admin';
      u.role = cleanRole;
      u.daily_limit = cleanRole === 'vip' ? 100 : cleanRole === 'admin' ? 9999 : 5;
    }
  }

  persistState();
  broadcastSSE('USERS_UPDATED', { users: realtimeState.users });
  res.json({ success: true, users: realtimeState.users });
});

// ==========================================
// REDEEM CODES & REFERRAL SYSTEM
// ==========================================

// Create Event Redeem Code (Admin)
app.post('/api/realtime/redeem-code', (req, res) => {
  const { code, limit_reward } = req.body;
  if (!code || !String(code).trim()) {
    return res.status(400).json({ success: false, message: 'Kode redeem tidak valid' });
  }

  const cleanCode = String(code).trim().toUpperCase();
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

// CLAIM REDEEM CODE OR REFERRAL USERNAME
app.post('/api/realtime/redeem-code/claim', (req, res) => {
  const { code, userId } = req.body;
  if (!code || !userId) {
    return res.status(400).json({ success: false, message: 'Kode redeem dan User ID wajib diisi' });
  }

  const cleanInput = String(code).trim();
  const lowerInput = cleanInput.toLowerCase();

  // 1. Cek apakah ini Kode Referral (Username User Pengundang)
  const referrer = realtimeState.users.find(
    u => u.username.toLowerCase() === lowerInput || u.email.split('@')[0].toLowerCase() === lowerInput
  );

  if (referrer) {
    if (referrer.id === userId) {
      return res.status(400).json({ success: false, message: 'Anda tidak bisa mengklaim kode referral milik sendiri!' });
    }

    const alreadyClaimed = realtimeState.referrals.some(
      r => r.referrer_id === referrer.id && r.referred_id === userId
    );

    if (alreadyClaimed) {
      return res.status(400).json({ success: false, message: 'Anda sudah pernah mengklaim kode undangan dari user ini.' });
    }

    // Reward: Pengundang +3 limit, Yang diundang +2 limit
    referrer.daily_limit = (referrer.daily_limit || 5) + 3;

    const currentUser = realtimeState.users.find(u => u.id === userId);
    if (currentUser) {
      currentUser.daily_limit = (currentUser.daily_limit || 5) + 2;
    }

    realtimeState.referrals.push({
      id: 'ref-' + Date.now(),
      referrer_id: referrer.id,
      referred_id: userId,
      created_at: new Date().toISOString()
    });

    persistState();
    broadcastSSE('USERS_UPDATED', { users: realtimeState.users });

    return res.json({
      success: true,
      message: `Berhasil klaim kode undangan @${referrer.username}! Anda mendapatkan +2 limit dan pengundang mendapat +3 limit.`
    });
  }

  // 2. Cek apakah ini Kode Promo Event (Admin)
  const promoIdx = realtimeState.redeemCodes.findIndex(r => r.code.toUpperCase() === cleanInput.toUpperCase());
  if (promoIdx !== -1) {
    const promo = realtimeState.redeemCodes[promoIdx];
    const currentUser = realtimeState.users.find(u => u.id === userId);

    if (currentUser) {
      currentUser.daily_limit = (currentUser.daily_limit || 5) + promo.limit_reward;
      persistState();
      broadcastSSE('USERS_UPDATED', { users: realtimeState.users });

      return res.json({
        success: true,
        message: `Selamat! Kode event "${promo.code}" berhasil diklaim. +${promo.limit_reward} limit ditambahkan ke akun Anda!`
      });
    }
  }

  return res.status(404).json({ success: false, message: 'Kode redeem tidak ditemukan atau tidak valid.' });
});

// Delete Event Redeem Code
app.delete('/api/realtime/redeem-code/:code', (req, res) => {
  const { code } = req.params;
  const cleanCode = decodeURIComponent(code).trim().toUpperCase();
  realtimeState.redeemCodes = realtimeState.redeemCodes.filter(r => r.code.toUpperCase() !== cleanCode);
  persistState();
  broadcastSSE('REDEEM_CODES_UPDATED', { redeemCodes: realtimeState.redeemCodes });
  res.json({ success: true, redeemCodes: realtimeState.redeemCodes });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
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
      redeemCodes: realtimeState.redeemCodes.length,
      referrals: realtimeState.referrals.length
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
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
