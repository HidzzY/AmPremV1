import { Request, Response } from 'express';
import { supabaseAdmin, getUserProfile } from './_store';

export async function handleRedeemCodeExpress(req: Request, res: Response) {
  try {
    const { code, userId } = req.body;
    const cleanCode = String(code || '').trim().toLowerCase();

    if (!cleanCode || !userId) {
      return res.status(400).json({ error: 'Kode redeem dan User ID wajib diisi.' });
    }

    // A. Cek apakah kode merupakan Username Pengundang (Kode Referral)
    const { data: referrer } = await supabaseAdmin
      .from('profiles')
      .select('id, username, daily_limit')
      .ilike('username', cleanCode)
      .single();

    if (referrer) {
      if (referrer.id === userId) {
        return res.status(400).json({ error: 'Anda tidak bisa mengklaim kode referral milik sendiri!' });
      }

      // Cek apakah user ini sudah pernahklaim kode pengundang ini
      const { data: existingRef } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrer.id)
        .eq('referred_id', userId)
        .single();

      if (existingRef) {
        return res.status(400).json({ error: 'Anda sudah pernah mengklaim kode undangan dari user ini.' });
      }

      // Berikan reward: Pengundang +3 limit, Yang diundang +2 limit
      await supabaseAdmin
        .from('profiles')
        .update({ daily_limit: (referrer.daily_limit || 0) + 3 })
        .eq('id', referrer.id);

      const currentUser = await getUserProfile(userId);
      const newLimit = (currentUser?.daily_limit || 0) + 2;

      await supabaseAdmin
        .from('profiles')
        .update({ daily_limit: newLimit })
        .eq('id', userId);

      // Catat ke tabel referrals
      await supabaseAdmin
        .from('referrals')
        .insert({ referrer_id: referrer.id, referred_id: userId });

      return res.json({
        success: true,
        message: `Berhasil mengklaim kode referral @${referrer.username}! Anda mendapatkan +2 limit tambahan dan pengundang mendapatkan +3 limit.`
      });
    }

    // B. Cek apakah kode merupakan Kode Event Promo buatan Admin
    const { data: promoCode, error: promoErr } = await supabaseAdmin
      .from('redeem_codes')
      .select('*')
      .ilike('code', cleanCode)
      .eq('is_active', true)
      .single();

    if (promoErr || !promoCode) {
      return res.status(404).json({ error: 'Kode redeem tidak ditemukan, sudah kadaluarsa, atau tidak aktif.' });
    }

    // Tambahkan limit dari promo code
    const currentUser = await getUserProfile(userId);
    const newLimit = (currentUser?.daily_limit || 0) + promoCode.limit_reward;

    await supabaseAdmin
      .from('profiles')
      .update({ daily_limit: newLimit })
      .eq('id', userId);

    return res.json({
      success: true,
      message: `Selamat! Kode event "${cleanCode.toUpperCase()}" berhasil diklaim. +${promoCode.limit_reward} limit telah ditambahkan ke akun Anda.`
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server saat klaim kode.' });
  }
}
