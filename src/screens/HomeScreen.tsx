import { GAMES } from '../../data/games';
import { Button, Toggle } from '../components/ui';
import type { Nav } from '../nav';
import { progress } from '../state/selectors';
import { useStore } from '../state/store';

export function HomeScreen({ nav }: { nav: Nav }) {
  const { state, dispatch } = useStore();
  const party = state.party;
  const p = party && progress(party);

  return (
    <div className="flex min-h-[90dvh] flex-col justify-center gap-8 py-10">
      <div className="space-y-3 text-center">
        <div className="text-7xl" aria-hidden>
          🎲
        </div>
        <h1 className="text-4xl font-black">Soirée Jeux</h1>
        <p className="text-lg text-muted">Un programme d'activités sur mesure pour votre dîner, de 10 à 80 ans.</p>
      </div>

      <div className="space-y-3">
        {party && p && (
          <Button className="w-full text-xl" onClick={() => nav.go({ name: party.phase === 'finished' ? 'final' : 'program' })}>
            ▶ Reprendre la soirée ({p.done}/{p.total})
          </Button>
        )}
        <Button className="w-full text-xl" variant={party ? 'secondary' : 'primary'} onClick={() => nav.go({ name: 'create' })}>
          ✨ Nouvelle soirée
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => nav.go({ name: 'catalog' })}>
          📚 Catalogue des {GAMES.length} jeux
        </Button>
      </div>

      <Toggle
        label="Gros caractères"
        hint="Agrandit tout le texte de l'application"
        checked={state.largeText}
        onChange={(value) => dispatch({ type: 'SET_LARGE_TEXT', value })}
      />
    </div>
  );
}
