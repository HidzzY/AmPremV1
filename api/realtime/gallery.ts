// Vercel Serverless Function: /api/realtime/gallery
import { realtimeStore } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, gallery: realtimeStore.gallery });
    }

    if (req.method === 'POST') {
      const { image_url, caption, author_name, user_id, action, gallery_id } = rawBody;

      // Handle Like toggle
      if (action === 'like' && gallery_id) {
        const item = realtimeStore.gallery.find(g => g.id === gallery_id);
        if (item) {
          item.likes = (item.likes || 0) + 1;
        }
        return res.status(200).json({ success: true, gallery: realtimeStore.gallery });
      }

      const newItem = {
        id: 'gallery-' + Date.now(),
        image_url: image_url || '',
        caption: caption || '',
        author_name: author_name || 'AlcaW44',
        user_id: user_id || 'user-admin-wahid',
        likes: 0,
        created_at: new Date().toISOString()
      };
      realtimeStore.gallery.unshift(newItem);
      return res.status(200).json({ success: true, item: newItem, gallery: realtimeStore.gallery });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message || 'Error' });
  }
}
