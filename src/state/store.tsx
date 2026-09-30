import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { localSync, type PartySync } from '../services/sync';
import type { Action, AppState } from './actions';
import { initialState, reducer } from './reducer';

const PREFS_KEY = 'soiree-jeux:prefs:v1';

function loadInitial(sync: PartySync): AppState {
  let largeText = false;
  try {
    largeText = localStorage.getItem(PREFS_KEY) === 'large';
  } catch {
    /* ignore */
  }
  const party = sync.load();
  return { ...initialState, party, largeText: party?.settings.largeText ?? largeText };
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children, sync = localSync }: { children: ReactNode; sync?: PartySync }) {
  const [state, dispatch] = useReducer(reducer, sync, loadInitial);

  useEffect(() => sync.save(state.party), [state.party, sync]);
  useEffect(() => sync.subscribe((party) => dispatch({ type: 'SYNC_PARTY', party })), [sync]);
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, state.largeText ? 'large' : 'normal');
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle('large-text', state.largeText);
  }, [state.largeText]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore hors StoreProvider');
  return ctx;
}
