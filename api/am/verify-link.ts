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
    const { email, magicLink } = body || {};

    if (!email || !magicLink) {
      return res.status(400).json({
        success: false,
        message: 'Email dan Magic Link dari Alight Motion wajib diisi.'
      });
    }

    const WORKER_ENDPOINT = 'https://satriam.satriadeveloperz.workers.dev/api/satriam/verify-link';
    const workerResponse = await fetch(WORKER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AlightPro-Proxy/1.0 (AlcaW44 Secure Client)'
      },
      body: JSON.stringify({
        email: email.trim(),
        magicLink: magicLink.trim()
      })
    });

    const responseData = await workerResponse.json().catch(() => null);

    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({
        success: false,
        message: responseData?.message || responseData?.error || 'Verifikasi magic link gagal atau link kadaluarsa.',
        details: responseData
      });
    }

    return res.status(200).json({
      success: true,
      message: responseData?.message || 'Akun Alight Motion Premium berhasil diverifikasi dan aktif!',
      data: responseData,
      logEntry: {
        target_email: email,
        created_at: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses verifikasi link: ' + (err?.message || 'Unknown error')
    });
  }
}
