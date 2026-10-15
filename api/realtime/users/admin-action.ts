import { Request, Response } from 'express';
import { addLimitToUser, updateUserRole, resetUserDailyLimit } from '../_store';

export async function handleAdminActionExpress(req: Request, res: Response) {
  try {
    const { action, adminEmail, targetUserId, limitToAdd, newRole } = req.body;

    // Proteksi Keamanan Admin Ketat
    if (adminEmail !== 'wahidrahmannn1324@gmail.com') {
      return res.status(403).json({ error: 'Akses Ditolak! Anda bukan SuperAdmin.' });
    }

    // 1. Action: Tambah Limit Ke 1 User atau Broadcast ke Semua User
    if (action === 'ADD_LIMIT_SINGLE' || action === 'ADD_LIMIT_ALL') {
      const target = action === 'ADD_LIMIT_ALL' ? 'ALL' : targetUserId;
      const amount = Number(limitToAdd) || 0;

      if (amount <= 0) {
        return res.status(400).json({ error: 'Jumlah limit yang ditambahkan harus lebih besar dari 0.' });
      }

      const result = await addLimitToUser(target, amount);
      const msg = action === 'ADD_LIMIT_ALL' 
        ? `Berhasil menambahkan +${amount} limit ke SEMUA user!` 
        : `Berhasil menambahkan +${amount} limit ke user tersebut.`;

      return res.json({ success: true, message: msg, result });
    }

    // 2. Action: Ubah Role User (VIP / Free)
    if (action === 'CHANGE_ROLE') {
      if (!targetUserId || !['free', 'vip'].includes(newRole)) {
        return res.status(400).json({ error: 'Parameter role tidak valid.' });
      }

      const result = await updateUserRole(targetUserId, newRole);
      return res.json({
        success: true,
        message: `Role user berhasil diperbarui menjadi ${newRole.toUpperCase()}.`,
        result
      });
    }

    // 3. Action: Reset Limit Harian User
    if (action === 'RESET_USER_LIMIT') {
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target User ID wajib diisi.' });
      }

      await resetUserDailyLimit(targetUserId);
      return res.json({ success: true, message: 'Limit pemakaian harian user berhasil direset ke 0.' });
    }

    return res.status(400).json({ error: 'Aksi Admin tidak dikenali.' });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memproses tindakan admin.' });
  }
}
