# Liste CRA

[← CRA](README.md) › **Liste**

> **Route** : `/cra`  
> **Nav** : Budget → Prestation / CRA

## Public et périmètre

- **Une ligne = une saisie CRA** (`Realise`).
- Lecture seule ; données via `useMissionsData` (lazy) + BDC déjà en contexte PA.
- Complète les vues par mission (fiche) et par BDC (onglet Dépenses).

## Filtres

| Filtre | Comportement |
|--------|--------------|
| Période | Select classique — clé `YYYY-MM`, libellé « Mois année » |
| Équipe | Select classique — valeurs distinctes de `Realise.Equipe` |
| Intervenant | Liste déroulante riche **recherchable** (1 choix) — Ref `Intervenants` |
| Produit | Liste déroulante riche **recherchable** (1 choix) — Ref produit SDPC |
| Bon de commande | Liste déroulante riche **recherchable** (1 choix) — `BDC_cible` sinon `Bdc_Chorus2` |

Filtres dans un **accordéon** (comme la liste missions), **combinables**. Lien **Réinitialiser les filtres** sous l’accordéon si au moins un filtre actif. Changement de filtre → page 1.

## Tableau

| Colonne | Source | Lien |
|---------|--------|------|
| Intervenant | `Intervenants` | — |
| Période | `Periode` | — |
| Équipe | `Equipe` | tag couleur |
| Jours | `Nb_jours` | — |
| Tâches | `Taches_realisees` | — |
| Produit | `Produit` | — (catalogue stub) |
| Mission | enfant / master | `/missions/:id` si master résolu |
| BDC | `BDC_cible` / `Bdc_Chorus2` | `/bdc/:id` |
| TTC | `Calcul_TTC` / `TTC` | montant EUR (peut être masqué par ACL Grist Owner) |

Tri défaut : période décroissante, puis id. Pagination **10** lignes.

## Récapitulatifs

- Compteur de plage (pagination) au-dessus du tableau
- Sous le tableau : **totaux filtrés** jours · TTC · nombre de lignes

## Hors périmètre (cette version)

- Création / modification (#33)
- Récap porteurs (#48)
- Rapprochement Malt
- Filtrage selon rôle utilisateur (droits serveur — [#47](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47), [#35](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/35))

## Issues

- [#32](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/32) — Suivre les CRA (ce parcours)
