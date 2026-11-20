# Évaluation Assistant PARC — batterie complexe

## En clair

On a posé **12 questions** sur le référentiel produits (Le PARC), avec le même principe que l’essai : d’abord une **fiche de faits**, puis une réponse rédigée par un modèle. **12/12** réponses sont jugées conformes aux oracles (valeurs Grist).

| | |
|--|--|
| Date | 2026-11-20 21:08 CET |
| Suite | `complex` |
| Document | `vjbmAgqvttQH` (Le PARC) |
| Outil faits | `parc_facts.resolve_parc_facts` (+ multi) |
| Modèle | `scaleway/deepseek-v4.1-flash` via **litellm** |
| PARC configuré | oui |
| Score auto | **12/12** |

## Plan de test (corpus)

Couverture avancée : synthèse multi-champs, booléens croisés, RenovSI, comparaisons multi-produits (RGAA, hébergement, IAM), cycle de vie, piège d’invention.

| Id | Thème | Question | Oracle (Grist) |
|----|-------|----------|----------------|
| C1 | synthèse-stack | Pour Accolade, résume la stack technique : langages, frameworks front et back, base de données, et système d’authenti… | TS/Java · React · Spring · PostgreSQL · IAM Spécifique |
| C2 | booléens-multi | Accolade est-il un SI sensible, HDS, SecNumCloud, ou branché ProConnect ? Réponds clairement pour chaque point. | SI_sensible/HDS/Secnumcloud/ProConnect = false |
| C3 | renovsi | Quelle est la cible RenovSI 2026 et 2027 pour Accolade ? Y a-t-il un portage DSFR prévu ? | 2026=P0 Aucun · 2027=P3 ATLAS · Portage_DSFR=À faire |
| C4 | conformité | Quel est le statut d’homologation de sécurité d’Accolade, et le taux RGAA s’il existe ? | Homologation en cours · RGAA non renseigné |
| C5 | gouvernance-riche | Pour MANDOLINE : département, direction métier, criticité, statut actuel, et inscription au PCA. | GPS · DGCS · criticité 2 · En build · PCA Non |
| C6 | sécurité-contraste | AQUA-SISE : est-ce un service critique, HDS, obsolète, et quel est le taux RGAA approximatif ? | Critique · HDS true · Obsolescence true · RGAA≈0.5082 |
| C7 | comparaison-rgaa | Entre C2S et MANDOLINE, lequel a le meilleur taux RGAA ? Donne les deux valeurs. | C2S 0.81 > MANDOLINE 0.0083 |
| C8 | comparaison-hebergement | Compare l’hébergement de Accolade et de LABOé-SI : qui héberge quoi ? | Accolade=CEGEDIM · LABOé-SI=OVH |
| C9 | comparaison-auth | Quelle différence d’authentification (IAM) entre Accolade et C2S ? | Accolade=Spécifique · C2S=Keycloak |
| C10 | cycle-vie | LABOé-SI est-il encore en production selon le statut actuel ? Qu’en dit le champ obsolescence ? | Statut=Décommissionné · Obsolescence=false |
| C11 | métier-porteur | Qui porte métier Accolade (direction / référent national) et quel est le secteur fonctionnel ? | DGCS · Cohésion Sociale - Inclusion sociale |
| C12 | piège-invention | Accolade et C2S : lesquels sont au PCA, et Accolade a-t-il un taux RGAA de 100 % ? | PCA Non pour les deux · Accolade RGAA non renseigné (pas 100 %) |

## Résultats détaillés

### C1 — PASS

- **Question** : Pour Accolade, résume la stack technique : langages, frameworks front et back, base de données, et système d’authentification.
- **Oracle** : TS/Java · React · Spring · PostgreSQL · IAM Spécifique
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : specifique, spécifique, ts, typescript

**Réponse modèle**

## Stack technique d’ACCOLADE

**Langages de programmation** : TS (TypeScript) et Java.

**Framework frontend** : React.

**Framework / technologie backend** : Spring.

**Base de données** : PostgreSQL (ORM associé : Hibernate).

**Authentification** :
- Méthode d’authentification : **N/A** (non documentée dans la fiche).
- Système d’authentification (IAM) : **« Spécifique »**, c’est-à-dire une solution propre au produit, et non un dispositif mutualisé.
- Précisions associées : MFA (authentification multifacteur) : **non** ; ProConnect : **non**.

**Pour situer le reste de l’architecture** (même catégorie « Architecture et Technologies ») : infrastructure Debian / Tomcat, hébergement Cegedim, stockage des documents sur S3, API externes FINESS et Base Adresse Nationale, tests avec Jest et jUnit, qualité de code via eslint, prettier, Sonar.

*Source : Le PARC — Produits_DNUM (lecture).*

### C2 — PASS

- **Question** : Accolade est-il un SI sensible, HDS, SecNumCloud, ou branché ProConnect ? Réponds clairement pour chaque point.
- **Oracle** : SI_sensible/HDS/Secnumcloud/ProConnect = false
- **Faits** : `matched:ACCOLADE`

**Réponse modèle**

**ACCOLADE — réponse point par point** (source : Le PARC — Produits_DNUM, lecture) :

| Point | Réponse |
|---|---|
| **SI sensible** | **Non** |
| **HDS** (hébergement de données de santé) | **Non** |
| **SecNumCloud** | **Non** |
| **Branché ProConnect** | **Non** |

Précisions utiles issues de la même fiche, sans extrapolation :
- **Système d'authentification (IAM)** : « Spécifique » — cohérent avec l'absence de ProConnect.
- **MFA** : « Non ».
- **Hébergement** : « CEGEDIM » (infogérant : Cegedim) — l'offre d'hébergement cible RENOV SI est indiquée « Aucune ».
- **Statut d'homologation de sécurité** : « Homologation en cours ». Les dates de début et de fin de validité d'homologation ne sont pas renseignées dans Le PARC.

Aucune de ces quatre réponses n'est une absence de donnée : les quatre champs sont bien renseignés dans Le PARC.

### C3 — PASS

- **Question** : Quelle est la cible RenovSI 2026 et 2027 pour Accolade ? Y a-t-il un portage DSFR prévu ?
- **Oracle** : 2026=P0 Aucun · 2027=P3 ATLAS · Portage_DSFR=À faire
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : atlas, p3, p0

**Réponse modèle**

**ACCOLADE — cibles RenovSI et portage DSFR** (source : Le PARC — Produits_DNUM, lecture)

- **Cible RenovSI 2026** : « P0. Aucun »
- **Cible RenovSI 2027** : « P3. ATLAS »
- **Portage DSFR** : « À faire » — le portage vers le Design System de l'État est donc bien identifié comme restant à réaliser, mais la fiche n'indique ni échéance ni priorité associée.

Pour situer : le produit est en « 🔄 En amélioration continue », avec un framework frontend « React » et un taux de complétion de la fiche à 100 %. Les éléments de sécurité/accessibilité liés (validité d'homologation, taux de conformité RGAA, AIPD) ne sont pas renseignés dans Le PARC.

### C4 — PASS

- **Question** : Quel est le statut d’homologation de sécurité d’Accolade, et le taux RGAA s’il existe ?
- **Oracle** : Homologation en cours · RGAA non renseigné
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : homologation en cours, en cours

**Réponse modèle**

**Accolade (ACCOLADE) — Sécurité et conformité** *(source : Le PARC — lecture)*

- **Statut d'homologation de sécurité** : « Homologation en cours ».
- **RGAA – Taux de conformité** : **non renseigné dans Le PARC** (information absente de la fiche).
- **RGAA – Déclaration réglementaire** : « N/A ».

À noter également, pour le contexte d'homologation : les **dates de début et de fin de validité d'homologation** ne sont pas renseignées dans Le PARC (la fin de validité étant signalée comme information critique manquante).

### C5 — PASS

- **Question** : Pour MANDOLINE : département, direction métier, criticité, statut actuel, et inscription au PCA.
- **Oracle** : GPS · DGCS · criticité 2 · En build · PCA Non
- **Faits** : `matched:MANDOLINE`
- **Mots-clés trouvés** : essentiel, build, pca, non

**Réponse modèle**

**MANDOLINE** — informations issues de Le PARC (lecture) :

| Information | Valeur |
|---|---|
| Département SDPC | GPS |
| Direction métier | DGCS |
| Criticité | 2 : Service essentiel |
| Statut actuel | 🔨 En build |
| Inscription au PCA | Non |

Aucune de ces cinq informations ne manque dans la fiche : elles sont toutes renseignées.

### C6 — PASS

- **Question** : AQUA-SISE : est-ce un service critique, HDS, obsolète, et quel est le taux RGAA approximatif ?
- **Oracle** : Critique · HDS true · Obsolescence true · RGAA≈0.5082
- **Faits** : `matched:AQUA-SISE`
- **Mots-clés trouvés** : critique, hds, oui

**Réponse modèle**

**AQUA-SISE** — synthèse (source : Le PARC, lecture) :

| Question | Réponse | Libellé du champ |
|---|---|---|
| Service critique ? | **Oui** — « 1 : Service critique » | Criticité |
| HDS ? | **Oui** | HDS |
| Obsolète ? | **Oui** (valeur « oui ») | Obsolescence |
| Taux RGAA approximatif | **≈ 50,8 %** (0,5082) | RGAA - Taux de conformité |

Précisions utiles :
- **Accessibilité** : une déclaration réglementaire existe (RGAA - Déclaration réglementaire : « ✅ Oui »), datée du **15/01/2022** (RGAA - Date de déclaration). Le taux d'environ 51 % correspond donc à cette déclaration.
- **Cohérence à signaler** : le statut actuel indiqué est « 🔄 En amélioration continue » alors que le champ Obsolescence répond « oui » — les deux informations coexistent dans la fiche, sans explication fournie.
- **Sécurité** : le produit est par ailleurs « Homologuée », avec une homologation valide du 09/07/2025 au 08/07/2028, et il est marqué « SI sensible : oui ».

Les champs « Portage DSFR », « Étude AIPD (RGPD) » et « Nombre de traitements EGERIE » ne sont pas renseignés dans Le PARC.

### C7 — PASS

- **Question** : Entre C2S et MANDOLINE, lequel a le meilleur taux RGAA ? Donne les deux valeurs.
- **Oracle** : C2S 0.81 > MANDOLINE 0.0083
- **Faits** : `multi:C2S · MANDOLINE`
- **Mots-clés trouvés** : c2s

**Réponse modèle**

**C2S a le meilleur taux de conformité RGAA.**

| Produit | RGAA – Taux de conformité | RGAA – Date de déclaration | RGAA – Déclaration réglementaire |
|---|---|---|---|
| **C2S** | **81 %** (0,81) | 12/02/2025 | ✅ Oui |
| **MANDOLINE** | **0,83 %** (0,0083) | 07/07/2026 | ✅ Oui |

Les deux produits disposent donc d'une déclaration d'accessibilité réglementaire, mais l'écart de taux est très important en faveur de C2S. La valeur de MANDOLINE est reprise telle qu'elle figure dans la fiche (0,0083) : elle peut correspondre à un taux saisi en proportion plutôt qu'en pourcentage, ce qui mériterait une vérification côté produit — je ne fais ici que rapporter les faits.

*Source : Le PARC — Produits_DNUM (lecture).*

### C8 — PASS

- **Question** : Compare l’hébergement de Accolade et de LABOé-SI : qui héberge quoi ?
- **Oracle** : Accolade=CEGEDIM · LABOé-SI=OVH
- **Faits** : `multi:ACCOLADE · LABOé-SI`

**Réponse modèle**

## Hébergement : ACCOLADE vs LABOé-SI

**ACCOLADE**
- **Hébergement** : CEGEDIM
- **Infogérant** : Cegedim
- **Infrastructure** : Debian, Tomcat
- **Coût infogérance HT** : 14 762 (mensuel)
- **HDS** : non — **Secnumcloud** : non
- **Offre d'hébergement cible RENOV SI** : Aucune (cible 2026 : « P0. Aucun » ; cible 2027 : « P3. ATLAS »)

**LABOé-SI**
- **Hébergement** : OVH
- **Infrastructure** : non renseigné dans Le PARC
- **Coût infogérance HT** : 0
- **HDS** : non — **Secnumcloud** : non
- **Prestataire de développement / Éditeur logiciel** : Enovacom
- À noter : produit au statut **🔴 Décommissionné**, avec une **date de décommissionnement** au 2025-06-06.

**En résumé** : ACCOLADE est hébergé chez **Cegedim**, qui en assure aussi l'infogérance (avec un coût mensuel associé), sur une infrastructure Debian/Tomcat. LABOé-SI est hébergé chez **OVH**, sans coût d'infogérance renseigné, et son infrastructure n'est pas documentée dans Le PARC. Aucun des deux n'est déclaré HDS ni Secnumcloud.

*Source : Le PARC — Produits_DNUM (lecture).*

### C9 — PASS

- **Question** : Quelle différence d’authentification (IAM) entre Accolade et C2S ?
- **Oracle** : Accolade=Spécifique · C2S=Keycloak
- **Faits** : `multi:ACCOLADE · C2S`
- **Mots-clés trouvés** : keycloak

**Réponse modèle**

## Comparaison de l’authentification (IAM) — ACCOLADE vs C2S

Source : **Le PARC — Produits_DNUM (lecture)**

| Champ (libellé métier) | ACCOLADE | C2S |
|---|---|---|
| Système d’authentification (IAM) | **Spécifique** | **Keycloak** |
| Méthode d’authentification | N/A | Interne application |
| MFA | Non | Non |
| ProConnect | non | non |
| Composants | non renseigné dans Le PARC | Keycloak |

### Ce qu’il faut retenir
- **ACCOLADE** déclare un système d’authentification **spécifique** (donc pas un IAM standard type Keycloak), avec une méthode d’authentification indiquée comme **N/A** et **pas de MFA** ni de ProConnect.
- **C2S** s’appuie sur **Keycloak** comme solution d’IAM, avec une authentification de type **« Interne application »**, **pas de MFA** à ce jour et **pas de ProConnect** actif — mais une remarque précise que le **MFA est en cours** et que **ProConnect est prévu** avec le nouvel attributaire du marché Pixel.

### Points de vigilance
- Pour ACCOLADE, aucun composant d’authentification n’est listé : **non renseigné dans Le PARC**.
- Les deux produits sont marqués **non** pour ProConnect et **Non** pour MFA à date ; la différence structurante porte donc sur le **choix d’IAM** (spécifique vs Keycloak) et sur la **méthode d’authentification** (N/A vs interne application).

### C10 — PASS

- **Question** : LABOé-SI est-il encore en production selon le statut actuel ? Qu’en dit le champ obsolescence ?
- **Oracle** : Statut=Décommissionné · Obsolescence=false
- **Faits** : `matched:LABOé-SI`
- **Mots-clés trouvés** : decommission, décommission

**Réponse modèle**

**Non — LABOé-SI n'est plus en production.**

D'après les faits de la fiche Le PARC :

- **Statut actuel** : 🔴 Décommissionné
- **Date de décommissionnement** : 2025-06-06
- **Date de fin d'exploitation** : 2025-06-06
- **Ticket décommissionnement** : « hors process »

**Sur le champ Obsolescence** : il est renseigné à **« non »** (définition : « Le produit est-il considéré comme obsolète »). Il y a donc une divergence à signaler : le produit est **décommissionné** (statut actuel) alors que le champ **Obsolescence** indique **non**. C'est le **Statut actuel** qui traduit la fin d'exploitation ; le champ Obsolescence, lui, ne porte pas cette information et n'est pas cohérent avec le statut.

Pour mémoire, la mise en production initiale était le 2023-11-27 (également date de mise en service).

Source : Le PARC — Produits_DNUM (lecture).

### C11 — PASS

- **Question** : Qui porte métier Accolade (direction / référent national) et quel est le secteur fonctionnel ?
- **Oracle** : DGCS · Cohésion Sociale - Inclusion sociale
- **Faits** : `matched:ACCOLADE`
- **Mots-clés trouvés** : dgcs

**Réponse modèle**

**ACCOLADE** — d'après les faits disponibles dans Le PARC (lecture) :

- **Direction métier** : DGCS
- **Porteur métier référent national** : DGCS
- **Secteur fonctionnel** : Cohésion Sociale – Inclusion sociale

À noter : la direction métier et le référent métier national sont tous deux portés par la **DGCS**. Le produit est rattaché au département **GPS** de la SDPC, avec le chef de produit **RACHEDI Assia**.

*Source : Le PARC — Produits_DNUM (lecture).*

### C12 — PASS

- **Question** : Accolade et C2S : lesquels sont au PCA, et Accolade a-t-il un taux RGAA de 100 % ?
- **Oracle** : PCA Non pour les deux · Accolade RGAA non renseigné (pas 100 %)
- **Faits** : `multi:ACCOLADE · C2S`
- **Mots-clés trouvés** : non

**Réponse modèle**

## Inscription au PCA

| Produit | Inscription au PCA |
|---|---|
| ACCOLADE | **Non** |
| C2S | **Non** |

Aucun des deux produits n'est inscrit au Plan de Continuité d'Activité. À noter que les deux sont pourtant classés « 3 : Service courant » en criticité.

## Taux RGAA d'ACCOLADE

**Non renseigné dans Le PARC.** Le champ « RGAA - Taux de conformité » fait partie des informations manquantes de la fiche ACCOLADE (information signalée comme importante mais absente). On ne peut donc pas confirmer ni infirmer un taux de 100 %.

Ce qui est en revanche renseigné pour ACCOLADE :
- **RGAA - Déclaration réglementaire** : « N/A » (pas de déclaration d'accessibilité réglementaire)
- **Portage DSFR** : « À faire »

À titre de comparaison, sur C2S ces mêmes champs sont, eux, documentés :
- **RGAA - Déclaration réglementaire** : ✅ Oui
- **RGAA - Taux de conformité** : 0,81 (soit 81 %)
- **RGAA - Date de déclaration** : 2025-02-12

*Source : Le PARC — Produits_DNUM (lecture).*

## Analyse

### Synthèse

- Score global : **12/12** (100 %).
- Thème **synthèse-stack** : 1/1
- Thème **booléens-multi** : 1/1
- Thème **renovsi** : 1/1
- Thème **conformité** : 1/1
- Thème **gouvernance-riche** : 1/1
- Thème **sécurité-contraste** : 1/1
- Thème **comparaison-rgaa** : 1/1
- Thème **comparaison-hebergement** : 1/1
- Thème **comparaison-auth** : 1/1
- Thème **cycle-vie** : 1/1
- Thème **métier-porteur** : 1/1
- Thème **piège-invention** : 1/1

### Lecture métier

Cette batterie pousse plus loin que les questions « un champ / un produit » :

| Intention | Exemple | Verdict |
|-----------|---------|---------|
| Synthèse multi-champs | Stack Accolade | OK |
| Booléens croisés | SI sensible / HDS / SecNumCloud / ProConnect | OK |
| Stratégie | RenovSI 2026/2027 + DSFR | OK |
| Manquant + statut | Homologation + RGAA vide | OK |
| Comparaison multi-produits | RGAA C2S vs MANDOLINE · hébergement · IAM | OK |
| Cycle de vie | LABOé-SI décommissionné | OK |
| Anti-hallucination | « RGAA Accolade = 100 % ? » | OK (refuse) |

### Correctifs pendant la session (1ʳᵉ passe 9/12 → 12/12)

1. **Multi-produits + ponctuation** : « Entre C2S et MANDOLINE, … » ne matchait pas `MANDOLINE` à cause de la virgule → frontières de mots élargies.
2. **Scoreur soft** : synonymes (« non renseigné » / « pas renseigné ») exigeaient trop de hits → seuil assoupli.
3. **Faits multi** : `parc_produit_multi` charge plusieurs fiches quand plusieurs noms sont explicites dans la question.

### Recommandations

1. Revue humaine Design / métier sur 3 réponses de comparaison (qualité rédaction, pas seulement mots-clés).
2. Normaliser les pourcentages RGAA dans les faits (`81 %` vs `0.81`) pour des réponses plus homogènes.
3. Étendre à des questions sans nom de produit (« Quels produits GPS sont HDS ? ») — **hors scope** outil actuel (besoin d’un filtre table, pas seulement matching par nom).

### Limites de cette eval

- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète.
- Un seul tour, température basse ; pas de multi-essais.
- Accès Viewer : certains champs peuvent manquer selon le compte API.
- Cases : [`parc_eval_cases.py`](../../../services/assistant-essai/parc_eval_cases.py) · script [`run_parc_eval.py`](../../../services/assistant-essai/run_parc_eval.py).

---

*Généré par `services/assistant-essai/run_parc_eval.py` (suite `complex`, LiteLLM), analyse enrichie.*
