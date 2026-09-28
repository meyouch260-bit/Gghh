import type { AgeBand, Game, PartySettings } from './types.js';

export const BAND_RANGE: Record<AgeBand, [number, number]> = {
  '10-13': [10, 13],
  '14-17': [14, 17],
  '18-30': [18, 30],
  '30-60': [30, 60],
  '60-80': [60, 80],
};

/** Âge le plus jeune et le plus âgé couverts par les tranches sélectionnées. */
export function ageSpan(bands: AgeBand[]): [number, number] {
  if (bands.length === 0) return [18, 60];
  const mins = bands.map((b) => BAND_RANGE[b][0]);
  const maxs = bands.map((b) => BAND_RANGE[b][1]);
  return [Math.min(...mins), Math.max(...maxs)];
}

export const hasMinors = (bands: AgeBand[]) => bands.includes('10-13') || bands.includes('14-17');
export const isMixedGenerations = (bands: AgeBand[]) => bands.length >= 3 || (ageSpan(bands)[1] - ageSpan(bands)[0] >= 40);

/** Le jeu couvre-t-il TOUS les âges sélectionnés ? */
export function coversAges(game: Pick<Game, 'ageMin' | 'ageMax'>, bands: AgeBand[]): boolean {
  const [lo, hi] = ageSpan(bands);
  return game.ageMin <= lo && game.ageMax >= hi;
}

/** Raisons pour lesquelles un jeu est exclu (vide = éligible). */
export function ineligibilityReasons(game: Game, s: PartySettings): string[] {
  const reasons: string[] = [];
  if (!coversAges(game, s.ageBands)) reasons.push(`Âges ${game.ageMin}-${game.ageMax} ans`);
  if (s.guests < game.playersMin) reasons.push(`${game.playersMin} joueurs minimum`);
  if (s.guests > game.playersMax) reasons.push(`${game.playersMax} joueurs maximum`);
  const missing = game.materials.filter((m) => !s.materials.includes(m));
  if (missing.length) reasons.push(`Matériel manquant : ${missing.join(', ')}`);
  if (game.venues && !game.venues.includes(s.venue)) reasons.push('Cadre inadapté');
  if (s.ageBands.includes('60-80') && game.energy === 'physique') reasons.push('Trop physique pour les 60-80');
  return reasons;
}

export const isEligible = (game: Game, s: PartySettings) => ineligibilityReasons(game, s).length === 0;

export function eligibleGames(games: Game[], s: PartySettings): Game[] {
  return games.filter((g) => isEligible(g, s));
}

/** 4 à 6 activités selon la durée totale. */
export function activityCount(durationMin: number): number {
  if (durationMin < 90) return 4;
  if (durationMin <= 150) return 5;
  return 6;
}

/** Vérifie les règles métier d'un programme. Renvoie la liste des erreurs. */
export function checkProgram(
  gameIds: string[],
  allowed: Record<string, Game>,
  s: PartySettings,
): string[] {
  const errors: string[] = [];
  const expected = activityCount(s.durationMin);
  if (gameIds.length < 4 || gameIds.length > 6) errors.push(`Il faut 4 à 6 activités (reçu ${gameIds.length}).`);
  else if (gameIds.length !== expected) errors.push(`Il faut exactement ${expected} activités pour ${s.durationMin} min.`);
  const unknown = gameIds.filter((id) => !allowed[id]);
  if (unknown.length) errors.push(`Jeux non autorisés : ${unknown.join(', ')}.`);
  if (new Set(gameIds).size !== gameIds.length) errors.push('Un même jeu apparaît deux fois.');
  for (let i = 1; i < gameIds.length; i++) {
    const a = allowed[gameIds[i - 1]];
    const b = allowed[gameIds[i]];
    if (a && b && a.category === b.category) {
      errors.push(`Deux activités de la catégorie « ${a.category} » se suivent (positions ${i} et ${i + 1}).`);
    }
  }
  return errors;
}
