// Unified Realtime Handler for Vercel Serverless Functions
// Consolidates all realtime endpoints into a single router to stay well within Vercel Hobby's 12-function limit
import { realtimeStore, getCleanUsers, RealtimeRedeemCode } from './_store';

export async function handleRealtimeRequest(req: any, res: any) {
  // Global CORS & Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const slug = req.query?.slug;
  const slugPath = Array.isArray(slug) ? slug.join('/') : (slug || '');
  const pathname = (slugPath ? `/api/realtime/${slugPath}` : url).split('?')[0].toLowerCase();
  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  try {
    // 1. SYNC: /api/realtime/sync
    if (pathname.includes('/sync') && !pathname.includes('/users/sync')) {
      if (req.method === 'POST') {
        if (Array.isArray(rawBody.redeemCodes) && rawBody.redeemCodes.length > 0) {
          rawBody.redeemCodes.forEach((c: any) => {
            if (c && c.code) {
              const clean = c.code.toUpperCase();
              if (!realtimeStore.redeemCodes.some(r => r.code.toUpperCase() === clean)) {
                realtimeStore.redeemCodes.push(c);
              }
            }
          });
        }
        if (rawBody.user && (rawBody.user.id || rawBody.user.email)) {
          const u = rawBody.user;
          const idx = realtimeStore.users.findIndex(item => item.id === u.id || item.email === u.email);
          if (idx !== -1) {
            realtimeStore.users[idx] = {
              ...realtimeStore.users[idx],
              ...u,
              daily_limit: u.daily_limit !== undefined ? Number(u.daily_limit) : realtimeStore.users[idx].daily_limit
            };
          } else {
            realtimeStore.users.push(u);
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          users: getCleanUsers(),
          chats: realtimeStore.chats,
          presets: realtimeStore.presets,
          gallery: realtimeStore.gallery,
          amLogs: realtimeStore.amLogs,
          redeemCodes: realtimeStore.redeemCodes
        }
      });
    }

    // 2. USER PROFILE SYNC: /api/realtime/users/sync or /api/realtime/profile
    if (pathname.includes('/users/sync') || pathname.includes('/profile')) {
      const user = rawBody.user || rawBody;
      if (!user || (!user.id && !user.email)) {
        return res.status(200).json({ success: true, message: 'Empty payload acknowledged' });
      }

      const isWahid = user.email === 'wahidrahmannn1324@gmail.com';
      const cleanAvatar = user.avatar_url && typeof user.avatar_url === 'string' && user.avatar_url.trim() ? user.avatar_url.trim() : undefined;
      const idx = realtimeStore.users.findIndex(item => item.id === user.id || item.email === user.email);

      if (idx !== -1) {
        const existing = realtimeStore.users[idx];
        const incomingLimit = typeof user.daily_limit === 'number' && !isNaN(user.daily_limit) ? user.daily_limit : undefined;
        const resolvedLimit = isWahid ? 9999 : (incomingLimit !== undefined ? Math.max(existing.daily_limit || 0, incomingLimit) : (existing.daily_limit || 5));

        realtimeStore.users[idx] = {
          ...existing,
          ...user,
          avatar_url: cleanAvatar || existing.avatar_url,
          daily_limit: resolvedLimit,
          role: isWahid ? 'admin' : (user.role || existing.role || 'free'),
          username: isWahid ? 'AlcaW44' : (user.username || existing.username)
        };
      } else {
        realtimeStore.users.push({
          id: user.id || 'user-' + Date.now(),
          email: user.email || '',
          username: isWahid ? 'AlcaW44' : (user.username || 'User'),
          avatar_url: cleanAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'user'}`,
          role: isWahid ? 'admin' : (user.role || 'free'),
          daily_limit: isWahid ? 9999 : (Number(user.daily_limit) || 5),
          used_limit_today: user.used_limit_today || 0,
          last_limit_reset: user.last_limit_reset || new Date().toISOString(),
          created_at: user.created_at || new Date().toISOString()
        });
      }

      return res.status(200).json({ success: true, users: getCleanUsers() });
    }

    // 3. ADMIN ACTIONS: /api/realtime/users/admin-action
    if (pathname.includes('/admin-action')) {
      const { action, userId, newLimit, role, broadcastAdd, targetUser } = rawBody;
      const cleanUserId = userId ? String(userId).trim().toLowerCase() : '';
      let u = realtimeStore.users.find(item => 
        item.id === userId || 
        (item.email && item.email.toLowerCase() === cleanUserId) ||
        (item.username && item.username.toLowerCase() === cleanUserId)
      );

      if (!u && targetUser && (action === 'set_limit' || action === 'add_limit')) {
        u = {
          id: targetUser.id || userId,
          email: targetUser.email || '',
          username: targetUser.username || 'User',
          avatar_url: targetUser.avatar_url || '',
          role: targetUser.role || 'free',
          daily_limit: targetUser.daily_limit || 5,
          used_limit_today: targetUser.used_limit_today || 0,
          last_limit_reset: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        realtimeStore.users.push(u);
      }

      if (action === 'set_limit' && u) {
        u.daily_limit = Math.max(0, Number(newLimit) || 5);
      } else if (action === 'add_limit' && u) {
        u.daily_limit = (u.daily_limit || 5) + (Number(newLimit) || 5);
      } else if (action === 'reset_limit' && u) {
        u.used_limit_today = 0;
        u.last_limit_reset = new Date().toISOString();
      } else if (action === 'broadcast_limit' && typeof broadcastAdd === 'number') {
        const addVal = Number(broadcastAdd) || 5;
        realtimeStore.users.forEach(item => {
          item.daily_limit = (item.daily_limit || 5) + addVal;
        });
      } else if (action === 'change_role' && u) {
        if (u.email !== 'wahidrahmannn1324@gmail.com') {
          u.role = role || 'free';
          u.daily_limit = role === 'vip' ? 100 : role === 'admin' ? 9999 : 5;
        }
      }

      return res.status(200).json({ success: true, users: getCleanUsers() });
    }

    // 4. REDEEM CODES: /api/realtime/redeem-code
    if (pathname.includes('/redeem-code')) {
      // 4a. User Claim Code
      if (pathname.includes('/claim') || rawBody.action === 'claim' || (req.method === 'POST' && rawBody.userId && rawBody.reward)) {
        const code = String(rawBody.code || '').trim().toUpperCase();
        const numReward = Number(rawBody.reward) || 10;
        const target = realtimeStore.users.find(item => 
          (rawBody.userId && item.id === rawBody.userId) || 
          (rawBody.userEmail && item.email && item.email.toLowerCase() === String(rawBody.userEmail).toLowerCase())
        );

        if (target) {
          target.daily_limit = (target.daily_limit || 5) + numReward;
        }

        return res.status(200).json({ success: true, message: `+${numReward} limit berhasil diklaim!` });
      }

      // 4b. Single code lookup or delete by path segment
      const segments = pathname.split('/').filter(Boolean);
      const lastSeg = decodeURIComponent(segments[segments.length - 1] || '').trim().toUpperCase();
      const isSpecificCode = lastSeg && lastSeg !== 'REDEEM-CODE' && lastSeg !== 'CLAIM';

      if (req.method === 'GET' && isSpecificCode) {
        const found = realtimeStore.redeemCodes.find(r => r.code.toUpperCase() === lastSeg && (r.is_active ?? true));
        if (found) return res.status(200).json({ success: true, redeemCode: found });
        return res.status(404).json({ success: false, message: 'Kode redeem tidak ditemukan' });
      }

      if (req.method === 'DELETE') {
        const codeToDelete = isSpecificCode ? lastSeg : String(req.query?.code || rawBody.code || '').trim().toUpperCase();
        realtimeStore.redeemCodes = realtimeStore.redeemCodes.filter(r => r.code.toUpperCase() !== codeToDelete);
        return res.status(200).json({ success: true, redeemCodes: realtimeStore.redeemCodes });
      }

      if (req.method === 'POST') {
        const clean = String(rawBody.code || '').trim().toUpperCase();
        if (!clean) return res.status(400).json({ success: false, message: 'Kode tidak boleh kosong' });

        const reward = Number(rawBody.limit_reward) || 10;
        const existing = realtimeStore.redeemCodes.find(r => r.code.toUpperCase() === clean);
        if (existing) {
          existing.limit_reward = reward;
          existing.is_active = true;
          return res.status(200).json({ success: true, redeemCode: existing, redeemCodes: realtimeStore.redeemCodes });
        }

        const newCode: RealtimeRedeemCode = {
          code: clean,
          limit_reward: reward,
          created_by: rawBody.created_by || 'AlcaW44',
          is_active: true,
          created_at: new Date().toISOString()
        };
        realtimeStore.redeemCodes.unshift(newCode);
        return res.status(200).json({ success: true, redeemCode: newCode, redeemCodes: realtimeStore.redeemCodes });
      }

      // Default GET: all active codes
      return res.status(200).json({ success: true, redeemCodes: realtimeStore.redeemCodes });
    }

    // 5. CHAT: /api/realtime/chat
    if (pathname.includes('/chat')) {
      if (req.method === 'POST') {
        const { user_id, username, avatar_url, message, role } = rawBody;
        const cleanMsg = (message || '').trim();
        const newChat = {
          id: 'chat-' + Date.now(),
          user_id: user_id || 'anonymous',
          username: username || 'User',
          avatar_url: avatar_url || '',
          role: role || 'free',
          message: cleanMsg,
          created_at: new Date().toISOString()
        };
        realtimeStore.chats.push(newChat);
        return res.status(200).json({ success: true, chat: newChat, chats: realtimeStore.chats });
      }
      return res.status(200).json({ success: true, chats: realtimeStore.chats });
    }

    // 6. PRESET: /api/realtime/preset
    if (pathname.includes('/preset')) {
      if (req.method === 'POST') {
        const newPreset = {
          id: 'preset-' + Date.now(),
          title: rawBody.title || 'Preset Baru',
          preset_link: rawBody.preset_link || '#',
          preview_url: rawBody.preview_url || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
          category: rawBody.category || 'Jedag Jedug',
          author_name: rawBody.author_name || 'AlcaW44',
          user_id: rawBody.user_id || 'user-admin-wahid',
          downloads: 0,
          created_at: new Date().toISOString()
        };
        realtimeStore.presets.unshift(newPreset);
        return res.status(200).json({ success: true, preset: newPreset, presets: realtimeStore.presets });
      }
      if (req.method === 'DELETE') {
        const id = req.query?.id || rawBody.id;
        realtimeStore.presets = realtimeStore.presets.filter(p => p.id !== id);
        return res.status(200).json({ success: true, presets: realtimeStore.presets });
      }
      return res.status(200).json({ success: true, presets: realtimeStore.presets });
    }

    // 7. GALLERY: /api/realtime/gallery
    if (pathname.includes('/gallery')) {
      if (req.method === 'POST') {
        if (rawBody.action === 'like' && rawBody.gallery_id) {
          const item = realtimeStore.gallery.find(g => g.id === rawBody.gallery_id);
          if (item) item.likes = (item.likes || 0) + 1;
          return res.status(200).json({ success: true, gallery: realtimeStore.gallery });
        }
        const newItem = {
          id: 'gallery-' + Date.now(),
          image_url: rawBody.image_url || '',
          caption: rawBody.caption || '',
          author_name: rawBody.author_name || 'AlcaW44',
          user_id: rawBody.user_id || 'user-admin-wahid',
          likes: 0,
          created_at: new Date().toISOString()
        };
        realtimeStore.gallery.unshift(newItem);
        return res.status(200).json({ success: true, item: newItem, gallery: realtimeStore.gallery });
      }
      return res.status(200).json({ success: true, gallery: realtimeStore.gallery });
    }

    // 8. AM LOGS: /api/realtime/am-logs or /api/realtime/am-log
    if (pathname.includes('/am-log')) {
      if (req.method === 'POST') {
        const { targetEmail, userId } = rawBody;
        const newLog = {
          id: 'log-' + Date.now(),
          target_email: targetEmail,
          created_at: new Date().toISOString(),
          user_id: userId || 'user'
        };
        realtimeStore.amLogs.unshift(newLog);
        return res.status(200).json({ success: true, log: newLog, amLogs: realtimeStore.amLogs });
      }
      return res.status(200).json({ success: true, amLogs: realtimeStore.amLogs });
    }

    // 9. STREAM / SSE: /api/realtime/stream
    if (pathname.includes('/stream')) {
      return res.status(200).json({
        success: true,
        connected: true,
        data: {
          users: getCleanUsers(),
          chats: realtimeStore.chats,
          presets: realtimeStore.presets,
          gallery: realtimeStore.gallery,
          amLogs: realtimeStore.amLogs,
          redeemCodes: realtimeStore.redeemCodes
        }
      });
    }

    // Default fallback
    return res.status(200).json({
      success: true,
      message: 'Realtime route acknowledged',
      path: pathname
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}
