import type { AiActivity, GenerateRequest, GenerateResponse } from '../../shared/schema';

export async function generate(req: GenerateRequest): Promise<{ activities: AiActivity[]; source: 'ai' | 'demo' }> {
  let res: Response;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    throw new Error('Connexion impossible. Vérifiez le réseau.');
  }
  let data: GenerateResponse;
  try {
    data = (await res.json()) as GenerateResponse;
  } catch {
    throw new Error(`Erreur serveur (${res.status}).`);
  }
  if (!data.ok) throw new Error(data.error);
  return { activities: data.activities, source: data.source };
}
