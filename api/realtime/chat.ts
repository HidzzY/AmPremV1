// Vercel Serverless Function: /api/realtime/chat
// Handles sending and retrieving chat messages

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { user_id, username, avatar_url, message, role } = rawBody;

      // Filter out any mock text
      const cleanMsg = (message || '').trim();
      const lower = cleanMsg.toLowerCase();
      if (lower.includes('mbak siti') || lower.includes('sound kane') || lower.includes('preset jj')) {
        return res.status(200).json({ success: true, message: 'Message filtered' });
      }

      const newChat = {
        id: 'chat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        user_id: user_id || 'anonymous',
        username: username || 'User',
        avatar_url: avatar_url || '',
        role: role || 'free',
        message: cleanMsg,
        created_at: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        chat: newChat
      });
    } catch (e: any) {
      return res.status(200).json({ success: true });
    }
  }

  return res.status(200).json({
    success: true,
    chats: []
  });
}
