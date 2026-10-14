import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Sparkles, 
  Layers, 
  MessageSquare, 
  Image as ImageIcon, 
  ShieldAlert, 
  User as UserIcon, 
  Database,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
  openSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openSupabaseModal
}) => {
  const { currentUser, isSuperAdmin } = useAuth();

  const remainingLimit = currentUser
    ? Math.max(0, currentUser.daily_limit - currentUser.used_limit_today)
    : 0;

  const isAdmin = isSuperAdmin;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div 
          onClick={() => setActiveTab('generator')} 
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              Alight<span className="text-emerald-400">Pro</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Generator AM
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Preset Hub
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Live Chat
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Gallery
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Admin Panel
            </button>
          )}
        </nav>

        {/* Zone 3: Account & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Supabase SQL Inspector button */}
          <button
            onClick={openSupabaseModal}
            title="Lihat Supabase SQL Schema"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQL Schema</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Daily Limit Tracker */}
              <div 
                onClick={() => setActiveTab('profile')}
                className="cursor-pointer hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Limit Hari Ini</span>
                  <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                    {remainingLimit} / {currentUser.daily_limit}
                  </span>
                </div>
              </div>

              {/* VIP Upgrade Button if role free */}
              {currentUser.role === 'free' && (
                <a
                  href="https://wa.me/6289502003601?text=mas%20alca%20pengen%20up%20akun%20jadi%20role%20vip%20dong"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded-lg hover:bg-emerald-900/50 hover:border-emerald-500/60 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Upgrade VIP
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {/* Profile Avatar Trigger */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border transition-all ${
                  activeTab === 'profile'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-full object-cover bg-slate-800 border border-emerald-500/30"
                />
                <span className="text-xs font-medium text-slate-200 hidden sm:inline truncate max-w-[90px]">
                  {currentUser.username}
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  currentUser.role === 'admin'
                    ? 'bg-rose-500/20 text-rose-400'
                    : currentUser.role === 'vip'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentUser.role}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Masuk / Daftar
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 px-2 py-2 bg-slate-950/70 text-xs">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'generator' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Generator</span>
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'presets' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Presets</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'chat' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'gallery' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Gallery</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
              activeTab === 'admin' ? 'text-rose-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
