import { GAMES, GAMES_BY_ID } from '../../data/games';
import { eligibleGames } from '../../shared/eligibility';
import type { AiActivity, GenerateRequest, GenerateResponse } from '../../shared/schema';
import { demoActivities } from '../../server/demo';

type Result = { activities: AiActivity[]; source: 'ai' | 'demo' };

/**
 * Sans fonction serveur (hébergement statique, aperçu), on génère un
 * programme de démonstration dans le navigateur.
 */
function localDemo(req: GenerateRequest): Result {
  const games =
    req.mode === 'program' ? eligibleGames(GAMES, req.settings) : [GAMES_BY_ID[req.gameId]].filter(Boolean);
  return { activities: demoActivities(req, games), source: 'demo' };
}

export async function generate(req: GenerateRequest): Promise<Result> {
  let res: Response;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    return localDemo(req);
  }
  let data: GenerateResponse;
  try {
    data = (await res.json()) as GenerateResponse;
  } catch {
    // Pas d'API à cette adresse (404 HTML, etc.)
    if (res.status === 404 || res.status === 405 || res.ok) return localDemo(req);
    throw new Error(`Erreur serveur (${res.status}).`);
  }
  if (!data.ok) throw new Error(data.error);
  return { activities: data.activities, source: data.source };
}
