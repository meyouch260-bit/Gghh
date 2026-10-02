import type { AiActivity } from '../../shared/schema';
import type { ActivityStatus, Party, PartySettings, Player, Team } from '../../shared/types';

export type Action =
  | { type: 'CREATE_PARTY'; settings: PartySettings; activities: AiActivity[]; source: 'ai' | 'demo' }
  | { type: 'TOGGLE_PREP'; item: string }
  | { type: 'SET_LARGE_TEXT'; value: boolean }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'SET_TEAMS'; teams: Team[]; players: Player[] }
  | { type: 'REPLACE_ACTIVITY'; activityId: string; activity: AiActivity }
  | { type: 'SET_ACTIVITY_STATUS'; activityId: string; status: ActivityStatus }
  | { type: 'SET_SCORES'; activityId: string; points: Record<string, number> }
  | { type: 'FINISH' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  /** Soirée reçue de la couche de synchro (autre onglet ; étape 2 : autres téléphones). */
  | { type: 'SYNC_PARTY'; party: Party | null };

export interface AppState {
  party: Party | null;
  /** Préférence d'affichage, conservée même sans soirée en cours. */
  largeText: boolean;
}
