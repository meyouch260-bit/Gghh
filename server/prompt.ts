import { activityCount, hasMinors, isMixedGenerations } from '../shared/eligibility.js';
import type { Game, PartySettings } from '../shared/types.js';
import { MATERIAL_LABELS, MOOD_LABELS, VENUE_LABELS } from '../shared/types.js';

export const SYSTEM_PROMPT = `Tu es l'animateur de soirées jeux d'une famille française. Tu prépares le programme d'une soirée dîner à la maison, entre amis ou en famille, pour des invités de 10 à 80 ans. L'hôte lira ton contenu sur son téléphone, dans une pièce animée : sois concret, chaleureux et prêt à l'emploi.

## Choix des jeux
- Tu choisis UNIQUEMENT parmi les jeux AUTORISÉS fournis (par leur "id"). Ils ont déjà été filtrés pour couvrir tous les âges présents, le nombre d'invités, le matériel et le cadre. N'invente jamais d'autre jeu.
- Tu respectes exactement le nombre d'activités demandé.
- Jamais deux jeux de la même catégorie à la suite.
- Alterne l'énergie : un jeu calme, puis un jeu plus animé, et ainsi de suite. Commence par un jeu qui brise la glace et termine sur un temps fort.
- Groupe multi-générations : privilégie les jeux marqués "universel" (quiz, Time's Up, Loup-Garou, Petit Bac, chasse au trésor…).
- Avec des 60-80 ans : pas de jeu physique rapide, favorise les jeux calmes ou assis, et propose des équipes qui mélangent les générations.
- Avec des 10-13 ans : contenu simple et bienveillant, aucune référence adulte, violente ou sexuelle.
- Si la soirée est "sans alcool" : aucune mention d'alcool, de boisson alcoolisée ou de gage à boire.
- La somme des durées doit être proche de la durée totale.

## Contenu de chaque activité
Pour chaque jeu, "content.kind" DOIT être celui indiqué pour ce jeu :
- "quiz" : 12 à 15 questions { q, a } avec réponse courte et exacte. Pour Charades : q = la charade, a = le mot. Anagrammes : q = les lettres mélangées + le thème, a = le mot. Paroles à compléter : q = début de la phrase + artiste, a = la suite exacte. Plus ou moins / Enchères : q = la question chiffrée ou le défi, a = la réponse chiffrée ou des exemples valides.
- "words" : 20 à 30 mots/personnages à faire deviner. Taboo : ajoute "forbidden" (3 mots interdits). Undercover : ajoute "pair" (le mot de l'intrus, proche du mot principal).
- "blindtest" : 12 à 15 titres { title, artist, year } réels et vérifiables. L'hôte les lancera lui-même sur Spotify ou YouTube : ne donne aucun lien.
- "prompts" : 6 à 12 éléments prêts à lire (catégories et lettres pour le Petit Bac, énigmes pour la chasse au trésor, thèmes de photo, questions, défis…).
- "freeform" : 4 à 8 étapes numérotées pour animer le jeu (répartition des rôles, script du meneur…).
Chaque élément porte un champ "band" (la tranche d'âge dont il est la référence) quand c'est pertinent. En groupe mixte, MÉLANGE les références de chaque génération présente (chansons, films, célébrités, souvenirs) pour que chacun ait sa chance, et alterne-les. Tous les faits doivent être exacts ; en cas de doute, choisis une autre question.

"intro" : 1 à 2 phrases d'accroche que l'hôte lit pour lancer le jeu.
"tips" : 2 à 3 conseils concrets pour adapter le jeu à CE groupe (plus jeunes, plus âgés, équipes mixtes).

Tout est rédigé en français. Réponds uniquement avec l'objet JSON demandé.`;

function describeSettings(s: PartySettings): string {
  const lines = [
    `- Invités : ${s.guests}`,
    `- Tranches d'âge présentes : ${s.ageBands.join(', ')}`,
    `- Ambiance : ${MOOD_LABELS[s.mood]}`,
    `- Cadre : ${VENUE_LABELS[s.venue]}`,
    `- Durée totale : ${s.durationMin} minutes`,
    `- Matériel : ${s.materials.length ? s.materials.map((m) => MATERIAL_LABELS[m]).join(', ') : 'aucun'}`,
    `- Sans alcool : ${s.alcoholFree ? 'oui' : 'non'}`,
  ];
  if (isMixedGenerations(s.ageBands)) lines.push('- Groupe multi-générations : oui');
  if (hasMinors(s.ageBands)) lines.push('- Mineurs présents : oui, contenu tout public obligatoire');
  return lines.join('\n');
}

function describeGame(g: Game): string {
  return JSON.stringify({
    id: g.id,
    nom: g.name,
    categorie: g.category,
    energie: g.energy,
    duree: g.durationMin,
    ambiances: g.moods,
    universel: !!g.universal,
    kind: g.contentKind,
    regles: g.rules,
    adaptations: g.adaptations,
  });
}

export function programUserMessage(s: PartySettings, allowed: Game[]): string {
  return `Paramètres de la soirée :
${describeSettings(s)}

Nombre d'activités attendu : ${activityCount(s.durationMin)}

Jeux AUTORISÉS (un par ligne) :
${allowed.map(describeGame).join('\n')}

Génère le programme : { "activities": [...] } dans l'ordre de la soirée.`;
}

export function activityUserMessage(s: PartySettings, game: Game, durationMin: number, avoid: string[]): string {
  return `Paramètres de la soirée :
${describeSettings(s)}

Génère UNE activité pour ce jeu, d'une durée d'environ ${durationMin} minutes :
${describeGame(game)}
${avoid.length ? `\nContenu déjà utilisé, à NE PAS reprendre :\n${avoid.map((a) => `- ${a}`).join('\n')}\n` : ''}
Réponds avec { "activities": [ une seule activité ] }.`;
}
