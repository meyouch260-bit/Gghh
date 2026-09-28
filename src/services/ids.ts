export const uid = () => Math.random().toString(36).slice(2, 10);

/** Étape 2 : code de soirée à 4 lettres (sans lettres ambiguës). */
export function partyCode(rand: () => number = Math.random): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => letters[Math.floor(rand() * letters.length)]).join('');
}
