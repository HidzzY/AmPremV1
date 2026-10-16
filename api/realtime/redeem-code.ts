// Vercel Serverless Function: /api/realtime/redeem-code
// Handles creating, deleting, fetching, and claiming redeem codes
import { realtimeStore, RealtimeRedeemCode } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // GET /api/realtime/redeem-code -> Get active redeem codes or query specific code
    if (req.method === 'GET') {
      const queryCode = req.query?.code ? String(req.query.code).trim().toUpperCase() : null;
      if (queryCode) {
        const found = realtimeStore.redeemCodes.find(r => r.code.toUpperCase() === queryCode && (r.is_active ?? true));
        if (found) {
          return res.status(200).json({ success: true, redeemCode: found });
        } else {
          return res.status(404).json({ success: false, message: 'Kode redeem tidak ditemukan' });
        }
      }
      return res.status(200).json({ success: true, redeemCodes: realtimeStore.redeemCodes });
    }

    // POST /api/realtime/redeem-code -> Create code OR Claim code
    if (req.method === 'POST') {
      // 1. Claim Code action
      if (rawBody.action === 'claim' || rawBody.userId) {
        const code = String(rawBody.code || '').trim().toUpperCase();
        if (!code) {
          return res.status(400).json({ success: false, message: 'Kode redeem tidak boleh kosong' });
        }

        const found = realtimeStore.redeemCodes.find(r => r.code.toUpperCase() === code && (r.is_active ?? true));
        if (!found) {
          return res.status(400).json({ success: false, message: 'Kode redeem tidak valid atau sudah kedaluwarsa' });
        }

        const reward = Number(found.limit_reward) || 10;
        const targetUserId = rawBody.userId;
        const targetUserEmail = rawBody.userEmail;

        let user = realtimeStore.users.find(u => 
          (targetUserId && u.id === targetUserId) || 
          (targetUserEmail && u.email && u.email.toLowerCase() === targetUserEmail.toLowerCase())
        );

        if (user) {
          user.daily_limit = (user.daily_limit || 5) + reward;
        }

        return res.status(200).json({
          success: true,
          message: `Berhasil mengklaim +${reward} limit!`,
          reward,
          code: found.code
        });
      }

      // 2. Admin Create Code
      const code = String(rawBody.code || '').trim().toUpperCase();
      const limit_reward = Number(rawBody.limit_reward) || 10;

      if (!code) {
        return res.status(400).json({ success: false, message: 'Kode redeem tidak boleh kosong' });
      }

      if (realtimeStore.redeemCodes.some(r => r.code.toUpperCase() === code)) {
        return res.status(400).json({ success: false, message: 'Kode redeem sudah terdaftar' });
      }

      const newCode: RealtimeRedeemCode = {
        code,
        limit_reward,
        created_by: rawBody.created_by || 'AlcaW44',
        is_active: true,
        created_at: new Date().toISOString()
      };

      realtimeStore.redeemCodes.unshift(newCode);

      return res.status(200).json({
        success: true,
        redeemCode: newCode,
        redeemCodes: realtimeStore.redeemCodes
      });
    }

    // DELETE /api/realtime/redeem-code -> Delete code
    if (req.method === 'DELETE') {
      const code = String(req.query?.code || rawBody.code || '').trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ success: false, message: 'Kode redeem harus disertakan' });
      }

      realtimeStore.redeemCodes = realtimeStore.redeemCodes.filter(r => r.code.toUpperCase() !== code);

      return res.status(200).json({
        success: true,
        message: `Kode ${code} berhasil dihapus`,
        redeemCodes: realtimeStore.redeemCodes
      });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}
