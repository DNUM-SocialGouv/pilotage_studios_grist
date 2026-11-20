# Évaluation Assistant PARC — agrégats (ensemble du parc)

## En clair

On a posé **10 questions** sur le référentiel produits (Le PARC), avec le même principe que l’essai : d’abord une **fiche de faits**, puis une réponse rédigée par un modèle. **10/10** réponses sont jugées conformes aux oracles (valeurs Grist).

| | |
|--|--|
| Date | 2026-11-20 21:57 CET |
| Suite | `aggregate` |
| Document | `vjbmAgqvttQH` (Le PARC) |
| Outil faits | `parc_facts.resolve_parc_facts` (+ multi) |
| Modèle | `scaleway/deepseek-v4.1-flash` via **litellm** |
| PARC configuré | oui |
| Score auto | **10/10** |

## Plan de test (corpus)

Couverture : agrégats parc (moyenne RGAA, comptages, listes **JDMA** / **HDS**) + contrôle fiche produit (C2S).

| Id | Thème | Question | Oracle (Grist) |
|----|-------|----------|----------------|
| A1 | rgaa-moyenne-parc | Donne moi la moyenne des taux de RGAA renseigné sur l’ensemble du parc | Agrégat · moyenne ≈ 48,72 % sur 110 / 416 fiches avec taux renseigné |
| A2 | rgaa-moyenne-reformulation | Quelle est la moyenne du taux de conformité RGAA pour tous les produits qui l’ont renseigné ? | Même agrégat rgaa_mean · ~48,72 % |
| A3 | count-produits | Combien de produits y a-t-il dans Le PARC ? | 416 fiches Produits_DNUM |
| A4 | rgaa-count | Combien de produits ont un taux RGAA renseigné ? | 110 / 416 (~26 %) |
| A5 | jdma-count | Sur l’ensemble du parc, combien de produits sont sur Je Donne Mon Avis ? | 20 produits JDMA = oui |
| A6 | hds-count | Combien de produits sont HDS sur le parc ? | 5 produits HDS = oui |
| A7 | pca-count | Combien de produits sont inscrits au PCA dans Le PARC ? | 59 inscriptions PCA « oui » |
| A8 | non-agregat-produit | Quel est le taux RGAA de C2S ? Réponds en pourcentage. | Fiche C2S · 81 % — ne doit PAS basculer en agrégat |
| A9 | jdma-liste | liste moi les produits qui ont "Je Donne Mon Avis" | Liste des 20 produits JDMA=oui (pas une fiche isolée « LISTE ») |
| A10 | hds-liste | Quels sont les produits avec un environnement HDS ? | Liste des 5 produits HDS=oui |

## Résultats détaillés

### A1 — PASS

- **Question** : Donne moi la moyenne des taux de RGAA renseigné sur l’ensemble du parc
- **Oracle** : Agrégat · moyenne ≈ 48,72 % sur 110 / 416 fiches avec taux renseigné
- **Faits** : `agregat:rgaa_mean`
- **Mots-clés trouvés** : 48, %

**Réponse modèle**

**Moyenne des taux RGAA renseignés : 48,72 %**

- Fiches avec un taux RGAA renseigné : **110**
- Nombre total de produits du parc : **416**
- Fiches sans taux RGAA renseigné : **306**

Cette moyenne porte uniquement sur les fiches disposant d'un taux RGAA renseigné : le dénominateur est donc de 110 fiches, et non de 416. Les 306 fiches sans taux renseigné ne sont pas comptabilisées dans le calcul.

Source : Le PARC — agrégat « Taux de conformité RGAA » (lecture).

### A2 — PASS

- **Question** : Quelle est la moyenne du taux de conformité RGAA pour tous les produits qui l’ont renseigné ?
- **Oracle** : Même agrégat rgaa_mean · ~48,72 %
- **Faits** : `agregat:rgaa_mean`
- **Mots-clés trouvés** : 48, %

**Réponse modèle**

**Moyenne des taux RGAA renseignés : 48,72 %**

- Nombre de fiches avec un taux RGAA renseigné : **110**
- Nombre total de produits dans Le PARC : **416** (dont 306 sans taux renseigné)

La moyenne porte donc uniquement sur les **110 fiches renseignées**, et non sur l’ensemble des 416 produits.

Source : Le PARC — agrégat « Taux de conformité RGAA » (lecture).

### A3 — PASS

- **Question** : Combien de produits y a-t-il dans Le PARC ?
- **Oracle** : 416 fiches Produits_DNUM
- **Faits** : `agregat:count_products`
- **Mots-clés trouvés** : 416

**Réponse modèle**

Le PARC compte **416 produits** (nombre de fiches Produits_DNUM visibles).

Source : Le PARC — agrégat Produits_DNUM (lecture).

### A4 — PASS

- **Question** : Combien de produits ont un taux RGAA renseigné ?
- **Oracle** : 110 / 416 (~26 %)
- **Faits** : `agregat:rgaa_count`
- **Mots-clés trouvés** : 110

**Réponse modèle**

**110 produits sur 416** ont un taux RGAA renseigné, soit environ **26,4 %** (110/416).  
À l’inverse, **306 produits** n’ont pas de taux RGAA renseigné.

Source : Le PARC — agrégat RGAA (lecture).

### A5 — PASS

- **Question** : Sur l’ensemble du parc, combien de produits sont sur Je Donne Mon Avis ?
- **Oracle** : 20 produits JDMA = oui
- **Faits** : `agregat:jdma_count`
- **Mots-clés trouvés** : 20

**Réponse modèle**

Sur l’ensemble du parc, **20 produits sur 416** sont sur **Je Donne Mon Avis**, soit **4,81 %** du parc.  
Les autres (**396**) sont à « non » ou non renseignés.

Source : Le PARC — agrégat « Je Donne Mon Avis » (lecture).

### A6 — PASS

- **Question** : Combien de produits sont HDS sur le parc ?
- **Oracle** : 5 produits HDS = oui
- **Faits** : `agregat:hds_count`
- **Mots-clés trouvés** : 5

**Réponse modèle**

**5 produits** sont marqués HDS, sur un total de **416 produits** du parc, soit **1,2 %** du parc.

Source : Le PARC — agrégat HDS (lecture).

### A7 — PASS

- **Question** : Combien de produits sont inscrits au PCA dans Le PARC ?
- **Oracle** : 59 inscriptions PCA « oui »
- **Faits** : `agregat:pca_count`
- **Mots-clés trouvés** : 59

**Réponse modèle**

**59 produits** sont inscrits au PCA dans Le PARC, sur un total de **416 produits** référencés, soit **14,18 %** du parc.

- Indicateur : « Produits inscrits au PCA » (champ « Inscription au PCA » = oui)
- Dénominateur : 416 fiches produits

Source : Le PARC — agrégat « Inscription au PCA » (lecture).

### A8 — PASS

- **Question** : Quel est le taux RGAA de C2S ? Réponds en pourcentage.
- **Oracle** : Fiche C2S · 81 % — ne doit PAS basculer en agrégat
- **Faits** : `matched:C2S`
- **Mots-clés trouvés** : 81 %

**Réponse modèle**

Le taux de conformité RGAA de **C2S** est de **81 %** (ratio 0,81).

Source : Le PARC — Produits_DNUM (lecture), champ « RGAA - Taux de conformité ».

### A9 — PASS

- **Question** : liste moi les produits qui ont "Je Donne Mon Avis"
- **Oracle** : Liste des 20 produits JDMA=oui (pas une fiche isolée « LISTE »)
- **Faits** : `agregat:jdma_list`
- **Mots-clés trouvés** : 20, accolade, mandoline

**Réponse modèle**

D’après Le PARC (lecture), **20 produits sur 416** ont « Je Donne Mon Avis » = oui :

1. 1J1S
2. ACCOLADE
3. AIDES JEUNES
4. DACCORD
5. DACCORD 2
6. Démarches Chantier
7. Démarches Salariés Protégés
8. Demat.social
9. EGAPRO V1
10. EGAPRO V2
11. MANDOLINE
12. MARS - ELECTIONS PROFESSIONELLES
13. Monsuivisocial
14. PEGASE
15. PTT-Mes Démarches Travail
16. SI-Hono Site Web
17. SI-Honorabilité
18. SI-RC-2
19. TPE SI LISTE ELECTORALE
20. TPE-PORTAIL-INTERNET

Soit **20 produits concernés sur un total de 416** dans Le PARC.

### A10 — PASS

- **Question** : Quels sont les produits avec un environnement HDS ?
- **Oracle** : Liste des 5 produits HDS=oui
- **Faits** : `agregat:hds_list`
- **Mots-clés trouvés** : 5, hds

**Réponse modèle**

**Produits marqués HDS (hébergement de données de santé) dans Le PARC**

**5 produits** sur **416** au total sont indiqués avec un environnement HDS :

- AQUA-SISE
- HOPSYWEB
- HOPSYWEB-2
- SI-VSS
- TRANSPARENCE-SANTE

Source : Le PARC — liste HDS (lecture).

## Analyse

### Synthèse

- Score global : **10/10** (100 %).
- Thème **rgaa-moyenne-parc** : 1/1
- Thème **rgaa-moyenne-reformulation** : 1/1
- Thème **count-produits** : 1/1
- Thème **rgaa-count** : 1/1
- Thème **jdma-count** : 1/1
- Thème **hds-count** : 1/1
- Thème **pca-count** : 1/1
- Thème **non-agregat-produit** : 1/1
- Thème **jdma-liste** : 1/1
- Thème **hds-liste** : 1/1

Aucune erreur auto-détectée sur cette batterie. Relancer avec LiteLLM Onyxia avant de conclure en prod.

### Limites de cette eval

- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète.
- Un seul tour, température basse ; pas de multi-essais.
- Accès Viewer : certains champs peuvent manquer selon le compte API.

---

*Généré par `services/assistant-essai/run_parc_eval.py`.*
