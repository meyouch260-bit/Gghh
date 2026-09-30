import { CATEGORY_EMOJI, ENERGY_LABELS } from '../../shared/types';
import { Leaderboard } from '../components/Scoreboard';
import { Button, Card, Header } from '../components/ui';
import { formatDuration } from '../format';
import type { Nav } from '../nav';
import { gameOf, progress } from '../state/selectors';
import { useStore } from '../state/store';

const STATUS_BADGE = {
  todo: { label: 'À jouer', cls: 'bg-coal text-muted' },
  current: { label: 'En cours', cls: 'bg-flame text-night' },
  done: { label: 'Terminé ✓', cls: 'bg-leaf/20 text-leaf' },
} as const;

export function ProgramScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const party = state.party;
  if (!party) return null;
  const p = progress(party);
  const total = party.activities.reduce((acc, a) => acc + a.durationMin, 0);

  return (
    <div className="space-y-5 pb-10">
      <Header title="Le programme" onBack={nav.home} />

      <p className="text-muted">
        {party.activities.length} activités · {formatDuration(total)} · {p.done}/{p.total} jouées
      </p>

      {party.teams.length === 0 ? (
        <Card className="space-y-3 border-2 border-dashed border-flame/40">
          <p className="text-lg font-bold">Formez les équipes pour compter les points.</p>
          <Button className="w-full" onClick={() => nav.go({ name: 'teams' })}>
            👥 Former les équipes
          </Button>
        </Card>
      ) : (
        <button className="block w-full text-left" onClick={() => nav.go({ name: 'scores' })} aria-label="Voir le classement">
          <Leaderboard party={party} compact />
        </button>
      )}

      <ol className="space-y-3">
        {party.activities.map((a, i) => {
          const game = gameOf(a.gameId);
          const badge = STATUS_BADGE[a.status];
          return (
            <li key={a.id}>
              <button
                onClick={() => nav.go({ name: 'activity', activityId: a.id })}
                className={`flex w-full items-center gap-4 rounded-3xl p-4 text-left transition ${
                  a.status === 'current' ? 'bg-flame/15 ring-2 ring-flame' : 'bg-ember'
                } ${a.status === 'done' ? 'opacity-70' : ''}`}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-coal text-3xl" aria-hidden>
                  {game ? CATEGORY_EMOJI[game.category] : '🎲'}
                </span>
                <span className="flex-1 space-y-1">
                  <span className="block text-sm font-bold text-muted">Activité {i + 1}</span>
                  <span className="block text-xl font-extrabold leading-tight">{game?.name ?? a.gameId}</span>
                  <span className="block text-sm text-muted">
                    {a.durationMin} min · {game ? ENERGY_LABELS[game.energy] : ''}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${badge.cls}`}>{badge.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => nav.go({ name: 'teams' })}>
          👥 Équipes
        </Button>
        <Button variant="secondary" onClick={() => nav.go({ name: 'scores' })}>
          🏆 Scores
        </Button>
      </div>
      <Button className="w-full" onClick={() => nav.go({ name: 'final' })}>
        🎉 Terminer la soirée
      </Button>
    </div>
  );
}
