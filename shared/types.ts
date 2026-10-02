/**
 * Types du domaine, partagés entre le front, la fonction serverless et
 * (étape 2) la synchronisation temps réel. Aucune dépendance au rendu.
 */

export const AGE_BANDS = ['10-13', '14-17', '18-30', '30-60', '60-80'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const MOODS = ['chill', 'festive', 'competitive', 'intello', 'nostalgie', 'couples'] as const;
export type Mood = (typeof MOODS)[number];

export const VENUES = ['petit-salon', 'grand-salon', 'jardin'] as const;
export type Venue = (typeof VENUES)[number];

/** Matériel disponible. « Aucun » = liste vide. */
export const MATERIALS = ['papier', 'enceinte', 'smartphones'] as const;
export type Material = (typeof MATERIALS)[number];

export const ENERGIES = ['calme', 'moyen', 'physique'] as const;
export type Energy = (typeof ENERGIES)[number];

export const CATEGORIES = ['mime', 'quiz', 'musique', 'papier', 'social', 'defi'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Forme du contenu prêt à l'emploi que l'IA génère pour un jeu. */
export const CONTENT_KINDS = ['quiz', 'words', 'blindtest', 'prompts', 'freeform'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export interface Game {
  id: string;
  name: string;
  category: Category;
  ageMin: number;
  ageMax: number;
  playersMin: number;
  playersMax: number;
  /** Durée typique en minutes. */
  durationMin: number;
  /** Matériel requis (tout doit être disponible). */
  materials: Material[];
  /** Petit matériel de la maison à prévoir (gobelets, cartes…). */
  props?: string;
  /** Cadres compatibles. Absent = tous. */
  venues?: Venue[];
  energy: Energy;
  moods: Mood[];
  /** Jeu qui fonctionne très bien en groupe multi-générations. */
  universal?: boolean;
  contentKind: ContentKind;
  rules: [string, string, string];
  adaptations: { younger: string; older: string };
}

// ---------- Contenu des activités ----------

export interface QuizItem {
  q: string;
  a: string;
  /** Génération visée, pour mélanger les références. */
  band?: AgeBand;
}
export interface WordItem {
  word: string;
  band?: AgeBand;
  /** Mots interdits (Taboo). */
  forbidden?: string[];
  /** Mot de l'intrus (Undercover). */
  pair?: string;
  /** Étape 2 : visible uniquement sur le téléphone du joueur concerné. */
  secret?: boolean;
}
export interface Track {
  title: string;
  artist: string;
  year: number;
  band?: AgeBand;
}

export type ActivityContent =
  | { kind: 'quiz'; questions: QuizItem[] }
  | { kind: 'words'; items: WordItem[] }
  | { kind: 'blindtest'; tracks: Track[] }
  | { kind: 'prompts'; items: string[] }
  | { kind: 'freeform'; steps: string[] };

export type ActivityStatus = 'todo' | 'current' | 'done';

export interface Activity {
  id: string;
  gameId: string;
  order: number;
  durationMin: number;
  /** Accroche lue par l'hôte pour lancer le jeu. */
  intro: string;
  /** Conseils d'adaptation au public du soir. */
  tips: string[];
  content: ActivityContent;
  status: ActivityStatus;
}

// ---------- Soirée ----------

export interface PartySettings {
  guests: number;
  ageBands: AgeBand[];
  mood: Mood;
  venue: Venue;
  durationMin: number;
  materials: Material[];
  alcoholFree: boolean;
  largeText: boolean;
}

export interface Player {
  id: string;
  name: string;
  ageBand?: AgeBand;
  teamId?: string;
  /** Joueurs d'un même couple partagent cet identifiant. */
  coupleId?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  playerIds: string[];
}

export interface ScoreEntry {
  activityId: string;
  teamId: string;
  points: number;
}

export type PartyPhase = 'setup' | 'playing' | 'finished';

/** Agrégat racine : tout l'état d'une soirée, sérialisable tel quel. */
export interface Party {
  id: string;
  /** Étape 2 : code à 4 lettres pour rejoindre depuis un téléphone. */
  code?: string;
  createdAt: string;
  settings: PartySettings;
  players: Player[];
  teams: Team[];
  activities: Activity[];
  scores: ScoreEntry[];
  phase: PartyPhase;
  /** Qui a généré le programme : Claude ou le mode démo. */
  source?: 'ai' | 'demo';
  /** Éléments cochés de la liste « À préparer ». */
  prepChecked?: string[];
}

// ---------- Libellés FR ----------

export const MOOD_LABELS: Record<Mood, string> = {
  chill: 'Chill',
  festive: 'Festive',
  competitive: 'Compétitive',
  intello: 'Intello',
  nostalgie: 'Nostalgie',
  couples: 'Entre couples',
};
export const VENUE_LABELS: Record<Venue, string> = {
  'petit-salon': 'Petit salon',
  'grand-salon': 'Grand salon',
  jardin: 'Jardin',
};
export const MATERIAL_LABELS: Record<Material, string> = {
  papier: 'Papier / stylos',
  enceinte: 'Enceinte',
  smartphones: 'Smartphones',
};
export const ENERGY_LABELS: Record<Energy, string> = {
  calme: 'Calme',
  moyen: 'Moyen',
  physique: 'Physique',
};
export const CATEGORY_LABELS: Record<Category, string> = {
  mime: 'Mime & expression',
  quiz: 'Quiz',
  musique: 'Musique',
  papier: 'Papier & mots',
  social: 'Jeux sociaux',
  defi: 'Défis',
};
export const CATEGORY_EMOJI: Record<Category, string> = {
  mime: '🎭',
  quiz: '❓',
  musique: '🎵',
  papier: '✏️',
  social: '🕵️',
  defi: '🏆',
};
