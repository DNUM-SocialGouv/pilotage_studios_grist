# Contrat de chiffres — Assistant (prérequis #140–#142)

## En clair

Quand vous posez une question sur un **budget**, un **reste** ou des **jours**, l’assistant ne doit **pas inventer** le calcul : il lit le **même résultat** que l’écran Missions / BDC / Produits. Une règle simple : **un CRA compte seulement s’il est lié à une prestation**.

| | |
|--|--|
| **Statut** | Figé Plan A (2026-11-18) — relecture Owner avant implémentation outils |
| **Base de référence** | Test `iAEEspLuAiuP` |
| **Issues** | [#140](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/140) · [#141](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/141) · [#142](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/142) |
| **Suite** | Outils dans l’ordre 140 → 141 → 142 → [#143](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/143) · affichages [#144](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/144) et droits [#145](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/145) **après** le jeu de questions ci-dessous au vert |

---

## Décision centrale

Le modèle de langage **présente** le résultat d’un **outil métier**. Il **ne calcule pas** les montants ni les jours.

Si l’outil et le widget divergent → on corrige l’outil (ou le helper partagé), pas la phrase.

---

## Sources de vérité

| Domaine | Question type | Source (widget / code) | Filtre obligatoire |
|---------|---------------|------------------------|--------------------|
| **Mission** (#140) | Jours / TTC consommés, jours envisagés prestations | `aggregateCraByMissionId` / totaux fiche mission · somme `Prestations.Jours_envisages` du parent | `filterRealiseWithPrestation` ([`realisePrestation.ts`](../../../src/utils/realisePrestation.ts)) |
| **BDC** (#141) | Budget TTC, consommé CRA, solde | Colonnes fiche BDC : `Montant_TTC`, `Total_TTC_CRA`, `Solde_TTC_CRA` (affichage [`BdcDetailView`](../../../src/pages/BdcDetailView.tsx)) | En-tête = colonnes Grist BDC ; détail dépenses = `Realise` lié via `BDC_cible` / `Bdc_Chorus2` **et** prestation renseignée pour l’assistant |
| **Produit** (#142) | Infos catalogue + missions liées | Table `Tableau_de_pilotage_SDPC_Produits_SDPC` · missions `Produit_SDPC` = id produit | Lecture seule catalogue + liste missions |

### Hors-scope réponse (ne pas inventer)

- Forfait prestataire ([#36](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/36))
- Import Sofiane / CSV
- PV / évaluations
- SQL libre sur toute la base

---

## Règle CRA

> Un CRA compte seulement s’il est lié à une prestation.

- Helper : `realiseHasPrestation` / `filterRealiseWithPrestation`
- Registre orphelins (14 lignes ops exclues) : [`docs/tmp-suivi-nettoyage-missions-prestations.md`](../../tmp-suivi-nettoyage-missions-prestations.md) §G

**Écart documenté** : la fiche BDC peut encore afficher en dépenses des CRA liés au BDC **sans** prestation (historique). L’assistant **exclut** ces lignes des totaux qu’il annonce ; l’en-tête BDC (`Total_TTC_CRA` / `Solde_TTC_CRA`) reste la référence « comme à l’écran » pour #141.

---

## Cinq questions de référence (base test)

À rejouer sur `iAEEspLuAiuP` : attendu = MCP / fiche widget (arrondi € à 2 décimales, jours à 2 décimales).

| # | Question | Attendu (2026-11-18) | Vérif. |
|---|----------|----------------------|--------|
| Q1 | « Combien de jours CRA sur la mission *Réalisation du produit VAO* (id 469) ? » | **323,55** j (CRA avec prestation uniquement) | MCP + fiche mission |
| Q2 | « Quel TTC CRA sur la mission VAO (id 469) ? » | **≈ 308 060,85 €** | MCP + barre TTC mission |
| Q3 | « Sur le BDC *2025-2910D47 - Audit design VigieRH* (id 1) : budget, consommé, solde ? » | Budget **5 316,96 €** · Consommé **6 279 €** · Solde **−962,04 €** | Fiche `/bdc/1` |
| Q4 | « Quelles missions sont liées au produit ACCOLADE (id 7) ? » | **4** missions : ids 478, 532, 533, 542 (libellés : besoins FSUS · renfort dev · audit a11y · propositions d’amélioration) | `/produits/7` onglet Missions |
| Q5 | « Les CRA sans prestation comptent-ils dans les totaux mission ? » | **Non** — 14 lignes ops exclues ; règle `realiseHasPrestation` | Registre §G + tests unitaires |

Critère de vert outils : les 5 questions, posées via l’assistant branché outils, donnent les mêmes chiffres (tolérance 0,01 € / 0,01 j).

---

## Ordre d’implémentation après ce contrat

1. Outil mission (#140)  
2. Outil BDC (#141)  
3. Outil produit (#142)  
4. Contexte page (#143)  
5. Conception UX conversationnelle (ton, erreurs)  
6. Affichages riches (#144) et restriction droits (#145) **après** Q1–Q5 verts  

---

## Go / no-go conception chat (Phase 5 Plan A)

| Phase | Statut |
|-------|--------|
| 1 Suppressions B prod | Vert |
| 2 Orphelins + règle CRA | Vert |
| 3 Alignement base test | Vert (schéma + smoke MCP) |
| 4 Contrat de chiffres | Vert (cette fiche) |
| **Go conception conversationnelle** | **Oui** — sans #144 en V0 |

N/A kanban : ménage schéma / contrat doc (carte `assistant-pilotage` déjà en cours).
