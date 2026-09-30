import { GAMES_BY_ID } from '../../data/games';
import type { Game, Party, Team } from '../../shared/types';

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
