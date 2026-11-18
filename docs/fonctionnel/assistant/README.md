# Assistant Pilotage — questions sur les données

## En clair

Un **tiroir** accessible depuis n’importe quel écran permettra de poser des questions en langage courant sur les données déjà saisies (missions, bons de commande, produits) : budget consommé, reste à consommer, infos utiles. Les réponses restent en **lecture seule**, avec les **mêmes droits** que la personne connectée. On commence par un **essai** (service hors widget + base Grist de test) ; si l’usage se confirme, bascule vers un serveur dédié.

## Statut

| | |
|--|--|
| **État** | Essai — chat sur **l’accueil** (+ tiroir ailleurs) ; outil mission (#140) : faits jours/TTC par **nom** de mission (règle prestation) |
| **Issues** | Cadre [#137](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/137) · Service essai [#138](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/138) · Tiroir [#139](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/139) · Mission [#140](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/140) · BDC [#141](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/141) · Produit [#142](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/142) · Contexte page [#143](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/143) · Affichages [#144](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/144) · Droits [#145](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/145) |
| **Kanban** | Clé `assistant-pilotage` (feuille de route) |
| **Branche** | `feat/assistant-outil-mission` |

## Base Grist de test

| | |
|--|--|
| **Document** | `Pilotage_studio_16-11` |
| **docId** | `iAEEspLuAiuP` |
| **Usage** | Toute expérimentation assistant / alignement schéma **avant** la prod (`nei9DeARs5Eo`) |
| **Merge** | Valider sur cette base → puis reporter / merger vers le document de pilotage V2 |

Le widget d’essai (URL localhost ou Pages de branche) doit être branché sur **ce** document dans Grist (Custom Widget → URL → Select Data = `Plan_activite`).

### Alignement schéma (2026-11-18 — Plan A)

| Contrôle | Résultat |
|----------|----------|
| Table `Prestations` (ex-`Missions_enfants`) | **OK** — 427 lignes |
| Table `Missions_enfants` | Absente |
| Jointure `Realise.Prestation` → `Prestations` | **OK** (`Ref:Prestations` · titres sur échantillon) |
| Colonnes mortes B (`MAJ_ST`, `URL_espace_collaboratif`, `UUID2`) | **Absentes** (aligné prod) · `UUID` **conservé** |
| Orphelins `Realise.Prestation` | **14** lignes ops (TTC 0) **exclues du calcul** · 3 CRA Charlotte rattachés (557→131, 589/647→56) |

### Smoke données (MCP, 2026-11-18)

| Table | Lignes (test) | Prod (réf.) |
|-------|---------------|-------------|
| `Plan_activite` | 13 | 13 |
| `Missions` | 138 | 138 |
| `Prestations` | 427 | 427 |
| `BDC` | 98 | 100 (dérive mineure) |
| `Realise` | 1119 | 1121 (dérive mineure) |
| `Equipe` | 89 | 89 |
| Orphelins `Prestation` vide | 14 | 14 |

Cœur mission / prestation / Realise / BDC : **aligné** (schéma B + orphelins traités).  
Smoke **UI** (manuel) : widget → ce document → Missions + fiche + un CRA — à rejouer après merge branche essai.  
Contrat de chiffres (prérequis #140–#142) : [contrat-chiffres.md](contrat-chiffres.md).  
Service d’essai + **checklist de relance Onyxia** : [service-essai.md](service-essai.md) · tiroir widget : [tiroir.md](tiroir.md) · code serveur [`services/assistant-essai/`](../../../services/assistant-essai/).

## Périmètre V0 (rappel)

- Lecture seule ; pas d’écriture Grist via le chat
- Entrée : tiroir global (pas la page Analyse seule)
- Premières questions : mission (budget / conso), BDC (reste), produit (infos / missions liées)
- Chiffres calculés côté outils métier, pas inventés par le modèle
- Service d’essai (Onyxia + accès modèles) hors bundle ; aucune clé dans le navigateur

## Hors scope (V0)

- Tableaux / graphiques dans le fil (voir #144, second temps)
- SQL libre / « toute la base »
- Haute dispo production
- Clé API Grist « admin » pour contourner les droits

## Documents liés

- Cadre sécurité secrets : [`SECURITY.md`](../../../SECURITY.md)
- Matrice rôles (quand le tiroir sera branché) : [`../roles/matrice-droits.md`](../roles/matrice-droits.md)
- Issues publiques : [`../../issues-publiques.md`](../../issues-publiques.md)
