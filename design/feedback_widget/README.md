# Handoff : Widget de feedback (Pilotage studios SDPC)

## Vue d'ensemble
Widget de retour utilisateur pour l'application **Pilotage studios SDPC**. Un bouton flottant fixe, en bas à droite de chaque écran, ouvre un panneau permettant à l'utilisateur de signaler une **anomalie**, proposer une **suggestion** ou poser une **question**. Chaque retour est enregistré dans une table **Grist**, avec l'identité de l'utilisateur reprise automatiquement de sa connexion Grist.

## À propos des fichiers de design
Le fichier `FeedbackWidget.dc.html` de ce bundle est une **référence de design réalisée en HTML** — un prototype qui montre l'apparence et le comportement attendus, **pas du code de production à copier tel quel**. La tâche consiste à **recréer ce design dans l'environnement du codebase cible** (l'app est un ensemble de widgets Grist ; voir ci-dessous) en réutilisant ses patterns établis — notamment le **Système de Design de l'État (DSFR)**, déjà utilisé.

Le prototype embarque un faux fond de page (`aria-hidden`, opacité réduite) uniquement pour situer le widget en contexte. **Seul le widget flottant** (bouton + panneau) doit être implémenté.

## Fidélité
**Haute fidélité (hifi)** — couleurs, typographie, espacements et interactions sont ceux du DSFR. Recréer l'UI fidèlement en s'appuyant sur les composants DSFR existants (`fr-btn`, `fr-input`, `fr-select`, `fr-checkbox-group`, tokens `--background-*` / `--text-*` / `--border-*`).

## Contexte technique de l'app
- **Stack** : widgets Grist (voir `github.md` du projet — repo `DNUM-SocialGouv/pilotage_studios`, dossier `design/`). Chaque écran est un widget HTML/JS chargé dans Grist.
- **API Grist côté widget** : `grist.ready()`, puis accès aux données/identité via l'API widget Grist (`grist.docApi`, `grist.getTable(...)`).
- **Identité utilisateur** : à récupérer via l'accès Grist. Deux voies possibles :
  1. `grist.docApi.getAccessToken()` / les infos de session exposées par Grist ;
  2. à défaut, une colonne/table Grist listant l'utilisateur courant.
  Le nom (et l'email si disponible) alimentent les champs `userName` / `userEmail` du widget — **non saisis par l'utilisateur, affichés en lecture seule**.

## Écran / Vue

### Bouton flottant
- **Position** : `position:fixed; right:24px; bottom:24px; z-index:1000`.
- **Forme** : pilule arrondie (`border-radius:999px`), fond `--background-action-high-blue-france`, texte blanc.
- **Contenu** : icône « bulle de dialogue » (SVG, 20×20, `stroke:currentColor`, stroke-width 2) + libellé « Un retour ? ».
- **Padding** : `.7rem 1.15rem` ; **gap** icône/texte `.55rem` ; **font** `.95rem`, weight 500.
- **Ombre** : `0 6px 20px rgba(0,0,60,.28)`.
- **Comportement** : bascule l'ouverture du panneau ; `aria-expanded` reflète l'état ; `aria-label="Donner un retour"`.

### Panneau de feedback
- **Position** : `position:fixed; right:24px; bottom:92px; z-index:1001` (ancré au-dessus du bouton).
- **Taille** : `width:min(400px, calc(100vw - 32px))` ; `max-height:calc(100vh - 132px)` ; `overflow:auto`.
- **Boîte** : fond `--background-default-grey`, bordure `1px solid --border-default-grey`, `border-radius:8px`, ombre `0 12px 40px rgba(0,0,20,.22)`.
- **Animation d'ouverture** : `fbw-pop .16s ease-out` — `opacity 0→1`, `translateY(12px)→0`, `scale(.98)→1`.
- **En-tête** : titre « Un retour à partager ? » (`h2`, `font-size:1.15rem`) + sous-titre gris (`--text-mention-grey`, `fr-text--sm`) + bouton fermer (croix SVG, `aria-label="Fermer"`).

#### Champs du formulaire (dans l'ordre)
1. **Type de retour** — `fieldset` + 3 boutons segmentés (`Anomalie` / `Suggestion` / `Question`), grille `1fr 1fr 1fr`, gap `.5rem`. Bouton actif : fond bleu France + texte blanc + bordure bleue ; inactif : fond blanc, bordure grise, texte `--text-default-grey`. `aria-pressed` sur chaque bouton. Radius 6px, font `.82rem` weight 500.
2. **Page concernée** — `fr-select`, pré-remplie avec la page courante. Options : `Accueil, BDC, PA, Produits, Missions, Intervenants, CRA, PV, Évaluations, Analyse, Autre` (à aligner sur la nav réelle de l'app).
3. **Votre message** — `fr-input` `textarea` (4 lignes, `resize:vertical`), **obligatoire** (astérisque rouge `--text-default-error`). Texte d'aide (`fr-hint-text`) qui **change selon le type** :
   - Anomalie : « Ce qui s'est passé, ce que vous attendiez, comment le reproduire. »
   - Suggestion : « L'amélioration proposée et le besoin auquel elle répond. »
   - Question : « Votre question sur l'outil ou une donnée. »
   - Placeholder : « Décrivez le problème, l'idée ou la question… »
4. **Niveau de gêne** — `fr-select`, **visible uniquement si type = Anomalie**. Options : `Bloquant — je ne peux pas continuer` / `Gênant — contournement possible` / `Mineur — cosmétique / confort`.
5. **Ligne identité** (lecture seule) — icône « utilisateur » (15×15) + « Envoyé en tant que **{userName}** · via Grist ». Texte `.75rem`, gris ; nom en gras `--text-default-grey`. `line-height:1` sur ligne et texte pour aligner l'icône.
6. **Contexte technique** — `fr-checkbox-group`, coché par défaut. Libellé « Joindre le contexte technique » + hint « Page, navigateur et résolution — utile pour reproduire une anomalie. »

#### Actions
- **Annuler** (`fr-btn fr-btn--secondary`) — ferme le panneau.
- **Envoyer le retour** (`fr-btn`) — **désactivé tant que le message est vide** (`message.trim().length === 0`).
- Alignés à droite, gap `.5rem`.

### Écran de confirmation (après envoi)
- Remplace le formulaire dans le même panneau.
- Pastille ronde 56px, fond `--background-contrast-success`, coche SVG `--text-default-success`.
- Titre « Merci, c'est enregistré ! » + texte gris « Votre retour arrive dans le suivi de l'équipe studio. Vous serez informé·e si une suite y est donnée. »
- Boutons : **Fermer** (secondaire, sm) + **Un autre retour** (primaire, sm — réinitialise le formulaire).

## Interactions & comportement
- **Ouverture/fermeture** : le bouton bascule `open` ; la croix et « Annuler » ferment.
- **Type dynamique** : sélectionner un type met à jour le texte d'aide et affiche/masque le champ « Niveau de gêne ».
- **Validation** : bouton d'envoi désactivé si message vide (seul champ requis).
- **Envoi** : dans le prototype, passe à l'état `sent`. En production → écrire une ligne dans la table Grist (voir ci-dessous), puis afficher la confirmation. Gérer un état d'erreur (échec API Grist) avec message + possibilité de réessayer.
- **Réinitialisation** : « Un autre retour » remet `sent=false`, vide le message, remet le type à `Anomalie`.

## État (state)
```
open: boolean          // panneau ouvert
sent: boolean          // écran de confirmation affiché
type: 'Anomalie' | 'Suggestion' | 'Question'
page: string           // page concernée (pré-remplie)
message: string        // requis
niveau: string         // seulement si type = Anomalie
joinContext: boolean   // joindre le contexte technique
```
À ajouter en production : `sending` (spinner sur le bouton), `error` (échec d'écriture Grist).

## Enregistrement dans Grist — table `Retours`
Colonnes suggérées :

| Colonne | Type | Source |
|---|---|---|
| `Date` | DateTime | auto à l'envoi |
| `Auteur` | Text | identité Grist (userName) |
| `Email` | Text | identité Grist (userEmail) |
| `Type` | Choice | Anomalie / Suggestion / Question |
| `Page` | Text/Choice | champ « Page concernée » |
| `Message` | Text | champ message |
| `Niveau_gene` | Choice | si Anomalie |
| `Contexte_technique` | Text | URL + user-agent + résolution (si case cochée) |
| `Statut` | Choice | **Nouveau → À trier → Planifié → Fait → Écarté** |
| `Priorite` | Choice | Basse / Moyenne / Haute |
| `Assigne_a` | Ref | membre de l'équipe studio |
| `Lien_ticket` | Text | vers le backlog |
| `Reponse` | Text | retour fait à l'auteur |

Écriture côté widget (schéma) :
```js
await grist.getTable('Retours').create({ fields: {
  Date: new Date().toISOString(),
  Auteur: userName, Email: userEmail,
  Type: type, Page: page, Message: message,
  Niveau_gene: type === 'Anomalie' ? niveau : '',
  Contexte_technique: joinContext ? `${location.href} · ${navigator.userAgent} · ${screen.width}x${screen.height}` : '',
  Statut: 'Nouveau',
}});
```

## Suivi des feedbacks (propositions)
1. **Vue Kanban Grist** par `Statut` — tri visuel en réunion studio.
2. **Notification** : formule Grist / webhook postant chaque nouveau retour dans un canal (Tchap/Mattermost) ou par mail à l'équipe.
3. **Boucle de retour** : champ `Reponse` + mail auto quand le statut passe à *Fait/Écarté*, pour informer l'auteur (ce que promet l'écran de confirmation).

## Design tokens (DSFR)
- **Couleurs** : `--background-action-high-blue-france` (bouton), `--background-default-grey`, `--background-alt-grey`, `--border-default-grey`, `--text-default-grey`, `--text-mention-grey`, `--text-default-error`, `--background-contrast-success`, `--text-default-success`.
- **Rayons** : bouton flottant `999px` ; panneau `8px` ; champs / boutons de type `6px`.
- **Ombres** : bouton `0 6px 20px rgba(0,0,60,.28)` ; panneau `0 12px 40px rgba(0,0,20,.22)`.
- **Typo** : Marianne (police DSFR). Titre panneau `1.15rem` ; corps `fr-text--sm` (`.875rem`) ; mentions `fr-text--xs` / `.75rem` ; boutons de type `.82rem`.
- **Espacements** : padding panneau `1.25rem` ; gaps `.5rem` / `.55rem` ; classes utilitaires DSFR `fr-mb-2w`, `fr-mb-3w`.

## Assets
Aucun asset binaire. Icônes = SVG inline (bulle de dialogue, croix, utilisateur, coche). DSFR chargé via CDN dans le prototype (`@gouvfr/dsfr@1.13.1`) — en production, utiliser le DSFR déjà présent dans le codebase.

## Captures d'écran
Dans `screenshots/` :
- `01-formulaire-anomalie.png` — formulaire, type Anomalie (champ « Niveau de gêne » visible).
- `02-formulaire-suggestion.png` — formulaire, type Suggestion, message rempli.
- `03-confirmation.png` — écran de confirmation après envoi.

## Fichiers
- `FeedbackWidget.dc.html` — le prototype complet (widget + faux fond de démo). Toute la logique est dans le `<script data-dc-script>` en bas ; le markup entre `<x-dc>…</x-dc>`.
