import { useState } from 'react';
import type { Party } from '../../shared/types';
import { scoresFor, standings } from '../state/selectors';
import { useStore } from '../state/store';
import { Button } from './ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ party, compact = false }: { party: Party; compact?: boolean }) {
  const rows = standings(party);
  if (rows.length === 0) return null;
  return (
    <ol className={compact ? 'flex flex-wrap gap-2' : 'space-y-2'}>
      {rows.map(({ team, total, rank }) => (
        <li
          key={team.id}
          className={`flex items-center gap-3 rounded-2xl bg-coal ${compact ? 'px-3 py-2' : 'p-4'}`}
          style={{ borderLeft: `6px solid ${team.color}` }}
        >
          <span className={compact ? 'text-lg' : 'text-2xl'}>{MEDALS[rank - 1] ?? `${rank}.`}</span>
          <span className={`flex-1 font-extrabold ${compact ? '' : 'text-xl'}`}>{team.name}</span>
          <span className={`font-black tabular-nums ${compact ? 'text-lg' : 'text-3xl'}`}>{total}</span>
        </li>
      ))}
    </ol>
  );
}

/** Saisie des points par équipe pour une activité. */
export function ScoreEntry({ party, activityId, onSaved }: { party: Party; activityId: string; onSaved?: () => void }) {
  const { dispatch } = useStore();
  const [points, setPoints] = useState<Record<string, number>>(() => {
    const existing = scoresFor(party, activityId);
    return Object.fromEntries(party.teams.map((t) => [t.id, existing[t.id] ?? 0]));
  });
  const [saved, setSaved] = useState(false);

  const change = (teamId: string, delta: number) => {
    setSaved(false);
    setPoints((p) => ({ ...p, [teamId]: Math.max(-99, Math.min(999, (p[teamId] ?? 0) + delta)) }));
  };

  return (
    <div className="space-y-3">
      {party.teams.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-2xl bg-coal p-2" style={{ borderLeft: `6px solid ${t.color}` }}>
          <span className="flex-1 pl-2 text-lg font-extrabold">{t.name}</span>
          <button className="h-12 w-12 rounded-xl bg-ember text-2xl font-black" aria-label={`Retirer un point à ${t.name}`} onClick={() => change(t.id, -1)}>
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            aria-label={`Points ${t.name}`}
            className="h-12 w-16 rounded-xl bg-night text-center text-2xl font-black tabular-nums"
            value={points[t.id] ?? 0}
            onChange={(e) => {
              setSaved(false);
              setPoints((p) => ({ ...p, [t.id]: Number(e.target.value) || 0 }));
            }}
          />
          <button className="h-12 w-12 rounded-xl bg-ember text-2xl font-black" aria-label={`Ajouter un point à ${t.name}`} onClick={() => change(t.id, 1)}>
            +
          </button>
        </div>
      ))}
      <Button
        className="w-full"
        onClick={() => {
          dispatch({ type: 'SET_SCORES', activityId, points });
          setSaved(true);
          onSaved?.();
        }}
      >
        {saved ? '✓ Points enregistrés' : 'Enregistrer les points'}
      </Button>
    </div>
  );
}
