# Prestation / CRA

[← Documentation](../../README.md) › **CRA**

> **Route** : `/cra` (liste Admin) · `/cra/declarer` (déclaration freelance) · `/cra/revue-equipe` (revue manager)  
> **Studio** : Produit / Tech

## Objet métier

Une **réalisation** (ligne `Realise`) décrit le travail d’un intervenant sur une période (jours, tâches, rattachements mission / BDC / produit).

| Outil | Rôle |
|-------|------|
| **Grist** (`Realise` + référentiels) | Référentiel |
| **Ce widget** | Liste transversale **lecture** (`/cra`) ; **déclaration** freelance (`/cra/declarer`) ; **revue équipe** + rattachement BDC (`/cra/revue-equipe`) ; **récap porteurs** (`/outils/recap-porteurs`) ; CRA aussi visibles en dépliable sur fiche mission / dépenses BDC |
| **App sœur** | Liste + create/edit + récap porteurs (drawer) + Malt |

## Données Grist

| Table | Usage |
|-------|--------|
| `Realise` | Lignes CRA (lazy via `useMissionsData` sur `/cra` ; create/update sur `/cra/declarer`) |
| `Equipe` | Libellés intervenants ; **`Portage`** pour le récap porteurs ; identité « moi » pour la déclaration |
| `Missions` / `Missions_enfants` | Libellés + liens mission ; filtre prestations pour la déclaration |
| `Tableau_de_pilotage_SDPC_Produits_SDPC` | Libellés produit |
| `BDC` | Libellés / liens BDC (déjà chargé au boot) |

Chargement **lazy** sur `/cra` et `/cra/declarer` (mêmes tables que `/missions`). Allowlist : `fetchTableAllowlist.ts`. Accès **full** requis.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/cra` |
| Déclarer mon CRA | [declaration.md](declaration.md) | `/cra/declarer` |
| Revue CRA équipe | [revue-equipe.md](revue-equipe.md) | `/cra/revue-equipe` |
| Récap porteurs | [recap-porteurs.md](recap-porteurs.md) | `/outils/recap-porteurs` |

## Écarts vs l’app

- Liste `/cra` : **lecture seule** Admin (`Page_cra`)
- Déclaration V1 : create/update `Realise` (jours + description) — pas de workflow relecture formelle
- Revue équipe V1 (#70) : update `Nb_jours` / `Taches_realisees` / `BDC_cible` pour le département du manager
- Récap porteurs en **page** sous Outils (l’app sœur utilise un drawer depuis `/cra`) — [#48](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/48)
- Pas de rapprochement Malt
- Pas de tri colonnes cliquable (MVP filtres + pagination)
- Complète (ne remplace pas) les CRA dépliables fiche mission
- Access Rules `Realise` (mur données freelance / département) : **fait** (#47 / #70 HITL 2026-09-21)