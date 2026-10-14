import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Code2, 
  ShieldCheck, 
  Server,
  Layers
} from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, updateSupabaseConfig } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- ALIGHT PRO - SUPABASE DATABASE SCHEMA
-- Creator: Alca W44 (https://whatsapp.com/channel/0029Vb82nkLEwEjtLSQ49I44)
-- Full-stack production-ready SQL script for Supabase PostgreSQL
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'vip', 'admin')),
  daily_limit INT NOT NULL DEFAULT 5,
  used_limit_today INT NOT NULL DEFAULT 0,
  last_limit_reset TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ALIGHT MOTION LOGS (am_logs)
CREATE TABLE IF NOT EXISTS public.am_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. REDEEM CODES (redeem_codes)
CREATE TABLE IF NOT EXISTS public.redeem_codes (
  code TEXT PRIMARY KEY,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  limit_reward INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. REFERRALS (referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_referred UNIQUE (referred_id)
);

-- 5. PRESETS SHARING (presets)
CREATE TABLE IF NOT EXISTS public.presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  preset_link TEXT NOT NULL,
  preview_url TEXT,
  category TEXT DEFAULT 'Jedag Jedug',
  downloads INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. LIVE COMMUNITY CHATS (chats)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. AM GALLERY SHOWCASE (gallery)
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  likes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.am_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own AM logs" ON public.am_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AM logs" ON public.am_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Presets viewable by all" ON public.presets FOR SELECT USING (true);
CREATE POLICY "Chats viewable by all" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Gallery viewable by all" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Active codes viewable" ON public.redeem_codes FOR SELECT USING (is_active = true);

-- DEFAULT SEED DATA
INSERT INTO public.redeem_codes (code, limit_reward, is_active)
VALUES ('ALCAPREM2026', 10, true), ('RAMADHANVIP', 25, true)
ON CONFLICT (code) DO NOTHING;`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'config'>('sql');

  const [inputUrl, setInputUrl] = useState(supabaseUrl);
  const [inputKey, setInputKey] = useState(supabaseAnonKey);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(inputUrl.trim(), inputKey.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Supabase PostgreSQL Schema & Konfigurasi</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isSupabaseConfigured ? 'Terkoneksi' : 'Mode Offline / Local DB Aktif'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Skema 7 tabel lengkap siap dieksekusi di Supabase SQL Editor.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('sql')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 ${
              activeSubTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            SQL Script (7 Tables + RLS)
          </button>

          <button
            onClick={() => setActiveSubTab('config')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 ${
              activeSubTab === 'config'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Koneksi Credentials
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeSubTab === 'sql' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Tabel: <strong className="text-slate-200">profiles, am_logs, redeem_codes, referrals, presets, chats, gallery</strong>
                </span>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>SQL Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua SQL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code display */}
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-[400px]">
                {SUPABASE_SQL_SCRIPT}
              </pre>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Cara Pasang di Supabase:</span>
                  <span>
                    Buka project Supabase Anda → Klik menu <strong>SQL Editor</strong> di bilah kiri → Buat New Query → Paste SQL di atas → Klik tombol <strong>Run</strong>.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-4 max-w-lg">
              <p className="text-slate-300">
                Aplikasi ini mendukung penyimpanan ganda: otomatis berjalan menggunakan Local Database reaktif, atau dapat dihubungkan ke instance Supabase Cloud Anda secara langsung.
              </p>

              <div>
                <label className="block text-slate-400 mb-1">Project Supabase URL</label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Supabase Anon Key (Public)</label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300 transition-colors"
                >
                  Simpan & Hubungkan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputUrl('');
                    setInputKey('');
                    updateSupabaseConfig('', '');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Reset ke Local Mock
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>File tersimpan di: <code>/supabase/schema.sql</code></span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
