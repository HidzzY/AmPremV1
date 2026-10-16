import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, AMLog, RedeemCode, Referral, Preset, ChatMessage, GalleryItem, UserRole, isValidEmailDomain } from '../types';
import { INITIAL_PRESETS, INITIAL_CHATS, INITIAL_GALLERY, INITIAL_REDEEM_CODES, ADMIN_CREDENTIALS } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  amLogs: AMLog[];
  presets: Preset[];
  chats: ChatMessage[];
  gallery: GalleryItem[];
  redeemCodes: RedeemCode[];
  claimedCodes: string[];
  pendingReferral: string | null;
  isSuperAdmin: boolean;
  isWsConnected: boolean;
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
  adminDeleteRedeemCode: (code: string) => void;
  addPreset: (title: string, link: string, previewUrl: string, category: string) => void;
  deletePreset: (presetId: string) => void;
  incrementPresetDownload: (presetId: string) => void;
  sendChatMessage: (message: string) => Promise<void>;
  refreshChats: () => Promise<void>;
  addGalleryItem: (imageUrl: string, caption: string) => void;
  toggleLikeGallery: (galleryId: string) => void;
  refreshLimitCheck: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'user-admin-wahid',
  email: 'wahidrahmannn1324@gmail.com',
  username: 'AlcaW44',
  avatar_url: '',
  role: 'admin',
  daily_limit: 9999,
  used_limit_today: 0,
  last_limit_reset: new Date().toISOString(),
  created_at: new Date().toISOString()
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

// BroadcastChannel for instant cross-tab real-time sync
const getRealtimeChannel = () => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    return new BroadcastChannel('alight_realtime_sync');
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Support independent multi-account testing per tab (sessionStorage has priority over localStorage)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const sessionUser = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('alight_current_user') : null;
      const localUser = typeof localStorage !== 'undefined' ? localStorage.getItem('alight_current_user') : null;
      const saved = sessionUser || localUser;

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'wahidrahmannn1324@gmail.com') {
          parsed.username = 'AlcaW44';
          parsed.role = 'admin';
          parsed.daily_limit = 9999;
        }

        const customAvatar = 
          localStorage.getItem(`alight_avatar_${parsed.id}`) || 
          localStorage.getItem(`alight_avatar_${parsed.email}`) ||
          (parsed.email === 'wahidrahmannn1324@gmail.com' ? localStorage.getItem('alight_user_avatar') : null);

        if (customAvatar) {
          parsed.avatar_url = customAvatar;
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Failed parsing current user from storage');
    }
    return null;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('alight_all_users');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        const cleaned = parsed.filter(u => 
          u.email === 'wahidrahmannn1324@gmail.com' || 
          (!u.id.includes('rizky') && !u.id.includes('demo') && !u.username.toLowerCase().includes('rizky') && !u.username.toLowerCase().includes('budi'))
        );
        if (cleaned.length > 0) {
          return cleaned.map(u => {
            const isSuper = u.email === 'wahidrahmannn1324@gmail.com';
            const customAvatar = 
              localStorage.getItem(`alight_avatar_${u.id}`) || 
              localStorage.getItem(`alight_avatar_${u.email}`) ||
              (isSuper ? localStorage.getItem('alight_user_avatar') : null);

            return {
              ...u,
              username: isSuper ? 'AlcaW44' : u.username,
              role: isSuper ? 'admin' : u.role,
              daily_limit: isSuper ? 9999 : (u.daily_limit || 5),
              avatar_url: customAvatar || u.avatar_url
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed parsing all users from localStorage');
    }

    const adminCustomAvatar = 
      localStorage.getItem('alight_user_avatar') || 
      localStorage.getItem('alight_avatar_wahidrahmannn1324@gmail.com') ||
      'https://api.dicebear.com/7.x/bottts/svg?seed=AlcaW44';

    return [{
      ...DEFAULT_ADMIN_PROFILE,
      avatar_url: adminCustomAvatar
    }];
  });

  const [amLogs, setAmLogs] = useState<AMLog[]>(() => {
    try {
      const saved = localStorage.getItem('alight_am_logs');
      if (saved) {
        const parsed: AMLog[] = JSON.parse(saved);
        return parsed.filter(l => l.id !== 'log-1' && l.id !== 'log-2');
      }
    } catch (e) {}
    return [];
  });

  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem('alight_presets');
      if (saved) {
        const parsed: Preset[] = JSON.parse(saved);
        return parsed.filter(p => p && p.id && !['preset-demo-1', 'preset-demo-2', 'preset-1', 'preset-2', 'preset-3'].includes(p.id));
      }
    } catch (e) {}
    return INITIAL_PRESETS;
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('alight_chats');
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        return parsed.filter(c => 
          c && c.id && c.message && 
          !c.message.toLowerCase().includes('mbak siti') &&
          !c.message.toLowerCase().includes('sound kane') &&
          !c.message.toLowerCase().includes('preset jj')
        );
      }
    } catch (e) {}
    return INITIAL_CHATS;
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem('alight_gallery');
      if (saved) {
        const parsed: GalleryItem[] = JSON.parse(saved);
        return parsed.filter(g => g && g.id && !['gallery-1', 'gallery-2', 'gallery-3'].includes(g.id));
      }
    } catch (e) {}
    return INITIAL_GALLERY;
  });

  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>(() => {
    try {
      const saved = localStorage.getItem('alight_redeem_codes');
      if (saved) {
        const parsed: RedeemCode[] = JSON.parse(saved);
        return parsed.filter(r => r && r.code);
      }
    } catch (e) {}
    return [
      { code: 'ALCAPRO2026', limit_reward: 10, is_active: true, created_at: new Date().toISOString() },
      { code: 'ALCAW44', limit_reward: 15, is_active: true, created_at: new Date().toISOString() },
      { code: 'VIPKREATORMU', limit_reward: 20, is_active: true, created_at: new Date().toISOString() }
    ];
  });

  const [claimedCodes, setClaimedCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('alight_claimed_codes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pendingReferral, setPendingReferral] = useState<string | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // WebSocket and BroadcastChannel references
  const wsRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Helper to preserve user custom avatar
  const enrichUsersWithCustomAvatars = (userList: UserProfile[]): UserProfile[] => {
    return userList.map(u => {
      const isSuperAdmin = u.email === 'wahidrahmannn1324@gmail.com';
      const customAvatar = 
        localStorage.getItem(`alight_avatar_${u.id}`) || 
        localStorage.getItem(`alight_avatar_${u.email}`) || 
        (isSuperAdmin ? localStorage.getItem('alight_user_avatar') : null);

      let finalAvatar = customAvatar || u.avatar_url;
      if (!finalAvatar || finalAvatar.includes('images.unsplash.com')) {
        finalAvatar = customAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${isSuperAdmin ? 'AlcaW44' : u.username}`;
      }

      if (isSuperAdmin) {
        return {
          ...u,
          username: 'AlcaW44',
          role: 'admin',
          daily_limit: 9999,
          avatar_url: finalAvatar
        };
      }

      return {
        ...u,
        avatar_url: finalAvatar
      };
    });
  };

  // Merge server profile into current active user state without losing higher earned limit!
  const mergeCurrentUserWithServer = (curr: UserProfile | null, serverUsers: UserProfile[]): UserProfile | null => {
    if (!curr) return null;
    const fresh = serverUsers.find((u: UserProfile) => 
      u.id === curr.id || (u.email && curr.email && u.email.toLowerCase() === curr.email.toLowerCase())
    );
    if (!fresh) return curr;

    const isSuperAdmin = curr.email === 'wahidrahmannn1324@gmail.com';

    const customAvatar = 
      localStorage.getItem(`alight_avatar_${curr.id}`) || 
      localStorage.getItem(`alight_avatar_${curr.email}`) || 
      (isSuperAdmin ? localStorage.getItem('alight_user_avatar') : null) || 
      (curr.avatar_url && !curr.avatar_url.includes('images.unsplash.com') ? curr.avatar_url : null);

    const chosenAvatar = customAvatar || (curr.avatar_url && !curr.avatar_url.includes('images.unsplash.com') ? curr.avatar_url : (fresh.avatar_url || curr.avatar_url));

    // CRITICAL: Keep highest earned daily_limit so browser refresh or sync NEVER degrades the limit!
    const bestLimit = isSuperAdmin ? 9999 : Math.max(curr.daily_limit || 5, fresh.daily_limit || 5);

    return {
      ...curr,
      ...fresh,
      id: curr.id,
      username: isSuperAdmin ? 'AlcaW44' : (curr.username || fresh.username),
      avatar_url: chosenAvatar,
      role: isSuperAdmin ? 'admin' : (fresh.role || curr.role),
      daily_limit: bestLimit,
      used_limit_today: fresh.used_limit_today !== undefined ? fresh.used_limit_today : curr.used_limit_today
    };
  };

  const filterCleanChats = (chatList: ChatMessage[]): ChatMessage[] => {
    return chatList.filter(c => 
      c && c.id && c.message && 
      !c.message.toLowerCase().includes('mbak siti') &&
      !c.message.toLowerCase().includes('sound kane') &&
      !c.message.toLowerCase().includes('preset jj')
    );
  };

  // Cross-tab broadcast channel listener
  useEffect(() => {
    channelRef.current = getRealtimeChannel();
    if (channelRef.current) {
      channelRef.current.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'SYNC_ALL') {
          if (payload.chats) setChats(filterCleanChats(payload.chats));
          if (payload.presets) setPresets(payload.presets);
          if (payload.gallery) setGallery(payload.gallery);
          if (payload.amLogs) setAmLogs(payload.amLogs);
          if (payload.redeemCodes) setRedeemCodes(payload.redeemCodes);
          if (payload.claimedCodes) setClaimedCodes(payload.claimedCodes);
          if (payload.users) {
            setAllUsers(payload.users);
            setCurrentUser(curr => mergeCurrentUserWithServer(curr, payload.users));
          }
        }
      };
    }

    return () => {
      channelRef.current?.close();
    };
  }, []);

  // MANUAL / ON-DEMAND CHAT & DATA REFRESH
  const refreshChats = async () => {
    try {
      const res = await fetch('/api/realtime/sync');
      if (!res.ok) return;
      const result = await res.json();
      if (result.success && result.data) {
        if (Array.isArray(result.data.chats)) setChats(filterCleanChats(result.data.chats));
        if (Array.isArray(result.data.presets)) setPresets(result.data.presets);
        if (Array.isArray(result.data.gallery)) setGallery(result.data.gallery);
        if (Array.isArray(result.data.amLogs)) setAmLogs(result.data.amLogs);
        if (Array.isArray(result.data.redeemCodes)) setRedeemCodes(result.data.redeemCodes);
        if (Array.isArray(result.data.claimedCodes)) {
          const codes = result.data.claimedCodes.map((c: any) => `${c.user_id}_${c.code}`);
          setClaimedCodes(prev => Array.from(new Set([...prev, ...codes])));
        }
        if (Array.isArray(result.data.users) && result.data.users.length > 0) {
          const enriched = enrichUsersWithCustomAvatars(result.data.users);
          setAllUsers(enriched);
          setCurrentUser(curr => mergeCurrentUserWithServer(curr, enriched));
        }
      }
    } catch (e) {}
  };

  // ==========================================
  // REAL-TIME ENGINE: WEBSOCKET PRIMARY + SSE & POLLING SECONDARY
  // ==========================================
  useEffect(() => {
    isComponentMounted.current = true;
    let wsReconnectTimeout: any = null;
    let wsPingInterval: any = null;
    let sseSource: EventSource | null = null;
    let sseReconnectTimeout: any = null;

    // 1. PRIMARY: Connect Native WebSocket to /ws
    const connectWebSocket = () => {
      if (typeof window === 'undefined' || !isComponentMounted.current) return;

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isComponentMounted.current) return;
          console.log('[Realtime] WebSocket connected successfully');
          setIsWsConnected(true);

          // Ping heartbeat every 15s to keep connection alive
          clearInterval(wsPingInterval);
          wsPingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted.current) return;
          try {
            const message = JSON.parse(event.data);
            handleRealtimeEvent(message);
          } catch (e) {
            console.warn('[Realtime WS] Parse error:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[Realtime WS] Socket error:', err);
          setIsWsConnected(false);
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          clearInterval(wsPingInterval);
          // Auto-reconnect with backoff
          if (isComponentMounted.current) {
            clearTimeout(wsReconnectTimeout);
            wsReconnectTimeout = setTimeout(connectWebSocket, 2000);
          }
        };
      } catch (err) {
        console.warn('[Realtime WS] Init failed:', err);
        if (isComponentMounted.current) {
          wsReconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    // 2. SECONDARY: Connect Server-Sent Events (SSE) as redundant push channel
    const connectSSE = () => {
      if (typeof window === 'undefined' || !window.EventSource || !isComponentMounted.current) return;

      try {
        sseSource = new EventSource('/api/realtime/stream');

        sseSource.onmessage = (event) => {
          if (!isComponentMounted.current) return;
          try {
            const message = JSON.parse(event.data);
            handleRealtimeEvent(message);
          } catch (e) {}
        };

        sseSource.onerror = () => {
          try {
            sseSource?.close();
          } catch {}
          if (isComponentMounted.current) {
            clearTimeout(sseReconnectTimeout);
            sseReconnectTimeout = setTimeout(connectSSE, 4000);
          }
        };
      } catch (e) {}
    };

    // Unified Event Dispatcher: processes real-time events from WS, SSE, or polling
    const handleRealtimeEvent = (msg: { type: string; data?: any }) => {
      if (!msg) return;

      if (msg.type === 'CONNECTED' && msg.data) {
        const state = msg.data;
        if (Array.isArray(state.chats)) setChats(filterCleanChats(state.chats));
        if (Array.isArray(state.presets)) setPresets(state.presets);
        if (Array.isArray(state.gallery)) setGallery(state.gallery);
        if (Array.isArray(state.amLogs)) setAmLogs(state.amLogs);
        if (Array.isArray(state.redeemCodes)) setRedeemCodes(state.redeemCodes);
        if (Array.isArray(state.claimedCodes)) {
          const codes = state.claimedCodes.map((c: any) => `${c.user_id}_${c.code}`);
          setClaimedCodes(prev => Array.from(new Set([...prev, ...codes])));
        }
        if (Array.isArray(state.users) && state.users.length > 0) {
          const enriched = enrichUsersWithCustomAvatars(state.users);
          setAllUsers(enriched);
          setCurrentUser(curr => mergeCurrentUserWithServer(curr, enriched));
        }
      } else if (msg.type === 'NEW_CHAT') {
        const incoming = msg.data?.chat;
        if (incoming && incoming.id && !incoming.message?.toLowerCase().includes('mbak siti')) {
          setChats(prev => {
            if (prev.some(c => c.id === incoming.id)) return prev;
            // Replace any optimistic message with matching user and content
            const withoutTemp = prev.filter(c => !(c.id.startsWith('temp-') && c.user_id === incoming.user_id && c.message === incoming.message));
            return [...withoutTemp, incoming];
          });
        } else if (Array.isArray(msg.data?.chats)) {
          setChats(filterCleanChats(msg.data.chats));
        }
      } else if (msg.type === 'USERS_UPDATED') {
        if (Array.isArray(msg.data?.users)) {
          const enriched = enrichUsersWithCustomAvatars(msg.data.users);
          setAllUsers(enriched);
          setCurrentUser(curr => mergeCurrentUserWithServer(curr, enriched));
        }
      } else if (msg.type === 'CLAIMED_CODES_UPDATED') {
        if (Array.isArray(msg.data?.claimedCodes)) {
          const codes = msg.data.claimedCodes.map((c: any) => `${c.user_id}_${c.code}`);
          setClaimedCodes(prev => Array.from(new Set([...prev, ...codes])));
        }
      } else if (msg.type === 'REDEEM_CODES_UPDATED') {
        if (Array.isArray(msg.data?.redeemCodes)) setRedeemCodes(msg.data.redeemCodes);
      } else if (msg.type === 'PRESETS_UPDATED') {
        if (Array.isArray(msg.data?.presets)) setPresets(msg.data.presets);
      } else if (msg.type === 'GALLERY_UPDATED') {
        if (Array.isArray(msg.data?.gallery)) setGallery(msg.data.gallery);
      } else if (msg.type === 'AM_LOGS_UPDATED') {
        if (Array.isArray(msg.data?.amLogs)) setAmLogs(msg.data.amLogs);
        if (Array.isArray(msg.data?.users)) {
          const enriched = enrichUsersWithCustomAvatars(msg.data.users);
          setAllUsers(enriched);
          setCurrentUser(curr => mergeCurrentUserWithServer(curr, enriched));
        }
      }
    };

    connectWebSocket();
    connectSSE();

    // 3. TERTIARY: Periodic Polling Sync as bulletproof fallback (every 2.5s)
    const pollingInterval = setInterval(refreshChats, 2500);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshChats();
      }
    };
    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', refreshChats);

    return () => {
      isComponentMounted.current = false;
      clearTimeout(wsReconnectTimeout);
      clearTimeout(sseReconnectTimeout);
      clearInterval(wsPingInterval);
      clearInterval(pollingInterval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', refreshChats);

      if (wsRef.current) {
        wsRef.current.close();
      }
      if (sseSource) {
        sseSource.close();
      }
    };
  }, []);

  const broadcastSync = (payload: {
    chats?: ChatMessage[];
    presets?: Preset[];
    gallery?: GalleryItem[];
    amLogs?: AMLog[];
    redeemCodes?: RedeemCode[];
    claimedCodes?: string[];
    users?: UserProfile[];
  }) => {
    try {
      channelRef.current?.postMessage({
        type: 'SYNC_ALL',
        payload
      });
    } catch (e) {}
  };

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

          if (!isValidEmailDomain(userEmail)) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setAuthCookies(null);
            alert('Domain email tidak diizinkan. Hanya menerima Gmail, Yahoo, Outlook, Hotmail, dan iCloud.');
            return;
          }

          const isSuperAdminEmail = userEmail === 'wahidrahmannn1324@gmail.com';
          const defaultUsername = session.user.user_metadata?.username || 
                                  session.user.user_metadata?.name || 
                                  userEmail.split('@')[0];

          let savedAvatar = 
            localStorage.getItem(`alight_avatar_${session.user.id}`) ||
            localStorage.getItem(`alight_avatar_${userEmail}`) ||
            (isSuperAdminEmail ? localStorage.getItem('alight_user_avatar') : null);

          let savedUserObj: UserProfile | null = null;
          try {
            const rawSaved = sessionStorage.getItem('alight_current_user') || localStorage.getItem('alight_current_user');
            if (rawSaved) savedUserObj = JSON.parse(rawSaved);
          } catch {}

          if (!savedAvatar && savedUserObj && (savedUserObj.id === session.user.id || savedUserObj.email === userEmail)) {
            if (savedUserObj.avatar_url && !savedUserObj.avatar_url.includes('images.unsplash.com')) {
              savedAvatar = savedUserObj.avatar_url;
            }
          }

          const finalAvatar = 
            savedAvatar || 
            session.user.user_metadata?.avatar_url || 
            `https://api.dicebear.com/7.x/bottts/svg?seed=${defaultUsername}`;

          const existingUsername = (savedUserObj && (savedUserObj.id === session.user.id || savedUserObj.email === userEmail)) ? savedUserObj.username : null;
          const finalUsername = isSuperAdminEmail ? 'AlcaW44' : (existingUsername || session.user.user_metadata?.username || defaultUsername);

          const profileObj: UserProfile = {
            id: session.user.id,
            email: userEmail,
            username: finalUsername,
            avatar_url: finalAvatar,
            role: isSuperAdminEmail ? 'admin' : (savedUserObj?.role || 'free'),
            daily_limit: isSuperAdminEmail ? 9999 : (savedUserObj?.daily_limit || 5),
            used_limit_today: savedUserObj?.used_limit_today || 0,
            last_limit_reset: savedUserObj?.last_limit_reset || new Date().toISOString(),
            created_at: savedUserObj?.created_at || new Date().toISOString()
          };

          if (finalAvatar && !finalAvatar.includes('images.unsplash.com')) {
            try {
              localStorage.setItem(`alight_avatar_${session.user.id}`, finalAvatar);
              localStorage.setItem(`alight_avatar_${userEmail}`, finalAvatar);
              if (isSuperAdminEmail) localStorage.setItem('alight_user_avatar', finalAvatar);
            } catch {}
          }

          setCurrentUser(profileObj);
          setAllUsers(prev => {
            const existing = prev.find(u => u.id === profileObj.id || u.email === profileObj.email);
            const updated = existing ? prev.map(u => (u.id === profileObj.id || u.email === profileObj.email) ? profileObj : u) : [profileObj, ...prev];
            broadcastSync({ users: updated });
            return updated;
          });
          setAuthCookies(profileObj);

          fetch('/api/realtime/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: profileObj })
          }).catch(() => {});
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Sync state to storage
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('alight_current_user', JSON.stringify(currentUser));
      localStorage.setItem('alight_current_user', JSON.stringify(currentUser));
      setAuthCookies(currentUser);
    } else {
      sessionStorage.removeItem('alight_current_user');
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
      const customAvatar = 
        localStorage.getItem('alight_avatar_user-admin-wahid') || 
        localStorage.getItem('alight_avatar_wahidrahmannn1324@gmail.com') ||
        localStorage.getItem('alight_user_avatar');

      const adminProfile = checkDailyResetForProfile({
        ...DEFAULT_ADMIN_PROFILE,
        username: 'AlcaW44',
        email: 'wahidrahmannn1324@gmail.com',
        daily_limit: 9999,
        avatar_url: customAvatar || DEFAULT_ADMIN_PROFILE.avatar_url
      });
      setCurrentUser(adminProfile);
      setAllUsers(prev => {
        const next = !prev.find(u => u.id === adminProfile.id) ? [adminProfile, ...prev] : prev.map(u => u.id === adminProfile.id ? adminProfile : u);
        broadcastSync({ users: next });
        return next;
      });
      setAuthCookies(adminProfile);

      fetch('/api/realtime/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: adminProfile })
      }).catch(() => {});

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
            username: isSuper ? 'AlcaW44' : (data.user.user_metadata?.username || userEmail.split('@')[0]),
            avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userEmail}`,
            role: isSuper ? 'admin' : 'free',
            daily_limit: isSuper ? 9999 : 5,
            used_limit_today: 0,
            last_limit_reset: new Date().toISOString(),
            created_at: data.user.created_at || new Date().toISOString()
          };

          setCurrentUser(loggedUser);
          setAllUsers(prev => {
            const exists = prev.find(u => u.id === loggedUser.id || u.email === loggedUser.email);
            const next = exists ? prev.map(u => (u.id === loggedUser.id || u.email === loggedUser.email) ? loggedUser : u) : [loggedUser, ...prev];
            broadcastSync({ users: next });
            return next;
          });
          setAuthCookies(loggedUser);

          fetch('/api/realtime/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: loggedUser })
          }).catch(() => {});

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

    if (allUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'Username sudah digunakan, silakan pilih yang lain.' };
    }

    if (allUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email sudah terdaftar. Silakan langsung login.' };
    }

    const isSuperAdminEmail = cleanEmail === 'wahidrahmannn1324@gmail.com';
    let initialDailyLimit = isSuperAdminEmail ? 9999 : 5;
    const effectiveRef = refCode?.trim().toLowerCase() || pendingReferral?.toLowerCase();

    if (effectiveRef && !isSuperAdminEmail) {
      const referrer = allUsers.find(u => u.username.toLowerCase() === effectiveRef);
      if (referrer) {
        initialDailyLimit += 2;
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
      username: isSuperAdminEmail ? 'AlcaW44' : cleanUsername,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      role: isSuperAdminEmail ? 'admin' : 'free',
      daily_limit: initialDailyLimit,
      used_limit_today: 0,
      last_limit_reset: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    setAllUsers(prev => {
      const next = [newUser, ...prev];
      broadcastSync({ users: next });
      return next;
    });
    setCurrentUser(newUser);
    setAuthCookies(newUser);

    fetch('/api/realtime/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newUser })
    }).catch(() => {});

    if (supabase) {
      supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            username: isSuperAdminEmail ? 'AlcaW44' : cleanUsername
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
    sessionStorage.removeItem('alight_current_user');
    localStorage.removeItem('alight_current_user');
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

    const updatedAvatar = avatarUrl.trim() || currentUser.avatar_url;

    const updated: UserProfile = {
      ...currentUser,
      username: cleanUsername,
      avatar_url: updatedAvatar
    };

    try {
      localStorage.setItem(`alight_avatar_${currentUser.id}`, updatedAvatar);
      localStorage.setItem(`alight_avatar_${currentUser.email}`, updatedAvatar);
      if (currentUser.email === 'wahidrahmannn1324@gmail.com') {
        localStorage.setItem('alight_user_avatar', updatedAvatar);
      }
      sessionStorage.setItem('alight_current_user', JSON.stringify(updated));
      localStorage.setItem('alight_current_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save avatar error:', e);
    }

    setCurrentUser(updated);
    setAllUsers(prev => {
      const next = prev.map(u => (u.id === updated.id || u.email === updated.email) ? updated : u);
      broadcastSync({ users: next });
      return next;
    });
    setAuthCookies(updated);

    if (supabase) {
      supabase.auth.updateUser({
        data: {
          avatar_url: updatedAvatar,
          username: cleanUsername
        }
      }).catch(() => {});
    }

    fetch('/api/realtime/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updated })
    }).catch(() => {});

    return { success: true, message: 'Profil Anda berhasil diperbarui!' };
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setAllUsers(prev => {
      const next = prev.filter(u => u.id !== userId);
      broadcastSync({ users: next });
      return next;
    });
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

    const newUsedCount = (currentUser.used_limit_today || 0) + 1;

    const updatedUser: UserProfile = {
      ...currentUser,
      used_limit_today: newUsedCount
    };

    setCurrentUser(updatedUser);
    
    setAllUsers(prev => {
      const nextUsers = prev.map(u => u.id === updatedUser.id ? { ...u, used_limit_today: newUsedCount } : u);
      broadcastSync({
        amLogs: [newLog, ...amLogs],
        users: nextUsers
      });
      return nextUsers;
    });
    setAmLogs(prev => [newLog, ...prev]);

    fetch('/api/realtime/am-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetEmail,
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar_url
      })
    }).catch(() => {});

    return true;
  };

  // Dedicated Robust Redeem Code Claim with Server-Authoritative State & Zero Limit Reset
  const claimRedeemCode = async (code: string): Promise<{ success: boolean; message: string; reward?: number }> => {
    if (!currentUser) return { success: false, message: 'Silakan login terlebih dahulu.' };

    const cleanCode = code.trim().toUpperCase();

    // Optimistic local check to immediately prevent duplicate submissions
    if (claimedCodes.includes(`${currentUser.id}_${cleanCode}`)) {
      return { success: false, message: `Anda sudah pernah mengklaim kode redeem "${cleanCode}" sebelumnya.` };
    }

    try {
      const res = await fetch('/api/realtime/redeem-code/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          userId: currentUser.id,
          email: currentUser.email,
          username: currentUser.username
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data?.message || 'Kode redeem tidak valid atau sudah kadaluarsa.'
        };
      }

      // Update state with server's confirmed new limit!
      const newLimit = typeof data.newDailyLimit === 'number' ? data.newDailyLimit : (currentUser.daily_limit + (data.reward || 5));
      const updatedUser: UserProfile = {
        ...currentUser,
        daily_limit: newLimit
      };

      setCurrentUser(updatedUser);
      setAllUsers(prev => {
        const next = prev.map(u => (u.id === updatedUser.id || u.email === updatedUser.email) ? updatedUser : u);
        broadcastSync({ users: next });
        return next;
      });

      const newClaimKey = `${currentUser.id}_${cleanCode}`;
      setClaimedCodes(prev => {
        const next = Array.from(new Set([...prev, newClaimKey]));
        localStorage.setItem('alight_claimed_codes', JSON.stringify(next));
        return next;
      });

      sessionStorage.setItem('alight_current_user', JSON.stringify(updatedUser));
      localStorage.setItem('alight_current_user', JSON.stringify(updatedUser));

      return {
        success: true,
        message: data.message || `Selamat! Kode ${cleanCode} berhasil diklaim (+${data.reward} limit).`,
        reward: data.reward
      };
    } catch (err: any) {
      console.error('Claim redeem code error:', err);
      return {
        success: false,
        message: 'Gagal menghubungi server saat klaim kode redeem. Periksa koneksi internet Anda.'
      };
    }
  };

  // Admin Actions
  const adminSetLimit = (userId: string, newLimit: number) => {
    setAllUsers(prev => {
      const next = prev.map(u => (u.id === userId ? { ...u, daily_limit: newLimit } : u));
      broadcastSync({ users: next });
      return next;
    });
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, daily_limit: newLimit } : null);
    }
    fetch('/api/realtime/users/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_limit', userId, newLimit })
    }).catch(() => {});
  };

  const adminBroadcastLimit = (addAmount: number) => {
    setAllUsers(prev => {
      const next = prev.map(u => ({ ...u, daily_limit: u.daily_limit + addAmount }));
      broadcastSync({ users: next });
      return next;
    });
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, daily_limit: prev.daily_limit + addAmount } : null);
    }
    fetch('/api/realtime/users/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'broadcast_limit', broadcastAdd: addAmount })
    }).catch(() => {});
  };

  const adminResetUserLimit = (userId: string) => {
    setAllUsers(prev => {
      const next = prev.map(u => (u.id === userId ? { ...u, used_limit_today: 0 } : u));
      broadcastSync({ users: next });
      return next;
    });
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, used_limit_today: 0 } : null);
    }
    fetch('/api/realtime/users/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_limit', userId })
    }).catch(() => {});
  };

  const adminChangeRole = (userId: string, role: UserRole) => {
    const limit = role === 'admin' ? 9999 : role === 'vip' ? 100 : 5;
    setAllUsers(prev => {
      const next = prev.map(u => (u.id === userId ? { ...u, role, daily_limit: limit } : u));
      broadcastSync({ users: next });
      return next;
    });
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role, daily_limit: limit } : null);
    }
    fetch('/api/realtime/users/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_role', userId, role })
    }).catch(() => {});
  };

  const adminAddRedeemCode = (code: string, reward: number) => {
    const clean = code.trim().toUpperCase();
    const newCode: RedeemCode = {
      code: clean,
      created_by: currentUser?.username || 'AlcaW44',
      limit_reward: reward,
      is_active: true,
      created_at: new Date().toISOString()
    };
    setRedeemCodes(prev => {
      const next = [newCode, ...prev.filter(c => c.code !== clean)];
      broadcastSync({ redeemCodes: next });
      return next;
    });
    fetch('/api/realtime/redeem-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: clean, limit_reward: reward })
    }).catch(() => {});
  };

  const adminDeleteRedeemCode = (codeToDelete: string) => {
    const clean = codeToDelete.trim().toUpperCase();
    setRedeemCodes(prev => {
      const next = prev.filter(c => c.code.toUpperCase() !== clean);
      broadcastSync({ redeemCodes: next });
      return next;
    });
    fetch(`/api/realtime/redeem-code/${encodeURIComponent(clean)}`, {
      method: 'DELETE'
    }).catch(() => {});
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
    setPresets(prev => {
      const next = [newPreset, ...prev];
      broadcastSync({ presets: next });
      return next;
    });
    fetch('/api/realtime/preset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newPreset.title,
        link: newPreset.preset_link,
        preview_url: newPreset.preview_url,
        category: newPreset.category,
        user_id: currentUser.id,
        username: currentUser.username,
        avatar_url: currentUser.avatar_url
      })
    }).catch(() => {});
  };

  const deletePreset = (presetId: string) => {
    setPresets(prev => {
      const next = prev.filter(p => p.id !== presetId);
      broadcastSync({ presets: next });
      return next;
    });
    fetch(`/api/realtime/preset/${presetId}`, {
      method: 'DELETE'
    }).catch(() => {});
  };

  const incrementPresetDownload = (presetId: string) => {
    setPresets(prev =>
      prev.map(p => (p.id === presetId ? { ...p, downloads: p.downloads + 1 } : p))
    );
    fetch(`/api/realtime/preset/${presetId}/download`, {
      method: 'POST'
    }).catch(() => {});
  };

  // INSTANT MULTI-USER REAL-TIME CHAT SEND WITH WEBSOCKET + REST REDUNDANCY
  const sendChatMessage = async (message: string) => {
    if (!currentUser || !message.trim()) return;
    const cleanMsg = message.trim();

    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const optimisticMsg: ChatMessage = {
      id: tempId,
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url,
      role: currentUser.role,
      message: cleanMsg,
      created_at: new Date().toISOString()
    };

    // 1. Instant local optimistic update for 0ms lag
    setChats(prev => [...prev, optimisticMsg]);

    const chatPayload = {
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url,
      role: currentUser.role,
      message: cleanMsg
    };

    // 2. Push immediately over Native WebSocket if open (<10ms transmission)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'SEND_CHAT',
          payload: chatPayload
        }));
      } catch (e) {
        console.warn('WS send failed, falling back to HTTP:', e);
      }
    }

    // 3. Redundant HTTP POST guarantees delivery and updates optimistic message with confirmed ID
    try {
      const res = await fetch('/api/realtime/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload)
      });
      const data = await res.json();
      if (data.success && data.chat) {
        setChats(prev => {
          const withoutTemp = prev.filter(c => c.id !== tempId);
          if (withoutTemp.some(c => c.id === data.chat.id)) return withoutTemp;
          return [...withoutTemp, data.chat];
        });
      }
    } catch (err) {
      console.error('Failed to send chat message over HTTP:', err);
    }
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
    setGallery(prev => {
      const next = [newItem, ...prev];
      broadcastSync({ gallery: next });
      return next;
    });
    fetch('/api/realtime/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: newItem.image_url,
        caption: newItem.caption,
        user_id: currentUser.id,
        username: currentUser.username,
        avatar_url: currentUser.avatar_url
      })
    }).catch(() => {});
  };

  const toggleLikeGallery = (galleryId: string) => {
    setGallery(prev =>
      prev.map(g => (g.id === galleryId ? { ...g, likes: g.likes + 1 } : g))
    );
    fetch(`/api/realtime/gallery/${galleryId}/like`, {
      method: 'POST'
    }).catch(() => {});
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
        claimedCodes,
        pendingReferral,
        isSuperAdmin,
        isWsConnected,
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
        adminDeleteRedeemCode,
        addPreset,
        deletePreset,
        incrementPresetDownload,
        sendChatMessage,
        refreshChats,
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
