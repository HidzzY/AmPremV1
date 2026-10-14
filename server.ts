import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Whitelist email domains allowed by policy
const ALLOWED_EMAIL_DOMAINS = [
  '@gmail.com',
  '@yahoo.com',
  '@yahoo.co.id',
  '@outlook.com',
  '@hotmail.com',
  '@icloud.com'
];

function isAllowedDomain(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const lower = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(domain => lower.endsWith(domain));
}

// 1. POST /api/am/send-link
// Proxies request securely to Alight Motion Worker without leaking endpoint to client
app.post('/api/am/send-link', async (req, res) => {
  try {
    const { email, userId, dailyLimit, usedToday } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Alamat email wajib diisi.' });
    }

    if (!isAllowedDomain(email)) {
      return res.status(400).json({
        success: false,
        message: 'Domain email tidak didukung. Harap gunakan @gmail.com, @yahoo.com, @yahoo.co.id, @outlook.com, @hotmail.com, atau @icloud.com.'
      });
    }

    // Limit check if provided
    if (typeof dailyLimit === 'number' && typeof usedToday === 'number') {
      if (usedToday >= dailyLimit) {
        return res.status(403).json({
          success: false,
          message: 'Limit harian Anda sudah habis. Silakan tunggu reset 24 jam atau upgrade ke VIP untuk 100x limit harian!'
        });
      }
    }

    const WORKER_ENDPOINT = 'https://satriam.satriadeveloperz.workers.dev/api/satriam/send-link';

    console.log(`[AM Proxy] Sending link request for ${email}`);
    
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
    console.error('[AM Proxy] Send Link Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal proxy server: ' + (err?.message || 'Unknown error')
    });
  }
});

// 2. POST /api/am/verify-link
// Proxies verification of magic link to Alight Motion Worker
app.post('/api/am/verify-link', async (req, res) => {
  try {
    const { email, magicLink, userId } = req.body;

    if (!email || !magicLink) {
      return res.status(400).json({
        success: false,
        message: 'Email dan Magic Link dari Alight Motion wajib diisi.'
      });
    }

    if (!isAllowedDomain(email)) {
      return res.status(400).json({
        success: false,
        message: 'Domain email tidak didukung.'
      });
    }

    const WORKER_ENDPOINT = 'https://satriam.satriadeveloperz.workers.dev/api/satriam/verify-link';

    console.log(`[AM Proxy] Verifying link for ${email}`);

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

    // Success response
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
    console.error('[AM Proxy] Verify Link Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses verifikasi link: ' + (err?.message || 'Unknown error')
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    creator: 'Alca W44',
    service: 'Alight Pro AM Proxy'
  });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
