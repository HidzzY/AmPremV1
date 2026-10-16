// Vercel Serverless Function: /api/realtime/stream
// Provides standard Server-Sent Events headers and handshake for browsers and reverse proxies
import { realtimeStore, getCleanUsers } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform, no-store');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial SSE handshake event with full state
  const payload = {
    type: 'CONNECTED',
    message: 'Alight Pro Realtime Active',
    timestamp: new Date().toISOString(),
    data: {
      users: getCleanUsers(),
      chats: realtimeStore.chats,
      presets: realtimeStore.presets,
      gallery: realtimeStore.gallery,
      amLogs: realtimeStore.amLogs,
      redeemCodes: realtimeStore.redeemCodes
    }
  };

  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  // Allow short keepalive then close gracefully so serverless function does not hang
  const timer = setTimeout(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'PING' })}\n\n`);
      res.end();
    } catch {}
  }, 4000);

  req.on('close', () => {
    clearTimeout(timer);
  });
}
