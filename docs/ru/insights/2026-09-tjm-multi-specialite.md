# TJM : multi-spécialité et historique

| | |
|--|--|
| Date | 2026-09-25 |
| Auteurs / sources | Conception produit ; relecture attendue Design + Accessibilité |
| Liens | [Issue #86](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/86) · carte kanban `tjm-historique-multi-spe` |
| Statut | brouillon — décision CRA figé (A) actée ; relecture Design / Access. |

## En clair

Certains freelances ont **deux tarifs journaliers** selon le métier (ex. RU et
Accessibilité). On doit aussi pouvoir **baisser un tarif** sans fausser les
réalisations (CRA) déjà saisies.

## Faits observés

- Aujourd’hui : **un seul** tarif par fiche personne.
- Contournement constaté : **deux fiches** pour une même personne selon le métier
  (à éviter à long terme — double saisie, confusion).
- Les montants des CRA semblent suivre le tarif **actuel** de la fiche : une
  baisse risque de **réécrire le passé**.

## Hypothèses

- La bonne clé de distinction des tarifs est la **spécialité / métier**
  (RU, Accessibilité, Design…), pas une autre dimension.
- Une **grille** « personne × métier × période » est compréhensible pour Design
  et pour les Admin.
- Les utilisateurs préfèrent une **règle en une phrase** à un détail technique.

## Implications produit

- **Parcours** : peu d’écrans ; Admin change un tarif en ajoutant une période,
  sans écraser silencieusement.
- **Règle métier (une phrase)** : *cette personne, pour ce métier, à partir de
  telle date, facture tant*.
- **Accessibilité** : toute future UI de consultation / saisie des tarifs doit
  rester utilisable au clavier, avec libellés et erreurs clairs (critère de revue).

## Questions ouvertes

- _(aucune sur le figement CRA)_ **Décision [#86](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/86)** : choix **A — Figé** — un CRA déjà saisi garde son montant si le tarif change ensuite.

## Ne pas faire

- Coder avant relecture Design / Accessibilité.
- Multiplier les fiches personne comme solution pérenne.
- Coller des montants ou noms réels dans le dépôt public.
- Recalculer rétroactivement les CRA déjà saisis quand un TJM change (écarté).
