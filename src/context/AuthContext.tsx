import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AMLog, RedeemCode, Referral, Preset, ChatMessage, GalleryItem, UserRole, isValidEmailDomain } from '../types';
import { INITIAL_PRESETS, INITIAL_CHATS, INITIAL_GALLERY, INITIAL_REDEEM_CODES, ADMIN_CREDENTIALS } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  amLogs: AMLog[];
  presets: Preset[];
  chats: ChatMessage[];
  gallery: GalleryItem[];
  redeemCodes: RedeemCode[];
  pendingReferral: string | null;
  isSuperAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message: string }>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<{ success: boolean; message: string }>;
  register: (email: string, username: string, pass: string, refCode?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (username: string, avatarUrl: string) => Promise<{ success: boolean; message: string }>;
  deleteAccount: () => Promise<void>;
  recordAMLog: (targetEmail: string) => Promise<boolean>;
  claimRedeemCode: (code: string) => Promise<{ success: boolean; message: string; reward?: number }>;
  adminSetLimit: (userId: string, newLimit: number) => void;
  adminBroadcastLimit: (addAmount: number) => void;
  adminResetUserLimit: (userId: string) => void;
  adminChangeRole: (userId: string, role: UserRole) => void;
  adminAddRedeemCode: (code: string, reward: number) => void;
  addPreset: (title: string, link: string, previewUrl: string, category: string) => void;
  deletePreset: (presetId: string) => void;
  incrementPresetDownload: (presetId: string) => void;
  sendChatMessage: (message: string) => void;
  addGalleryItem: (imageUrl: string, caption: string) => void;
  toggleLikeGallery: (galleryId: string) => void;
  refreshLimitCheck: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Primary Admin Profile locked to wahidrahmannn1324@gmail.com
const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'user-admin-wahid',
  email: 'wahidrahmannn1324@gmail.com',
  username: 'SuperAdmin_Alca',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  role: 'admin',
  daily_limit: 9999,
  used_limit_today: 0,
  last_limit_reset: new Date().toISOString(),
  created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
};

const DEFAULT_VIP_PROFILE: UserProfile = {
  id: 'user-rizky-vip',
  email: 'rizky.amv@gmail.com',
  username: 'rizky_am',
  avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  role: 'vip',
  daily_limit: 100,
  used_limit_today: 4,
  last_limit_reset: new Date().toISOString(),
  created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString()
};

// Helper to set cookie for middleware synchronization
function setAuthCookies(user: UserProfile | null) {
  if (typeof document === 'undefined') return;
  if (user) {
    document.cookie = `alight_session=${user.id}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `alight_user_email=${encodeURIComponent(user.email)}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `alight_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `alight_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('alight_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('alight_all_users');
    return saved ? JSON.parse(saved) : [DEFAULT_ADMIN_PROFILE, DEFAULT_VIP_PROFILE];
  });

  const [amLogs, setAmLogs] = useState<AMLog[]>(() => {
    const saved = localStorage.getItem('alight_am_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log-1',
        user_id: 'user-rizky-vip',
        target_email: 'rizky.project2026@gmail.com',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'log-2',
        user_id: 'user-admin-wahid',
        target_email: 'alca.tester@yahoo.com',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
  });

  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('alight_presets');
    return saved ? JSON.parse(saved) : INITIAL_PRESETS;
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('alight_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('alight_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY;
  });

  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>(() => {
    const saved = localStorage.getItem('alight_redeem_codes');
    return saved ? JSON.parse(saved) : INITIAL_REDEEM_CODES;
  });

  const [claimedCodes, setClaimedCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('alight_claimed_codes');
    return saved ? JSON.parse(saved) : [];
  });

  const [pendingReferral, setPendingReferral] = useState<string | null>(null);

  // Check URL query for referral link e.g., ?code=username or ?coderedeem=username
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code') || urlParams.get('coderedeem');
      if (code) {
        setPendingReferral(code.trim());
      }
    }
  }, []);

  // Listen to Supabase Auth State changes for OAuth login (Google/GitHub)
  useEffect(() => {
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase() || '';

          // Strict Domain Validation in OAuth Callback
          if (!isValidEmailDomain(userEmail)) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setAuthCookies(null);
            alert('Domain email tidak diizinkan. Hanya menerima Gmail, Yahoo, Outlook, Hotmail, dan iCloud.');
            return;
          }

          // Check if admin email
          const isSuperAdminEmail = userEmail === 'wahidrahmannn1324@gmail.com';
          const username = session.user.user_metadata?.username || 
                           session.user.user_metadata?.name || 
                           userEmail.split('@')[0];

          const profileObj: UserProfile = {
            id: session.user.id,
            email: userEmail,
            username: isSuperAdminEmail ? 'SuperAdmin_Alca' : username,
            avatar_url: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            role: isSuperAdminEmail ? 'admin' : 'free',
            daily_limit: isSuperAdminEmail ? 9999 : 5,
            used_limit_today: 0,
            last_limit_reset: new Date().toISOString(),
            created_at: new Date().toISOString()
          };

          setCurrentUser(profileObj);
          setAllUsers(prev => {
            const existing = prev.find(u => u.id === profileObj.id || u.email === profileObj.email);
            if (existing) {
              return prev.map(u => (u.id === profileObj.id || u.email === profileObj.email) ? profileObj : u);
            }
            return [profileObj, ...prev];
          });
          setAuthCookies(profileObj);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Sync state to localStorage & cookies
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('alight_current_user', JSON.stringify(currentUser));
      setAuthCookies(currentUser);
    } else {
      localStorage.removeItem('alight_current_user');
      setAuthCookies(null);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('alight_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('alight_am_logs', JSON.stringify(amLogs));
  }, [amLogs]);

  useEffect(() => {
    localStorage.setItem('alight_presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('alight_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('alight_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('alight_redeem_codes', JSON.stringify(redeemCodes));
  }, [redeemCodes]);

  useEffect(() => {
    localStorage.setItem('alight_claimed_codes', JSON.stringify(claimedCodes));
  }, [claimedCodes]);

  // Check 24-hour limit reset
  const checkDailyResetForProfile = (profile: UserProfile): UserProfile => {
    const lastReset = new Date(profile.last_limit_reset).getTime();
    const now = Date.now();
    const diffHours = (now - lastReset) / (1000 * 60 * 60);

    const lastDate = new Date(profile.last_limit_reset).toDateString();
    const todayDate = new Date().toDateString();

    if (diffHours >= 24 || lastDate !== todayDate) {
      return {
        ...profile,
        used_limit_today: 0,
        last_limit_reset: new Date().toISOString()
      };
    }
    return profile;
  };

  const refreshLimitCheck = () => {
    if (currentUser) {
      const updated = checkDailyResetForProfile(currentUser);
      if (updated.used_limit_today !== currentUser.used_limit_today) {
        setCurrentUser(updated);
        setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      }
    }
  };

  useEffect(() => {
    refreshLimitCheck();
    const interval = setInterval(refreshLimitCheck, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Check if current user is SuperAdmin
  const isSuperAdmin = Boolean(
    currentUser &&
    currentUser.email.toLowerCase() === 'wahidrahmannn1324@gmail.com' &&
    currentUser.role === 'admin'
  );

  // Login handler
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const cleanId = identifier.trim().toLowerCase();

    // 1. Direct Admin Credential Check for wahidrahmannn1324@gmail.com or alcaw44
    if (
      (cleanId === 'wahidrahmannn1324@gmail.com' || cleanId === 'alcaw44') &&
      pass === ADMIN_CREDENTIALS.password
    ) {
      const adminProfile = checkDailyResetForProfile({
        ...DEFAULT_ADMIN_PROFILE,
        email: 'wahidrahmannn1324@gmail.com'
      });
      setCurrentUser(adminProfile);
      setAllUsers(prev => {
        if (!prev.find(u => u.id === adminProfile.id)) return [adminProfile, ...prev];
        return prev.map(u => u.id === adminProfile.id ? adminProfile : u);
      });
      setAuthCookies(adminProfile);
      return { success: true, message: 'Selamat datang kembali, SuperAdmin (wahidrahmannn1324@gmail.com)!' };
    }

    // 2. Local users database
    const found = allUsers.find(
      u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (found) {
      const checkedUser = checkDailyResetForProfile(found);
      setCurrentUser(checkedUser);
      setAuthCookies(checkedUser);
      return { success: true, message: `Berhasil masuk! Selamat datang, ${checkedUser.username}.` };
    }

    // 3. Supabase Auth Sign In
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password: pass
        });
        if (error) {
          return { success: false, message: error.message };
        }
        if (data.user) {
          const userEmail = data.user.email?.toLowerCase() || '';
          
          if (!isValidEmailDomain(userEmail)) {
            await supabase.auth.signOut();
            return {
              success: false,
              message: 'Domain email tidak diizinkan. Hanya menerima Gmail, Yahoo, Outlook, Hotmail, dan iCloud.'
            };
          }

          const isSuper = userEmail === 'wahidrahmannn1324@gmail.com';
          const loggedUser: UserProfile = {
            id: data.user.id,
            email: userEmail,
            username: isSuper ? 'SuperAdmin_Alca' : (data.user.user_metadata?.username || userEmail.split('@')[0]),
            avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userEmail}`,
            role: isSuper ? 'admin' : 'free',
            daily_limit: isSuper ? 9999 : 5,
            used_limit_today: 0,
            last_limit_reset: new Date().toISOString(),
            created_at: data.user.created_at || new Date().toISOString()
          };

          setCurrentUser(loggedUser);
          setAuthCookies(loggedUser);
          return { success: true, message: 'Berhasil login via Supabase Auth!' };
        }
      } catch (err: any) {
        console.warn('Supabase signin error:', err);
      }
    }

    return {
      success: false,
      message: 'Akun tidak ditemukan atau kata sandi salah. Gunakan username/email yang terdaftar.'
    };
  };

  // OAuth Login (Google / GitHub)
  const loginWithOAuth = async (provider: 'google' | 'github'): Promise<{ success: boolean; message: string }> => {
    if (!supabase) {
      return { success: false, message: 'Supabase client belum terinisialisasi.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: `Mengalihkan ke ${provider}...` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memulai autentikasi OAuth.' };
    }
  };

  // Register handler
  const register = async (
    email: string,
    username: string,
    pass: string,
    refCode?: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Policy Rule 3: Strict Email Domain Whitelist
    if (!isValidEmailDomain(cleanEmail)) {
      return {
        success: false,
        message: 'Domain email tidak diizinkan. Hanya menerima Gmail, Yahoo, Outlook, Hotmail, dan iCloud.'
      };
    }

    if (cleanUsername.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter.' };
    }

    if (pass.length < 6) {
      return { success: false, message: 'Kata sandi minimal 6 karakter.' };
    }

    // Check existing
    if (allUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'Username sudah digunakan, silakan pilih yang lain.' };
    }

    if (allUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email sudah terdaftar. Silakan langsung login.' };
    }

    // Admin rule: wahidrahmannn1324@gmail.com is always SuperAdmin!
    const isSuperAdminEmail = cleanEmail === 'wahidrahmannn1324@gmail.com';

    // Referral logic: Referrer gets +3 limit, referred user gets +2 bonus limit
    let initialDailyLimit = isSuperAdminEmail ? 9999 : 5;
    const effectiveRef = refCode?.trim().toLowerCase() || pendingReferral?.toLowerCase();

    if (effectiveRef && !isSuperAdminEmail) {
      const referrer = allUsers.find(u => u.username.toLowerCase() === effectiveRef);
      if (referrer) {
        initialDailyLimit += 2;
        // Credit referrer +3
        setAllUsers(prev =>
          prev.map(u =>
            u.id === referrer.id
              ? { ...u, daily_limit: u.daily_limit + 3 }
              : u
          )
        );
      }
    }

    const newUser: UserProfile = {
      id: 'user-' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      username: isSuperAdminEmail ? 'SuperAdmin_Alca' : cleanUsername,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      role: isSuperAdminEmail ? 'admin' : 'free',
      daily_limit: initialDailyLimit,
      used_limit_today: 0,
      last_limit_reset: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setAuthCookies(newUser);

    // If Supabase is connected, register in auth.users
    if (supabase) {
      supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            username: isSuperAdminEmail ? 'SuperAdmin_Alca' : cleanUsername
          }
        }
      }).catch(err => console.warn('Supabase signup fallback:', err));
    }

    const bonusText = effectiveRef ? ' (Bonus +2 Limit dari referral aktif!)' : '';
    return {
      success: true,
      message: `Akun berhasil didaftarkan! Selamat bergabung, ${newUser.username}.${bonusText}`
    };
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthCookies(null);
    if (supabase) {
      supabase.auth.signOut().catch(() => null);
    }
  };

  const updateProfile = async (username: string, avatarUrl: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Silakan login terlebih dahulu.' };

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter.' };
    }

    const conflict = allUsers.find(
      u => u.id !== currentUser.id && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (conflict) {
      return { success: false, message: 'Username sudah digunakan orang lain.' };
    }

    const updated: UserProfile = {
      ...currentUser,
      username: cleanUsername,
      avatar_url: avatarUrl.trim() || currentUser.avatar_url
    };

    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setAuthCookies(updated);

    return { success: true, message: 'Profil Anda berhasil diperbarui!' };
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    setCurrentUser(null);
    setAuthCookies(null);
  };

  const recordAMLog = async (targetEmail: string): Promise<boolean> => {
    if (!currentUser) return false;

    const newLog: AMLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      user_id: currentUser.id,
      target_email: targetEmail,
      created_at: new Date().toISOString()
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      used_limit_today: currentUser.used_limit_today + 1
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setAmLogs(prev => [newLog, ...prev]);

    return true;
  };

  const claimRedeemCode = async (code: string): Promise<{ success: boolean; message: string; reward?: number }> => {
    if (!currentUser) return { success: false, message: 'Silakan login terlebih dahulu.' };

    const cleanCode = code.trim().toUpperCase();

    if (claimedCodes.includes(`${currentUser.id}_${cleanCode}`)) {
      return { success: false, message: 'Anda sudah pernah mengklaim kode ini sebelumnya.' };
    }

    const foundCode = redeemCodes.find(c => c.code.toUpperCase() === cleanCode && c.is_active);
    if (!foundCode) {
      return { success: false, message: 'Kode redeem tidak valid atau sudah tidak aktif.' };
    }

    const reward = foundCode.limit_reward;
    const updatedUser: UserProfile = {
      ...currentUser,
      daily_limit: currentUser.daily_limit + reward
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setClaimedCodes(prev => [...prev, `${currentUser.id}_${cleanCode}`]);

    return {
      success: true,
      message: `Selamat! Anda berhasil mengklaim ${reward} limit tambahan.`,
      reward
    };
  };

  // Admin Actions
  const adminSetLimit = (userId: string, newLimit: number) => {
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, daily_limit: newLimit } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, daily_limit: newLimit } : null);
    }
  };

  const adminBroadcastLimit = (addAmount: number) => {
    setAllUsers(prev =>
      prev.map(u => ({ ...u, daily_limit: u.daily_limit + addAmount }))
    );
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, daily_limit: prev.daily_limit + addAmount } : null);
    }
  };

  const adminResetUserLimit = (userId: string) => {
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, used_limit_today: 0 } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, used_limit_today: 0 } : null);
    }
  };

  const adminChangeRole = (userId: string, role: UserRole) => {
    const limit = role === 'admin' ? 9999 : role === 'vip' ? 100 : 5;
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role, daily_limit: limit } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role, daily_limit: limit } : null);
    }
  };

  const adminAddRedeemCode = (code: string, reward: number) => {
    const newCode: RedeemCode = {
      code: code.trim().toUpperCase(),
      created_by: currentUser?.username || 'admin',
      limit_reward: reward,
      is_active: true,
      created_at: new Date().toISOString()
    };
    setRedeemCodes(prev => [newCode, ...prev.filter(c => c.code !== newCode.code)]);
  };

  const addPreset = (title: string, link: string, previewUrl: string, category: string) => {
    if (!currentUser) return;
    const newPreset: Preset = {
      id: 'preset-' + Math.random().toString(36).substring(2, 9),
      user_id: currentUser.id,
      author_name: currentUser.username,
      title: title.trim(),
      preset_link: link.trim(),
      preview_url: previewUrl.trim() || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
      category: category || 'Jedag Jedug',
      downloads: 0,
      created_at: new Date().toISOString()
    };
    setPresets(prev => [newPreset, ...prev]);
  };

  const deletePreset = (presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const incrementPresetDownload = (presetId: string) => {
    setPresets(prev =>
      prev.map(p => (p.id === presetId ? { ...p, downloads: p.downloads + 1 } : p))
    );
  };

  const sendChatMessage = (message: string) => {
    if (!currentUser || !message.trim()) return;
    const newMsg: ChatMessage = {
      id: 'chat-' + Math.random().toString(36).substring(2, 9),
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url,
      role: currentUser.role,
      message: message.trim(),
      created_at: new Date().toISOString()
    };
    setChats(prev => [...prev, newMsg]);
  };

  const addGalleryItem = (imageUrl: string, caption: string) => {
    if (!currentUser) return;
    const newItem: GalleryItem = {
      id: 'gallery-' + Math.random().toString(36).substring(2, 9),
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url,
      image_url: imageUrl.trim(),
      caption: caption.trim(),
      likes: 0,
      created_at: new Date().toISOString()
    };
    setGallery(prev => [newItem, ...prev]);
  };

  const toggleLikeGallery = (galleryId: string) => {
    setGallery(prev =>
      prev.map(g => (g.id === galleryId ? { ...g, likes: g.likes + 1 } : g))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        amLogs,
        presets,
        chats,
        gallery,
        redeemCodes,
        pendingReferral,
        isSuperAdmin,
        login,
        loginWithOAuth,
        register,
        logout,
        updateProfile,
        deleteAccount,
        recordAMLog,
        claimRedeemCode,
        adminSetLimit,
        adminBroadcastLimit,
        adminResetUserLimit,
        adminChangeRole,
        adminAddRedeemCode,
        addPreset,
        deletePreset,
        incrementPresetDownload,
        sendChatMessage,
        addGalleryItem,
        toggleLikeGallery,
        refreshLimitCheck
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
