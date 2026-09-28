import { useState, type ReactNode } from 'react';
import { CATEGORY_EMOJI, CATEGORY_LABELS, ENERGY_LABELS, MATERIAL_LABELS, type Game } from '../../shared/types';

const ENERGY_COLOR = { calme: 'text-sky-300', moyen: 'text-flame', physique: 'text-berry' } as const;

export function GameMeta({ game }: { game: Game }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
      <span>{CATEGORY_LABELS[game.category]}</span>
      <span>
        {game.ageMin}-{game.ageMax} ans
      </span>
      <span>
        {game.playersMin}-{game.playersMax} joueurs
      </span>
      <span>~{game.durationMin} min</span>
      <span className={`font-bold ${ENERGY_COLOR[game.energy]}`}>● {ENERGY_LABELS[game.energy]}</span>
    </div>
  );
}

export function GameRules({ game }: { game: Game }) {
  return (
    <div className="space-y-3">
      <ol className="list-decimal space-y-1 pl-5">
        {game.rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
      {(game.materials.length > 0 || game.props) && (
        <p className="text-sm text-muted">
          🧰 {[...game.materials.map((m) => MATERIAL_LABELS[m]), game.props].filter(Boolean).join(' · ')}
        </p>
      )}
      <div className="space-y-1 text-sm">
        <p>
          <span className="font-bold text-flame">Plus jeunes : </span>
          {game.adaptations.younger}
        </p>
        <p>
          <span className="font-bold text-flame">Plus âgés : </span>
          {game.adaptations.older}
        </p>
      </div>
    </div>
  );
}

export function GameCard({ game, action, footer }: { game: Game; action?: ReactNode; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-3xl bg-ember p-4">
      <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="text-3xl" aria-hidden>
          {CATEGORY_EMOJI[game.category]}
        </span>
        <span className="flex-1 space-y-1">
          <span className="block text-lg font-extrabold leading-tight">{game.name}</span>
          <GameMeta game={game} />
        </span>
        <span className="text-muted" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="mt-3 border-t border-cream/10 pt-3">
          <GameRules game={game} />
        </div>
      )}
      {footer}
      {action && <div className="mt-3">{action}</div>}
    </article>
  );
}
