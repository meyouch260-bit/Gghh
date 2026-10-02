import { useCallback, useEffect, useState } from 'react';
import type { Nav, Screen } from './nav';
import { ActivityScreen } from './screens/ActivityScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { CreateScreen } from './screens/CreateScreen';
import { FinalScreen } from './screens/FinalScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProgramScreen } from './screens/ProgramScreen';
import { ScoresScreen } from './screens/ScoresScreen';
import { TeamsScreen } from './screens/TeamsScreen';
import { useStore } from './state/store';
import { useWakeLock } from './useWakeLock';

const NEEDS_PARTY: Screen['name'][] = ['program', 'activity', 'teams', 'scores', 'final'];

export default function App() {
  const { state } = useStore();
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);
  const screen = stack[stack.length - 1];

  // Le bouton « retour » du téléphone dépile un écran.
  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => window.scrollTo(0, 0), [screen]);

  const go = useCallback((s: Screen) => {
    window.history.pushState(null, '');
    setStack((st) => [...st, s]);
  }, []);
  const back = useCallback(() => {
    if (stack.length > 1) window.history.back();
  }, [stack.length]);
  const nav: Nav = {
    go,
    back,
    replace: (s) => setStack((st) => [...st.slice(0, -1), s]),
    home: () => {
      const depth = stack.length - 1;
      if (depth > 0) window.history.go(-depth);
      setStack([{ name: 'home' }]);
    },
  };

  const current: Screen = NEEDS_PARTY.includes(screen.name) && !state.party ? { name: 'home' } : screen;
  useWakeLock(state.party?.phase === 'playing' && (current.name === 'program' || current.name === 'activity'));

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-[env(safe-area-inset-bottom)]">
      {current.name === 'home' && <HomeScreen nav={nav} />}
      {current.name === 'create' && <CreateScreen nav={nav} />}
      {current.name === 'program' && <ProgramScreen nav={nav} />}
      {current.name === 'activity' && <ActivityScreen key={current.activityId} nav={nav} activityId={current.activityId} />}
      {current.name === 'teams' && <TeamsScreen nav={nav} />}
      {current.name === 'scores' && <ScoresScreen nav={nav} />}
      {current.name === 'final' && <FinalScreen nav={nav} />}
      {current.name === 'catalog' && <CatalogScreen nav={nav} />}
    </main>
  );
}
