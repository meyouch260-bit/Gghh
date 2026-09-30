import { useEffect } from 'react';
import { Leaderboard } from '../components/Scoreboard';
import { Button, Header } from '../components/ui';
import type { Nav } from '../nav';
import { standings } from '../state/selectors';
import { useStore } from '../state/store';

export function FinalScreen({ nav }: { nav: Nav }) {
  const { state, dispatch } = useStore();
  const party = state.party;
  const finished = party?.phase === 'finished';

  useEffect(() => {
    if (party && !finished) dispatch({ type: 'FINISH' });
  }, [party, finished, dispatch]);

  if (!party) return null;
  const rows = standings(party);
  const winners = rows.filter((r) => r.rank === 1);

  return (
    <div className="space-y-6 pb-10">
      <Header title="Fin de soirée" onBack={nav.back} />
      <div className="space-y-2 py-6 text-center">
        <div className="text-8xl" aria-hidden>
          🏆
        </div>
        {winners.length > 0 && rows.some((r) => r.total !== 0) ? (
          <>
            <p className="text-lg text-muted">{winners.length > 1 ? 'Égalité au sommet !' : 'Victoire de'}</p>
            <h2 className="text-4xl font-black" style={{ color: winners[0].team.color }}>
              {winners.map((w) => w.team.name).join(' & ')}
            </h2>
            <p className="text-2xl font-black">{winners[0].total} points</p>
          </>
        ) : (
          <h2 className="text-3xl font-black">Merci pour cette belle soirée !</h2>
        )}
      </div>
      <Leaderboard party={party} />
      <div className="space-y-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            dispatch({ type: 'RESUME' });
            nav.replace({ name: 'program' });
          }}
        >
          ← Revenir au programme
        </Button>
        <Button className="w-full" onClick={() => nav.go({ name: 'create' })}>
          ✨ Nouvelle soirée
        </Button>
      </div>
    </div>
  );
}
