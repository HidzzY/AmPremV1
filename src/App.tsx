import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { GeneratorView } from './components/GeneratorView';
import { PresetHubView } from './components/PresetHubView';
import { LiveChatView } from './components/LiveChatView';
import { GalleryView } from './components/GalleryView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { SupabaseModal } from './components/SupabaseModal';
import { X, Gift, AlertOctagon, ShieldAlert, Zap } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, isSuperAdmin, pendingReferral } = useAuth();
  
  // Navigation tabs: 'generator' | 'presets' | 'chat' | 'gallery' | 'admin' | 'profile'
  const [activeTab, setActiveTab] = useState('generator');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [showReferralBanner, setShowReferralBanner] = useState(false);
  const [adminDeniedToast, setAdminDeniedToast] = useState(false);

  useEffect(() => {
    if (pendingReferral && !currentUser) {
      setShowReferralBanner(true);
    }
  }, [pendingReferral, currentUser]);

  // Safe tab switcher enforcing admin security
  const handleTabChange = (tab: string) => {
    if (tab === 'admin') {
      if (!isSuperAdmin) {
        setAdminDeniedToast(true);
        setTimeout(() => setAdminDeniedToast(false), 4000);
        setActiveTab('generator');
        return;
      }
    }
    setActiveTab(tab);
  };

  // Requirement 2: Halaman Utama Pertama Kali Publik Masuk WAJIB Halaman Login/Register
  // Jika pengguna belum terautentikasi (belum login), redirect / kunci di Halaman Login!
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col bg-grid-pattern relative">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-radial-glow pointer-events-none" />

        {/* Minimal Gatekeeper Header */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/icon.jpg"
                alt="Alight Premium Logo"
                className="w-9 h-9 rounded-full object-cover border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
              />
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Alight <span className="text-emerald-400">Premium</span>
              </span>
            </div>
          </div>
        </header>

        {/* Floating Referral Invitation Banner if visitor came via referral link */}
        {showReferralBanner && (
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-950 px-4 py-2.5 text-xs font-semibold flex items-center justify-between sticky top-16 z-50 shadow-md">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <Gift className="w-4 h-4 fill-slate-950 shrink-0" />
              <span>
                Anda diundang oleh <strong className="font-bold underline">{pendingReferral}</strong>! Daftar sekarang untuk langsung mendapatkan <strong>Bonus +2 Limit Harian Tambahan</strong>.
              </span>
            </div>
            <button
              onClick={() => setShowReferralBanner(false)}
              className="p-1 hover:bg-emerald-700/30 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Public Login/Register Page Gate */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
          <AuthView isModal={false} />
        </main>

        <Footer />

        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col bg-grid-pattern relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-radial-glow pointer-events-none" />

      {/* Admin Denied Toast Notification */}
      {adminDeniedToast && (
        <div className="fixed top-20 right-6 z-50 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2.5 animate-bounce border border-rose-400">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Akses ditolak. Halaman admin hanya dapat diakses oleh akun wahidrahmannn1324@gmail.com.</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        openAuthModal={() => setIsAuthModalOpen(true)}
        openSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {activeTab === 'generator' && (
          <GeneratorView openAuthModal={() => setIsAuthModalOpen(true)} />
        )}

        {activeTab === 'presets' && (
          <PresetHubView openAuthModal={() => setIsAuthModalOpen(true)} />
        )}

        {activeTab === 'chat' && (
          <LiveChatView openAuthModal={() => setIsAuthModalOpen(true)} />
        )}

        {activeTab === 'gallery' && (
          <GalleryView openAuthModal={() => setIsAuthModalOpen(true)} />
        )}

        {activeTab === 'admin' && (
          isSuperAdmin ? (
            <AdminDashboardView />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
              <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-base font-bold text-white">Akses Admin Ditolak</h2>
              <p className="text-xs text-slate-400">
                Halaman ini dilindungi secara ketat dan HANYA BISA diakses oleh akun email <strong>wahidrahmannn1324@gmail.com</strong> dengan role admin.
              </p>
              <button
                onClick={() => setActiveTab('generator')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )
        )}

        {activeTab === 'profile' && (
          <ProfileView openAuthModal={() => setIsAuthModalOpen(true)} />
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Supabase Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
