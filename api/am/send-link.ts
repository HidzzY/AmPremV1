export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, dailyLimit, usedToday } = body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Alamat email target tidak valid.' });
    }

    if (typeof dailyLimit === 'number' && typeof usedToday === 'number') {
      if (usedToday >= dailyLimit) {
        return res.status(403).json({
          success: false,
          message: 'Limit harian Anda sudah habis. Silakan tunggu reset 24 jam atau upgrade ke VIP untuk 100x limit harian!'
        });
      }
    }

    const WORKER_ENDPOINT = 'https://satriam.satriadeveloperz.workers.dev/api/satriam/send-link';
    const workerResponse = await fetch(WORKER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AlightPro-Proxy/1.0 (AlcaW44 Secure Client)'
      },
      body: JSON.stringify({ email: email.trim() })
    });

    const responseData = await workerResponse.json().catch(() => null);

    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({
        success: false,
        message: responseData?.message || responseData?.error || 'Gagal mengirim link dari server worker Alight Motion.',
        details: responseData
      });
    }

    return res.status(200).json({
      success: true,
      message: responseData?.message || 'Link verifikasi Alight Motion berhasil dikirim ke email tujuan!',
      data: responseData
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal proxy server: ' + (err?.message || 'Unknown error')
    });
  }
}
