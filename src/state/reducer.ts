import type { Activity, Party } from '../../shared/types';
import type { AiActivity } from '../../shared/schema';
import { partyCode, uid } from '../services/ids';
import type { Action, AppState } from './actions';

export const initialState: AppState = { party: null, largeText: false };

const toActivity = (a: AiActivity, order: number, id = uid()): Activity => ({
  id,
  gameId: a.gameId,
  order,
  durationMin: a.durationMin,
  intro: a.intro,
  tips: a.tips,
  content: a.content,
  status: 'todo',
});

function updateParty(state: AppState, fn: (p: Party) => Party): AppState {
  return state.party ? { ...state, party: fn(state.party) } : state;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SYNC_PARTY':
      return { ...state, party: action.party };
    case 'CREATE_PARTY': {
      const previous = state.party;
      const party: Party = {
        id: uid(),
        code: partyCode(),
        createdAt: new Date().toISOString(),
        settings: action.settings,
        // On garde les invités et équipes d'une soirée précédente.
        players: previous?.players ?? [],
        teams: previous?.teams ?? [],
        activities: action.activities.map((a, i) => toActivity(a, i)),
        scores: [],
        phase: 'playing',
        source: action.source,
        prepChecked: [],
      };
      return { ...state, party, largeText: action.settings.largeText };
    }
    case 'SET_LARGE_TEXT':
      return {
        ...state,
        largeText: action.value,
        party: state.party && { ...state.party, settings: { ...state.party.settings, largeText: action.value } },
      };
    case 'SET_PLAYERS':
      return updateParty(state, (p) => ({ ...p, players: action.players }));
    case 'SET_TEAMS':
      return updateParty(state, (p) => {
        const ids = new Set(action.teams.map((t) => t.id));
        return { ...p, teams: action.teams, players: action.players, scores: p.scores.filter((s) => ids.has(s.teamId)) };
      });
    case 'REPLACE_ACTIVITY':
      return updateParty(state, (p) => ({
        ...p,
        activities: p.activities.map((a) =>
          a.id === action.activityId ? toActivity(action.activity, a.order, a.id) : a,
        ),
        scores: p.scores.filter((s) => s.activityId !== action.activityId),
      }));
    case 'SET_ACTIVITY_STATUS':
      return updateParty(state, (p) => ({
        ...p,
        activities: p.activities.map((a) => {
          if (a.id === action.activityId) return { ...a, status: action.status };
          // Une seule activité « en cours » à la fois.
          if (action.status === 'current' && a.status === 'current') return { ...a, status: 'todo' };
          return a;
        }),
      }));
    case 'SET_SCORES':
      return updateParty(state, (p) => ({
        ...p,
        scores: [
          ...p.scores.filter((s) => s.activityId !== action.activityId),
          ...Object.entries(action.points).map(([teamId, points]) => ({
            activityId: action.activityId,
            teamId,
            points,
          })),
        ],
      }));
    case 'TOGGLE_PREP':
      return updateParty(state, (p) => {
        const checked = p.prepChecked ?? [];
        return {
          ...p,
          prepChecked: checked.includes(action.item) ? checked.filter((i) => i !== action.item) : [...checked, action.item],
        };
      });
    case 'FINISH':
      return updateParty(state, (p) => ({ ...p, phase: 'finished' }));
    case 'RESUME':
      return updateParty(state, (p) => ({ ...p, phase: 'playing' }));
    case 'RESET':
      return { ...state, party: null };
  }
}
