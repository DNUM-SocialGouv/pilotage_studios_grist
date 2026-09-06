# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist. Liste les écrans accessibles avec leur statut.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| Liste | Liens vers chaque module de `WIDGET_MODULE_LINKS` (nav hors Accueil) |
| Statuts | En cours (PA, BDC) · À venir (stubs) |
| Nav | Icône home (`fr-icon-home-4-line`) + libellé `fr-sr-only` « Accueil » ; hors nav : Analyse, Évaluations |
| Layout | Bloc centré (`max-width` ~42rem) : texte + pictogramme `Factory` |
| Fallback | Route `*` → redirection vers `/` |

## Données Grist

Aucune lecture dédiée : page statique (le provider PA peut charger en arrière-plan pour les autres écrans).

## Hors scope

- Contenu marketing / branding Marianne
- Remplacement de la nav par cette seule liste
