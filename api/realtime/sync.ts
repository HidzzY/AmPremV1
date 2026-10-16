// Vercel Serverless Function: /api/realtime/sync
// Returns clean real-time state for polling fallback and initial state synchronization
import { realtimeStore, getCleanUsers } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle optional POST sync payload from client
  if (req.method === 'POST') {
    try {
      const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (Array.isArray(rawBody.redeemCodes) && rawBody.redeemCodes.length > 0) {
        rawBody.redeemCodes.forEach((codeObj: any) => {
          if (codeObj && codeObj.code) {
            const clean = codeObj.code.toUpperCase();
            if (!realtimeStore.redeemCodes.some(r => r.code.toUpperCase() === clean)) {
              realtimeStore.redeemCodes.push(codeObj);
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
    } catch (e) {}
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
