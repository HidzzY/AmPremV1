import { Preset, ChatMessage, GalleryItem, RedeemCode } from '../types';

// Preset Hub: dimulai dari 0 karena pengguna lain belum ada
export const INITIAL_PRESETS: Preset[] = [];

// Live Chat: dimulai dari 0 pesan
export const INITIAL_CHATS: ChatMessage[] = [];

// AM Gallery: dimulai dari 0 karya
export const INITIAL_GALLERY: GalleryItem[] = [];

// Kode Redeem: dimulai dari 0 kode (dibuat manual oleh admin)
export const INITIAL_REDEEM_CODES: RedeemCode[] = [];

export const ADMIN_CREDENTIALS = {
  email: 'wahidrahmannn1324@gmail.com',
  username: 'alcaw44',
  password: 'AlcaAdminW44Dashboard#1'
};
