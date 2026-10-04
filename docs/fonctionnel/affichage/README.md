# Paramètres d’affichage (clair / sombre / système)

## En clair

Chaque personne peut choisir comment le widget s’affiche : **clair**, **sombre**, ou **comme sur son ordinateur / téléphone** (réglage système). Le choix se fait depuis le **menu compte** (avatar en haut à droite) → **Paramètres d’affichage**. Ce n’est **pas** un droit Admin : c’est un confort personnel, mémorisé dans le navigateur.

## Parcours

1. Ouvrir le menu compte (bouton avatar / icône compte).
2. Cliquer sur **Paramètres d’affichage**.
3. Dans la modale du design de l’État (DSFR) : choisir **Thème clair**, **Thème sombre** ou **Système**.
4. Fermer la modale — le choix reste pour les prochaines visites (même navigateur, même origine de l’iframe).

## Règles produit

| Règle | Détail |
|-------|--------|
| Placement | Menu compte uniquement (pas de page, pas d’entrée nav Budget / Outils) |
| Qui voit le bouton | Tous les profils qui voient le menu compte (y compris Invité) |
| Défaut | **Système** tant qu’aucun choix n’a été enregistré |
| Persistance | Navigateur (`localStorage` clé `scheme`) — **aucune** colonne Grist |
| Portée | Uniquement le widget (iframe) — ne change pas le thème de Grist parent |
| Droits `Page_*` | **N/A** — pas d’écran nav ni garde de route |

## Technique (agents)

| Élément | Emplacement |
|---------|-------------|
| Défaut color scheme | `src/main.tsx` — `startReactDsfr({ defaultColorScheme: "system" })` |
| Modale DSFR | `WidgetLayout` monte `Display` depuis `@codegouvfr/react-dsfr/Display/Display` (pas l’export déprécié qui renvoie `null`) |
| Bouton menu | `WidgetUserMenu` — `headerFooterDisplayItem` + classe DSFR `fr-btn--display` (icône + libellé « Paramètres d’affichage ») ; séparateur CSS avant l’entrée |
| Pas de Header / Footer Marianne | Rule widget-iframe |

## Limites V1

- Quelques zones encore « collées » au clair (drawers, Weekly, Feedback) peuvent paraître imparfaites en sombre — polissage éventuel en suite.
- Pas de sync avec le thème sombre éventuel de Grist parent.
