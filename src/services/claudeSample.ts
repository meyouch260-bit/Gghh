/**
 * Génération via le compte Claude de la personne qui ouvre l'app, quand
 * l'app est publiée comme page claude.ai (capability `sample`).
 * Même prompt et mêmes règles de validation que la fonction serveur.
 */
import { AiProgramSchema, type AiActivity, type GenerateRequest } from '../../shared/schema';
import type { Game } from '../../shared/types';
import { JSON_FORMAT, SYSTEM_PROMPT, activityUserMessage, programUserMessage } from '../../server/prompt';
import { validateResponse } from '../../server/validate';

type Turn = { role: 'user' | 'assistant'; content: string };
interface SampleError {
  code: string;
  message: string;
  text?: string;
}
interface SampleFn {
  json<T = unknown>(
    input: string | Turn[],
    opts?: { modelTier?: 'quick' | 'default' | 'complex'; cache?: boolean; onText?: (u: { text: string }) => void },
  ): Promise<T>;
}
declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

/** Erreur à montrer telle quelle à l'utilisateur. */
export class UserFacingError extends Error {}

/** Codes après lesquels la fonctionnalité est indisponible pour cette visite. */
const UNAVAILABLE = new Set([
  'not_granted',
  'sampling_disabled',
  'not_declared',
  'capability_disabled',
  'capability_removed',
  'session_expired',
]);

let samplePromise: Promise<SampleFn | null> | null = null;
let disabled = false;

export function getSample(): Promise<SampleFn | null> {
  if (disabled || typeof window === 'undefined' || !window.claude?.use) return Promise.resolve(null);
  samplePromise ??= window.claude
    .use('sample')
    .then((s) => (s as SampleFn | null) ?? null)
    .catch(() => null);
  return samplePromise;
}

const isSampleError = (e: unknown): e is SampleError =>
  typeof e === 'object' && e !== null && 'code' in e && typeof (e as SampleError).code === 'string';

/**
 * Renvoie les activités, ou `null` si Claude n'est pas disponible ici
 * (refus de l'autorisation, page hors claude.ai…) : on passe alors en démo.
 */
export async function generateWithSample(
  req: GenerateRequest,
  games: Game[],
  onProgress?: (activitiesWritten: number) => void,
): Promise<AiActivity[] | null> {
  const sample = await getSample();
  if (!sample) return null;

  const allowed = Object.fromEntries(games.map((g) => [g.id, g]));
  const userMessage =
    req.mode === 'program'
      ? programUserMessage(req.settings, games)
      : activityUserMessage(req.settings, games[0], req.durationMin, req.avoid ?? []);
  const turns: Turn[] = [{ role: 'user', content: `${SYSTEM_PROMPT}\n\n${userMessage}\n\n${JSON_FORMAT}` }];
  const onText = ({ text }: { text: string }) => onProgress?.((text.match(/"gameId"/g) ?? []).length);

  let errors: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw: unknown;
    try {
      raw = await sample.json(turns, { modelTier: 'default', cache: false, onText });
    } catch (e) {
      if (!isSampleError(e)) throw e;
      if (UNAVAILABLE.has(e.code)) {
        disabled = true;
        return null;
      }
      if (e.code === 'rate_limited') throw new UserFacingError('Limite d’utilisation de Claude atteinte. Réessayez un peu plus tard.');
      if (e.code === 'cancelled') throw new UserFacingError('Génération annulée.');
      if (e.code === 'invalid_json' && attempt === 1) {
        errors = ['Ta réponse n’était pas un JSON valide et complet.'];
        turns.push({ role: 'assistant', content: (e.text ?? '').slice(0, 20000) || '…' });
        turns.push({ role: 'user', content: `${errors[0]} Renvoie uniquement l'objet JSON complet.` });
        continue;
      }
      throw new UserFacingError('Claude n’a pas pu préparer le programme. Réessayez.');
    }

    const parsed = AiProgramSchema.safeParse(raw);
    errors = parsed.success
      ? validateResponse(req, parsed.data.activities, allowed)
      : parsed.error.issues.slice(0, 8).map((i) => `${i.path.join('.')} : ${i.message}`);
    if (parsed.success && errors.length === 0) return parsed.data.activities;

    turns.push({ role: 'assistant', content: JSON.stringify(raw).slice(0, 60000) });
    turns.push({
      role: 'user',
      content: `Ta réponse ne respecte pas les règles :\n${errors.map((e) => `- ${e}`).join('\n')}\nCorrige et renvoie l'objet JSON complet.`,
    });
  }
  console.warn('[sample] programme rejeté :', errors);
  throw new UserFacingError('Claude a proposé un programme qui ne respecte pas les règles. Réessayez.');
}
