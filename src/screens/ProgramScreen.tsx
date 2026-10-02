import { useState } from 'react';
import { CATEGORY_EMOJI, ENERGY_LABELS, type Party } from '../../shared/types';
import { Leaderboard } from '../components/Scoreboard';
import { Button, Card, Header } from '../components/ui';
import { formatDuration } from '../format';
import type { Nav } from '../nav';
import { gameOf, prepList, programAsText, progress } from '../state/selectors';
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

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted">
          {party.activities.length} activités · {formatDuration(total)} · {p.done}/{p.total} jouées
        </p>
        {party.source === 'ai' && <span className="rounded-full bg-leaf/15 px-3 py-1 text-xs font-extrabold text-leaf">✨ Préparé par Claude</span>}
        {party.source === 'demo' && <span className="rounded-full bg-coal px-3 py-1 text-xs font-extrabold text-muted">Mode démo</span>}
      </div>

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

      <PrepChecklist party={party} />
      <ShareProgram party={party} />

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

function PrepChecklist({ party }: { party: Party }) {
  const { dispatch } = useStore();
  const items = prepList(party);
  const checked = new Set(party.prepChecked ?? []);
  const [open, setOpen] = useState(checked.size < items.length);
  if (items.length === 0) return null;
  return (
    <section className="rounded-3xl bg-ember p-4">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="text-lg font-extrabold">🧰 À préparer</span>
        <span className="font-bold text-muted tabular-nums">
          {checked.size}/{items.length} {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {items.map(({ item, games }) => {
            const on = checked.has(item);
            return (
              <li key={item}>
                <button
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => dispatch({ type: 'TOGGLE_PREP', item })}
                  className="flex w-full items-start gap-3 rounded-2xl bg-coal p-3 text-left"
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${on ? 'border-leaf bg-leaf text-night' : 'border-muted/50'}`}>
                    {on ? '✓' : ''}
                  </span>
                  <span className="min-w-0">
                    <span className={`block font-bold ${on ? 'text-muted line-through' : ''}`}>{item}</span>
                    <span className="block text-sm text-muted">{games.join(' · ')}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ShareProgram({ party }: { party: Party }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const text = programAsText(party);
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState('copied');
          } catch {
            setState('manual');
          }
        }}
      >
        {state === 'copied' ? '✓ Programme copié, collez-le dans vos messages' : '📋 Copier le programme pour les invités'}
      </Button>
      {state === 'manual' && (
        <textarea
          readOnly
          aria-label="Programme à copier"
          className="h-40 w-full rounded-2xl bg-coal p-3 text-base"
          value={text}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </div>
  );
}
