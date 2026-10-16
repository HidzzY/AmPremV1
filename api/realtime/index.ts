// Vercel Serverless Function: /api/realtime
import { handleRealtimeRequest } from './_router';

export default async function handler(req: any, res: any) {
  return handleRealtimeRequest(req, res);
}
