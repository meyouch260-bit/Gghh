import { GAMES, GAMES_BY_ID } from '../../data/games';
import { eligibleGames } from '../../shared/eligibility';
import type { AiActivity, GenerateRequest, GenerateResponse } from '../../shared/schema';
import { demoActivities } from '../../server/demo';
import { generateWithSample } from './claudeSample';

export type Source = 'ai' | 'demo';
type Result = { activities: AiActivity[]; source: Source };

function gamesFor(req: GenerateRequest) {
  return req.mode === 'program' ? eligibleGames(GAMES, req.settings) : [GAMES_BY_ID[req.gameId]].filter(Boolean);
}

/**
 * Sans fonction serveur (page claude.ai, hébergement statique) : Claude via
 * le compte de la personne si possible, sinon programme de démonstration.
 */
async function withoutServer(req: GenerateRequest, onProgress?: (n: number) => void): Promise<Result> {
  const games = gamesFor(req);
  const activities = await generateWithSample(req, games, onProgress);
  if (activities) return { activities, source: 'ai' };
  return { activities: demoActivities(req, games), source: 'demo' };
}

export async function generate(req: GenerateRequest, onProgress?: (n: number) => void): Promise<Result> {
  let res: Response;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    return withoutServer(req, onProgress);
  }
  let data: GenerateResponse;
  try {
    data = (await res.json()) as GenerateResponse;
  } catch {
    // Pas d'API à cette adresse (404 HTML, etc.)
    if (res.status === 404 || res.status === 405 || res.ok) return withoutServer(req, onProgress);
    throw new Error(`Erreur serveur (${res.status}).`);
  }
  if (!data.ok) throw new Error(data.error);
  return { activities: data.activities, source: data.source };
}
