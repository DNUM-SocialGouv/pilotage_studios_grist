# Assistant Pilotage — questions sur les données

## En clair

Un **tiroir** accessible depuis n’importe quel écran permettra de poser des questions en langage courant sur les données déjà saisies (missions, bons de commande, produits) : budget consommé, reste à consommer, infos utiles. Les réponses restent en **lecture seule**, avec les **mêmes droits** que la personne connectée. On commence par un **essai** (service hors widget + base Grist de test) ; si l’usage se confirme, bascule vers un serveur dédié.

## Statut

| | |
|--|--|
| **État** | Préparation — service d’essai scaffoldé (`services/assistant-essai/`) ; tiroir widget pas encore branché |
| **Issues** | Cadre [#137](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/137) · Service essai [#138](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/138) · Tiroir [#139](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/139) · Mission [#140](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/140) · BDC [#141](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/141) · Produit [#142](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/142) · Contexte page [#143](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/143) · Affichages [#144](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/144) · Droits [#145](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/145) |
| **Kanban** | Clé `assistant-pilotage` (feuille de route) |
| **Branche** | `feat/assistant-pilotage-essai` |

## Base Grist de test

| | |
|--|--|
| **Document** | `Pilotage_studio_16-11` |
| **docId** | `iAEEspLuAiuP` |
| **Usage** | Toute expérimentation assistant / alignement schéma **avant** la prod (`nei9DeARs5Eo`) |
| **Merge** | Valider sur cette base → puis reporter / merger vers le document de pilotage V2 |

Le widget d’essai (URL localhost ou Pages de branche) doit être branché sur **ce** document dans Grist (Custom Widget → URL → Select Data = `Plan_activite`).

### Alignement schéma (2026-11-17)

| Contrôle | Résultat |
|----------|----------|
| Table `Prestations` (ex-`Missions_enfants`) | **OK** — ~427 lignes |
| Table `Missions_enfants` | Absente (renommée) |
| Jointure `Realise.Prestation` → `Prestations` | **OK** — titres trouvés sur échantillon |
| « Orphelins » `Realise.Prestation` | 17 lignes avec `Prestation = 0` (ref vide) — **préexistant**, pas un effet du renommage |

### Smoke données (MCP, 2026-11-17)

| Table | Lignes |
|-------|--------|
| `Plan_activite` | 13 |
| `Missions` | 138 |
| `Prestations` | 427 |
| `BDC` | 98 |
| `Realise` | 1119 |
| `Equipe` | 89 |

Smoke **UI** (manuel) : widget → ce document → Missions + fiche + CRA.  
Service d’essai : [service-essai.md](service-essai.md) · code [`services/assistant-essai/`](../../../services/assistant-essai/).

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
