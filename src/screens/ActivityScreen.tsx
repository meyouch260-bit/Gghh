import { useState } from 'react';
import { GAMES } from '../../data/games';
import { eligibleGames } from '../../shared/eligibility';
import { relevance } from '../../shared/planner';
import type { Activity, Game, Party } from '../../shared/types';
import { ContentView, contentSummary } from '../components/ContentView';
import { GameCard, GameRules } from '../components/GameCard';
import { ScoreEntry } from '../components/Scoreboard';
import { Button, Card, ErrorBox, Header, Section, Spinner } from '../components/ui';
import type { Nav } from '../nav';
import { generate } from '../services/api';
import { gameOf } from '../state/selectors';
import { useStore } from '../state/store';

export function ActivityScreen({ nav, activityId }: { nav: Nav; activityId: string }) {
  const { state, dispatch } = useStore();
  const party = state.party;
  const activity = party?.activities.find((a) => a.id === activityId);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [showRules, setShowRules] = useState(false);

  if (!party || !activity) return null;
  const game = gameOf(activity.gameId);
  const index = party.activities.findIndex((a) => a.id === activityId);
  const nextActivity = party.activities[index + 1];

  const regenerate = async (gameId: string, avoid: string[], label: string) => {
    setBusy(label);
    setError(null);
    setPicking(false);
    try {
      const { activities } = await generate({
        mode: 'activity',
        settings: party.settings,
        gameId,
        durationMin: activity.durationMin,
        avoid: avoid.slice(0, 80),
      });
      dispatch({ type: 'REPLACE_ACTIVITY', activityId, activity: activities[0] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setBusy(null);
    }
  };

  if (picking) {
    return (
      <ReplacePicker
        party={party}
        activity={activity}
        onCancel={() => setPicking(false)}
        onPick={(g) => regenerate(g.id, [], `Préparation de « ${g.name} »…`)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Header title={game?.name ?? 'Activité'} onBack={nav.back} />

      {busy ? (
        <Spinner label={busy} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-muted">
            <span>
              Activité {index + 1}/{party.activities.length}
            </span>
            <span>· {activity.durationMin} min</span>
          </div>

          <Card className="space-y-3">
            <p className="text-xl font-bold leading-snug">{activity.intro}</p>
            {activity.status === 'todo' && (
              <Button className="w-full" onClick={() => dispatch({ type: 'SET_ACTIVITY_STATUS', activityId, status: 'current' })}>
                ▶ Lancer l'activité
              </Button>
            )}
          </Card>

          {game && (
            <Section title="Règles">
              <button className="w-full rounded-2xl bg-ember p-4 text-left" onClick={() => setShowRules((v) => !v)} aria-expanded={showRules}>
                {showRules ? <GameRules game={game} /> : <span className="font-bold text-muted">Afficher les règles ▼</span>}
              </button>
            </Section>
          )}

          {activity.tips.length > 0 && (
            <Section title="Conseils pour votre groupe">
              <ul className="space-y-2">
                {activity.tips.map((t, i) => (
                  <li key={i} className="rounded-2xl bg-ember p-3">
                    💡 {t}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Contenu prêt à jouer">
            <ContentView content={activity.content} />
          </Section>

          {party.teams.length > 0 ? (
            <Section title="Points de la manche">
              <ScoreEntry
                key={activity.id + activity.intro}
                party={party}
                activityId={activityId}
                onSaved={() => dispatch({ type: 'SET_ACTIVITY_STATUS', activityId, status: 'done' })}
              />
            </Section>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => nav.go({ name: 'teams' })}>
              👥 Former les équipes pour noter les points
            </Button>
          )}

          {error && <ErrorBox message={error} />}

          <Section title="Pas convaincu ?">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={() => regenerate(activity.gameId, contentSummary(activity.content), 'Nouveau contenu en préparation…')}
              >
                🔄 Nouveau contenu
              </Button>
              <Button variant="secondary" onClick={() => setPicking(true)}>
                🔁 Changer de jeu
              </Button>
            </div>
          </Section>

          <div className="space-y-2">
            {activity.status !== 'done' && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => dispatch({ type: 'SET_ACTIVITY_STATUS', activityId, status: 'done' })}
              >
                ✓ Marquer comme terminée
              </Button>
            )}
            {nextActivity ? (
              <Button
                className="w-full"
                onClick={() => {
                  if (activity.status !== 'done') dispatch({ type: 'SET_ACTIVITY_STATUS', activityId, status: 'done' });
                  dispatch({ type: 'SET_ACTIVITY_STATUS', activityId: nextActivity.id, status: 'current' });
                  nav.replace({ name: 'activity', activityId: nextActivity.id });
                }}
              >
                Activité suivante : {gameOf(nextActivity.gameId)?.name} →
              </Button>
            ) : (
              <Button className="w-full" onClick={() => nav.go({ name: 'final' })}>
                🎉 Voir le classement final
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReplacePicker({
  party,
  activity,
  onPick,
  onCancel,
}: {
  party: Party;
  activity: Activity;
  onPick: (g: Game) => void;
  onCancel: () => void;
}) {
  const inProgram = new Set(party.activities.map((a) => a.gameId));
  const idx = party.activities.findIndex((a) => a.id === activity.id);
  const neighbours = [party.activities[idx - 1], party.activities[idx + 1]]
    .filter(Boolean)
    .map((a) => gameOf(a.gameId)?.category);

  const options = eligibleGames(GAMES, party.settings)
    .filter((g) => !inProgram.has(g.id))
    .map((g) => ({ g, clash: neighbours.includes(g.category), score: relevance(g, party.settings) }))
    .sort((a, b) => Number(a.clash) - Number(b.clash) || b.score - a.score);

  return (
    <div className="space-y-4 pb-10">
      <Header title="Changer de jeu" onBack={onCancel} />
      <p className="text-muted">Jeux compatibles avec tous vos invités, les plus adaptés en premier.</p>
      <div className="space-y-3">
        {options.map(({ g, clash }) => (
          <GameCard
            key={g.id}
            game={g}
            footer={
              clash ? (
                <p className="mt-2 text-sm text-flame">⚠️ Même catégorie qu'une activité voisine</p>
              ) : undefined
            }
            action={
              <Button className="w-full" onClick={() => onPick(g)}>
                Choisir ce jeu
              </Button>
            }
          />
        ))}
      </div>
    </div>
  );
}
