# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist. Présente le produit comme **en cours de réalisation** et liste les écrans accessibles avec leur statut.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| Message | Alert DSFR info « Produit en cours de réalisation » |
| Liste | Liens vers chaque module de `WIDGET_MODULE_LINKS` (nav hors Accueil) |
| Statuts | Disponible (PA, BDC) · À venir (stubs) · Hors scope widget (Analyse) |
| Nav | Entrée **Accueil** en tête de `WIDGET_NAV_LINKS` |
| Fallback | Route `*` → redirection vers `/` |

## Données Grist

Aucune lecture dédiée : page statique (le provider PA peut charger en arrière-plan pour les autres écrans).

## Hors scope

- Contenu marketing / branding Marianne
- Remplacement de la nav par cette seule liste
