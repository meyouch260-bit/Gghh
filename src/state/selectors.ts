import { GAMES_BY_ID } from '../../data/games';
import { MATERIAL_LABELS, type Game, type Party, type Team } from '../../shared/types';

export interface Standing {
  team: Team;
  total: number;
  rank: number;
}

/** Classement par total décroissant, ex æquo au même rang. */
export function standings(party: Party): Standing[] {
  const totals = party.teams.map((team) => ({
    team,
    total: party.scores.filter((s) => s.teamId === team.id).reduce((acc, s) => acc + s.points, 0),
  }));
  totals.sort((a, b) => b.total - a.total);
  return totals.map((t) => ({ ...t, rank: totals.findIndex((x) => x.total === t.total) + 1 }));
}

export function scoresFor(party: Party, activityId: string): Record<string, number> {
  return Object.fromEntries(
    party.scores.filter((s) => s.activityId === activityId).map((s) => [s.teamId, s.points]),
  );
}

export const gameOf = (gameId: string): Game | undefined => GAMES_BY_ID[gameId];

export function progress(party: Party): { done: number; total: number } {
  return { done: party.activities.filter((a) => a.status === 'done').length, total: party.activities.length };
}

/** Ce qu'il faut préparer avant la soirée, d'après les jeux du programme. */
export function prepList(party: Party): { item: string; games: string[] }[] {
  const map = new Map<string, string[]>();
  const add = (item: string, game: string) => map.set(item, [...(map.get(item) ?? []), game]);
  for (const a of party.activities) {
    const g = gameOf(a.gameId);
    if (!g) continue;
    for (const m of g.materials) add(MATERIAL_LABELS[m], g.name);
    if (g.props) add(g.props, g.name);
  }
  if (party.activities.some((a) => gameOf(a.gameId)?.contentKind === 'blindtest')) {
    add('Compte Spotify ou YouTube prêt sur un téléphone', 'Blind test');
  }
  return [...map.entries()].map(([item, games]) => ({ item, games: [...new Set(games)] }));
}

/** Programme en texte simple, à coller dans un message (WhatsApp, SMS…). */
export function programAsText(party: Party): string {
  const lines = party.activities.map((a, i) => `${i + 1}. ${gameOf(a.gameId)?.name ?? a.gameId} (${a.durationMin} min)`);
  return `🎲 Programme de la soirée jeux\n\n${lines.join('\n')}\n\nÀ tout à l'heure !`;
}
