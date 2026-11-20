# Évaluation Assistant PARC — rôle responsable de département

## En clair

On a posé **6 questions** sur le référentiel produits (Le PARC), avec le même principe que l’essai : d’abord une **fiche de faits**, puis une réponse rédigée par un modèle. **6/6** réponses sont jugées conformes aux oracles (valeurs Grist).

| | |
|--|--|
| Date | 2026-11-20 22:10 CET |
| Suite | `role-manager` |
| Document | `vjbmAgqvttQH` (Le PARC) |
| Outil faits | `parc_facts.resolve_parc_facts` (+ multi) |
| Modèle | `scaleway/deepseek-v4.1-flash` via **litellm** |
| PARC configuré | oui |
| Score auto | **6/6** |

## Plan de test (corpus)

Couverture : **responsable de département** — snapshots GPS/SANTE, JDMA∩RGAA, PCA, comparatif d’effectifs, part d’obsolètes.

| Id | Thème | Question | Oracle (Grist) |
|----|-------|----------|----------------|
| MGR1 | mgr-snapshot-gps | Fais-moi une synthèse / chiffres clés du département GPS : nombre de produits, obsolètes, JDMA, HDS, PCA, taux RGAA r… | Snapshot GPS · 22 · JDMA 6 · moyenne ~60 % · 0 HDS |
| MGR2 | mgr-jdma-rgaa-gps | Dans le département GPS, quels produits sont à la fois sur Je Donne Mon Avis et ont un taux RGAA renseigné ? Donne le… | 5 produits GPS JDMA∩RGAA (Accolade JDMA sans RGAA → hors liste) |
| MGR3 | mgr-snapshot-sante | État des lieux / chiffres clés du département SANTE : effectif, obsolètes, HDS (avec les noms s’ils sont peu nombreux… | Snapshot SANTE · 57 · 22 obs · 5 HDS nommés |
| MGR4 | mgr-compare-effectifs | Compare les effectifs produits des départements GPS, SANTE et SDCID/DIA : combien chacun, et lequel est le plus gros ? | DIA 108 > SANTE 57 > GPS 22 |
| MGR5 | mgr-pca-gps | Quels produits du département GPS sont inscrits au PCA ? S’il n’y en a que quelques-uns, liste-les. | SIAPADD · SISE-EAUX OROB · SI-Honorabilité |
| MGR6 | mgr-obs-vs-effectif-sante | Dans SANTE, quelle part des produits est obsolète ? Donne le nombre d’obsolètes, le total SANTE, et un ordre de grand… | 22/57 ≈ 39 % (pas 75 parc) |

## Résultats détaillés

### MGR1 — PASS

- **Question** : Fais-moi une synthèse / chiffres clés du département GPS : nombre de produits, obsolètes, JDMA, HDS, PCA, taux RGAA renseignés et moyenne RGAA.
- **Oracle** : Snapshot GPS · 22 · JDMA 6 · moyenne ~60 % · 0 HDS
- **Faits** : `agregat:department_snapshot`
- **Mots-clés trouvés** : 22

**Réponse modèle**

## Synthèse — département GPS

Périmètre : département **GPS**, soit **22 fiches** (filtre : département = GPS).

| Indicateur | Valeur |
|---|---|
| Produits du département | **22** |
| Produits obsolètes | **7** |
| Produits avec un JDMA | **6** |
| Produits hébergés HDS | **0** |
| Produits avec un PCA | **3** |
| Taux RGAA renseignés | **18 / 22** fiches |
| Moyenne RGAA | **60,23 %** (sur les 18 fiches renseignées) |
| Produits de criticité 1 | **3** |

**À retenir :**
- Aucun produit du département n'est déclaré hébergé en **HDS** (0 fiche).
- Le **RGAA** est renseigné pour 18 des 22 produits ; la moyenne s'établit à **60,23 %**.
- 7 produits sont **obsolètes**, 6 disposent d'un **JDMA** et 3 d'un **PCA**.

### MGR2 — PASS

- **Question** : Dans le département GPS, quels produits sont à la fois sur Je Donne Mon Avis et ont un taux RGAA renseigné ? Donne le nom et le pourcentage RGAA pour chacun.
- **Oracle** : 5 produits GPS JDMA∩RGAA (Accolade JDMA sans RGAA → hors liste)
- **Faits** : `agregat:jdma_rgaa_list`
- **Mots-clés trouvés** : mandoline, 1j1s, 85, 75

**Réponse modèle**

**Produits du département GPS présents sur Je Donne Mon Avis avec un taux RGAA renseigné**

Périmètre : département GPS, soit **22 fiches** dans ce périmètre (filtre « Département = GPS »). Sur ces 22 produits, **5** remplissent les deux conditions (JDMA = oui **et** taux RGAA renseigné) :

| Produit | Taux RGAA |
|---|---|
| 1J1S | 75 % |
| AIDES JEUNES | 75 % |
| MANDOLINE | 0,83 % |
| SI-Hono Site Web | 94 % |
| SI-Honorabilité | 85 % |

À noter : pour MANDOLINE, la valeur enregistrée est bien 0,83 % (ratio 0,0083), ce qui est très bas comparé aux autres produits de la liste — c'est la donnée telle qu'elle figure dans Le PARC, elle n'a pas été corrigée ici.

### MGR3 — PASS

- **Question** : État des lieux / chiffres clés du département SANTE : effectif, obsolètes, HDS (avec les noms s’ils sont peu nombreux), JDMA, PCA, moyenne RGAA si disponible.
- **Oracle** : Snapshot SANTE · 57 · 22 obs · 5 HDS nommés
- **Faits** : `agregat:department_snapshot`
- **Mots-clés trouvés** : 57, 22

**Réponse modèle**

## Synthèse du département SANTE

Périmètre : fiches dont le département est **SANTE** — **57 fiches** au total.

| Indicateur | Valeur |
|---|---|
| Effectif (produits du département) | **57** |
| Produits obsolètes | **22** |
| Produits HDS | **5** |
| Produits JDMA | **0** |
| Produits avec PCA | **12** |
| Produits de criticité 1 | **12** |
| Taux RGAA moyen | **33,58 %** (calculé sur **20** fiches où le RGAA est renseigné, sur 57) |

### Précisions

- **HDS (5 produits)** : AQUA-SISE, HOPSYWEB, HOPSYWEB-2, SI-VSS, TRANSPARENCE-SANTE.
- **JDMA** : aucun produit du département n'est marqué JDMA (0 sur 57).
- **RGAA** : la moyenne de **33,58 %** ne porte que sur les 20 fiches disposant d'un taux renseigné ; les 37 autres fiches du département n'ont pas de valeur RGAA dans Le PARC (elle n'est donc pas comptée comme 0 dans ce calcul).
- **Obsolètes** : 22 fiches sur 57 sont signalées comme obsolètes, soit un peu plus d'un tiers du département.

### MGR4 — PASS

- **Question** : Compare les effectifs produits des départements GPS, SANTE et SDCID/DIA : combien chacun, et lequel est le plus gros ?
- **Oracle** : DIA 108 > SANTE 57 > GPS 22
- **Faits** : `agregat:departments_compare`
- **Mots-clés trouvés** : 108, sdcid

**Réponse modèle**

Voici la comparaison des effectifs produits par département :

| Département | Nombre de produits |
|---|---|
| SDCID/DIA | 108 |
| SANTE | 57 |
| GPS | 22 |

**Le plus gros effectif est celui du département SDCID/DIA**, avec 108 produits — soit près du double de SANTE (57) et environ cinq fois celui de GPS (22).

### MGR5 — PASS

- **Question** : Quels produits du département GPS sont inscrits au PCA ? S’il n’y en a que quelques-uns, liste-les.
- **Oracle** : SIAPADD · SISE-EAUX OROB · SI-Honorabilité
- **Faits** : `agregat:pca_list`
- **Mots-clés trouvés** : siapadd, honorabilite, honorabilité

**Réponse modèle**

Dans le périmètre du département **GPS** (22 fiches recensées), **3 produits** sont inscrits au PCA :

- **SI-Honorabilité**
- **SIAPADD**
- **SISE-EAUX OROB**

Les 19 autres produits du département ne sont donc pas marqués comme inscrits au PCA dans Le PARC.

### MGR6 — PASS

- **Question** : Dans SANTE, quelle part des produits est obsolète ? Donne le nombre d’obsolètes, le total SANTE, et un ordre de grandeur en %.
- **Oracle** : 22/57 ≈ 39 % (pas 75 parc)
- **Faits** : `agregat:obsolescence_count`
- **Mots-clés trouvés** : 22, 57

**Réponse modèle**

Dans le périmètre **SANTE** (filtre sur le département = SANTE, soit **57 fiches** dans ce périmètre) :

- **Produits marqués obsolètes : 22**
- **Total de produits SANTE : 57**
- **Part : 38,6 %**, soit un ordre de grandeur d’**environ 4 produits sur 10** (un peu moins de 40 %).

Le calcul porte bien uniquement sur le département SANTE.

## Analyse

### Synthèse

- Score global : **6/6** (100 %).
- Thème **mgr-snapshot-gps** : 1/1
- Thème **mgr-jdma-rgaa-gps** : 1/1
- Thème **mgr-snapshot-sante** : 1/1
- Thème **mgr-compare-effectifs** : 1/1
- Thème **mgr-pca-gps** : 1/1
- Thème **mgr-obs-vs-effectif-sante** : 1/1

Aucune erreur auto-détectée sur cette batterie. Relancer avec LiteLLM Onyxia avant de conclure en prod.

### Limites de cette eval

- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète.
- Un seul tour, température basse ; pas de multi-essais.
- Accès Viewer : certains champs peuvent manquer selon le compte API.

---

*Généré par `services/assistant-essai/run_parc_eval.py`.*
