// Vercel Serverless Function: /api/realtime/users/admin-action
// Handles Admin adding limit, setting limit, resetting limit, changing roles, and broadcasting
import { realtimeStore, getCleanUsers } from '../_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, userId, newLimit, role, broadcastAdd, targetUser } = rawBody;

    const cleanUserId = userId ? String(userId).trim().toLowerCase() : '';
    let user = realtimeStore.users.find(u => 
      u.id === userId || 
      (u.email && u.email.toLowerCase() === cleanUserId) ||
      (u.username && u.username.toLowerCase() === cleanUserId)
    );

    if (!user && targetUser && (action === 'set_limit' || action === 'add_limit')) {
      user = {
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
      realtimeStore.users.push(user);
    }

    if (action === 'set_limit' && user) {
      user.daily_limit = Math.max(0, Number(newLimit) || 5);
    } else if (action === 'add_limit' && user) {
      user.daily_limit = (user.daily_limit || 5) + (Number(newLimit) || 5);
    } else if (action === 'reset_limit' && user) {
      user.used_limit_today = 0;
      user.last_limit_reset = new Date().toISOString();
    } else if (action === 'broadcast_limit' && typeof broadcastAdd === 'number') {
      const addVal = Number(broadcastAdd) || 5;
      realtimeStore.users.forEach(u => {
        u.daily_limit = (u.daily_limit || 5) + addVal;
      });
    } else if (action === 'change_role' && user) {
      if (user.email !== 'wahidrahmannn1324@gmail.com') {
        user.role = role || 'free';
        user.daily_limit = role === 'vip' ? 100 : role === 'admin' ? 9999 : 5;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Admin action applied successfully',
      users: getCleanUsers()
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}
