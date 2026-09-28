import type { Party } from '../../shared/types';

/**
 * Couche de persistance/synchronisation d'une soirée.
 * V1 : localStorage. Étape 2 : implémentation Supabase Realtime
 * (canal par code de soirée, mot secret envoyé au seul joueur concerné).
 */
export interface PartySync {
  load(): Party | null;
  save(party: Party | null): void;
  /** Notifie les changements venant d'ailleurs (autre onglet, autres téléphones). */
  subscribe(onChange: (party: Party | null) => void): () => void;
}

const KEY = 'soiree-jeux:party:v1';

export const localSync: PartySync = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Party) : null;
    } catch {
      return null;
    }
  },
  save(party) {
    try {
      if (party) localStorage.setItem(KEY, JSON.stringify(party));
      else localStorage.removeItem(KEY);
    } catch {
      /* stockage indisponible : l'app continue en mémoire */
    }
  },
  subscribe(onChange) {
    const handler = (e: StorageEvent) => {
      if (e.key === KEY) onChange(e.newValue ? (JSON.parse(e.newValue) as Party) : null);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};
