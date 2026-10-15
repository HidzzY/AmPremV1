import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: 'free' | 'vip' | 'admin';
  daily_limit: number;
  used_limit_today: number;
  last_limit_reset?: string;
  created_at?: string;
}

// 1. Ambil Profil User
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

// 2. Tambah Limit Ke 1 User Atau Semua User
export async function addLimitToUser(targetUserId: string | 'ALL', amount: number) {
  if (targetUserId === 'ALL') {
    const { data: users, error } = await supabaseAdmin.from('profiles').select('id, daily_limit');
    if (error) throw error;

    for (const u of users) {
      await supabaseAdmin
        .from('profiles')
        .update({ daily_limit: (u.daily_limit || 0) + amount })
        .eq('id', u.id);
    }
    return { success: true, count: users.length };
  } else {
    const user = await getUserProfile(targetUserId);
    if (!user) throw new Error('User tidak ditemukan.');

    const newLimit = (user.daily_limit || 0) + amount;
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ daily_limit: newLimit })
      .eq('id', targetUserId);

    if (error) throw error;
    return { success: true, newLimit };
  }
}

// 3. Ubah Role User (VIP / Free)
export async function updateUserRole(userId: string, newRole: 'free' | 'vip') {
  const newLimit = newRole === 'vip' ? 100 : 5;
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: newRole, daily_limit: newLimit })
    .eq('id', userId);

  if (error) throw error;
  return { success: true, role: newRole, newLimit };
}

// 4. Reset Limit Pemakaian Harian
export async function resetUserDailyLimit(userId: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ used_limit_today: 0 })
    .eq('id', userId);

  if (error) throw error;
  return { success: true };
}
