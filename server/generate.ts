import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { GAMES, GAMES_BY_ID } from '../data/games.js';
import { checkProgram, eligibleGames, isEligible } from '../shared/eligibility.js';
import {
  AiProgramSchema,
  GenerateRequestSchema,
  type AiActivity,
  type GenerateRequest,
  type GenerateResponse,
} from '../shared/schema.js';
import type { Game } from '../shared/types.js';
import { demoActivities } from './demo.js';
import { SYSTEM_PROMPT, activityUserMessage, programUserMessage } from './prompt.js';
import { checkActivity } from './validate.js';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_ATTEMPTS = 2; // 1 essai + 1 retry

export interface HandlerResult {
  status: number;
  body: GenerateResponse;
}

/** Point d'entrée commun à la fonction Vercel et au serveur de dev Vite. */
export async function handleGenerate(rawBody: unknown): Promise<HandlerResult> {
  const parsed = GenerateRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { ok: false, error: 'Requête invalide : ' + parsed.error.issues[0]?.message } };
  }
  const req = parsed.data;
  const allowed = eligibleGames(GAMES, req.settings);

  let games: Game[];
  if (req.mode === 'program') {
    if (allowed.length < 4) {
      return {
        status: 422,
        body: { ok: false, error: 'Pas assez de jeux compatibles avec ces critères. Ajoutez du matériel ou élargissez le cadre.' },
      };
    }
    games = allowed;
  } else {
    const game = GAMES_BY_ID[req.gameId];
    if (!game || !isEligible(game, req.settings)) {
      return { status: 422, body: { ok: false, error: "Ce jeu n'est pas compatible avec la soirée." } };
    }
    games = [game];
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 200, body: { ok: true, source: 'demo', activities: demoActivities(req, games) } };
  }

  try {
    const activities = await generateWithClaude(req, games);
    return { status: 200, body: { ok: true, source: 'ai', activities } };
  } catch (err) {
    console.error('[generate]', err);
    const message =
      err instanceof Anthropic.RateLimitError
        ? "L'IA est très sollicitée, réessayez dans un instant."
        : err instanceof Anthropic.AuthenticationError
          ? 'Clé API invalide côté serveur.'
          : "La génération a échoué. Réessayez.";
    return { status: 502, body: { ok: false, error: message } };
  }
}

async function generateWithClaude(req: GenerateRequest, games: Game[]): Promise<AiActivity[]> {
  const client = new Anthropic();
  const allowedById = Object.fromEntries(games.map((g) => [g.id, g]));
  const userMessage =
    req.mode === 'program'
      ? programUserMessage(req.settings, games)
      : activityUserMessage(req.settings, games[0], req.durationMin, req.avoid ?? []);

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages,
      output_config: { format: zodOutputFormat(AiProgramSchema) },
    });

    const output = response.parsed_output;
    lastErrors = output ? validate(req, output.activities, allowedById) : ['Réponse JSON illisible ou incomplète.'];
    if (response.stop_reason === 'max_tokens') lastErrors.push('Réponse tronquée : sois plus concis.');
    if (output && lastErrors.length === 0) return output.activities;

    console.warn(`[generate] tentative ${attempt} rejetée :`, lastErrors);
    // Retry : on renvoie la réponse et les erreurs pour correction.
    const text = response.content.find((b) => b.type === 'text');
    messages.push(
      { role: 'assistant', content: text?.type === 'text' ? text.text : '{}' },
      {
        role: 'user',
        content: `Ta réponse ne respecte pas les règles :\n${lastErrors.map((e) => `- ${e}`).join('\n')}\nCorrige et renvoie le JSON complet.`,
      },
    );
  }
  throw new Error('Validation échouée après retry : ' + lastErrors.join(' | '));
}

function validate(req: GenerateRequest, activities: AiActivity[], allowed: Record<string, Game>): string[] {
  const errors: string[] = [];
  if (req.mode === 'program') {
    errors.push(...checkProgram(activities.map((a) => a.gameId), allowed, req.settings));
  } else if (activities.length !== 1 || activities[0].gameId !== req.gameId) {
    errors.push(`Il faut exactement une activité pour le jeu "${req.gameId}".`);
  }
  for (const a of activities) errors.push(...checkActivity(a, allowed[a.gameId]));
  return errors;
}
