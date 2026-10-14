import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  ShieldAlert, 
  Users, 
  Sparkles, 
  Gift, 
  RotateCcw, 
  Plus, 
  Radio, 
  Check, 
  Search, 
  Trash2,
  KeyRound,
  Zap,
  Clock
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    adminSetLimit, 
    adminBroadcastLimit, 
    adminResetUserLimit, 
    adminChangeRole, 
    adminAddRedeemCode,
    redeemCodes,
    amLogs
  } = useAuth();

  const [searchUser, setSearchUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [limitInput, setLimitInput] = useState<number>(10);
  const [broadcastAmount, setBroadcastAmount] = useState<number>(5);

  // Redeem code form state
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeReward, setNewCodeReward] = useState<number>(10);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleManualAddLimit = (userId: string, currentLimit: number) => {
    adminSetLimit(userId, currentLimit + Number(limitInput));
    showNotification(`Limit berhasil ditambahkan ke user.`);
  };

  const handleResetLimit = (userId: string) => {
    adminResetUserLimit(userId);
    showNotification(`Limit harian user berhasil direset ke 0.`);
  };

  const handleToggleRole = (userId: string, currentRole: UserRole) => {
    const nextRole: UserRole = currentRole === 'free' ? 'vip' : 'free';
    adminChangeRole(userId, nextRole);
    showNotification(`Role user berhasil diubah menjadi ${nextRole.toUpperCase()}.`);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (broadcastAmount <= 0) return;
    adminBroadcastLimit(Number(broadcastAmount));
    showNotification(`Broadcast +${broadcastAmount} limit ke seluruh ${allUsers.length} user berhasil!`);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim() || newCodeReward <= 0) return;
    adminAddRedeemCode(newCodeName.trim(), Number(newCodeReward));
    setNewCodeName('');
    showNotification(`Kode redeem ${newCodeName.toUpperCase()} (+${newCodeReward} limit) aktif!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-[#0b0f19] border border-rose-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>ALIGHT PRO SUPERADMIN DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Pusat Kendali Admin (Alca W44)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Manajemen hak akses, limit kuota pengguna, broadcast massal, dan pembuatan event kode redeem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold">
              SUPERADMIN: {currentUser?.email}
            </span>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Total Pengguna</span>
            <span className="text-xl font-bold text-white font-mono">{allUsers.length}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Member VIP</span>
            <span className="text-xl font-bold text-amber-300 font-mono">
              {allUsers.filter(u => u.role === 'vip').length}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">AM Tergenerate</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {amLogs.length}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Kode Redeem</span>
            <span className="text-xl font-bold text-slate-200 font-mono">
              {redeemCodes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid 2 Column: Broadcast & Create Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Broadcast Limit to All Users */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
            <Radio className="w-4 h-4" />
            <span>Broadcast Limit Massal</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Tambahkan bonus kuota instan ke SELURUH user yang terdaftar di database sekaligus.
          </p>

          <form onSubmit={handleBroadcast} className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-slate-400 mb-1">Jumlah Tambahan Limit</label>
              <input
                type="number"
                min="1"
                max="100"
                value={broadcastAmount}
                onChange={(e) => setBroadcastAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="self-end py-2 px-4 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
            >
              Kirim Broadcast
            </button>
          </form>
        </div>

        {/* Buat Custom Event Redeem Code */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
            <Gift className="w-4 h-4" />
            <span>Buat Event Redeem Code Baru</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Rilis kode voucher baru untuk dibagikan kepada follower saluran WhatsApp.
          </p>

          <form onSubmit={handleCreateCode} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Kode Voucher</label>
                <input
                  type="text"
                  placeholder="MISAL: TIKTOKVIRAL"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Reward Limit</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newCodeReward}
                  onChange={(e) => setNewCodeReward(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors"
            >
              Aktifkan Kode Redeem
            </button>
          </form>
        </div>

      </div>

      {/* Tabel Manajemen Pengguna */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Daftar Pengguna & Kontrol Limit</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ubah role, atur kuota manual per pengguna, atau reset limit pemakaian.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Cari user..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3">Pengguna</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Limit Hari Ini</th>
                <th className="py-3 px-3">Terpakai</th>
                <th className="py-3 px-3 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar_url}
                        alt={u.username}
                        className="w-7 h-7 rounded-full bg-slate-800 object-cover border border-slate-700"
                      />
                      <div>
                        <span className="font-semibold text-slate-200 block">{u.username}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                        u.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : u.role === 'vip'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-slate-800'
                          : 'bg-slate-800 text-slate-300 hover:bg-amber-500/20 hover:text-amber-300'
                      }`}
                      title="Klik untuk ubah role VIP / Free"
                    >
                      {u.role}
                    </button>
                  </td>

                  <td className="py-3 px-3 font-mono text-emerald-400 font-semibold tabular-nums">
                    {u.daily_limit}x/hari
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300 tabular-nums">
                    {u.used_limit_today}x
                  </td>

                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => handleManualAddLimit(u.id, u.daily_limit)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 text-[11px] font-medium transition-colors"
                      title="Tambah +5 Limit"
                    >
                      +5 Limit
                    </button>

                    <button
                      onClick={() => handleResetLimit(u.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 text-[11px] font-medium transition-colors"
                      title="Reset limit hari ini ke 0"
                    >
                      Reset 0
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* List Active Redeem Codes */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <span>Daftar Kode Redeem Terdaftar</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {redeemCodes.map((code) => (
            <div key={code.code} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-amber-300 block">{code.code}</span>
                <span className="text-[10px] text-slate-400">Reward: +{code.limit_reward} Limit</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-bold">
                AKTIF
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
