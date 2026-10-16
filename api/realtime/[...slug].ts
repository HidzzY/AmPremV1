// Vercel Serverless Function: /api/realtime/[...slug]
import { handleRealtimeRequest } from './_router';

export default async function handler(req: any, res: any) {
  return handleRealtimeRequest(req, res);
}
