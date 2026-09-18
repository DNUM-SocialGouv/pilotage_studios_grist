# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Contenu roadmap** : `src/content/publicRoadmap.ts`  
> **Drawer guide** : `src/components/welcome/RoadmapGuideDrawer.tsx`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist : titre + pictogramme + **Roadmap en kanban** (Feedback · Backlog · En cours · Livré). Chaque carte roadmap propose **« Comment ça marche ? »** (drawer d’onboarding). La navigation des modules se fait via la **nav** (`WidgetNav`), pas une liste sur l’accueil.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| En-tête | Titre « Pilotage studios » + pictogramme `Factory` |
| Roadmap | Titre « Roadmap » + **kanban** : **Feedback** (placeholder CTA + liste `Retours`) · **Backlog** · **En cours** · **Livré** |
| Carte | Titre, badge statut produit (Fait / En cours / À venir / Plus tard), thème, résumé, actions |
| Comment ça marche ? | Ouvre un drawer SM (`RoadmapGuideDrawer`) avec lead, étapes (ou puces), lien optionnel vers l’écran (`pagePath`) — un guide par item. |
| GitHub | Liens « Discuter sur GitHub » (`target=_blank`) si `issueUrl` |
| Nav | `WidgetNav` : Accueil icône home ; **Budget** / **Outils** en menus |
| Layout | Panneau large (`welcome-page__panel--wide`) pour 4 colonnes |
| Fallback | Route `*` → redirection vers `/` |

## Données Grist

Roadmap / guides : **versionnés dans le code**. Colonne Feedback : lecture `Retours` (allowlist) après boot Grist ; message d’erreur visible si la lecture échoue.

## Hors scope

- Contenu marketing / branding Marianne
- Liste de modules / raccourcis sur l’accueil (retirée — doublon nav + roadmap)
- Sync automatique table `Retours` → roadmap
- Jargon technique (allowlist, ACL, fetchTable) dans les libellés publics
- Drawer unique par thème (V1 = un drawer par carte kanban)
- Édition live des guides, analytics, tutoriel multi-étapes
- Drag-and-drop / déplacement de cartes dans le widget
