# 🎲 Soirée Jeux

Web app mobile-first qui génère un programme d'activités pour une soirée dîner entre amis ou en famille, pour tous les âges (10 à 80 ans). Interface en français, thème sombre chaleureux, mode gros caractères.

- **Formulaire** : nombre de joueurs, tranches d'âge (multi-sélection), ambiance (chill, festive, compétitive, intello, nostalgie, **entre couples**), cadre, durée, matériel, « sans alcool » (auto si 10-17 ans), gros caractères.
- **Programme IA** : 4 à 6 activités choisies parmi les 53 jeux de la bibliothèque (50 de base + 3 « entre couples »), avec contenu prêt à l'emploi (questions, mots à mimer, titres de blind test…) adapté aux générations présentes.
- **Équipes** : prénoms (seul ou en couple), tirage équilibré 2 à 4 équipes, « mixer les générations », « une équipe par couple » ou « séparer les couples », re-tirage.
- **Scores** : points par équipe après chaque activité, classement en direct, écran final.
- **Pendant le jeu** : chrono avec bip et vibration, écran qui reste allumé, carte « mot secret » à faire passer.
- **Avant la soirée** : liste « À préparer » (matériel et accessoires du programme, à cocher), programme à copier pour WhatsApp.
- **Régénérer** le contenu d'une activité ou **changer de jeu**.
- **Catalogue** des 53 jeux, filtrable par âge, énergie et ambiance.

## Lancer en local

Prérequis : Node.js 20.19+ (ou 22+).

```bash
npm install
cp .env.example .env.local   # puis renseigner ANTHROPIC_API_KEY
npm run dev                  # http://localhost:5173 (et sur le réseau local pour tester au téléphone)
```

`npm run dev` sert aussi l'API `/api/generate` (middleware Vite qui exécute le même code que la fonction Vercel) : pas besoin de la CLI Vercel.

**Sans clé API**, l'app fonctionne en **mode démo** : le programme est composé localement par un planificateur heuristique avec du contenu d'exemple. Pratique pour développer l'interface.

Autres commandes :

```bash
npm test           # tests unitaires (Vitest) : bibliothèque, éligibilité, planificateur
npm run typecheck  # vérification TypeScript
npm run build      # build de production dans dist/
```

## Déployer sur Vercel

1. Poussez le dépôt sur GitHub puis importez-le sur [vercel.com/new](https://vercel.com/new). Vercel détecte Vite automatiquement (build `npm run build`, sortie `dist`).
2. Dans **Settings → Environment Variables**, ajoutez :
   - `ANTHROPIC_API_KEY` : votre clé (jamais exposée au navigateur) ;
   - `ANTHROPIC_MODEL` *(optionnel)* : par défaut `claude-sonnet-4-6`.
3. Déployez. La fonction `api/generate.ts` est servie sur `/api/generate` (durée max 120 s, voir `vercel.json`).

En CLI : `npm i -g vercel && vercel` puis `vercel env add ANTHROPIC_API_KEY` et `vercel --prod`.

## Publier comme page claude.ai (sans serveur)

```bash
npm run build:artifact   # -> dist-artifact/soiree-jeux.html (JS et CSS inlinés)
```

Publiée comme page claude.ai avec la capacité `sample`, l'app n'a pas besoin de fonction serveur : le programme est demandé à Claude **via le compte de la personne qui ouvre la page** (autorisation demandée au premier usage). Même prompt, même validation métier et même retry que la fonction Vercel (`src/services/claudeSample.ts`). Si l'autorisation est refusée, l'app passe en mode démo.

Ordre de repli côté client : `/api/generate` (Vercel) → Claude via la page claude.ai → mode démo.

## Architecture

```
api/generate.ts        Fonction serverless Vercel (fine enveloppe)
server/
  generate.ts          Validation requête, filtre des jeux, appel Claude, validation métier, 1 retry
  prompt.ts            Prompt système et messages utilisateur
  validate.ts          Contrôles du contenu (bon type, nombre d'éléments)
  demo.ts              Contenu de démonstration (sans clé API)
shared/                Code commun client/serveur, sans dépendance au rendu
  types.ts             Types du domaine : Party, Player, Team, ScoreEntry, Activity, Game…
  schema.ts            Schémas Zod : requête et sortie structurée de l'IA
  eligibility.ts       Règle centrale : un jeu doit couvrir TOUS les âges choisis
  planner.ts           Planificateur heuristique (mode démo)
data/games.ts          Les 53 jeux typés (règles, adaptations, énergie, ambiances…)
src/
  state/               Store (reducer + actions + sélecteurs), persistance via services/sync
  services/            api, teams (tirage), sync (localStorage), ids (code soirée)
  screens/ components/ Rendu React + Tailwind
tests/                 Tests Vitest
```

### Génération par l'IA

1. Le serveur filtre les jeux **éligibles** (âges, nombre de joueurs, matériel, cadre, pas de jeu physique avec des 60-80 ans). Seule cette liste est envoyée au modèle : il ne peut pas choisir un jeu hors tranche d'âge.
2. Claude répond en **sortie structurée JSON** (schéma Zod via `zodOutputFormat`).
3. Le serveur **revalide** : 4 à 6 activités selon la durée, ids autorisés, pas deux catégories identiques de suite, bon type de contenu et quantité suffisante. En cas d'échec, **un retry** renvoie les erreurs au modèle pour correction.

## Étape 2 (préparée, non implémentée)

Soirée multi-téléphones avec Supabase Realtime :

- `Party.code` est déjà généré (4 lettres) pour que les invités rejoignent la soirée.
- `src/services/sync.ts` expose l'interface `PartySync` (`load` / `save` / `subscribe`). Il suffira d'ajouter une implémentation Supabase (table `parties`, canal Realtime par code) et de la passer à `<StoreProvider sync={...}>` ; le store dispatche déjà `SYNC_PARTY` sur les changements distants.
- `WordItem.secret` marque les mots à n'afficher que sur le téléphone du joueur concerné (mime, Time's Up) ; côté serveur, il faudra alors ne diffuser le mot qu'au joueur actif (canal privé ou RLS par `player_id`).
- L'état est un agrégat sérialisable unique (`Party`) : soirée, joueurs, équipes, scores, activités, séparé du rendu.
