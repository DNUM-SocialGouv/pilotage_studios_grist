# Évaluation Assistant PARC — résultats

## En clair

On a posé **12 questions** sur le référentiel produits (Le PARC), avec le même principe que l’essai : d’abord une **fiche de faits**, puis une réponse rédigée par un modèle. **12/12** réponses sont jugées conformes aux oracles (valeurs Grist).

| | |
|--|--|
| Date | 2026-11-20 21:19 CET |
| Suite | `explore` |
| Document | `vjbmAgqvttQH` (Le PARC) |
| Outil faits | `parc_facts.resolve_parc_facts` (+ multi) |
| Modèle | `scaleway/deepseek-v4.1-flash` via **litellm** |
| PARC configuré | oui |
| Score auto | **12/12** |

## Plan de test (corpus)

Couverture : besoins **DAT / DICT** (dont alias DAT, produits DATIA), comparaison multi-produits, RGAA en %, JDMA, volumétrie / prestataire, criticité saisonnière, support / PCA.

| Id | Thème | Question | Oracle (Grist) |
|----|-------|----------|----------------|
| E1 | dict-complet | Quels sont les besoins DICT (disponibilité, intégrité, confidentialité, traçabilité) d’Accolade ? | DICT Accolade : Dispo 2 · Intégrité 2 · Conf 2 · Traçab 3 |
| E2 | dat-alias | Pour Accolade, résume les besoins DAT : dis-moi clairement disponibilité et confidentialité. | DAT = DICT · Dispo « un jour » · Conf « restreintes » |
| E3 | dict-sensible | MANDOLINE : quel niveau de confidentialité DICT, et la traçabilité est-elle au niveau « opposabilité légale » ? | Conf niveau 4 · Traçabilité niveau 4 opposabilité légale |
| E4 | dict-comparaison | Entre Accolade et C2S, lequel a l’exigence de disponibilité DICT la plus forte (indisponibilité la moins tolérée) ? | C2S : 4h tolérable vs Accolade : un jour |
| E5 | datia-produit | Pour le produit DATIA TBD, quels sont les besoins DICT disponibilité et traçabilité ? | DATIA TBD · Dispo niv.1 · Traçab « Pas besoin de traces » |
| E6 | datia-tdb | Le produit TDB IA DAT'IA : département SDPC et besoin DICT de confidentialité ? | SDCID/DIA · Conf « informations sensibles » |
| E7 | rgaa-normalise | Quel est le taux RGAA de C2S ? Réponds en pourcentage. | Faits normalisés → 81 % (ratio 0.81) |
| E8 | jdma | Accolade est-il sur Je Donne Mon Avis, et y a-t-il un lien stats JDMA ? | Je_Donne_Mon_Avis=true · Lien JDMA présent |
| E9 | volumetrie-prestataire | Pour C2S : volumétrie utilisateurs par an et prestataire de développement ? | 10 001 à 100 000 · Capgemini |
| E10 | criticite-saisonniere | MANDOLINE a-t-il une criticité saisonnière, et quelle est sa criticité globale ? | Criticité saisonnière oui · Criticité 2 essentiel |
| E11 | support-petp | PETP : mode de support utilisateur, et inscription au PCA ? | Support via le référent · PCA Non |
| E12 | onvs-dict-rgaa | ONVS : besoin DICT de confidentialité, et taux RGAA en pourcentage ? | Conf sensibles · RGAA ≈ 57 % |

## Résultats détaillés

### E1 — PASS

- **Question** : Quels sont les besoins DICT (disponibilité, intégrité, confidentialité, traçabilité) d’Accolade ?
- **Oracle** : DICT Accolade : Dispo 2 · Intégrité 2 · Conf 2 · Traçab 3
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : jour, imputabilite, restreintes, alterations

**Réponse modèle**

Pour **ACCOLADE**, les besoins DICT renseignés dans Le PARC sont les suivants :

| Besoin DICT | Niveau renseigné |
|---|---|
| **Disponibilité** | 2 : Indisponibilité d'un jour tolérable |
| **Intégrité** | 2 : Les altérations doivent être détectées |
| **Confidentialité** | 2 : Diffusion d'informations restreintes |
| **Traçabilité** | 3 : Besoin d'imputabilité des actions aux acteurs |

Les quatre besoins sont bien renseignés : la disponibilité, l'intégrité et la confidentialité sont au niveau 2, tandis que la traçabilité est au niveau 3 (imputabilité des actions aux acteurs).

*Source : Le PARC — Produits_DNUM (lecture).*

### E2 — PASS

- **Question** : Pour Accolade, résume les besoins DAT : dis-moi clairement disponibilité et confidentialité.
- **Oracle** : DAT = DICT · Dispo « un jour » · Conf « restreintes »
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : disponibilite, disponibilité, jour

**Réponse modèle**

**ACCOLADE — besoins DICT (volet disponibilité et confidentialité)**

- **Disponibilité :** niveau 2 — « Indisponibilité d'un jour tolérable »
- **Confidentialité :** niveau 2 — « Diffusion d'informations restreintes »

Pour situer ces deux niveaux dans l'ensemble des besoins DICT du produit :
- **Intégrité :** niveau 2 — « Les altérations doivent être détectées »
- **Traçabilité :** niveau 3 — « Besoin d'imputabilité des actions aux acteurs »

Ces informations sont renseignées dans la fiche du produit (taux de complétion : 100 %). À noter en revanche : plusieurs éléments de sécurité/conformité ne sont **pas renseignés dans Le PARC**, notamment l'étude AIPD (RGPD), les dates de début et de fin de validité de l'homologation, ainsi que le taux et la date de déclaration RGAA — le statut d'homologation de sécurité est, lui, indiqué comme « Homologation en cours ».

Source : Le PARC — Produits_DNUM (lecture).

### E3 — PASS

- **Question** : MANDOLINE : quel niveau de confidentialité DICT, et la traçabilité est-elle au niveau « opposabilité légale » ?
- **Oracle** : Conf niveau 4 · Traçabilité niveau 4 opposabilité légale
- **Faits** : `matched:MANDOLINE`
- **Mots-clés trouvés** : tres sensibles, très sensibles, opposabilite, opposabilité

**Réponse modèle**

**MANDOLINE** — besoins DICT (source : Le PARC, lecture) :

- **Besoin DICT - Confidentialité** : **4 – Diffusion d'informations très sensibles**.
- **Besoin DICT - Traçabilité** : **4 – Besoin d'opposabilité légale des actions** → oui, la traçabilité est bien positionnée au niveau « opposabilité légale ».

Pour situer, les deux autres besoins DICT du produit sont : Disponibilité **3 – Indisponibilité de 4 h tolérable** et Intégrité **2 – Les altérations doivent être détectées**.

### E4 — PASS

- **Question** : Entre Accolade et C2S, lequel a l’exigence de disponibilité DICT la plus forte (indisponibilité la moins tolérée) ?
- **Oracle** : C2S : 4h tolérable vs Accolade : un jour
- **Faits** : `multi:ACCOLADE · C2S`
- **Mots-clés trouvés** : c2s, 4h

**Réponse modèle**

**C2S** a l’exigence de disponibilité la plus forte.

| Produit | Besoin DICT - Disponibilité |
|---|---|
| **ACCOLADE** | 2 : Indisponibilité d’un jour tolérable |
| **C2S** | 3 : Indisponibilité de 4h tolérable |

Le niveau 3 de C2S tolère une indisponibilité de seulement 4 heures, contre un jour entier pour ACCOLADE (niveau 2) : c’est donc C2S qui supporte le moins bien une interruption de service.

Source : Le PARC — Produits_DNUM (lecture).

### E5 — PASS

- **Question** : Pour le produit DATIA TBD, quels sont les besoins DICT disponibilité et traçabilité ?
- **Oracle** : DATIA TBD · Dispo niv.1 · Traçab « Pas besoin de traces »
- **Faits** : `matched:DATIA TBD`
- **Mots-clés trouvés** : superieure, supérieure, jour, traces, pas besoin

**Réponse modèle**

Pour le produit **DATIA TBD** (code DATIA-TBD), les besoins DICT demandés sont renseignés dans Le PARC :

- **Besoin DICT - Disponibilité** : « 1 : Indisponibilité supérieure à un jour tolérable »
- **Besoin DICT - Traçabilité** : « 1 : Pas besoin de traces »

À titre de contexte, les deux autres besoins DICT du produit sont également renseignés : Confidentialité « 3 : Diffusion d'informations sensibles » et Intégrité « 1 : Les données sont altérables sans conséquences ».

Source : Le PARC — Produits_DNUM (lecture).

### E6 — PASS

- **Question** : Le produit TDB IA DAT'IA : département SDPC et besoin DICT de confidentialité ?
- **Oracle** : SDCID/DIA · Conf « informations sensibles »
- **Faits** : `matched:TDB IA DAT'IA`
- **Mots-clés trouvés** : sdcid, dia, sensibles

**Réponse modèle**

Pour le produit **TDB IA DAT'IA** (code TDB-IA-DAT-IA) :

- **Département SDPC** : SDCID/DIA
- **Besoin DICT – Confidentialité** : 3 : Diffusion d'informations sensibles

Source : Le PARC — Produits_DNUM (lecture).

### E7 — PASS

- **Question** : Quel est le taux RGAA de C2S ? Réponds en pourcentage.
- **Oracle** : Faits normalisés → 81 % (ratio 0.81)
- **Faits** : `matched:C2S`
- **Mots-clés trouvés** : 81 %

**Réponse modèle**

Le taux de conformité RGAA de **C2S** est de **81 %** (ratio 0,81).

Source : Le PARC — Produits_DNUM (lecture).

### E8 — PASS

- **Question** : Accolade est-il sur Je Donne Mon Avis, et y a-t-il un lien stats JDMA ?
- **Oracle** : Je_Donne_Mon_Avis=true · Lien JDMA présent
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : oui, jedonnemonavis, jdma

**Réponse modèle**

Oui, pour **ACCOLADE** (source : Le PARC, lecture) :

- **Je Donne Mon Avis** : oui — le bouton est présent.
- **Lien stats JDMA** : oui, il est renseigné : https://jedonnemonavis.numerique.gouv.fr/administration/dashboard/product/3703/forms/1778

À noter : le champ **RGAA - Taux de conformité** et la **date de déclaration RGAA** ne sont pas renseignés dans Le PARC (la déclaration réglementaire est indiquée comme « N/A »).

### E9 — PASS

- **Question** : Pour C2S : volumétrie utilisateurs par an et prestataire de développement ?
- **Oracle** : 10 001 à 100 000 · Capgemini
- **Faits** : `matched:C2S`
- **Mots-clés trouvés** : capgemini

**Réponse modèle**

**C2S** — source : Le PARC (lecture)

- **Volumétrie utilisateurs par an** : De 10 001 à 100 000
- **Prestataire de développement** : Capgemini

À titre complémentaire, la fiche indique un **Marché DEV/TMA** référencé « 2MAINS » et un infogérant « Cegedim » — à ne pas confondre avec le prestataire de développement.

### E10 — PASS

- **Question** : MANDOLINE a-t-il une criticité saisonnière, et quelle est sa criticité globale ?
- **Oracle** : Criticité saisonnière oui · Criticité 2 essentiel
- **Faits** : `matched:MANDOLINE`
- **Mots-clés trouvés** : oui, essentiel

**Réponse modèle**

**MANDOLINE — Criticité** (source : Le PARC, lecture)

- **Criticité saisonnière** : **oui**. En revanche, les périodes de forte criticité ne sont pas précisées dans la fiche (le champ indique seulement « oui »).
- **Criticité globale** : **2 : Service essentiel**.

À noter en complément, sur le même thème : le produit n'est **pas inscrit au PCA** (« Inscription au PCA » : Non), et il est signalé comme **SI sensible** (oui).

### E11 — PASS

- **Question** : PETP : mode de support utilisateur, et inscription au PCA ?
- **Oracle** : Support via le référent · PCA Non
- **Faits** : `matched:PETP`
- **Mots-clés trouvés** : referent, référent

**Réponse modèle**

**PETP** — source : Le PARC (lecture)

- **Mode de support utilisateur** : Via le référent
- **Inscription au PCA** : Non

Pour situer ces éléments : le produit est en « 🔄 En amélioration continue », avec une criticité « 3 : Service courant » et une criticité saisonnière « Non ». Ces deux informations sont bien renseignées dans Le PARC ; d'autres champs techniques de la fiche (langages, frameworks, infrastructure, etc.) restent, eux, non renseignés dans Le PARC.

### E12 — PASS

- **Question** : ONVS : besoin DICT de confidentialité, et taux RGAA en pourcentage ?
- **Oracle** : Conf sensibles · RGAA ≈ 57 %
- **Faits** : `matched:ONVS`
- **Mots-clés trouvés** : sensibles, 57 %

**Réponse modèle**

Pour **ONVS** (source : Le PARC — lecture) :

- **Besoin DICT - Confidentialité** : 3 : Diffusion d'informations sensibles
- **RGAA - Taux de conformité** : 57 % (ratio 0,57)

À noter en complément, si utile : la déclaration d'accessibilité réglementaire est présente (✅ Oui), datée du 2022-12-03.

## Analyse

### Synthèse

- Score global : **12/12** (100 %).
- Thème **dict-complet** : 1/1
- Thème **dat-alias** : 1/1
- Thème **dict-sensible** : 1/1
- Thème **dict-comparaison** : 1/1
- Thème **datia-produit** : 1/1
- Thème **datia-tdb** : 1/1
- Thème **rgaa-normalise** : 1/1
- Thème **jdma** : 1/1
- Thème **volumetrie-prestataire** : 1/1
- Thème **criticite-saisonniere** : 1/1
- Thème **support-petp** : 1/1
- Thème **onvs-dict-rgaa** : 1/1

Aucune erreur auto-détectée sur cette batterie. Relancer avec LiteLLM Onyxia avant de conclure en prod.

### Limites de cette eval

- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète.
- Un seul tour, température basse ; pas de multi-essais.
- Accès Viewer : certains champs peuvent manquer selon le compte API.

---

*Généré par `services/assistant-essai/run_parc_eval.py`.*
