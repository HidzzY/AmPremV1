// Vercel Serverless Function: Catch-all for /api/realtime/*
// Ensures no route under /api/realtime returns 404 or 405

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    message: 'Operation acknowledged',
    route: req.query?.slug || 'realtime-action'
  });
}
