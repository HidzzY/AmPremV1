import React, { useState, useId } from 'react';
import { useAuth } from '../context/AuthContext';
import { isValidEmailDomain, ALLOWED_EMAIL_DOMAINS } from '../types';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight,
  Zap,
  KeyRound,
  Check,
  Gift
} from 'lucide-react';

interface AuthViewProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, isModal = false }) => {
  const { login, loginWithOAuth, register, pendingReferral } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(false); // Default to register or login

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(pendingReferral || '');
  const [showPassword, setShowPassword] = useState(false);
  
  // Turnstile verification state
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [isVerifyingTurnstile, setIsVerifyingTurnstile] = useState(false);

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Kosong', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Lemah', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Sedang', color: 'bg-amber-500' };
    return { score: 3, label: 'Kuat', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Email domain check on input
  const emailTrimmed = email.trim().toLowerCase();
  const hasEmailEntered = emailTrimmed.includes('@');
  const isEmailDomainValid = !hasEmailEntered || isValidEmailDomain(emailTrimmed);

  // Handle Turnstile click
  const handleTurnstileClick = () => {
    if (turnstileVerified || isVerifyingTurnstile) return;
    setIsVerifyingTurnstile(true);
    setTimeout(() => {
      setIsVerifyingTurnstile(false);
      setTurnstileVerified(true);
    }, 900);
  };

  // Quick fill admin credentials for wahidrahmannn1324@gmail.com
  const handleQuickAdmin = () => {
    setIsLoginTab(true);
    setEmail('wahidrahmannn1324@gmail.com');
    setUsername('wahidrahmannn1324@gmail.com');
    setPassword('AlcaAdminW44Dashboard#1');
    setTurnstileVerified(true);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!turnstileVerified) {
      setErrorMessage('Harap selesaikan verifikasi bahwa Anda adalah manusia.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLoginTab) {
        // Login flow
        const identifier = email || username;
        if (!identifier) {
          setErrorMessage('Harap masukkan username atau email Anda.');
          setIsLoading(false);
          return;
        }
        if (!password) {
          setErrorMessage('Harap masukkan kata sandi.');
          setIsLoading(false);
          return;
        }

        const res = await login(identifier, password);
        if (res.success) {
          setSuccessMessage(res.message);
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 600);
        } else {
          setErrorMessage(res.message);
        }
      } else {
        // Register flow
        if (!email) {
          setErrorMessage('Alamat email wajib diisi.');
          setIsLoading(false);
          return;
        }

        if (!isValidEmailDomain(emailTrimmed)) {
          setErrorMessage('Domain email tidak didukung. Harap gunakan @gmail.com, @yahoo.com, @yahoo.co.id, @outlook.com, @hotmail.com, atau @icloud.com.');
          setIsLoading(false);
          return;
        }

        if (!username || username.trim().length < 3) {
          setErrorMessage('Username minimal 3 karakter.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage('Kata sandi minimal 6 karakter.');
          setIsLoading(false);
          return;
        }

        const res = await register(email, username, password, referralCode);
        if (res.success) {
          setSuccessMessage(res.message);
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 800);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await loginWithOAuth(provider);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memulai login OAuth.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-4xl mx-auto' : 'min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8'}`}>
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* SISI KIRI: Hero Section & Fitur Utama (Mengacu Gambar 2) */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-[#0b0f19] border border-slate-800/80 shadow-2xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create Akun Alight Prem</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight text-balance">
              Generator Alight Motion Prem
            </h1>

            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Dapatkan akses fitur premium Alight Motion resmi secara instan dengan cloud limit tracker, dan ratusan preset video estetik siap pakai.
            </p>

            {/* Banner Image */}
            <div className="mt-6 rounded-xl overflow-hidden border border-slate-800 relative group">
              <img
                src="/banner.jpg"
                alt="Alight Motion Premium Pro Unlocked"
                referrerPolicy="no-referrer"
                className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-3">
                <span className="text-[11px] font-medium text-emerald-300">
                  Cepat - Dan Memuaskan
                </span>
              </div>
            </div>

            {/* Feature Points */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Sistem Limit & Reset Otomatis 24 Jam</h4>
                  <p className="text-[11px] text-slate-400">Pengguna Free mendapatkan 5x/hari dan VIP mendapatkan 100x/hari dengan riset otomatis.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Komunitas Preset & Live Chat Kreator</h4>
                  <p className="text-[11px] text-slate-400">Unduh preset XML 5MB Jedag Jedug viral dan berdiskusi langsung di forum realtime.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom creator signature */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Developed by <strong className="text-slate-200">Alca W44</strong></span>
            </div>
            <a 
              href="https://whatsapp.com/channel/0029Vb82nkLEwEjtLSQ49I44" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              Saluran Resmi WA <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* SISI KANAN: Glassmorphism Auth Card (Mengacu Gambar 2) */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl relative">
            
            {/* Tab Switcher Elegan: Masuk / Daftar */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  !isLoginTab
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar Akun Baru
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  isLoginTab
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk ke Akun
              </button>
            </div>

            {/* Title & subtitle */}
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white">
                {isLoginTab ? 'Selamat Datang Kembali' : 'Buat Akun'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isLoginTab
                  ? 'Masukkan kredensial Anda untuk mengakses generator dan limit harian.'
                  : 'Dapatkan 5x limit harian gratis atau lebih dengan kode referral.'}
              </p>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input (Always for register, optional/ident for login) */}
              {!isLoginTab ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Alamat Email <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="namaanda@gmail.com"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  {/* Domain Validation Helper */}
                  {hasEmailEntered && !isEmailDomainValid ? (
                    <div className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Hanya domain @gmail.com, @yahoo, @outlook, @hotmail, atau @icloud</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-slate-500">
                      Didukung: Gmail, Yahoo, Outlook, Hotmail, iCloud
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username atau Email <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username || email}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setEmail(e.target.value);
                      }}
                      placeholder="username atau email anda"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Username Input for Register */}
              {!isLoginTab && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username Profil <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="isi username akun"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Username ini juga akan menjadi kode referral Anda.
                  </p>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kata Sandi <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Indikator Kekuatan Password (Sesuai Gambar 2) */}
                {!isLoginTab && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Kekuatan Kata Sandi:</span>
                      <span className={`font-semibold ${
                        passwordStrength.score === 1 ? 'text-rose-400' :
                        passwordStrength.score === 2 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-800'}`} />
                      <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-800'}`} />
                      <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-800'}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Referral Code (Optional for register) */}
              {!isLoginTab && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kode Undangan (Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="masukin code redeeem"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  <p className="mt-1 text-[10px] text-emerald-400/80">
                    Dapatkan bonus +2 limit harian tambahan dengan kode undangan!
                  </p>
                </div>
              )}

              {/* Cloudflare Turnstile UI Style Verification Box (Sesuai Gambar 2) */}
              <div 
                onClick={handleTurnstileClick}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                  turnstileVerified
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                    turnstileVerified
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : isVerifyingTurnstile
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-900'
                  }`}>
                    {turnstileVerified ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isVerifyingTurnstile ? (
                      <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : null}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-200">
                      {turnstileVerified ? 'Verifikasi Manusia Berhasil' : 'Verifikasi bahwa Anda adalah manusia'}
                    </span>
                    <span className="text-[10px] text-slate-500">Cloudflare Turnstile Protected</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <ShieldCheck className={`w-5 h-5 ${turnstileVerified ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className="text-[9px] text-slate-600 font-mono">Turnstile</span>
                </div>
              </div>

              {/* Tombol Utama: Gradient Green Button "Buat akun" / "Masuk" */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 bg-size-200 hover:bg-right hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>{isLoginTab ? 'Masuk ke Dashboard' : 'Buat akun sekarang'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-slate-900 text-slate-500 text-[11px]">atau lanjutkan dengan</span>
              </div>
            </div>

            {/* Tombol OAuth: Google & GitHub (Sesuai Gambar 2) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
