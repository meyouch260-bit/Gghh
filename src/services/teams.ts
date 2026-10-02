import { AGE_BANDS, type Player, type Team } from '../../shared/types';
import { uid } from './ids';

export const TEAM_PRESETS = [
  { name: 'Les Renards', color: '#f97316' },
  { name: 'Les Hiboux', color: '#38bdf8' },
  { name: 'Les Lucioles', color: '#facc15' },
  { name: 'Les Loutres', color: '#a78bfa' },
  { name: 'Les Flamants', color: '#f472b6' },
  { name: 'Les Castors', color: '#4ade80' },
  { name: 'Les Pandas', color: '#e2e8f0' },
  { name: 'Les Tigres', color: '#fb7185' },
];

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function withTeams(players: Player[], teams: Team[]) {
  const teamOf = new Map(teams.flatMap((t) => t.playerIds.map((pid) => [pid, t.id] as const)));
  return { teams, players: players.map((p) => ({ ...p, teamId: teamOf.get(p.id) })) };
}

function emptyTeams(n: number, rand: () => number): Team[] {
  return shuffle(TEAM_PRESETS, rand)
    .slice(0, n)
    .map((p) => ({ id: uid(), name: p.name, color: p.color, playerIds: [] }));
}

export interface DrawOptions {
  /** Répartir les tranches d'âge entre les équipes. */
  mixGenerations?: boolean;
  /** Mettre les deux membres d'un couple dans des équipes différentes. */
  separateCouples?: boolean;
}

/**
 * Répartition aléatoire équilibrée en `count` équipes (2 à 4).
 * - `mixGenerations` : joueurs triés par tranche d'âge puis distribués en
 *   serpentin, chaque équipe reçoit un peu de chaque génération.
 * - `separateCouples` : les partenaires se suivent dans l'ordre de
 *   distribution, qui se fait alors en tourniquet : ils tombent toujours
 *   dans deux équipes différentes.
 */
export function drawTeams(
  players: Player[],
  count: number,
  opts: DrawOptions = {},
  rand: () => number = Math.random,
): { teams: Team[]; players: Player[] } {
  const n = Math.max(2, Math.min(4, count));
  const teams = emptyTeams(n, rand);
  const offset = Math.floor(rand() * n);

  if (opts.separateCouples) {
    // Unités = couples (2 joueurs) ou joueurs seuls, ordonnées au hasard.
    const units = new Map<string, Player[]>();
    for (const p of shuffle(players, rand)) {
      const key = p.coupleId ?? p.id;
      units.set(key, [...(units.get(key) ?? []), p]);
    }
    let order = shuffle([...units.values()], rand);
    if (opts.mixGenerations) {
      const rank = (u: Player[]) => Math.min(...u.map((p) => (p.ageBand ? AGE_BANDS.indexOf(p.ageBand) : AGE_BANDS.length)));
      order = order.sort((a, b) => rank(a) - rank(b));
    }
    order.flat().forEach((p, i) => teams[(i + offset) % n].playerIds.push(p.id));
    return withTeams(players, teams);
  }

  let order = shuffle(players, rand);
  if (opts.mixGenerations) {
    const rank = (p: Player) => (p.ageBand ? AGE_BANDS.indexOf(p.ageBand) : AGE_BANDS.length);
    order = order.sort((a, b) => rank(a) - rank(b));
  }
  // Serpentin 0,1,2,2,1,0… en commençant par une équipe au hasard.
  order.forEach((p, i) => {
    const round = Math.floor(i / n);
    const pos = i % n;
    const idx = (round % 2 === 0 ? pos : n - 1 - pos) + offset;
    teams[idx % n].playerIds.push(p.id);
  });
  return withTeams(players, teams);
}

/** Une équipe par couple (8 au maximum) ; les joueurs seuls forment ensemble une équipe. */
export function coupleTeams(players: Player[], rand: () => number = Math.random): { teams: Team[]; players: Player[] } {
  const couples = new Map<string, Player[]>();
  const solos: Player[] = [];
  for (const p of players) {
    if (p.coupleId) couples.set(p.coupleId, [...(couples.get(p.coupleId) ?? []), p]);
    else solos.push(p);
  }
  const groups = [...couples.values()];
  if (solos.length) groups.push(solos);
  const presets = shuffle(TEAM_PRESETS, rand);
  const teams: Team[] = groups.slice(0, TEAM_PRESETS.length).map((g, i) => ({
    id: uid(),
    name: g === solos ? 'Les Électrons libres' : g.map((p) => p.name).join(' & '),
    color: presets[i].color,
    playerIds: g.map((p) => p.id),
  }));
  return withTeams(players, teams);
}
