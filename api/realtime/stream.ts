// Vercel Serverless Function: /api/realtime/stream
// Safe SSE responder that ends cleanly to avoid 500 crashes on Serverless Lambdas

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform, no-store');
    res.setHeader('Connection', 'keep-alive');

    // Send single snapshot handshake and close gracefully so Vercel does not crash
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Stream ready', timestamp: new Date().toISOString() })}\n\n`);
    res.end();
  } catch (err) {
    // Fallback JSON in case res.write is not supported in the execution environment
    try {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ success: true, message: 'Stream fallback active' });
    } catch {}
  }
}
