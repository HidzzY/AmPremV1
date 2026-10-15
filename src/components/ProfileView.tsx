import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Sparkles, 
  ExternalLink, 
  LogOut, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  Copy, 
  Gift, 
  Share2, 
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload
} from 'lucide-react';

interface ProfileViewProps {
  openAuthModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ openAuthModal }) => {
  const { currentUser, logout, updateProfile, deleteAccount, amLogs } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const [newAvatarUrl, setNewAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Keep edit state synced with latest currentUser
  React.useEffect(() => {
    if (currentUser) {
      setNewUsername(currentUser.username);
      setNewAvatarUrl(currentUser.avatar_url);
    }
  }, [currentUser?.username, currentUser?.avatar_url]);

  const [copiedRef, setCopiedRef] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 250;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setNewAvatarUrl(dataUrl);
        } else {
          setNewAvatarUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <User className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Anda Belum Masuk</h2>
        <p className="text-xs text-slate-400">Silakan login atau buat akun untuk melihat profil dan limit harian.</p>
        <button
          onClick={openAuthModal}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
        >
          Masuk / Daftar Sekarang
        </button>
      </div>
    );
  }

  const remainingLimit = Math.max(0, currentUser.daily_limit - currentUser.used_limit_today);

  // Referral URL format
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://alightpro.vercel.app';
  const referralLink = `${baseUrl}/?code=${currentUser.username}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    const res = await updateProfile(newUsername, newAvatarUrl);
    setSaveMessage(res.message);
    setIsSaving(false);

    if (res.success) {
      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage('');
      }, 1200);
    }
  };

  const handleDelete = async () => {
    await deleteAccount();
    setShowDeleteModal(false);
  };

  // Filter logs for this user
  const userLogs = amLogs.filter(l => l.user_id === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar */}
          <div className="relative group shrink-0">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/40 bg-slate-800 shadow-lg"
            />
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md transition-colors"
              title="Edit Profil"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{currentUser.username}</h1>
              <span className={`self-center sm:self-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                currentUser.role === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : currentUser.role === 'vip'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                Role: {currentUser.role}
              </span>
            </div>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mb-4">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser.email}</span>
            </p>

            {/* Metric Strips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">Sisa Kuota Hari Ini</span>
                <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                  {remainingLimit} <span className="text-xs text-slate-500">/ {currentUser.daily_limit}</span>
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">AM Dibuat</span>
                <span className="text-base font-bold text-slate-200 font-mono tabular-nums">
                  {userLogs.length} Akun
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block uppercase">Bergabung Sejak</span>
                <span className="text-xs font-medium text-slate-300 font-mono">
                  {new Date(currentUser.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Perbarui Informasi Profil</h3>
            
            {saveMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {saveMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Username Akun</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-2">
                  Foto Profil (Ambil dari Galeri atau Kamera)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <img
                    src={newAvatarUrl || currentUser.avatar_url}
                    alt="Pratinjau Foto"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500/50 bg-slate-800 shrink-0 shadow-md"
                  />
                  <div className="space-y-2 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-emerald-400" />
                        <span>Pilih dari Galeri</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>Buka Kamera</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Pilih foto langsung dari galeri HP/laptop atau jepret langsung dengan kamera perangkat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* VIP Upgrade Banner (Requirement Section 5: jika 'free', tampilkan tombol "Upgrade ke VIP" mengarahkan ke WhatsApp) */}
      {currentUser.role === 'free' && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-[#0b0f19] border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>STATUS FREE (LIMIT 5x/HARI)</span>
            </div>
            <h3 className="text-base font-bold text-white">Upgrade ke Role VIP (Limit 100x/Hari)</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Dapatkan kuota 100x pembuatan akun Alight Motion setiap hari tanpa watermark dengan support prioritas dari admin Mas Alca W44.
            </p>
          </div>

          <a
            href="https://wa.me/6289502003601?text=mas%20alca%20pengen%20up%20akun%20jadi%20role%20vip%20dong"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap self-start sm:self-auto flex items-center gap-2"
          >
            <span>Upgrade ke VIP Sekarang</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Referral Link Box (Requirement Section 7) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>Program Undangan & Referral</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Bagikan tautan referral Anda kepada teman atau di media sosial. Setiap orang yang mendaftar melalui link Anda:
          <span className="block mt-1 text-emerald-300 font-medium">
            • Anda mendapatkan <strong className="text-white">+3 Limit Harian</strong> tambahan
            <br />
            • Teman yang mendaftar mendapatkan <strong className="text-white">+2 Limit Bonus</strong> pertama
          </span>
        </p>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono select-all focus:outline-none"
          />
          <button
            onClick={handleCopyReferral}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center gap-1.5 shrink-0"
          >
            {copiedRef ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Riwayat Log Pembuatan Akun AM Prem */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Riwayat Pembuatan Akun AM Premium Anda</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {userLogs.length} Catatan
          </span>
        </div>

        {userLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Anda belum pernah membuat akun AM Premium. Buka tab Generator untuk mulai!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Target Email</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Waktu Pembuatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono text-slate-200">{log.target_email}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-400 inline-flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Sukses Aktif
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Settings / Danger Zone */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun (Logout)</span>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Hapus Akun Saya</span>
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Hapus Akun Anda?</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Tindakan ini permanen. Profil, sisa limit harian, dan riwayat akun Anda akan dihapus dari sistem.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
