# Évaluation Assistant PARC — rôle direction

## En clair

On a posé **6 questions** sur le référentiel produits (Le PARC), avec le même principe que l’essai : d’abord une **fiche de faits**, puis une réponse rédigée par un modèle. **6/6** réponses sont jugées conformes aux oracles (valeurs Grist).

| | |
|--|--|
| Date | 2026-11-20 22:10 CET |
| Suite | `role-direction` |
| Document | `vjbmAgqvttQH` (Le PARC) |
| Outil faits | `parc_facts.resolve_parc_facts` (+ multi) |
| Modèle | `scaleway/deepseek-v4.1-flash` via **litellm** |
| PARC configuré | oui |
| Score auto | **6/6** |

## Plan de test (corpus)

Couverture : **direction** — croisements HDS×obsolescence / HDS×criticité 1, couverture RGAA, snapshot risques, effectifs DIA.

| Id | Thème | Question | Oracle (Grist) |
|----|-------|----------|----------------|
| DIR1 | dir-hds-obsolete | Parmi les produits HDS du parc, lesquels sont aussi marqués obsolètes ? Liste les noms et le nombre. | 3 : AQUA-SISE, HOPSYWEB, SI-VSS (pas Transparence ni HOPSYWEB-2) |
| DIR2 | dir-hds-critique | Quels produits sont à la fois HDS et en criticité 1 (service critique) ? | AQUA-SISE · HOPSYWEB-2 |
| DIR3 | dir-rgaa-vs-couverture | Sur l’ensemble du parc : moyenne des taux RGAA renseignés, nombre de fiches avec taux, total de produits, et part app… | 48,72 % · 110 renseignés · 306 sans (~74 %) |
| DIR4 | dir-risque-triple | Pour le pilotage risques : combien de produits obsolètes, combien en criticité 1, combien HDS, et combien inscrits au… | 75 obs · 52 crit1 · 5 HDS · 59 PCA |
| DIR5 | dir-jdma-rgaa-qualite | Sur les produits Je Donne Mon Avis qui ont un taux RGAA, y en a-t-il avec un RGAA inférieur à 10 % ? Si oui, lesquels… | MANDOLINE ≈ 0,83 % dans la liste JDMA∩RGAA |
| DIR6 | dir-perimetre-dia | Compare les effectifs SDCID/DIA, SANTE et GPS : SDCID/DIA est-il le plus gros ? Donne les trois nombres. | Oui · DIA 108 > SANTE 57 > GPS 22 |

## Résultats détaillés

### DIR1 — PASS

- **Question** : Parmi les produits HDS du parc, lesquels sont aussi marqués obsolètes ? Liste les noms et le nombre.
- **Oracle** : 3 : AQUA-SISE, HOPSYWEB, SI-VSS (pas Transparence ni HOPSYWEB-2)
- **Faits** : `agregat:hds_obsolete_list`
- **Mots-clés trouvés** : aqua-sise, hopsyweb, si-vss

**Réponse modèle**

Parmi les **416 produits** du parc, **3** sont à la fois marqués **HDS** et **obsolètes** :

1. AQUA-SISE
2. HOPSYWEB
3. SI-VSS

(Croisement « HDS = oui » ET « Obsolescence = oui » ; aucun filtre département n’est appliqué ici.)

### DIR2 — PASS

- **Question** : Quels produits sont à la fois HDS et en criticité 1 (service critique) ?
- **Oracle** : AQUA-SISE · HOPSYWEB-2
- **Faits** : `agregat:hds_criticite1_list`
- **Mots-clés trouvés** : aqua-sise, hopsyweb-2

**Réponse modèle**

Deux produits du référentiel cumulent **HDS = oui** et **criticité 1 (service critique)** :

- **AQUA-SISE**
- **HOPSYWEB-2**

Ce croisement porte sur l’ensemble des **416 produits** du PARC ; **2** répondent aux deux critères.

### DIR3 — PASS

- **Question** : Sur l’ensemble du parc : moyenne des taux RGAA renseignés, nombre de fiches avec taux, total de produits, et part approximative de fiches encore sans taux RGAA.
- **Oracle** : 48,72 % · 110 renseignés · 306 sans (~74 %)
- **Faits** : `agregat:rgaa_mean`
- **Mots-clés trouvés** : 48, 110, 416

**Réponse modèle**

La moyenne des taux RGAA renseignés est de **48,72 %**. Elle est calculée uniquement sur les **110 fiches avec un taux RGAA renseigné**, et non sur l’ensemble du parc.

Le parc compte **416 produits**. **306 fiches** n’ont pas encore de taux RGAA, soit environ **73,6 %** du parc (306 / 416).

### DIR4 — PASS

- **Question** : Pour le pilotage risques : combien de produits obsolètes, combien en criticité 1, combien HDS, et combien inscrits au PCA ? Réponds avec les quatre chiffres clairement.
- **Oracle** : 75 obs · 52 crit1 · 5 HDS · 59 PCA
- **Faits** : `agregat:parc_risk_snapshot`
- **Mots-clés trouvés** : 75, 52, 5, 59

**Réponse modèle**

Sur les **416 produits** du PARC :

- **Obsolètes : 75**
- **En criticité 1 : 52**
- **HDS : 5**
- **Inscrits au PCA : 59**

### DIR5 — PASS

- **Question** : Sur les produits Je Donne Mon Avis qui ont un taux RGAA, y en a-t-il avec un RGAA inférieur à 10 % ? Si oui, lesquels et quel taux ?
- **Oracle** : MANDOLINE ≈ 0,83 % dans la liste JDMA∩RGAA
- **Faits** : `agregat:jdma_rgaa_list`
- **Mots-clés trouvés** : mandoline

**Réponse modèle**

Oui. Parmi les **14 produits « Je Donne Mon Avis » avec un taux RGAA renseigné** (sur 416 produits), **2** ont un taux inférieur à 10 % :

- **DACCORD 2** : **0,7 %** (ratio 0,007)
- **MANDOLINE** : **0,83 %** (ratio 0,0083)

Les autres produits listés ont tous un taux RGAA supérieur à 10 %.

### DIR6 — PASS

- **Question** : Compare les effectifs SDCID/DIA, SANTE et GPS : SDCID/DIA est-il le plus gros ? Donne les trois nombres.
- **Oracle** : Oui · DIA 108 > SANTE 57 > GPS 22
- **Faits** : `agregat:departments_compare`
- **Mots-clés trouvés** : 108

**Réponse modèle**

Oui, **SDCID/DIA est le plus gros** des trois départements comparés.

| Département | Nombre de produits |
|---|---|
| **SDCID/DIA** | **108** |
| SANTE | 57 |
| GPS | 22 |

SDCID/DIA compte près du double de SANTE (57) et environ cinq fois plus que GPS (22).

## Analyse

### Synthèse

- Score global : **6/6** (100 %).
- Thème **dir-hds-obsolete** : 1/1
- Thème **dir-hds-critique** : 1/1
- Thème **dir-rgaa-vs-couverture** : 1/1
- Thème **dir-risque-triple** : 1/1
- Thème **dir-jdma-rgaa-qualite** : 1/1
- Thème **dir-perimetre-dia** : 1/1

Aucune erreur auto-détectée sur cette batterie. Relancer avec LiteLLM Onyxia avant de conclure en prod.

### Limites de cette eval

- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète.
- Un seul tour, température basse ; pas de multi-essais.
- Accès Viewer : certains champs peuvent manquer selon le compte API.

---

*Généré par `services/assistant-essai/run_parc_eval.py`.*
