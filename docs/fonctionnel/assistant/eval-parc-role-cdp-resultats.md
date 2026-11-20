# Évaluation Assistant PARC — rôle chef de projet

## En clair

On a posé **6 questions** sur le référentiel produits (Le PARC), avec le même principe que l’essai : d’abord une **fiche de faits**, puis une réponse rédigée par un modèle. **6/6** réponses sont jugées conformes aux oracles (valeurs Grist).

| | |
|--|--|
| Date | 2026-11-20 22:09 CET |
| Suite | `role-cdp` |
| Document | `vjbmAgqvttQH` (Le PARC) |
| Outil faits | `parc_facts.resolve_parc_facts` (+ multi) |
| Modèle | `scaleway/deepseek-v4.1-flash` via **litellm** |
| PARC configuré | oui |
| Score auto | **6/6** |

## Plan de test (corpus)

Couverture : **chef de projet** — synthèses multi-champs, comparaisons DICT/RGAA, stack + JDMA (sans pied de page Source).

| Id | Thème | Question | Oracle (Grist) |
|----|-------|----------|----------------|
| CDP1 | cdp-fiche-croisee | Pour Accolade, donne-moi en une synthèse : le chef de produit, l’hébergeur / infogérant, si c’est HDS, la criticité, … | CDP Assia · Cegedim · pas HDS · crit. 3 · homolog en cours · RGAA vide |
| CDP2 | cdp-compare-dict-rgaa | Compare Accolade et C2S sur deux axes seulement : besoin DICT de disponibilité, et taux RGAA (en %). Dis clairement l… | C2S dispo 4h > Accolade 1 jour · RGAA C2S 81 % · Accolade vide |
| CDP3 | cdp-mandoline-sensible | MANDOLINE : département, criticité saisonnière, besoin DICT de confidentialité, disponibilité DICT, et taux RGAA en p… | GPS · saisonnière oui · conf 4 · dispo 4h · RGAA ≈ 0,83 % |
| CDP4 | cdp-stack-livraison | Accolade : frameworks front et back, monorepo ou non, prestataire de développement, mode de support, et présence JDMA… | React/Spring · pas monorepo · Interne · JIRA · JDMA oui + lien |
| CDP5 | cdp-dict-complet-vs | Sur les quatre besoins DICT (dispo, intégrité, conf, traçabilité), où Mandoline est-elle plus exigeante qu’Accolade ?… | Mandoline conf 4 + traçab 4 vs Accolade 2/2/2/3 |
| CDP6 | cdp-petp-exploit | PETP : département, mode de support, inscription PCA, taux RGAA en %, et si Je Donne Mon Avis est activé. | SANTE · référent · PCA non · RGAA 81 % · JDMA non |

## Résultats détaillés

### CDP1 — PASS

- **Question** : Pour Accolade, donne-moi en une synthèse : le chef de produit, l’hébergeur / infogérant, si c’est HDS, la criticité, le statut d’homologation, et le taux RGAA s’il existe.
- **Oracle** : CDP Assia · Cegedim · pas HDS · crit. 3 · homolog en cours · RGAA vide
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : rachedi, cegedim

**Réponse modèle**

**Synthèse — ACCOLADE**

- **Chef de produit** : RACHEDI Assia
- **Hébergement / infogérant** : CEGEDIM (hébergement) ; infogérant : Cegedim
- **HDS** : non
- **Criticité** : 3 : Service courant
- **Statut d'homologation de sécurité** : Homologation en cours
- **Taux RGAA** : non renseigné dans Le PARC (le taux de conformité RGAA fait partie des informations manquantes). À noter : la déclaration réglementaire RGAA est indiquée comme « N/A ».

Pour situer le produit : ACCOLADE est porté par la DGCS, rattaché au département GPS, en amélioration continue, avec une mise en production au 2 janvier 2023.

### CDP2 — PASS

- **Question** : Compare Accolade et C2S sur deux axes seulement : besoin DICT de disponibilité, et taux RGAA (en %). Dis clairement lequel a l’exigence de dispo la plus forte.
- **Oracle** : C2S dispo 4h > Accolade 1 jour · RGAA C2S 81 % · Accolade vide
- **Faits** : `multi:ACCOLADE · C2S`
- **Mots-clés trouvés** : c2s, 4h

**Réponse modèle**

**Comparaison sur les deux axes demandés**

| Axe | ACCOLADE | C2S |
|---|---|---|
| Besoin DICT – Disponibilité | 2 : Indisponibilité d'un jour tolérable | 3 : Indisponibilité de 4h tolérable |
| RGAA – Taux de conformité | Non renseigné dans Le PARC | 81 % (ratio 0,81) |

**Exigence de disponibilité la plus forte : C2S.** Son niveau 3 ne tolère que 4 heures d'indisponibilité, alors qu'ACCOLADE (niveau 2) tolère une indisponibilité d'un jour.

À noter : le taux RGAA d'ACCOLADE n'est pas renseigné dans Le PARC (il figure parmi les informations manquantes de sa fiche), la comparaison sur cet axe n'est donc pas possible ; seul le taux de C2S est disponible.

### CDP3 — PASS

- **Question** : MANDOLINE : département, criticité saisonnière, besoin DICT de confidentialité, disponibilité DICT, et taux RGAA en pourcentage. Signale si le RGAA est très bas.
- **Oracle** : GPS · saisonnière oui · conf 4 · dispo 4h · RGAA ≈ 0,83 %
- **Faits** : `matched:MANDOLINE`
- **Mots-clés trouvés** : gps, tres sensibles, très sensibles

**Réponse modèle**

**MANDOLINE** (département SDPC : GPS)

| Information demandée | Valeur dans Le PARC |
|---|---|
| Département SDPC | GPS |
| Criticité saisonnière | oui |
| Besoin DICT – Confidentialité | 4 : Diffusion d'informations très sensibles |
| Besoin DICT – Disponibilité | 3 : Indisponibilité de 4h tolérable |
| RGAA – Taux de conformité | **0,83 %** (ratio 0,0083) |

⚠️ **Le taux RGAA est très bas** : 0,83 %, soit moins de 1 % de conformité — un niveau quasi nul, très éloigné d'une conformité satisfaisante. À noter en regard : une déclaration d'accessibilité réglementaire est bien présente (déclarée le 2026-07-07), mais le taux déclaré reste extrêmement faible ; c'est un point d'alerte à signaler au produit.

Pour information, la criticité générale du produit est « 2 : Service essentiel » et le produit est marqué « SI sensible : oui ».

### CDP4 — PASS

- **Question** : Accolade : frameworks front et back, monorepo ou non, prestataire de développement, mode de support, et présence JDMA (oui/non + lien stats s’il existe).
- **Oracle** : React/Spring · pas monorepo · Interne · JIRA · JDMA oui + lien
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : react, spring, jira

**Réponse modèle**

**ACCOLADE — architecture, développement et support**

- **Framework frontend** : React
- **Framework/technologie backend** : Spring
- **Monorepo** : non (architecture multi-repos, avec 1 repository déclaré)
- **Prestataire de développement** : Interne (maîtrise d'œuvre assurée en interne)
- **Mode de support utilisateur** : via JIRA
- **Je Donne Mon Avis (JDMA)** : oui
  - Lien vers les statistiques : https://jedonnemonavis.numerique.gouv.fr/administration/dashboard/product/3703/forms/1778

Pour situer le contexte technique : le produit utilise TypeScript et Java comme langages, PostgreSQL comme base de données, et son code est hébergé sur https://github.com/DNUM-SocialGouv/accolade-env (repository non public).

### CDP5 — PASS

- **Question** : Sur les quatre besoins DICT (dispo, intégrité, conf, traçabilité), où Mandoline est-elle plus exigeante qu’Accolade ? Cite les niveaux pour les deux produits.
- **Oracle** : Mandoline conf 4 + traçab 4 vs Accolade 2/2/2/3
- **Faits** : `multi:ACCOLADE · MANDOLINE`
- **Mots-clés trouvés** : confidentialite, confidentialité, tracabilite, traçabilité

**Réponse modèle**

**Mandoline est plus exigeante qu’Accolade sur trois des quatre besoins DICT** ; sur l’intégrité, les deux produits sont au même niveau.

| Besoin DICT | ACCOLADE | MANDOLINE | Comparaison |
|---|---|---|---|
| Disponibilité | 2 : Indisponibilité d'un jour tolérable | 3 : Indisponibilité de 4h tolérable | Mandoline plus exigeante |
| Intégrité | 2 : Les altérations doivent être détectées | 2 : Les altérations doivent être détectées | Égalité |
| Confidentialité | 2 : Diffusion d'informations restreintes | 4 : Diffusion d'informations très sensibles | Mandoline plus exigeante |
| Traçabilité | 3 : Besoin d'imputabilité des actions aux acteurs | 4 : Besoin d'opposabilité légale des actions | Mandoline plus exigeante |

À noter, en cohérence avec ce positionnement : Mandoline est qualifiée de « SI sensible » (oui) et dispose d'une homologation de sécurité en statut « Homologuée », alors qu'Accolade est en « Homologation en cours » et non sensible.

### CDP6 — PASS

- **Question** : PETP : département, mode de support, inscription PCA, taux RGAA en %, et si Je Donne Mon Avis est activé.
- **Oracle** : SANTE · référent · PCA non · RGAA 81 % · JDMA non
- **Faits** : `matched:PETP`
- **Mots-clés trouvés** : referent, référent, 81

**Réponse modèle**

**PETP** — les éléments demandés :

- **Département SDPC** : SANTE
- **Mode de support utilisateur** : Via le référent
- **Inscription au PCA** : Non
- **Taux RGAA de conformité** : 81 % (ratio 0,81), déclaration réglementaire présente, datée du 01/06/2023
- **Je Donne Mon Avis** : non activé (le lien de statistiques JDMA indique d'ailleurs « pas encore mis en place dans le formulaire PETP »)

## Analyse

### Synthèse

- Score global : **6/6** (100 %).
- Thème **cdp-fiche-croisee** : 1/1
- Thème **cdp-compare-dict-rgaa** : 1/1
- Thème **cdp-mandoline-sensible** : 1/1
- Thème **cdp-stack-livraison** : 1/1
- Thème **cdp-dict-complet-vs** : 1/1
- Thème **cdp-petp-exploit** : 1/1

Aucune erreur auto-détectée sur cette batterie. Relancer avec LiteLLM Onyxia avant de conclure en prod.

### Limites de cette eval

- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète.
- Un seul tour, température basse ; pas de multi-essais.
- Accès Viewer : certains champs peuvent manquer selon le compte API.

---

*Généré par `services/assistant-essai/run_parc_eval.py`.*
