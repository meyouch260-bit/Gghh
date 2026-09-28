export type Screen =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'program' }
  | { name: 'activity'; activityId: string }
  | { name: 'teams' }
  | { name: 'scores' }
  | { name: 'final' }
  | { name: 'catalog' };

export interface Nav {
  go: (s: Screen) => void;
  /** Remplace l'écran courant (pas de retour possible). */
  replace: (s: Screen) => void;
  back: () => void;
  home: () => void;
}
