import { describe, expect, it } from 'vitest';
import { GAMES } from '../data/games';
import { activityCount, checkProgram, coversAges, eligibleGames } from '../shared/eligibility';
import { planProgram } from '../shared/planner';
import type { PartySettings } from '../shared/types';

const base: PartySettings = {
  guests: 8,
  ageBands: ['10-13', '30-60', '60-80'],
  mood: 'festive',
  venue: 'petit-salon',
  durationMin: 120,
  materials: ['papier', 'enceinte', 'smartphones'],
  alcoholFree: true,
  largeText: false,
};

describe('bibliothèque', () => {
  it('contient 50 jeux de base + 3 jeux « entre couples », aux id uniques', () => {
    expect(GAMES).toHaveLength(53);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(53);
    expect(GAMES.filter((g) => g.moods.includes('couples')).length).toBeGreaterThanOrEqual(15);
  });
  it('chaque jeu a 3 lignes de règles et des adaptations', () => {
    for (const g of GAMES) {
      expect(g.rules.every((r) => r.length > 10), g.id).toBe(true);
      expect(g.adaptations.younger && g.adaptations.older, g.id).toBeTruthy();
      expect(g.ageMin).toBeLessThan(g.ageMax);
      expect(g.playersMin).toBeLessThanOrEqual(g.playersMax);
    }
  });
});

describe('éligibilité', () => {
  it('exige de couvrir TOUS les âges', () => {
    expect(coversAges({ ageMin: 12, ageMax: 80 }, ['10-13', '30-60'])).toBe(false);
    expect(coversAges({ ageMin: 10, ageMax: 70 }, ['60-80'])).toBe(false);
    expect(coversAges({ ageMin: 10, ageMax: 80 }, ['10-13', '60-80'])).toBe(true);
  });
  it('exclut Undercover avec des 10-13, la chasse au trésor avec des 60-80, les jeux physiques', () => {
    const ids = eligibleGames(GAMES, base).map((g) => g.id);
    expect(ids).not.toContain('undercover');
    expect(ids).not.toContain('chasse-tresor');
    expect(ids).not.toContain('statues-musicales');
    expect(ids).not.toContain('je-nai-jamais');
    expect(ids).toContain('times-up');
  });
  it('respecte le matériel et le cadre', () => {
    const ids = eligibleGames(GAMES, { ...base, ageBands: ['18-30'], materials: [], venue: 'jardin' }).map((g) => g.id);
    expect(ids).not.toContain('pictionary');
    expect(ids).not.toContain('blindtest-decennies');
    expect(ids).toContain('relais-cuillere');
  });
});

describe('programme', () => {
  it('4 à 6 activités selon la durée', () => {
    expect(activityCount(60)).toBe(4);
    expect(activityCount(120)).toBe(5);
    expect(activityCount(200)).toBe(6);
  });
  it('le planificateur ne répète jamais une catégorie deux fois de suite', () => {
    for (let i = 0; i < 50; i++) {
      const allowed = eligibleGames(GAMES, base);
      const plan = planProgram(allowed, base);
      const byId = Object.fromEntries(allowed.map((g) => [g.id, g]));
      expect(checkProgram(plan.map((g) => g.id), byId, base)).toEqual([]);
    }
  });
  it('checkProgram détecte les erreurs', () => {
    const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]));
    const errs = checkProgram(['quiz-culture', 'quiz-geo', 'inconnu'], byId, base);
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
