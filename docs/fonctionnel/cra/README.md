# Prestation / CRA

[← Documentation](../../README.md) › **CRA**

> **Route** : `/cra`  
> **Studio** : Produit / Tech

## Objet métier

Une **réalisation** (ligne `Realise`) décrit le travail d’un intervenant sur une période (jours, tâches, rattachements mission / BDC / produit).

| Outil | Rôle |
|-------|------|
| **Grist** (`Realise` + référentiels) | Référentiel |
| **Ce widget** | Liste transversale **lecture** (`/cra`) ; **récap porteurs** (`/outils/recap-porteurs`) ; CRA aussi visibles en dépliable sur fiche mission / dépenses BDC |
| **App sœur** | Liste + create/edit + récap porteurs (drawer) + Malt |

## Données Grist

| Table | Usage |
|-------|--------|
| `Realise` | Lignes CRA (lazy via `useMissionsData` sur `/cra`) |
| `Equipe` | Libellés intervenants ; **`Portage`** pour le récap porteurs |
| `Missions` / `Missions_enfants` | Libellés + liens mission |
| `Tableau_de_pilotage_SDPC_Produits_SDPC` | Libellés produit |
| `BDC` | Libellés / liens BDC (déjà chargé au boot) |

Chargement **lazy** sur `/cra` (mêmes tables que `/missions`). Allowlist : `fetchTableAllowlist.ts`. Accès **full** requis.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/cra` |
| Récap porteurs | [recap-porteurs.md](recap-porteurs.md) | `/outils/recap-porteurs` |

## Écarts vs l’app

- **Lecture seule** — pas de create / edit / delete (#33)
- Récap porteurs en **page** sous Outils (l’app sœur utilise un drawer depuis `/cra`) — [#48](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/48)
- Pas de rapprochement Malt
- Pas de tri colonnes cliquable (MVP filtres + pagination)
- Complète (ne remplace pas) les CRA dépliables fiche mission
