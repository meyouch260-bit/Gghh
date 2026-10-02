import { useState } from 'react';
import { AGE_BANDS, type AgeBand, type Player } from '../../shared/types';
import { Button, Chip, Header, Section, Toggle } from '../components/ui';
import type { Nav } from '../nav';
import { uid } from '../services/ids';
import { coupleTeams, drawTeams } from '../services/teams';
import { useStore } from '../state/store';

const inputCls = 'h-14 min-w-0 flex-1 rounded-2xl bg-ember px-4 text-lg placeholder:text-muted/60';

export function TeamsScreen({ nav }: { nav: Nav }) {
  const { state, dispatch } = useStore();
  const party = state.party;
  const couplesMood = party?.settings.mood === 'couples';
  const [entry, setEntry] = useState<'solo' | 'couple'>(couplesMood ? 'couple' : 'solo');
  const [name, setName] = useState('');
  const [name2, setName2] = useState('');
  const [band, setBand] = useState<AgeBand | undefined>(undefined);
  const [mode, setMode] = useState<'random' | 'couples'>(couplesMood ? 'couples' : 'random');
  const [count, setCount] = useState(() => Math.min(4, Math.max(2, party?.teams.length || 2)));
  const [mix, setMix] = useState(() => (party?.settings.ageBands.length ?? 0) > 1);
  const [separate, setSeparate] = useState(false);

  if (!party) return null;
  const players = party.players;
  const bands = party.settings.ageBands.length > 0 ? party.settings.ageBands : [...AGE_BANDS];
  const hasCouples = players.some((p) => p.coupleId);
  const teamMode = hasCouples ? mode : 'random';

  const setPlayers = (next: Player[]) => dispatch({ type: 'SET_PLAYERS', players: next });

  const canAdd = entry === 'solo' ? !!name.trim() : !!name.trim() && !!name2.trim();
  const add = () => {
    if (!canAdd) return;
    if (entry === 'solo') {
      setPlayers([...players, { id: uid(), name: name.trim(), ageBand: band }]);
    } else {
      const coupleId = uid();
      setPlayers([
        ...players,
        { id: uid(), name: name.trim(), ageBand: band, coupleId },
        { id: uid(), name: name2.trim(), ageBand: band, coupleId },
      ]);
    }
    setName('');
    setName2('');
  };

  const remove = (ids: string[]) => {
    const rest = players.filter((p) => !ids.includes(p.id));
    setPlayers(rest);
    if (party.teams.length) {
      dispatch({
        type: 'SET_TEAMS',
        teams: party.teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((pid) => !ids.includes(pid)) })),
        players: rest,
      });
    }
  };

  const draw = () => {
    const res =
      teamMode === 'couples' ? coupleTeams(players) : drawTeams(players, count, { mixGenerations: mix, separateCouples: hasCouples && separate });
    dispatch({ type: 'SET_TEAMS', teams: res.teams, players: res.players });
  };

  // Liste affichée : un couple = une seule pastille.
  const units: Player[][] = [];
  const seen = new Set<string>();
  for (const p of players) {
    if (!p.coupleId) units.push([p]);
    else if (!seen.has(p.coupleId)) {
      seen.add(p.coupleId);
      units.push(players.filter((q) => q.coupleId === p.coupleId));
    }
  }

  const unassigned = players.filter((p) => !p.teamId || !party.teams.some((t) => t.id === p.teamId));
  const hasScores = party.scores.length > 0;
  const minPlayers = teamMode === 'couples' ? 2 : count;

  return (
    <div className="space-y-6 pb-10">
      <Header title="Les équipes" onBack={nav.back} />

      <Section title={`Joueurs (${players.length})`}>
        <div className="grid grid-cols-2 gap-2">
          <Chip selected={entry === 'solo'} onClick={() => setEntry('solo')}>
            👤 Une personne
          </Chip>
          <Chip selected={entry === 'couple'} onClick={() => setEntry('couple')}>
            💞 Un couple
          </Chip>
        </div>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <div className="flex gap-2">
            <input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={entry === 'couple' ? 'Prénom 1' : 'Prénom'}
              aria-label={entry === 'couple' ? 'Prénom du premier partenaire' : 'Prénom du joueur'}
              autoComplete="off"
              className={inputCls}
            />
            {entry === 'couple' && (
              <input
                id="player-name-2"
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder="Prénom 2"
                aria-label="Prénom du second partenaire"
                autoComplete="off"
                className={inputCls}
              />
            )}
            <Button type="submit" disabled={!canAdd} aria-label={entry === 'couple' ? 'Ajouter le couple' : 'Ajouter le joueur'}>
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

        {units.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {units.map((u) => (
              <li key={u[0].id} className="flex items-center gap-2 rounded-full bg-coal py-1 pl-4 pr-1">
                <span className="font-bold">{u.map((p) => p.name).join(' 💞 ')}</span>
                {u[0].ageBand && <span className="text-xs text-muted">{u[0].ageBand}</span>}
                <button
                  onClick={() => remove(u.map((p) => p.id))}
                  aria-label={`Retirer ${u.map((p) => p.name).join(' et ')}`}
                  className="h-9 w-9 rounded-full bg-ember text-muted"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Composition des équipes">
        {hasCouples && (
          <div className="grid grid-cols-2 gap-2">
            <Chip selected={teamMode === 'couples'} onClick={() => setMode('couples')}>
              💞 Une équipe par couple
            </Chip>
            <Chip selected={teamMode === 'random'} onClick={() => setMode('random')}>
              🎲 Au hasard
            </Chip>
          </div>
        )}
        {teamMode === 'random' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((n) => (
                <Chip key={n} selected={count === n} onClick={() => setCount(n)}>
                  {n} équipes
                </Chip>
              ))}
            </div>
            <Toggle label="Mixer les générations" hint="Répartit les âges entre les équipes" checked={mix} onChange={setMix} />
            {hasCouples && (
              <Toggle
                label="Séparer les couples"
                hint="Chaque partenaire joue dans une équipe différente"
                checked={separate}
                onChange={setSeparate}
              />
            )}
          </>
        )}
      </Section>

      <Button className="w-full text-xl" disabled={players.length < minPlayers} onClick={draw}>
        {teamMode === 'couples' ? '💞 Former les équipes par couple' : `🎲 ${party.teams.length ? 'Re-tirer les équipes' : 'Tirer les équipes au sort'}`}
      </Button>
      {players.length < minPlayers && <p className="text-center text-sm text-muted">Ajoutez au moins {minPlayers} joueurs.</p>}
      {hasScores && party.teams.length > 0 && (
        <p className="text-center text-sm text-flame">⚠️ Refaire les équipes remet les scores à zéro.</p>
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
            <p className="text-sm text-muted">Sans équipe : {unassigned.map((p) => p.name).join(', ')}. Refaites les équipes pour les inclure.</p>
          )}
          <Button className="w-full" variant="secondary" onClick={nav.back}>
            C'est parti !
          </Button>
        </div>
      )}
    </div>
  );
}
