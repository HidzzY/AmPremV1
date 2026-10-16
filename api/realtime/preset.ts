// Vercel Serverless Function: /api/realtime/preset
import { realtimeStore } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, presets: realtimeStore.presets });
    }

    if (req.method === 'POST') {
      const { title, preset_link, preview_url, category, author_name, user_id } = rawBody;
      const newPreset = {
        id: 'preset-' + Date.now(),
        title: title || 'Preset Baru',
        preset_link: preset_link || '#',
        preview_url: preview_url || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
        category: category || 'Jedag Jedug',
        author_name: author_name || 'AlcaW44',
        user_id: user_id || 'user-admin-wahid',
        downloads: 0,
        created_at: new Date().toISOString()
      };
      realtimeStore.presets.unshift(newPreset);
      return res.status(200).json({ success: true, preset: newPreset, presets: realtimeStore.presets });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || rawBody;
      realtimeStore.presets = realtimeStore.presets.filter(p => p.id !== id);
      return res.status(200).json({ success: true, presets: realtimeStore.presets });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message || 'Error' });
  }
}
