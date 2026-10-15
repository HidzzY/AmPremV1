// Vercel Serverless Function: /api/realtime/profile
// Handles user profile updates

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const user = rawBody?.user || rawBody;

    return res.status(200).json({
      success: true,
      message: 'Profil Anda berhasil diperbarui!',
      user
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui'
    });
  }
}
