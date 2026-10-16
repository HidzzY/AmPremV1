// Vercel Serverless Function: /api/realtime/sync
// Returns clean real-time state for Polling fallback and initial state synchronization

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Admin Wahid/AlcaW44 definition
  const adminUser = {
    id: 'user-admin-wahid',
    email: 'wahidrahmannn1324@gmail.com',
    username: 'AlcaW44',
    avatar_url: '', // Empty by default so local custom photo takes 100% priority
    role: 'admin',
    daily_limit: 9999,
    used_limit_today: 0,
    last_limit_reset: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    data: {
      users: [adminUser],
      chats: [],
      presets: [],
      gallery: [],
      amLogs: [],
      redeemCodes: []
    }
  });
}
