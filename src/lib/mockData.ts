import { Preset, ChatMessage, GalleryItem, RedeemCode, UserProfile } from '../types';

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'preset-1',
    user_id: 'user-alca',
    author_name: 'Alca W44',
    title: 'Preset XML JJ Sound Kane Viral TikTok 2026',
    preset_link: 'http://alight.link/JjKaneAlcaW44_2026',
    preview_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    category: 'Jedag Jedug',
    downloads: 1420,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'preset-2',
    user_id: 'user-alca',
    author_name: 'Alca W44',
    title: 'Cinematic 4K Teal Orange + Smooth Motion Blur (Under 5MB)',
    preset_link: 'http://alight.link/CinematicTealAlca_5MB',
    preview_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80',
    category: 'Cinematic',
    downloads: 980,
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
  },
  {
    id: 'preset-3',
    user_id: 'user-rizky',
    author_name: 'RizkyEditor',
    title: 'Preset Velocity Auto Shake Beat Bass Glitch',
    preset_link: 'http://alight.link/VelocityShakeRizky',
    preview_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    category: 'Velocity',
    downloads: 654,
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
  },
  {
    id: 'preset-4',
    user_id: 'user-fajar',
    author_name: 'FajarAMV',
    title: 'Anime Flow Effect + 3D Camera Pan Clean',
    preset_link: 'http://alight.link/AnimeFlow3DFajar',
    preview_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    category: 'Anime',
    downloads: 832,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'preset-5',
    user_id: 'user-alca',
    author_name: 'Alca W44',
    title: 'Typo 3D Estetik Lirik Berjalan Neon Glow',
    preset_link: 'http://alight.link/Typo3DNeonAlca',
    preview_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    category: 'Typo 3D',
    downloads: 1105,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

export const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'chat-1',
    user_id: 'user-alca',
    username: 'alcaw44',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'admin',
    message: 'Halo semua kreator Alight Motion! Selamat datang di Alight Pro Hub. Gunakan generator AM Prem dengan bijak ya!',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: 'chat-2',
    user_id: 'user-rizky',
    username: 'rizky_am',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    role: 'vip',
    message: 'Mantap bang Alca! Generatornya cepet banget langsung masuk ke email Gmail ku tanpa delay.',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'chat-3',
    user_id: 'user-siti',
    username: 'siti_creator',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    role: 'free',
    message: 'Ada yang punya preset JJ sound kane terbaru ga? Mau buat konten TikTok nanti sore.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'chat-4',
    user_id: 'user-alca',
    username: 'alcaw44',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'admin',
    message: 'Cek di tab Preset Hub mbak Siti, baru aja saya upload preset JJ sound kane 2026!',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gallery-1',
    user_id: 'user-alca',
    username: 'alcaw44',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    caption: 'Hasil grading Alight Motion 5.0 Cinematic Mood Tokyo Night. Efek glow + RGB split.',
    likes: 89,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'gallery-2',
    user_id: 'user-fajar',
    username: 'fajar_amv',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    caption: 'Cyberpunk Neon Visual Effect dibuat murni di smartphone dengan AM Prem.',
    likes: 64,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'gallery-3',
    user_id: 'user-rizky',
    username: 'rizky_am',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    caption: '3D Null camera motion test render 60fps tanpa watermark berkat AM Pro.',
    likes: 42,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export const INITIAL_REDEEM_CODES: RedeemCode[] = [
  {
    code: 'ALCAPREM2026',
    created_by: 'alcaw44',
    limit_reward: 10,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    code: 'RAMADHANVIP',
    created_by: 'alcaw44',
    limit_reward: 25,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    code: 'ALCAW44SPECIAL',
    created_by: 'alcaw44',
    limit_reward: 50,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

export const ADMIN_CREDENTIALS = {
  email: 'wahidrahmannn1324@gmail.com',
  username: 'alcaw44',
  password: 'AlcaAdminW44Dashboard#1'
};
