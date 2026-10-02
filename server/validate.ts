import { checkProgram } from '../shared/eligibility.js';
import type { AiActivity, GenerateRequest } from '../shared/schema.js';
import type { ContentKind, Game } from '../shared/types.js';

const MIN_ITEMS: Record<ContentKind, number> = {
  quiz: 8,
  words: 12,
  blindtest: 8,
  prompts: 4,
  freeform: 3,
};

function itemCount(a: AiActivity): number {
  const c = a.content;
  switch (c.kind) {
    case 'quiz':
      return c.questions.length;
    case 'words':
      return c.items.length;
    case 'blindtest':
      return c.tracks.length;
    case 'prompts':
      return c.items.length;
    case 'freeform':
      return c.steps.length;
  }
}

/** Vérifie le contenu d'une activité par rapport à la fiche du jeu. */
export function checkActivity(a: AiActivity, game: Game | undefined): string[] {
  if (!game) return [`Jeu inconnu : ${a.gameId}.`];
  const errors: string[] = [];
  if (a.content.kind !== game.contentKind) {
    errors.push(`${game.id} : content.kind doit être "${game.contentKind}" (reçu "${a.content.kind}").`);
  } else if (itemCount(a) < MIN_ITEMS[game.contentKind]) {
    errors.push(`${game.id} : au moins ${MIN_ITEMS[game.contentKind]} éléments attendus (reçu ${itemCount(a)}).`);
  }
  if (!a.intro.trim()) errors.push(`${game.id} : intro vide.`);
  return errors;
}

/** Toutes les règles métier d'une réponse de l'IA. Renvoie la liste des erreurs. */
export function validateResponse(req: GenerateRequest, activities: AiActivity[], allowed: Record<string, Game>): string[] {
  const errors: string[] = [];
  if (req.mode === 'program') {
    errors.push(...checkProgram(activities.map((a) => a.gameId), allowed, req.settings));
  } else if (activities.length !== 1 || activities[0].gameId !== req.gameId) {
    errors.push(`Il faut exactement une activité pour le jeu "${req.gameId}".`);
  }
  for (const a of activities) errors.push(...checkActivity(a, allowed[a.gameId]));
  return errors;
}
