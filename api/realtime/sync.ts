import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const DATA_FILE = path.resolve(process.cwd(), '.data', 'realtime_store.json');
  let data: any = {
    users: [],
    chats: [],
    presets: [],
    gallery: [],
    amLogs: [],
    redeemCodes: [],
    claimedCodes: []
  };

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) data = parsed;
    }
  } catch (e) {}

  return res.status(200).json({
    success: true,
    data
  });
}
