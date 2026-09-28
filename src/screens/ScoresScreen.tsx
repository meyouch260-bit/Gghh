import { Leaderboard } from '../components/Scoreboard';
import { Button, Card, Header, Section } from '../components/ui';
import type { Nav } from '../nav';
import { gameOf, scoresFor } from '../state/selectors';
import { useStore } from '../state/store';

export function ScoresScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const party = state.party;
  if (!party) return null;

  if (party.teams.length === 0) {
    return (
      <div className="space-y-5">
        <Header title="Classement" onBack={nav.back} />
        <Card className="space-y-3">
          <p className="text-lg">Aucune équipe pour l'instant.</p>
          <Button className="w-full" onClick={() => nav.go({ name: 'teams' })}>
            👥 Former les équipes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Header title="Classement" onBack={nav.back} />
      <Leaderboard party={party} />

      <Section title="Détail par activité">
        <div className="overflow-x-auto rounded-2xl bg-ember">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cream/10">
                <th className="p-3 text-sm text-muted">Activité</th>
                {party.teams.map((t) => (
                  <th key={t.id} className="p-3 text-center text-sm" style={{ color: t.color }}>
                    {t.name.replace('Les ', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {party.activities.map((a) => {
                const pts = scoresFor(party, a.id);
                return (
                  <tr key={a.id} className="border-b border-cream/5 last:border-0">
                    <td className="p-3">
                      <button className="text-left font-bold underline decoration-flame/40 underline-offset-4" onClick={() => nav.go({ name: 'activity', activityId: a.id })}>
                        {gameOf(a.gameId)?.name}
                      </button>
                    </td>
                    {party.teams.map((t) => (
                      <td key={t.id} className="p-3 text-center text-lg font-black tabular-nums">
                        {pts[t.id] ?? '·'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">Touchez une activité pour saisir ou corriger ses points.</p>
      </Section>
    </div>
  );
}
