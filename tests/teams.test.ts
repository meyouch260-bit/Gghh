import { describe, expect, it } from 'vitest';
import { coupleTeams, drawTeams } from '../src/services/teams';
import type { Player } from '../shared/types';

const couple = (id: string, a: string, b: string): Player[] => [
  { id: `${id}a`, name: a, coupleId: id, ageBand: '30-60' },
  { id: `${id}b`, name: b, coupleId: id, ageBand: '60-80' },
];
const players: Player[] = [
  ...couple('c1', 'Léa', 'Tom'),
  ...couple('c2', 'Marc', 'Sophie'),
  ...couple('c3', 'Jo', 'Luc'),
  { id: 's1', name: 'Nina', ageBand: '10-13' },
];

describe('équipes', () => {
  it('répartition équilibrée (écart max 1)', () => {
    for (let i = 0; i < 30; i++) {
      const { teams } = drawTeams(players, 3, { mixGenerations: true });
      const sizes = teams.map((t) => t.playerIds.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(players.length);
    }
  });
  it('« séparer les couples » ne met jamais deux partenaires ensemble', () => {
    for (let i = 0; i < 50; i++) {
      for (const n of [2, 3, 4]) {
        const res = drawTeams(players, n, { separateCouples: true, mixGenerations: i % 2 === 0 });
        const teamOf = Object.fromEntries(res.players.map((p) => [p.id, p.teamId]));
        for (const c of ['c1', 'c2', 'c3']) expect(teamOf[`${c}a`]).not.toBe(teamOf[`${c}b`]);
      }
    }
  });
  it('une équipe par couple, les solos ensemble', () => {
    const { teams } = coupleTeams(players);
    expect(teams).toHaveLength(4);
    expect(teams.map((t) => t.name)).toContain('Léa & Tom');
    expect(teams.find((t) => t.name === 'Les Électrons libres')?.playerIds).toEqual(['s1']);
  });
});
