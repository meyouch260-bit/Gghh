import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGenerate } from '../server/generate.js';

/** Fonction serverless Vercel : POST /api/generate */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }
  const out = await handleGenerate(req.body);
  return res.status(out.status).json(out.body);
}
