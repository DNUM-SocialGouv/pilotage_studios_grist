# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Contenu roadmap** : `src/content/publicRoadmap.ts`  
> **Drawer guide** : `src/components/welcome/RoadmapGuideDrawer.tsx`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist : titre + pictogramme + **feuille de route en kanban** (Backlog · En cours · Livré). Chaque carte propose **« Comment ça marche ? »** (drawer d’onboarding). La navigation des modules se fait via la **nav** (`WidgetNav`), pas une liste sur l’accueil.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| En-tête | Titre « Pilotage studios » + pictogramme `Factory` |
| Feuille de route | Intro + CTA + **kanban** (`groupPublicRoadmapByKanban`) : colonnes gauche → droite **Backlog** (`next` + `later`) · **En cours** (`current`) · **Livré** (`done`) |
| Carte | Titre, badge statut produit (Fait / En cours / À venir / Plus tard), thème, résumé, actions |
| Comment ça marche ? | Ouvre un drawer SM (`RoadmapGuideDrawer`) avec lead, étapes (ou puces), lien optionnel vers l’écran (`pagePath`) — un guide par item. Pas de schéma (Mermaid hors scope V1 : package lourd). |
| GitHub | Liens « Discuter sur GitHub » (`target=_blank`) si `issueUrl` |
| Nav | `WidgetNav` : barre horizontale compacte même sous 62em (sinon DSFR empile en colonne hors Header) ; Accueil icône home ; **Budget** / **Outils** en menus ; hors nav : Analyse, Évaluations |
| Layout | Panneau large (`max-width` ~72rem) pour 3 colonnes |
| Fallback | Route `*` → redirection vers `/` |

## Données Grist

Aucune lecture dédiée : page statique (le provider PA peut charger en arrière-plan pour les autres écrans). La roadmap et les guides sont **versionnés dans le code** (pas de table Grist).

## Hors scope

- Contenu marketing / branding Marianne
- Liste de modules / raccourcis sur l’accueil (retirée — doublon nav + roadmap)
- Sync automatique table `Retours` → roadmap
- Jargon technique (allowlist, ACL, fetchTable) dans les libellés publics
- Drawer unique par thème (V1 = un drawer par carte kanban)
- Édition live des guides, analytics, tutoriel multi-étapes
- Drag-and-drop / déplacement de cartes dans le widget
