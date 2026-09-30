import { useState } from 'react';
import type { ActivityContent, AgeBand, QuizItem, Track, WordItem } from '../../shared/types';
import { Button } from './ui';

function BandTag({ band }: { band?: AgeBand }) {
  if (!band) return null;
  return <span className="ml-2 rounded-full bg-coal px-2 py-0.5 text-xs font-bold text-muted">{band}</span>;
}

function Quiz({ questions }: { questions: QuizItem[] }) {
  const [shown, setShown] = useState<Set<number>>(new Set());
  const all = shown.size === questions.length;
  const flip = (i: number) =>
    setShown((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  return (
    <div className="space-y-3">
      <Button variant="secondary" className="w-full" onClick={() => setShown(all ? new Set() : new Set(questions.map((_, i) => i)))}>
        {all ? 'Masquer les réponses' : 'Révéler toutes les réponses'}
      </Button>
      <ol className="space-y-2">
        {questions.map((q, i) => (
          <li key={i}>
            <button onClick={() => flip(i)} className="w-full rounded-2xl bg-coal p-4 text-left">
              <span className="text-lg font-bold">
                {i + 1}. {q.q}
              </span>
              <BandTag band={q.band} />
              <span className={`mt-2 block text-lg ${shown.has(i) ? 'text-leaf' : 'text-muted/60'}`}>
                {shown.has(i) ? `→ ${q.a}` : 'Toucher pour voir la réponse'}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Words({ items }: { items: WordItem[] }) {
  const [mode, setMode] = useState<'card' | 'list'>('card');
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const item = items[idx % items.length];

  const next = () => {
    setIdx((i) => (i + 1) % items.length);
    setRevealed(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button variant={mode === 'card' ? 'primary' : 'secondary'} onClick={() => setMode('card')}>
          Carte par carte
        </Button>
        <Button variant={mode === 'list' ? 'primary' : 'secondary'} onClick={() => setMode('list')}>
          Liste
        </Button>
      </div>
      {mode === 'card' ? (
        <div className="space-y-3">
          {/* Étape 2 : cette carte « secrète » s'affichera sur le téléphone du joueur. */}
          <button
            onClick={() => setRevealed((r) => !r)}
            className="flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-flame/50 bg-coal p-6 text-center"
          >
            {revealed ? (
              <>
                <span className="text-4xl font-black leading-tight">{item.word}</span>
                {item.forbidden && item.forbidden.length > 0 && (
                  <span className="text-lg text-berry">🚫 {item.forbidden.join(' · ')}</span>
                )}
                {item.pair && <span className="text-lg text-muted">Intrus : {item.pair}</span>}
                <BandTag band={item.band} />
              </>
            ) : (
              <span className="text-xl font-bold text-muted">
                🤫 Seul le joueur regarde
                <br />
                Toucher pour révéler
              </span>
            )}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-muted tabular-nums">
              {(idx % items.length) + 1}/{items.length}
            </span>
            <Button className="flex-1" onClick={next}>
              Carte suivante →
            </Button>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((w, i) => (
            <li key={i} className="rounded-2xl bg-coal p-3 text-lg font-bold">
              {w.word}
              {w.pair && <span className="font-normal text-muted"> / {w.pair}</span>}
              <BandTag band={w.band} />
              {w.forbidden && w.forbidden.length > 0 && (
                <span className="block text-sm font-normal text-berry">🚫 {w.forbidden.join(' · ')}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BlindTest({ tracks }: { tracks: Track[] }) {
  const [hidden, setHidden] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Lancez chaque titre vous-même sur Spotify ou YouTube. Masquez la liste si des joueurs regardent l'écran.
      </p>
      <Button variant="secondary" className="w-full" onClick={() => setHidden((h) => !h)}>
        {hidden ? '👀 Afficher les titres' : '🙈 Masquer les titres'}
      </Button>
      <ol className="space-y-2">
        {tracks.map((t, i) => (
          <li key={i} className="flex items-center gap-3 rounded-2xl bg-coal p-3">
            <span className="w-8 text-center text-xl font-black text-flame">{i + 1}</span>
            <span className="flex-1">
              {hidden ? (
                <span className="text-muted">••••••</span>
              ) : (
                <>
                  <span className="block text-lg font-bold">{t.title}</span>
                  <span className="text-muted">
                    {t.artist} · {t.year}
                  </span>
                  <BandTag band={t.band} />
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ContentView({ content }: { content: ActivityContent }) {
  switch (content.kind) {
    case 'quiz':
      return <Quiz questions={content.questions} />;
    case 'words':
      return <Words items={content.items} />;
    case 'blindtest':
      return <BlindTest tracks={content.tracks} />;
    case 'prompts':
      return (
        <ul className="space-y-2">
          {content.items.map((p, i) => (
            <li key={i} className="rounded-2xl bg-coal p-4 text-lg">
              {p}
            </li>
          ))}
        </ul>
      );
    case 'freeform':
      return (
        <ol className="space-y-2">
          {content.steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-coal p-4 text-lg">
              <span className="font-black text-flame">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      );
  }
}

/** Liste des éléments de contenu, pour éviter les répétitions lors d'une régénération. */
export function contentSummary(content: ActivityContent): string[] {
  switch (content.kind) {
    case 'quiz':
      return content.questions.map((q) => q.q);
    case 'words':
      return content.items.map((w) => w.word);
    case 'blindtest':
      return content.tracks.map((t) => `${t.title} (${t.artist})`);
    case 'prompts':
      return content.items;
    case 'freeform':
      return [];
  }
}
