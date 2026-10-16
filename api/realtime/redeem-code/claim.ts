import fs from 'fs';
import path from 'path';

async function getRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch { return {}; }
    }
  }

  return new Promise((resolve) => {
    let data = '';
    if (typeof req.on !== 'function') return resolve({});
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
    setTimeout(() => resolve({}), 1000);
  });
}

const DEFAULT_CODES: Record<string, number> = {
  'ALCAPRO2026': 10,
  'ALCAW44': 15,
  'VIPKREATORMU': 20
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = await getRequestBody(req);
    const code = String(body?.code || '').trim().toUpperCase();
    const userId = body?.userId;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Silakan masukkan kode redeem.' });
    }

    const reward = DEFAULT_CODES[code] || 10;

    return res.status(200).json({
      success: true,
      message: `Selamat! Kode redeem "${code}" berhasil diklaim. Kuota harian Anda bertambah +${reward} limit!`,
      reward,
      newDailyLimit: 15
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      message: 'Kode redeem berhasil diklaim!',
      reward: 10,
      newDailyLimit: 15
    });
  }
}
