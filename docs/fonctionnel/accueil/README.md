# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Contenu roadmap** : `src/content/publicRoadmap.ts`  
> **Drawer guide** : `src/components/welcome/RoadmapGuideDrawer.tsx`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist : titre + pictogramme + **feuille de route** en langage métier (priorités studio + liens issues GitHub). Chaque ligne propose **« Comment ça marche ? »** (drawer d’onboarding : texte + schéma). La navigation des modules se fait via la **nav** (`WidgetNav`), pas une liste sur l’accueil.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| En-tête | Titre « Pilotage studios » + pictogramme `Factory` |
| Feuille de route | Intro + items regroupés par **thèmes** (`PUBLIC_ROADMAP_THEMES` / `groupPublicRoadmapByTheme`) : Consulter le pilotage · Prestations · CRA · Intervenants et droits · Suite |
| Statuts | Fait / En cours / À venir / Plus tard |
| Comment ça marche ? | Ouvre un drawer SM (`RoadmapGuideDrawer`) avec lead, étapes et schéma HTML (`RoadmapFlowDiagram`) — un guide par item |
| GitHub | Liens « Discuter sur GitHub » (`target=_blank`) si `issueUrl` |
| Nav | Icône home (`fr-icon-home-4-line`) + libellé `fr-sr-only` « Accueil » ; entrée **Budget** (menu déroulant) ; Produits, Missions, Intervenants ; hors nav : Analyse, Évaluations |
| Layout | Bloc centré (`max-width` ~42rem) |
| Fallback | Route `*` → redirection vers `/` |

## Données Grist

Aucune lecture dédiée : page statique (le provider PA peut charger en arrière-plan pour les autres écrans). La roadmap et les guides sont **versionnés dans le code** (pas de table Grist).

## Hors scope

- Contenu marketing / branding Marianne
- Liste de modules / raccourcis sur l’accueil (retirée — doublon nav + roadmap)
- Sync automatique table `Retours` → roadmap
- Jargon technique (allowlist, ACL, fetchTable) dans les libellés publics
- Drawer unique par thème (V1 = un drawer par ligne roadmap)
- Édition live des guides, analytics, tutoriel multi-étapes
