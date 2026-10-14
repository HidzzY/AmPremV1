export type UserRole = 'free' | 'vip' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  role: UserRole;
  daily_limit: number;
  used_limit_today: number;
  last_limit_reset: string;
  created_at: string;
}

export interface AMLog {
  id: string;
  user_id: string;
  target_email: string;
  created_at: string;
}

export interface RedeemCode {
  code: string;
  created_by?: string;
  limit_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
}

export interface Preset {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  preset_link: string;
  preview_url?: string;
  category: string;
  downloads: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  role: UserRole;
  message: string;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  image_url: string;
  caption: string;
  likes: number;
  created_at: string;
}

export const ALLOWED_EMAIL_DOMAINS = [
  '@gmail.com',
  '@yahoo.com',
  '@yahoo.co.id',
  '@outlook.com',
  '@hotmail.com',
  '@icloud.com'
];

export function isValidEmailDomain(email: string): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(d => lower.endsWith(d));
}
