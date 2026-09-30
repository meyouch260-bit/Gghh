import { useMemo, useState } from 'react';
import { GAMES } from '../../data/games';
import { coversAges } from '../../shared/eligibility';
import { AGE_BANDS, ENERGIES, ENERGY_LABELS, MOODS, MOOD_LABELS, type AgeBand, type Energy, type Mood } from '../../shared/types';
import { GameCard } from '../components/GameCard';
import { Chip, Header, Section } from '../components/ui';
import type { Nav } from '../nav';

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function CatalogScreen({ nav }: { nav: Nav }) {
  const [ages, setAges] = useState<AgeBand[]>([]);
  const [energies, setEnergies] = useState<Energy[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);

  const games = useMemo(
    () =>
      GAMES.filter(
        (g) =>
          (ages.length === 0 || coversAges(g, ages)) &&
          (energies.length === 0 || energies.includes(g.energy)) &&
          (moods.length === 0 || g.moods.some((m) => moods.includes(m))),
      ),
    [ages, energies, moods],
  );

  return (
    <div className="space-y-5 pb-10">
      <Header title="Catalogue des jeux" onBack={nav.back} />
      <Section title="Âges (le jeu doit tous les couvrir)">
        <div className="flex flex-wrap gap-2">
          {AGE_BANDS.map((b) => (
            <Chip key={b} selected={ages.includes(b)} onClick={() => setAges(toggle(ages, b))}>
              {b}
            </Chip>
          ))}
        </div>
      </Section>
      <Section title="Énergie">
        <div className="flex flex-wrap gap-2">
          {ENERGIES.map((e) => (
            <Chip key={e} selected={energies.includes(e)} onClick={() => setEnergies(toggle(energies, e))}>
              {ENERGY_LABELS[e]}
            </Chip>
          ))}
        </div>
      </Section>
      <Section title="Ambiance">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip key={m} selected={moods.includes(m)} onClick={() => setMoods(toggle(moods, m))}>
              {MOOD_LABELS[m]}
            </Chip>
          ))}
        </div>
      </Section>
      <p className="font-bold text-muted" aria-live="polite">
        {games.length} jeu{games.length > 1 ? 'x' : ''}
      </p>
      <div className="space-y-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
