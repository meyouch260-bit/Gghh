/**
 * Contenu de démonstration, utilisé quand aucune clé API n'est configurée.
 * Permet de tester toute l'app en local sans appeler Claude.
 */
import { planProgram, splitDuration } from '../shared/planner.js';
import type { AiActivity, GenerateRequest } from '../shared/schema.js';
import type { ActivityContent, Game, QuizItem, Track, WordItem } from '../shared/types.js';

const QUIZ: QuizItem[] = [
  { q: 'Quelle est la capitale du Canada ?', a: 'Ottawa', band: '14-17' },
  { q: 'Combien de pattes a une araignée ?', a: '8', band: '10-13' },
  { q: 'En quelle année l\'homme a-t-il marché sur la Lune ?', a: '1969', band: '60-80' },
  { q: 'Quel est le plus long fleuve de France ?', a: 'La Loire', band: '30-60' },
  { q: 'Quel personnage vit dans un ananas sous la mer ?', a: 'Bob l\'éponge', band: '18-30' },
  { q: 'Qui a peint La Joconde ?', a: 'Léonard de Vinci', band: '30-60' },
  { q: 'Quel est le plus grand océan du monde ?', a: 'Le Pacifique', band: '10-13' },
  { q: 'Quelle chanteuse a interprété « Non, je ne regrette rien » ?', a: 'Édith Piaf', band: '60-80' },
  { q: 'Comment s\'appelle l\'ours de la série « Bonne nuit les petits » ?', a: 'Nounours', band: '60-80' },
  { q: 'Dans quel jeu vidéo construit-on avec des blocs cubiques ?', a: 'Minecraft', band: '10-13' },
  { q: 'Quel pays a remporté la Coupe du monde de football 1998 ?', a: 'La France', band: '30-60' },
  { q: 'Combien y a-t-il de joueurs dans une équipe de rugby à XV ?', a: '15', band: '18-30' },
  { q: 'Quel légume, en plus de la tomate, trouve-t-on dans la ratatouille ? (un au choix)', a: 'Courgette, aubergine ou poivron', band: '30-60' },
];

const WORDS: WordItem[] = [
  { word: 'Astérix', band: '30-60' }, { word: 'Harry Potter', band: '18-30' }, { word: 'Un pingouin', band: '10-13' },
  { word: 'Charles de Gaulle', band: '60-80' }, { word: 'La tour Eiffel' }, { word: 'Pikachu', band: '14-17' },
  { word: 'Un parapluie' }, { word: 'Zinedine Zidane', band: '30-60' }, { word: 'Le Petit Prince', band: '60-80' },
  { word: 'Un astronaute' }, { word: 'Mickey Mouse' }, { word: 'Un 33 tours', band: '60-80' },
  { word: 'Spider-Man', band: '14-17' }, { word: 'Une baguette de pain' }, { word: 'Johnny Hallyday', band: '60-80' },
  { word: 'Un smartphone', band: '10-13' }, { word: 'Le père Noël' }, { word: 'Un kangourou' },
  { word: 'Les Bronzés', band: '30-60' }, { word: 'Une trottinette', band: '10-13' },
];

const TABOO: WordItem[] = [
  { word: 'Plage', forbidden: ['sable', 'mer', 'vacances'] },
  { word: 'Anniversaire', forbidden: ['gâteau', 'bougies', 'fête'] },
  { word: 'Téléphone', forbidden: ['appeler', 'portable', 'écran'] },
  { word: 'Pompier', forbidden: ['feu', 'camion', 'sauver'] },
  { word: 'Neige', forbidden: ['blanc', 'froid', 'ski'] },
  { word: 'Cinéma', forbidden: ['film', 'écran', 'popcorn'] },
  { word: 'Jardin', forbidden: ['fleurs', 'herbe', 'plantes'] },
  { word: 'Piano', forbidden: ['touches', 'musique', 'instrument'] },
  { word: 'Dentiste', forbidden: ['dents', 'carie', 'docteur'] },
  { word: 'Vélo', forbidden: ['roues', 'pédaler', 'Tour de France'] },
  { word: 'Pirate', forbidden: ['bateau', 'trésor', 'crochet'] },
  { word: 'Chocolat', forbidden: ['cacao', 'sucré', 'tablette'] },
];

const UNDERCOVER: WordItem[] = [
  { word: 'Chat', pair: 'Chien' }, { word: 'Plage', pair: 'Piscine' }, { word: 'Croissant', pair: 'Pain au chocolat' },
  { word: 'Guitare', pair: 'Violon' }, { word: 'Train', pair: 'Métro' }, { word: 'Hiver', pair: 'Automne' },
  { word: 'Pizza', pair: 'Tarte flambée' }, { word: 'Football', pair: 'Rugby' }, { word: 'Lune', pair: 'Soleil' },
  { word: 'Cinéma', pair: 'Théâtre' }, { word: 'Fraise', pair: 'Framboise' }, { word: 'Montagne', pair: 'Colline' },
];

const TRACKS: Track[] = [
  { title: 'La Bohème', artist: 'Charles Aznavour', year: 1965, band: '60-80' },
  { title: 'Les Champs-Élysées', artist: 'Joe Dassin', year: 1969, band: '60-80' },
  { title: 'Alexandrie Alexandra', artist: 'Claude François', year: 1978, band: '60-80' },
  { title: 'Billie Jean', artist: 'Michael Jackson', year: 1983, band: '30-60' },
  { title: 'Les Démons de minuit', artist: 'Images', year: 1986, band: '30-60' },
  { title: 'Wannabe', artist: 'Spice Girls', year: 1996, band: '30-60' },
  { title: 'Tourner dans le vide', artist: 'Indila', year: 2014, band: '18-30' },
  { title: 'Alors on danse', artist: 'Stromae', year: 2010, band: '18-30' },
  { title: 'Libérée, délivrée', artist: 'Anaïs Delva', year: 2013, band: '10-13' },
  { title: 'Djadja', artist: 'Aya Nakamura', year: 2018, band: '14-17' },
  { title: 'Bad Guy', artist: 'Billie Eilish', year: 2019, band: '14-17' },
  { title: 'Happy', artist: 'Pharrell Williams', year: 2013, band: '10-13' },
];

const QUIZ_BY_GAME: Record<string, QuizItem[]> = {
  charades: [
    { q: 'Mon premier miaule, mon second est le contraire de « tard ». Mon tout est la demeure d\'un roi.', a: 'Château (chat-tôt)' },
    { q: 'Mon premier est un rongeur, mon second est le contraire de « tard ». Mon tout sert au jardin.', a: 'Râteau (rat-tôt)' },
    { q: 'Mon premier miaule, mon second contient des fleurs. Mon tout se porte sur la tête.', a: 'Chapeau (chat-pot)' },
    { q: 'Mon premier se porte aux jambes, mon second est le contraire de « tard ». Mon tout flotte.', a: 'Bateau (bas-tôt)' },
    { q: 'Mon premier miaule, mon second s\'écrit avec des lettres. Mon tout vit dans le désert.', a: 'Chameau (chat-mot)' },
    { q: 'Mon premier est un petit légume vert et rond, mon second s\'entend. Mon tout nage.', a: 'Poisson (pois-son)' },
    { q: 'Mon premier est une petite étendue d\'eau, mon second est le contraire de « tard ». Mon tout est un outil.', a: 'Marteau (mare-tôt)' },
    { q: 'Mon premier est la moitié de « papa », mon second est un rongeur, mon troisième tombe du ciel. Mon tout nous abrite.', a: 'Parapluie (pa-rat-pluie)' },
  ],
  anagrammes: [
    { q: 'N I H C E (animal)', a: 'CHIEN' }, { q: 'R I P S A (ville)', a: 'PARIS' }, { q: 'M O P E M (fruit)', a: 'POMME' },
    { q: 'N O S M I A (lieu)', a: 'MAISON' }, { q: 'E G I N E (météo)', a: 'NEIGE' }, { q: 'R A J I N D (lieu)', a: 'JARDIN' },
    { q: 'T E A U A G (dessert)', a: 'GATEAU' }, { q: 'L E I O L S (ciel)', a: 'SOLEIL' }, { q: 'B L E T A (meuble)', a: 'TABLE' },
  ],
  'paroles-completer': [
    { q: '« Aux Champs-Élysées… » (Joe Dassin)', a: '« …au soleil, sous la pluie, à midi ou à minuit »', band: '60-80' },
    { q: '« Alors on… » (Stromae)', a: '« …danse »', band: '18-30' },
    { q: '« Libérée, délivrée… » (La Reine des neiges)', a: '« …je ne mentirai plus jamais »', band: '10-13' },
    { q: '« Non, rien de rien… » (Édith Piaf)', a: '« …non, je ne regrette rien »', band: '60-80' },
    { q: '« Il en faut peu pour être heureux… » (Le Livre de la jungle)', a: '« …vraiment très peu pour être heureux »', band: '30-60' },
    { q: '« Je te promets le sel au baiser de ma bouche… » (Johnny Hallyday)', a: '« …je te promets le miel à ma main qui te touche »', band: '30-60' },
    { q: '« Et si tu n\'existais pas… » (Joe Dassin)', a: '« …dis-moi pourquoi j\'existerais »', band: '60-80' },
    { q: '« Djadja, y\'a pas moyen… » (Aya Nakamura)', a: '« …Djadja »', band: '14-17' },
  ],
  'plus-ou-moins': [
    { q: 'Combien de marches pour monter au 2e étage de la tour Eiffel ?', a: '674' },
    { q: 'En quelle année est sortie la première Game Boy ?', a: '1989' },
    { q: 'Distance Paris-Marseille en voiture (km) ?', a: 'Environ 775 km' },
    { q: 'Combien d\'os dans le corps humain adulte ?', a: '206' },
    { q: 'En quelle année est sorti le premier iPhone ?', a: '2007' },
    { q: 'Hauteur du mont Blanc (m) ?', a: 'Environ 4 806 m' },
    { q: 'Combien de pays dans l\'Union européenne en 2024 ?', a: '27' },
    { q: 'Année de la première émission de télé en couleur en France ?', a: '1967' },
  ],
  'encheres-records': [
    { q: 'Citer des départements français', a: 'Ain, Aisne, Allier… (101 départements)' },
    { q: 'Citer des personnages Disney', a: 'Mickey, Simba, Elsa, Aladdin…' },
    { q: 'Citer des chansons de Johnny Hallyday', a: 'Allumer le feu, Que je t\'aime, Noir c\'est noir…' },
    { q: 'Citer des pays d\'Afrique', a: 'Maroc, Sénégal, Kenya, Égypte…' },
    { q: 'Citer des fromages français', a: 'Comté, Brie, Roquefort, Camembert…' },
    { q: 'Citer des sports olympiques', a: 'Natation, judo, escrime, athlétisme…' },
    { q: 'Citer des films avec Louis de Funès', a: 'La Grande Vadrouille, Rabbi Jacob, Le Corniaud…' },
    { q: 'Citer des Pokémon', a: 'Pikachu, Salamèche, Bulbizarre…' },
  ],
};

const DUO_SCENES: WordItem[] = [
  'Un rendez-vous chez le dentiste', 'Monter une tente sous la pluie', 'Un slow à un mariage', 'Faire les courses un samedi',
  'Promener un chien qui tire', 'Le premier rendez-vous au restaurant', 'Peindre un mur à deux', 'Un créneau difficile en voiture',
  'Une séance de cinéma avec un film qui fait peur', 'Préparer une crêpe et la faire sauter', 'Danser le rock', 'Monter un meuble en kit',
  'Prendre un selfie devant la tour Eiffel', 'Se réveiller en retard pour prendre l\'avion',
].map((word) => ({ word }));

const PROMPTS_BY_GAME: Record<string, string[]> = {
  'qui-de-nous-deux': ['Qui de vous deux cuisine le mieux ?', 'Qui est le plus bordélique ?', 'Qui a fait le premier pas ?', 'Qui chante le plus faux ?', 'Qui est toujours en retard ?', 'Qui pleure devant les films ?', 'Qui gagne les disputes ?', 'Qui a le plus mauvais sens de l\'orientation ?'],
  'quiz-des-couples': ['Quel est son plat préféré ?', 'Où vous êtes-vous rencontrés ?', 'Quel est son film culte ?', 'Quel métier rêvait-il ou elle de faire enfant ?', 'Quelle est sa plus grande manie ?', 'Quel pays rêve-t-il ou elle de visiter ?', 'Quelle est sa chanson préférée ?', 'Qu\'est-ce qui l\'énerve le plus ?'],
  'telephone-dessine': ['Un chat qui fait du ski', 'Mamie gagne au loto', 'Un dinosaure au restaurant', 'Le Père Noël en vacances à la plage', 'Un robot qui arrose ses fleurs', 'Une fusée en retard'],
  'quiz-invites': ['Quel était votre premier métier ou job d\'été ?', 'Quel est votre plat préféré ?', 'Quel pays rêvez-vous de visiter ?', 'Quel est votre surnom d\'enfance ?', 'Quel talent caché avez-vous ?', 'Quelle est votre plus grande peur ?'],
  'petit-bac': ['Catégories : Prénom, Animal, Pays, Métier, Fruit ou légume, Objet de la maison', 'Lettre 1 : B', 'Lettre 2 : M', 'Lettre 3 : C', 'Lettre 4 : P', 'Lettre 5 : S', 'Lettre bonus : L'],
  'cadavre-exquis': ['Case 1 : un sujet (« Le vieux marin »)', 'Case 2 : un adjectif', 'Case 3 : un verbe (« mange »)', 'Case 4 : un complément (« une tarte aux pommes »)', 'Case 5 : un lieu (« sur la Lune »)'],
  'mot-plus-long': ['Tirage 1 : E A R T S N I O L', 'Tirage 2 : U E M A C R T S I', 'Tirage 3 : O A P R E N T L S', 'Tirage 4 : I E A D R O G N S', 'Tirage 5 : A E U B L T R S I'],
  'qui-a-ecrit': ['Si vous étiez un animal, lequel seriez-vous ?', 'Votre plus grosse bêtise d\'enfance ?', 'Le super-pouvoir que vous aimeriez avoir ?', 'Votre plat de réconfort ?', 'Le lieu où vous aimeriez vivre ?', 'La chanson qui vous fait danser ?'],
  'ni-oui-ni-non': ['Tu aimes les frites ?', 'Tu es sûr ?', 'Tu as déjà vu la mer ?', 'C\'est ton premier tour ?', 'Tu veux arrêter ?', 'Tu t\'appelles bien comme ça ?'],
  'action-verite': ['Vérité : ton plus gros fou rire ?', 'Action : imite un animal pendant 10 secondes', 'Vérité : la chose la plus bizarre que tu as mangée ?', 'Action : chante le refrain d\'une chanson', 'Vérité : ton film préféré ?', 'Action : fais un compliment à chaque joueur'],
  'je-nai-jamais': ['Je n\'ai jamais pris l\'avion', 'Je n\'ai jamais dormi sous une tente', 'Je n\'ai jamais cassé un objet sans le dire', 'Je n\'ai jamais chanté au karaoké', 'Je n\'ai jamais vu un film d\'horreur jusqu\'au bout', 'Je n\'ai jamais fait de ski'],
  'chasse-tresor': ['Je te réchauffe le matin mais je ne suis pas le soleil (grille-pain)', 'J\'ai des dents mais je ne mords pas (peigne)', 'Je suis plein de trous mais je retiens l\'eau (éponge)', 'Plus je sèche, plus je suis mouillée (serviette)', 'J\'ai des aiguilles mais je ne couds pas (horloge)', 'Le trésor est là où l\'on garde le froid (frigo)'],
  'pyramide-gobelets': ['Défi 1 : pyramide de 10 gobelets à la main', 'Défi 2 : pyramide avec une seule main par joueur', 'Défi 3 : pyramide sans toucher les gobelets (élastique + ficelles)', 'Défi 4 : démonter la pyramide en soufflant'],
  'defi-photo': ['Pochette d\'album des années 80', 'Affiche de film d\'action', 'Photo de famille royale', 'Groupe de rock en tournée', 'Tableau célèbre recréé', 'Photo de classe'],
  degustation: ['Chocolat noir', 'Cannelle', 'Fraise', 'Comté', 'Menthe fraîche', 'Cornichon', 'Paprika'],
};

function contentFor(game: Game): ActivityContent {
  switch (game.contentKind) {
    case 'quiz':
      return { kind: 'quiz', questions: QUIZ_BY_GAME[game.id] ?? QUIZ };
    case 'words':
      return {
        kind: 'words',
        items: game.id === 'taboo' ? TABOO : game.id === 'undercover' ? UNDERCOVER : game.id === 'mime-en-duo' ? DUO_SCENES : WORDS,
      };
    case 'blindtest':
      return { kind: 'blindtest', tracks: TRACKS };
    case 'prompts':
      return { kind: 'prompts', items: PROMPTS_BY_GAME[game.id] ?? [...game.rules] };
    case 'freeform':
      return {
        kind: 'freeform',
        steps: [
          'Rassemblez tout le monde et formez les équipes mixtes.',
          ...game.rules,
          game.props ? `Matériel à préparer : ${game.props}.` : 'Annoncez le gagnant et enchaînez !',
        ],
      };
  }
}

function toActivity(game: Game, durationMin: number): AiActivity {
  return {
    gameId: game.id,
    durationMin,
    intro: `(Démo) On lance « ${game.name} » ! ${game.rules[0]}`,
    tips: [game.adaptations.younger, game.adaptations.older],
    content: contentFor(game),
  };
}

export function demoActivities(req: GenerateRequest, games: Game[]): AiActivity[] {
  if (req.mode === 'activity') return [toActivity(games[0], req.durationMin)];
  const plan = planProgram(games, req.settings);
  const durations = splitDuration(plan, req.settings.durationMin);
  return plan.map((g, i) => toActivity(g, durations[i]));
}
