# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Contenu roadmap** : `src/content/publicRoadmap.ts`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist. Liste les écrans accessibles avec leur statut, et une **feuille de route** en langage métier (priorités studio + liens issues GitHub pour discuter).

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| Liste modules | Liens plats vers chaque module de `WIDGET_MODULE_LINKS` (hors Accueil ; le regroupement Budget n’apparaît pas ici) |
| Statuts modules | En cours (PA, BDC, Missions) · À venir (stubs) |
| Feuille de route | Intro + liste ordonnée (`PUBLIC_ROADMAP_ITEMS`) : Fait / En cours / À venir / Plus tard ; liens « Discuter sur GitHub » (`target=_blank`) |
| Nav | Icône home (`fr-icon-home-4-line`) + libellé `fr-sr-only` « Accueil » ; entrée **Budget** (menu déroulant) ; Produits, Missions, Intervenants ; hors nav : Analyse, Évaluations |
| Layout | Bloc centré (`max-width` ~42rem) : modules + pictogramme `Factory` + section roadmap |
| Fallback | Route `*` → redirection vers `/` |

## Données Grist

Aucune lecture dédiée : page statique (le provider PA peut charger en arrière-plan pour les autres écrans). La roadmap est **versionnée dans le code** (pas de table Grist).

## Hors scope

- Contenu marketing / branding Marianne
- Remplacement de la nav par cette seule liste
- Sync automatique table `Retours` → roadmap
- Jargon technique (allowlist, ACL, fetchTable) dans les libellés publics
