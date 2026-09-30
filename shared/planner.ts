import { activityCount, isMixedGenerations } from './eligibility.js';
import type { Energy, Game, PartySettings } from './types.js';

const ENERGY_LEVEL: Record<Energy, number> = { calme: 0, moyen: 1, physique: 2 };

/** Score de pertinence d'un jeu pour la soirée (plus haut = mieux). */
export function relevance(game: Game, s: PartySettings): number {
  let score = 0;
  if (game.moods.includes(s.mood)) score += 3;
  if (game.moods[0] === s.mood) score += 1;
  if (isMixedGenerations(s.ageBands) && game.universal) score += 2;
  if (s.ageBands.includes('60-80') && game.energy === 'calme') score += 1;
  return score;
}

/**
 * Programme heuristique (sans IA) : jeux pertinents, pas deux catégories
 * identiques de suite, énergie alternée. Sert au mode démo et de secours.
 */
export function planProgram(eligible: Game[], s: PartySettings, rand: () => number = Math.random): Game[] {
  const n = Math.min(activityCount(s.durationMin), eligible.length);
  const ranked = [...eligible]
    .map((g) => ({ g, score: relevance(g, s) + rand() * 2 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.g);

  const picked: Game[] = [];
  const used = new Set<string>();
  while (picked.length < n) {
    const prev = picked[picked.length - 1];
    const wantCalm = prev ? ENERGY_LEVEL[prev.energy] > 0 : true;
    const candidates = ranked.filter((g) => !used.has(g.id) && (!prev || g.category !== prev.category));
    if (candidates.length === 0) break;
    const next =
      candidates.find((g) => (wantCalm ? g.energy === 'calme' : g.energy !== 'calme')) ?? candidates[0];
    picked.push(next);
    used.add(next.id);
  }
  return picked;
}

/** Répartit la durée totale entre les activités, au prorata de leur durée type. */
export function splitDuration(games: Game[], totalMin: number): number[] {
  const sum = games.reduce((acc, g) => acc + g.durationMin, 0) || 1;
  return games.map((g) => Math.max(5, Math.round(((g.durationMin / sum) * totalMin) / 5) * 5));
}
