// Shared in-memory store for Vercel Serverless Functions
// Preserves real-time state, users, redeem codes, chats, presets, and gallery across function invocations

export interface RealtimeUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: 'admin' | 'vip' | 'free';
  daily_limit: number;
  used_limit_today: number;
  last_limit_reset: string;
  created_at: string;
}

export interface RealtimeRedeemCode {
  code: string;
  limit_reward: number;
  created_by?: string;
  is_active?: boolean;
  created_at: string;
}

export interface RealtimeState {
  users: RealtimeUser[];
  chats: any[];
  presets: any[];
  gallery: any[];
  amLogs: any[];
  redeemCodes: RealtimeRedeemCode[];
}

const DEFAULT_ADMIN: RealtimeUser = {
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

// Attach to globalThis to retain across warm lambdas in serverless runtime
const globalStore = (globalThis as any).__ALIGHT_REALTIME_STORE__ || {
  users: [DEFAULT_ADMIN],
  chats: [],
  presets: [],
  gallery: [],
  amLogs: [],
  redeemCodes: []
};

(globalThis as any).__ALIGHT_REALTIME_STORE__ = globalStore;

export const realtimeStore: RealtimeState = globalStore;

export function getCleanUsers(): RealtimeUser[] {
  return realtimeStore.users.map(u => {
    if (u.email === 'wahidrahmannn1324@gmail.com') {
      return {
        ...u,
        username: 'AlcaW44',
        role: 'admin',
        daily_limit: 9999
      };
    }
    return u;
  });
}
