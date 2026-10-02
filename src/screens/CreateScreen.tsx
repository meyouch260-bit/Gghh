import { useMemo, useState } from 'react';
import { GAMES } from '../../data/games';
import { eligibleGames, hasMinors } from '../../shared/eligibility';
import {
  AGE_BANDS,
  MATERIALS,
  MATERIAL_LABELS,
  MOODS,
  MOOD_LABELS,
  VENUES,
  VENUE_LABELS,
  type AgeBand,
  type Material,
  type PartySettings,
} from '../../shared/types';
import { Button, Chip, ErrorBox, Header, Section, Spinner, Stepper, Toggle } from '../components/ui';
import { formatDuration } from '../format';
import type { Nav } from '../nav';
import { generate } from '../services/api';
import { useStore } from '../state/store';

const MOOD_EMOJI: Record<string, string> = { chill: '🛋️', festive: '🎉', competitive: '🏆', intello: '🧠', nostalgie: '📼', couples: '💞' };

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function CreateScreen({ nav }: { nav: Nav }) {
  const { state, dispatch } = useStore();
  const [s, setS] = useState<PartySettings>(
    () =>
      state.party?.settings ?? {
        guests: 8,
        ageBands: ['30-60'],
        mood: 'festive',
        venue: 'petit-salon',
        durationMin: 120,
        materials: ['papier', 'smartphones'],
        alcoholFree: false,
        largeText: state.largeText,
      },
  );
  const [alcoholTouched, setAlcoholTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [written, setWritten] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<PartySettings>) => setS((prev) => ({ ...prev, ...p }));

  const setBands = (ageBands: AgeBand[]) => {
    // « Sans alcool » s'active automatiquement dès que des 10-17 ans sont présents.
    patch(alcoholTouched ? { ageBands } : { ageBands, alcoholFree: hasMinors(ageBands) });
  };

  const eligibleCount = useMemo(() => eligibleGames(GAMES, s).length, [s]);
  const canSubmit = s.ageBands.length > 0 && eligibleCount >= 4 && !loading;

  const submit = async () => {
    setLoading(true);
    setWritten(0);
    setError(null);
    try {
      const { activities, source } = await generate({ mode: 'program', settings: s }, setWritten);
      dispatch({ type: 'CREATE_PARTY', settings: s, activities, source });
      nav.replace({ name: 'program' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Préparation…" />
        <Spinner
          label={
            written > 0
              ? `Claude écrit le programme… ${written} activité${written > 1 ? 's' : ''} rédigée${written > 1 ? 's' : ''}`
              : 'On concocte votre programme de soirée. Cela peut prendre jusqu’à deux minutes.'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-32">
      <Header title="Nouvelle soirée" onBack={nav.back} />

      <Section title="Combien de joueurs ?">
        <Stepper label="joueurs" value={s.guests} min={2} max={30} onChange={(guests) => patch({ guests })} format={(v) => `${v} personnes`} />
      </Section>

      <Section title="Âges présents (plusieurs choix)">
        <div className="flex flex-wrap gap-2">
          {AGE_BANDS.map((b) => (
            <Chip key={b} selected={s.ageBands.includes(b)} onClick={() => setBands(toggle(s.ageBands, b))}>
              {b} ans
            </Chip>
          ))}
        </div>
        {s.ageBands.length === 0 && <p className="text-sm text-berry">Choisissez au moins une tranche d'âge.</p>}
      </Section>

      <Section title="Ambiance">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip key={m} selected={s.mood === m} onClick={() => patch({ mood: m })}>
              {MOOD_EMOJI[m]} {MOOD_LABELS[m]}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Où joue-t-on ?">
        <div className="flex flex-wrap gap-2">
          {VENUES.map((v) => (
            <Chip key={v} selected={s.venue === v} onClick={() => patch({ venue: v })}>
              {VENUE_LABELS[v]}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Durée totale des jeux">
        <Stepper label="durée" value={s.durationMin} min={45} max={240} step={15} onChange={(durationMin) => patch({ durationMin })} format={formatDuration} />
      </Section>

      <Section title="Matériel disponible">
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <Chip key={m} selected={s.materials.includes(m)} onClick={() => patch({ materials: toggle<Material>(s.materials, m) })}>
              {MATERIAL_LABELS[m]}
            </Chip>
          ))}
          <Chip selected={s.materials.length === 0} onClick={() => patch({ materials: [] })}>
            Aucun
          </Chip>
        </div>
      </Section>

      <Section title="Options">
        <Toggle
          label="Sans alcool"
          hint={hasMinors(s.ageBands) ? 'Activé par défaut : des mineurs sont présents' : 'Aucune référence à l\'alcool'}
          checked={s.alcoholFree}
          onChange={(alcoholFree) => {
            setAlcoholTouched(true);
            patch({ alcoholFree });
          }}
        />
        <Toggle
          label="Gros caractères"
          hint="Plus lisible pour tout le monde"
          checked={s.largeText}
          onChange={(largeText) => {
            patch({ largeText });
            dispatch({ type: 'SET_LARGE_TEXT', value: largeText });
          }}
        />
      </Section>

      {error && <ErrorBox message={error} onRetry={submit} />}

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-night via-night to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto max-w-xl space-y-2">
          <p className="text-center text-sm text-muted">
            {eligibleCount} jeux compatibles avec tous les âges
            {eligibleCount < 4 && ' — ajoutez du matériel ou des joueurs'}
          </p>
          <Button className="w-full text-xl" disabled={!canSubmit} onClick={submit}>
            ✨ Générer le programme
          </Button>
        </div>
      </div>
    </div>
  );
}
