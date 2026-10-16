// Vercel Serverless Function: /api/realtime/redeem-code/[code]
import { realtimeStore } from '../_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code } = req.query;
  const cleanCode = code ? decodeURIComponent(String(code)).trim().toUpperCase() : '';

  if (!cleanCode) {
    return res.status(400).json({ success: false, message: 'Kode redeem tidak valid' });
  }

  if (req.method === 'GET') {
    const found = realtimeStore.redeemCodes.find(r => r.code.toUpperCase() === cleanCode && (r.is_active ?? true));
    if (found) {
      return res.status(200).json({ success: true, redeemCode: found });
    }
    return res.status(404).json({ success: false, message: 'Kode redeem tidak ditemukan' });
  }

  if (req.method === 'DELETE') {
    realtimeStore.redeemCodes = realtimeStore.redeemCodes.filter(r => r.code.toUpperCase() !== cleanCode);
    return res.status(200).json({ success: true, redeemCodes: realtimeStore.redeemCodes });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
