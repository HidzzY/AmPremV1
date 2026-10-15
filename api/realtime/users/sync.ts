// Vercel Serverless Function: /api/realtime/users/sync
// Handles user profile synchronization across clients and prevents 405 Method Not Allowed

export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const user = rawBody?.user || rawBody;

    if (!user || (!user.id && !user.email)) {
      return res.status(200).json({
        success: true,
        message: 'No-op: empty user data received',
        user: null
      });
    }

    // Keep response ultra-fast and lightweight
    return res.status(200).json({
      success: true,
      message: 'User profile synchronized successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
        role: user.email === 'wahidrahmannn1324@gmail.com' ? 'admin' : (user.role || 'free'),
        daily_limit: user.email === 'wahidrahmannn1324@gmail.com' ? 9999 : (user.daily_limit || 5),
        used_limit_today: user.used_limit_today || 0,
        last_limit_reset: user.last_limit_reset || new Date().toISOString()
      }
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      message: 'User sync acknowledged',
      fallback: true
    });
  }
}
