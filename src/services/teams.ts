import { AGE_BANDS, type Player, type Team } from '../../shared/types';
import { uid } from './ids';

export const TEAM_PRESETS = [
  { name: 'Les Renards', color: '#f97316' },
  { name: 'Les Hiboux', color: '#38bdf8' },
  { name: 'Les Lucioles', color: '#facc15' },
  { name: 'Les Loutres', color: '#a78bfa' },
];

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Répartition aléatoire équilibrée en `count` équipes (2 à 4).
 * Avec `mixGenerations`, les joueurs sont triés par tranche d'âge puis
 * distribués en serpentin : chaque équipe reçoit un peu de chaque génération.
 */
export function drawTeams(
  players: Player[],
  count: number,
  mixGenerations: boolean,
  rand: () => number = Math.random,
): { teams: Team[]; players: Player[] } {
  const n = Math.max(2, Math.min(4, count));
  const presets = shuffle(TEAM_PRESETS, rand).slice(0, n);
  const teams: Team[] = presets.map((p) => ({ id: uid(), name: p.name, color: p.color, playerIds: [] }));

  let order = shuffle(players, rand);
  if (mixGenerations) {
    const rank = (p: Player) => (p.ageBand ? AGE_BANDS.indexOf(p.ageBand) : AGE_BANDS.length);
    order = order.sort((a, b) => rank(a) - rank(b));
  }

  // Serpentin 0,1,2,2,1,0… en commençant par une équipe au hasard pour ne pas avantager la première.
  const offset = Math.floor(rand() * n);
  order.forEach((p, i) => {
    const round = Math.floor(i / n);
    const pos = i % n;
    const idx = (round % 2 === 0 ? pos : n - 1 - pos) + offset;
    teams[idx % n].playerIds.push(p.id);
  });

  const teamOf = new Map(teams.flatMap((t) => t.playerIds.map((pid) => [pid, t.id] as const)));
  return { teams, players: players.map((p) => ({ ...p, teamId: teamOf.get(p.id) })) };
}
