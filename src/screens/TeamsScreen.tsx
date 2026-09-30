import { useState } from 'react';
import { AGE_BANDS, type AgeBand, type Player } from '../../shared/types';
import { Button, Chip, Header, Section, Toggle } from '../components/ui';
import type { Nav } from '../nav';
import { uid } from '../services/ids';
import { drawTeams } from '../services/teams';
import { useStore } from '../state/store';

export function TeamsScreen({ nav }: { nav: Nav }) {
  const { state, dispatch } = useStore();
  const party = state.party;
  const [name, setName] = useState('');
  const [band, setBand] = useState<AgeBand | undefined>(undefined);
  const [count, setCount] = useState(() => party?.teams.length || 2);
  const [mix, setMix] = useState(() => (party?.settings.ageBands.length ?? 0) > 1);

  if (!party) return null;
  const players = party.players;
  const bands = party.settings.ageBands.length > 0 ? party.settings.ageBands : [...AGE_BANDS];

  const setPlayers = (next: Player[]) => dispatch({ type: 'SET_PLAYERS', players: next });

  const addPlayer = () => {
    const n = name.trim();
    if (!n) return;
    setPlayers([...players, { id: uid(), name: n, ageBand: band }]);
    setName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
    if (party.teams.length) {
      dispatch({
        type: 'SET_TEAMS',
        teams: party.teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((pid) => pid !== id) })),
        players: players.filter((p) => p.id !== id),
      });
    }
  };

  const draw = () => {
    const res = drawTeams(players, count, mix);
    dispatch({ type: 'SET_TEAMS', teams: res.teams, players: res.players });
  };

  const unassigned = players.filter((p) => !p.teamId || !party.teams.some((t) => t.id === p.teamId));
  const hasScores = party.scores.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <Header title="Les équipes" onBack={nav.back} />

      <Section title={`Joueurs (${players.length})`}>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            addPlayer();
          }}
        >
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prénom"
              aria-label="Prénom du joueur"
              autoComplete="off"
              className="h-14 min-w-0 flex-1 rounded-2xl bg-ember px-4 text-lg placeholder:text-muted/60"
            />
            <Button type="submit" disabled={!name.trim()} aria-label="Ajouter le joueur">
              +
            </Button>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Tranche d'âge (optionnel)">
            {bands.map((b) => (
              <Chip key={b} selected={band === b} onClick={() => setBand(band === b ? undefined : b)} className="min-h-10 px-3 text-sm">
                {b}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-muted">Tranche d'âge facultative, utile pour mixer les générations.</p>
        </form>

        {players.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-full bg-coal py-1 pl-4 pr-1">
                <span className="font-bold">{p.name}</span>
                {p.ageBand && <span className="text-xs text-muted">{p.ageBand}</span>}
                <button onClick={() => removePlayer(p.id)} aria-label={`Retirer ${p.name}`} className="h-9 w-9 rounded-full bg-ember text-muted">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Nombre d'équipes">
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((n) => (
            <Chip key={n} selected={count === n} onClick={() => setCount(n)}>
              {n} équipes
            </Chip>
          ))}
        </div>
        <Toggle label="Mixer les générations" hint="Répartit les âges entre les équipes" checked={mix} onChange={setMix} />
      </Section>

      <Button className="w-full text-xl" disabled={players.length < count} onClick={draw}>
        🎲 {party.teams.length ? 'Re-tirer les équipes' : 'Tirer les équipes au sort'}
      </Button>
      {players.length < count && <p className="text-center text-sm text-muted">Ajoutez au moins {count} joueurs.</p>}
      {hasScores && party.teams.length > 0 && (
        <p className="text-center text-sm text-flame">⚠️ Un nouveau tirage remet les scores à zéro.</p>
      )}

      {party.teams.length > 0 && (
        <div className="space-y-3">
          {party.teams.map((t) => (
            <div key={t.id} className="rounded-3xl bg-ember p-4" style={{ borderTop: `6px solid ${t.color}` }}>
              <h3 className="mb-2 text-xl font-black" style={{ color: t.color }}>
                {t.name}
              </h3>
              <p className="text-lg">
                {t.playerIds
                  .map((id) => players.find((p) => p.id === id))
                  .filter(Boolean)
                  .map((p) => p!.name)
                  .join(' · ') || '—'}
              </p>
            </div>
          ))}
          {unassigned.length > 0 && (
            <p className="text-sm text-muted">Sans équipe : {unassigned.map((p) => p.name).join(', ')} — relancez le tirage.</p>
          )}
          <Button className="w-full" variant="secondary" onClick={nav.back}>
            C'est parti !
          </Button>
        </div>
      )}
    </div>
  );
}
