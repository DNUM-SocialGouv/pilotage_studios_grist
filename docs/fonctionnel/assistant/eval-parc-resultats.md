# Évaluation Assistant PARC — résultats

## En clair

On a posé **12 questions** sur le référentiel produits (Le PARC), avec le même principe que l’essai : d’abord une **fiche de faits**, puis une réponse rédigée par un modèle. **12/12** réponses sont jugées conformes aux oracles (valeurs Grist).

| | |
|--|--|
| Date | 2026-11-20 19:26 CET |
| Document | `vjbmAgqvttQH` (Le PARC) |
| Outil faits | `parc_facts.resolve_parc_facts` |
| Modèle | `mistral-small-3-2-24b-instruct-2506` via **albert** |
| PARC configuré | oui |
| Score auto | **12/12** |

> **Note** : LiteLLM Onyxia n’était pas configuré en local. L’évaluation a utilisé **Albert** (API compatible) avec le **même** prompt système et les **mêmes** faits — utile pour juger la qualité du contrat faits→réponse ; à rejouer ensuite avec LiteLLM Fabrique.

## Plan de test (corpus)

Couverture : identité/gouvernance, hébergement, stack, RGAA renseigné / vide, personnes (CDP), produit sparse, produit inconnu, ambiguïté de nom.

| Id | Thème | Question | Oracle (Grist) |
|----|-------|----------|----------------|
| Q1 | hébergement | Quel est l’hébergeur de Accolade ? | Hebergement=CEGEDIM · Infogerant=Cegedim |
| Q2 | gouvernance | Quel département SDPC pour Accolade ? | Departement_SDPC=GPS |
| Q3 | techno | Accolade est-il en monorepo ? | Monorepo=false |
| Q4 | manquant | Quel est le taux RGAA d’Accolade ? | RGAA_Taux_de_conformite vide → non renseigné |
| Q5 | personnes | Qui est le chef de produit d’Accolade ? | Product_Manager_Chef_de_projet → RACHEDI Assia (Base_RH id 16) |
| Q6 | stack | Quels langages de programmation pour Accolade ? | Langages=TS, Java |
| Q7 | rgaa-positif | Quel est le taux RGAA de C2S ? | RGAA_Taux_de_conformite=0.81 |
| Q8 | techno | C2S est-il en monorepo ? | Monorepo=true |
| Q9 | sécurité | MANDOLINE a-t-il la MFA ? | MFA=Oui |
| Q10 | sparse | Quel est le taux RGAA de DSN BDD ? | Produit peu complet · RGAA vide → non renseigné (produit exact DSN BDD) |
| Q11 | inconnu | Quel hébergeur pour le produit ZXQRTY-INCONNU-42 ? | Produit inexistant → guidage, pas d’invention |
| Q12 | ambigu | Parle-moi du produit SISE-EAUX | Ambiguïté famille SISE-EAUX → candidats attendus |

## Résultats détaillés

### Q1 — PASS

- **Question** : Quel est l’hébergeur de Accolade ?
- **Oracle** : Hebergement=CEGEDIM · Infogerant=Cegedim
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : cegedim

**Réponse modèle**

L’hébergeur de Accolade est CEGEDIM.

Source : Le PARC — Produits_DNUM (lecture).

### Q2 — PASS

- **Question** : Quel département SDPC pour Accolade ?
- **Oracle** : Departement_SDPC=GPS
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : gps

**Réponse modèle**

Le département SDPC pour Accolade est **GPS**.

Source : Le PARC — Produits_DNUM (lecture).

### Q3 — PASS

- **Question** : Accolade est-il en monorepo ?
- **Oracle** : Monorepo=false
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : non

**Réponse modèle**

Non, Accolade n'est pas en monorepo. La valeur du champ **Monorepo** est explicitement "non".

### Q4 — PASS

- **Question** : Quel est le taux RGAA d’Accolade ?
- **Oracle** : RGAA_Taux_de_conformite vide → non renseigné
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : pas renseigne, n'est pas renseigne

**Réponse modèle**

Le taux RGAA d’Accolade n'est pas renseigné dans Le PARC.

### Q5 — PASS

- **Question** : Qui est le chef de produit d’Accolade ?
- **Oracle** : Product_Manager_Chef_de_projet → RACHEDI Assia (Base_RH id 16)
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : rachedi, assia

**Réponse modèle**

Le chef de produit d’Accolade est **RACHEDI Assia**.

Source : Le PARC — Produits_DNUM (lecture).

### Q6 — PASS

- **Question** : Quels langages de programmation pour Accolade ?
- **Oracle** : Langages=TS, Java
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : java

**Réponse modèle**

Les langages de programmation utilisés pour Accolade sont TypeScript (TS) et Java.

Source : Le PARC — Produits_DNUM (lecture).

### Q7 — PASS

- **Question** : Quel est le taux RGAA de C2S ?
- **Oracle** : RGAA_Taux_de_conformite=0.81
- **Faits** : `matched:C2S`
- **Mots-clés trouvés** : 81, 0,81

**Réponse modèle**

Le taux RGAA de C2S est de 81 % (0,81).

Source : Le PARC — Produits_DNUM (lecture).

### Q8 — PASS

- **Question** : C2S est-il en monorepo ?
- **Oracle** : Monorepo=true
- **Faits** : `matched:C2S`
- **Mots-clés trouvés** : oui

**Réponse modèle**

Oui, C2S est en monorepo. Le nombre de repositories est de 1.

Source : Le PARC — Produits_DNUM (lecture).

### Q9 — PASS

- **Question** : MANDOLINE a-t-il la MFA ?
- **Oracle** : MFA=Oui
- **Faits** : `matched:MANDOLINE`
- **Mots-clés trouvés** : oui

**Réponse modèle**

Oui, MANDOLINE a la MFA (Multi-Factor Authentication). La méthode d'authentification utilisée est "Interne application" avec Keycloak comme système d'authentification (IAM). De plus, il est indiqué que la MFA est activée avec une remarque précisant "2FA par mail".

Source : Le PARC — Produits_DNUM (lecture).

### Q10 — PASS

- **Question** : Quel est le taux RGAA de DSN BDD ?
- **Oracle** : Produit peu complet · RGAA vide → non renseigné (produit exact DSN BDD)
- **Faits** : `matched:DSN BDD`
- **Mots-clés trouvés** : pas renseigne, n'est pas renseigne

**Réponse modèle**

Le taux RGAA de DSN BDD n'est pas renseigné dans Le PARC.

### Q11 — PASS

- **Question** : Quel hébergeur pour le produit ZXQRTY-INCONNU-42 ?
- **Oracle** : Produit inexistant → guidage, pas d’invention
- **Faits** : `unresolved:not_found`
- **Mots-clés trouvés** : aucun, ne correspond, pas trouve, verifiez, orthographe
- **Notes outil** : hint outil: Aucun produit visible ne correspond à ce nom. Vérifiez l’orthographe dans Le PARC.

**Réponse modèle**

Le produit ZXQRTY-INCONNU-42 n'est pas trouvé dans Le PARC. Le hint indique : "Aucun produit visible ne correspond à ce nom. Vérifiez l’orthographe dans Le PARC." (source : Le PARC, lecture).

### Q12 — PASS

- **Question** : Parle-moi du produit SISE-EAUX
- **Oracle** : Ambiguïté famille SISE-EAUX → candidats attendus
- **Faits** : `unresolved:ambiguous`
- **Mots-clés trouvés** : plusieurs, precisez, candidat, correspond
- **Notes outil** : hint outil: Plusieurs produits correspondent. Précisez le nom un peu plus. · candidats: SISE-EAUX Infocentre Alimentation, SISE-EAUX Infocentre Baignades, SISE-EAUX Internet Baignades, SISE-EAUX Administration, SISE-EAUX Alimentation, SISE-EAUX Référentiels

**Réponse modèle**

Le produit SISE-EAUX n'est pas clairement identifié dans Le PARC. Plusieurs produits correspondent à cette recherche. Pour obtenir des informations précises, précisez le nom un peu plus. Voici les candidats possibles :

- SISE-EAUX Infocentre Alimentation
- SISE-EAUX Infocentre Baignades
- SISE-EAUX Internet Baignades
- SISE-EAUX Administration
- SISE-EAUX Alimentation
- SISE-EAUX Référentiels
- SISE-EAUX Baignades
- SISE-EAUX OROB

Source : Le PARC (lecture).

## Analyse

### Synthèse

- Score global : **12/12** (100 %).
- Thème **hébergement** : 1/1
- Thème **gouvernance** : 1/1
- Thème **techno** : 2/2
- Thème **manquant** : 1/1
- Thème **personnes** : 1/1
- Thème **stack** : 1/1
- Thème **rgaa-positif** : 1/1
- Thème **sécurité** : 1/1
- Thème **sparse** : 1/1
- Thème **inconnu** : 1/1
- Thème **ambigu** : 1/1

### Lecture métier

Sur cette batterie, le duo **faits structurés + modèle** tient la route :

| Intention | Verdict |
|-----------|---------|
| Lire une valeur renseignée (hébergeur, département, MFA, stack) | OK |
| Dire « non renseigné » quand le champ est vide (RGAA Accolade / DSN BDD) | OK |
| Résoudre une personne (CDP via Base_RH) | OK |
| Refuser d’inventer un produit inconnu | OK (après durcissement du prompt) |
| Demander de préciser si le nom est ambigu (SISE-EAUX) | OK |

### Correctifs issus de la 1ʳᵉ passe (7/12 → 12/12)

1. **Matching préfixe** : la question « DSN BDD » tombait sur le produit **DSN** (code court trop fort). Correction : rétrograder un libellé court si un **libellé plus long** matche en phrase entière dans la question (`parc_facts.py`).
2. **Prompt unresolved** : sur produit introuvable, le modèle répondait « non renseigné » comme si la fiche existait. Le prompt impose désormais de citer `not_found` / `ambiguous` + hint / candidats.
3. **Scoreur** : `expect_any` exigeait à tort *tous* les mots-clés ; corrigé en *au moins un*, avec normalisation des accents.

### Recommandations

1. **Rejouer** la même batterie avec **LiteLLM Fabrique** (Onyxia) — modèle de prod de l’essai.
2. Ajouter 3–5 questions « piège » : dates sentinelle d’homologation, booléens `false`, produit parent / sous-produit.
3. Normaliser l’affichage RGAA dans les faits (ex. `81 %` plutôt que `0.81` seul) pour des réponses plus homogènes.
4. Revue humaine Design / métier sur 5 réponses libres (pas seulement le score auto).

### Limites de cette eval

- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète.
- Un seul tour, température basse ; pas de multi-essais.
- Modèle = **Albert** (repli local), pas LiteLLM Onyxia.
- Accès Viewer : certains champs peuvent manquer selon le compte API.
- Script : [`services/assistant-essai/run_parc_eval.py`](../../../services/assistant-essai/run_parc_eval.py).

---

*Généré par `services/assistant-essai/run_parc_eval.py`, analyse enrichie après correctifs matching/prompt.*
