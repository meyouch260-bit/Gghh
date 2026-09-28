import { z } from 'zod';
import { AGE_BANDS, MATERIALS, MOODS, VENUES } from './types.js';

// ---------- Requête client -> /api/generate ----------

export const SettingsSchema = z.object({
  guests: z.number().int().min(2).max(40),
  ageBands: z.array(z.enum(AGE_BANDS)).min(1),
  mood: z.enum(MOODS),
  venue: z.enum(VENUES),
  durationMin: z.number().int().min(30).max(360),
  materials: z.array(z.enum(MATERIALS)),
  alcoholFree: z.boolean(),
  largeText: z.boolean(),
});

export const GenerateRequestSchema = z.discriminatedUnion('mode', [
  /** Programme complet. */
  z.object({ mode: z.literal('program'), settings: SettingsSchema }),
  /** Une seule activité : régénérer le même jeu ou le remplacer par un autre. */
  z.object({
    mode: z.literal('activity'),
    settings: SettingsSchema,
    gameId: z.string(),
    durationMin: z.number().int().min(5).max(90),
    /** Éléments déjà utilisés, à ne pas répéter lors d'une régénération. */
    avoid: z.array(z.string()).max(80).optional(),
  }),
]);
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// ---------- Sortie de l'IA (structured output) ----------

const Band = z.enum(AGE_BANDS);

export const ContentSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('quiz'),
    questions: z.array(z.object({ q: z.string(), a: z.string(), band: Band.optional() })),
  }),
  z.object({
    kind: z.literal('words'),
    items: z.array(
      z.object({
        word: z.string(),
        band: Band.optional(),
        forbidden: z.array(z.string()).optional(),
        pair: z.string().optional(),
      }),
    ),
  }),
  z.object({
    kind: z.literal('blindtest'),
    tracks: z.array(z.object({ title: z.string(), artist: z.string(), year: z.number().int(), band: Band.optional() })),
  }),
  z.object({ kind: z.literal('prompts'), items: z.array(z.string()) }),
  z.object({ kind: z.literal('freeform'), steps: z.array(z.string()) }),
]);

export const AiActivitySchema = z.object({
  gameId: z.string(),
  durationMin: z.number().int(),
  intro: z.string(),
  tips: z.array(z.string()),
  content: ContentSchema,
});
export type AiActivity = z.infer<typeof AiActivitySchema>;

export const AiProgramSchema = z.object({ activities: z.array(AiActivitySchema) });
export type AiProgram = z.infer<typeof AiProgramSchema>;

// ---------- Réponse /api/generate ----------

export type GenerateResponse =
  | { ok: true; activities: AiActivity[]; source: 'ai' | 'demo' }
  | { ok: false; error: string };
