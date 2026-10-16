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
  Sliders,
  UserCheck,
  ChevronRight,
  Edit3,
  X
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    adminSetLimit, 
    adminAddUserLimit,
    adminBroadcastLimit, 
    adminResetUserLimit, 
    adminChangeRole, 
    adminAddRedeemCode,
    adminDeleteRedeemCode,
    redeemCodes,
    amLogs
  } = useAuth();

  const [searchUser, setSearchUser] = useState('');
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [customAddAmount, setCustomAddAmount] = useState<number>(10);
  const [broadcastAmount, setBroadcastAmount] = useState<number>(5);

  // Modal / Inline Edit Limit State
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; email: string; currentLimit: number } | null>(null);
  const [modalNewLimit, setModalNewLimit] = useState<number>(10);
  const [modalMode, setModalMode] = useState<'add' | 'set'>('add');

  // Redeem code form state
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeReward, setNewCodeReward] = useState<number>(10);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Handle direct limit addition from dedicated form
  const handleDedicatedAddLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetUserId) {
      showNotification('Pilih pengguna yang ingin ditambahkan limitnya.');
      return;
    }
    const target = allUsers.find(u => u.id === selectedTargetUserId);
    if (!target) return;

    adminAddUserLimit(target.id, Number(customAddAmount));
    showNotification(`Berhasil menambahkan +${customAddAmount} limit ke akun ${target.username}!`);
  };

  const handleQuickAddLimit = (userId: string, username: string, amount: number) => {
    adminAddUserLimit(userId, amount);
    showNotification(`+${amount} Limit berhasil ditambahkan ke ${username}.`);
  };

  const handleResetLimit = (userId: string, username: string) => {
    adminResetUserLimit(userId);
    showNotification(`Limit harian untuk ${username} berhasil direset ke 0.`);
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
    const clean = newCodeName.trim().toUpperCase();
    if (!clean || newCodeReward <= 0) return;
    adminAddRedeemCode(clean, Number(newCodeReward));
    setNewCodeName('');
    showNotification(`Kode redeem ${clean} (+${newCodeReward} limit) berhasil diaktifkan!`);
  };

  const handleDeleteCode = (codeName: string) => {
    adminDeleteRedeemCode(codeName);
    showNotification(`Kode redeem ${codeName} berhasil dihapus.`);
  };

  const openLimitModal = (u: { id: string; username: string; email: string; daily_limit: number }) => {
    setEditingUser({ id: u.id, username: u.username, email: u.email, currentLimit: u.daily_limit });
    setModalNewLimit(10);
    setModalMode('add');
  };

  const handleSaveModalLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (modalMode === 'add') {
      adminAddUserLimit(editingUser.id, Number(modalNewLimit));
      showNotification(`+${modalNewLimit} limit berhasil ditambahkan ke ${editingUser.username}.`);
    } else {
      adminSetLimit(editingUser.id, Number(modalNewLimit));
      showNotification(`Limit harian ${editingUser.username} disetel menjadi ${modalNewLimit}x.`);
    }
    setEditingUser(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2 animate-bounce border border-emerald-400">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Modal Atur Limit Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Sliders className="w-4 h-4" />
              <span>Atur Kuota Limit Pengguna</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Pengguna: <strong className="text-white">{editingUser.username}</strong> ({editingUser.email})<br />
              Limit saat ini: <span className="text-emerald-400 font-mono font-bold">{editingUser.currentLimit}x</span>
            </p>

            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
              <button
                type="button"
                onClick={() => { setModalMode('add'); setModalNewLimit(10); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  modalMode === 'add' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                + Tambah Kuota
              </button>
              <button
                type="button"
                onClick={() => { setModalMode('set'); setModalNewLimit(editingUser.currentLimit); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  modalMode === 'set' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Set Total Kuota
              </button>
            </div>

            <form onSubmit={handleSaveModalLimit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {modalMode === 'add' ? 'Jumlah Kuota yang Ditambahkan' : 'Total Kuota Harian Baru'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={modalNewLimit}
                  onChange={(e) => setModalNewLimit(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              {/* Quick Chip Shortcuts */}
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 25, 50, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setModalNewLimit(amt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700"
                  >
                    {modalMode === 'add' ? `+${amt}` : `${amt}x`}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
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
              Manajemen hak akses, penambahan kuota limit instan, broadcast massal, dan pembuatan event kode redeem.
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

      {/* Grid 3 Column: Tambah Limit Pengguna, Broadcast Limit & Buat Redeem Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Tambah Limit ke Pengguna Spesifik */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Zap className="w-4 h-4" />
              <span>Tambah Limit Pengguna</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Pilih akun target lalu tentukan berapa bonus kuota yang ingin ditambahkan.
            </p>

            <form onSubmit={handleDedicatedAddLimit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pilih Pengguna</label>
                <select
                  value={selectedTargetUserId}
                  onChange={(e) => setSelectedTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Akun User --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email}) - Kuota: {u.daily_limit}x
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Jumlah Tambahan Kuota</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={customAddAmount}
                    onChange={(e) => setCustomAddAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors whitespace-nowrap"
                  >
                    + Tambahkan
                  </button>
                </div>
              </div>

              {/* Quick Chip Shortcuts */}
              <div className="flex gap-1.5 flex-wrap pt-1">
                {[5, 10, 20, 50, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAddAmount(amt)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: Broadcast Limit ke Semua User */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
              <Radio className="w-4 h-4" />
              <span>Broadcast Limit Massal</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Tambahkan bonus kuota instan ke SELURUH {allUsers.length} user terdaftar sekaligus.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Jumlah Tambahan Tiap User</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={broadcastAmount}
                    onChange={(e) => setBroadcastAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors whitespace-nowrap"
                  >
                    Kirim Semua
                  </button>
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap pt-1">
                {[5, 10, 25, 50].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBroadcastAmount(amt)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                  >
                    +{amt} Limit
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Card 3: Buat Custom Event Redeem Code */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
              <Gift className="w-4 h-4" />
              <span>Buat Event Redeem Code</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Rilis kode voucher baru untuk dibagikan kepada follower saluran WhatsApp.
            </p>

            <form onSubmit={handleCreateCode} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Kode Voucher</label>
                  <input
                    type="text"
                    placeholder="MISAL: TIKTOKVIRAL"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 uppercase font-mono font-bold"
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors"
              >
                Aktifkan Kode Redeem
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Tabel Manajemen Pengguna */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Daftar Pengguna & Kontrol Limit Langsung</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik <strong className="text-emerald-400">+5</strong> / <strong className="text-emerald-400">+10</strong> untuk tambah limit cepat, atau klik <strong className="text-slate-300">Atur Limit</strong> untuk memasukkan kuota bebas.
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
                placeholder="Cari user atau email..."
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
                <th className="py-3 px-3">Limit Kuota</th>
                <th className="py-3 px-3">Terpakai Hari Ini</th>
                <th className="py-3 px-3 text-right">Aksi Cepat Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username || 'user'}`}
                        alt={u.username}
                        className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700"
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
                      title="Klik untuk toggle VIP / Free"
                    >
                      {u.role}
                    </button>
                  </td>

                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold tabular-nums">
                    <span className="text-sm">{u.daily_limit}x</span>
                    <span className="text-[10px] text-slate-400 font-normal"> /hari</span>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.used_limit_today > 0 
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                          : 'text-slate-400 bg-slate-800/60'
                      }`}>
                        {u.used_limit_today}x
                      </span>
                      {u.used_limit_today > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Aktif terpakai" />
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right space-x-1.5">
                    {/* Quick +5 Limit */}
                    <button
                      onClick={() => handleQuickAddLimit(u.id, u.username, 5)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                      title="Tambah +5 Limit Instan"
                    >
                      +5
                    </button>

                    {/* Quick +10 Limit */}
                    <button
                      onClick={() => handleQuickAddLimit(u.id, u.username, 10)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                      title="Tambah +10 Limit Instan"
                    >
                      +10
                    </button>

                    {/* Custom Edit Limit Modal */}
                    <button
                      onClick={() => openLimitModal(u)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                      title="Atur Limit Kustom"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Atur</span>
                    </button>

                    {/* Reset Limit */}
                    <button
                      onClick={() => handleResetLimit(u.id, u.username)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 text-[11px] font-medium transition-colors"
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
          <span>Daftar Kode Redeem Terdaftar ({redeemCodes.length})</span>
        </h3>

        {redeemCodes.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Belum ada kode redeem aktif (0 kode). Buat kode baru menggunakan formulir di atas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {redeemCodes.map((code) => (
              <div key={code.code} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-300 block">{code.code}</span>
                  <span className="text-[10px] text-slate-400">Reward: +{code.limit_reward} Kuota Limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-bold">
                    AKTIF
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCode(code.code)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Hapus kode redeem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
