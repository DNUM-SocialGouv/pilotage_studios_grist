# Missions studio

[← Documentation](../../README.md) › **Missions**

> **Routes** : `/missions`, `/missions/:id`  
> **Studio** : Produit / Tech

## Objet métier

Une **mission master** (`Missions`) est un lot d’accompagnement (contexte, produit, statut). Les **enfants** (`Missions_enfants`) portent le staffing (`Mission_parent` → master, `Mission_enfant` = libellé texte). Les lignes CRA (`Realise`) se rattachent d’abord à l’enfant (`Realise.Mission_enfant`, **référence** — homonyme du texte `Missions_enfants.Mission_enfant`), sinon au master (`Realise.Missions`).

| Outil | Rôle |
|-------|------|
| **Grist** (`Missions`, `Missions_enfants`, `Realise`, `Equipe`, produits SDPC) | Référentiel |
| **Ce widget** | Liste / fiche **lecture seule** |
| **App sœur** | Création, édition, CSV, IA — [doc missions app](https://github.com/DNUM-SocialGouv/pilotage_studios/blob/main/docs/fonctionnel/missions/README.md) |

## Données Grist

| Table | Usage |
|-------|--------|
| `Missions` | Lignes liste / fiche (masters) |
| `Missions_enfants` | Prestations : `Mission_parent` (ref), `Mission_enfant` (texte, ex-`Libelle`) |
| `Equipe` | Libellés intervenants / équipe |
| `Tableau_de_pilotage_SDPC_Produits_SDPC` | Libellés produit |
| `Realise` | Agrégats jours / TTC + réalisations fiche |
| `BDC` | Liens BDC sur l’onglet CRA (déjà chargé au boot) |

Chargement **lazy** sur `/missions` uniquement (`useMissionsData`) — pas au boot widget, **indépendant** du chargement REST BDC. Allowlist : `src/security/fetchTableAllowlist.ts`. Accès **full** obligatoire pour `fetchTable`.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/missions` |
| Fiche | [fiche.md](fiche.md) | `/missions/:id` |

## Écarts vs l’app

- Pas d’écriture (drawers, CRUD enfants, édition inline, upload PJ)
- Pas d’IA (rapport d’investissement, CR, estimation)
- Pas d’export CSV, pas de `?vue=nouvelles-demandes`
- Liste : pas de colonne Intervenant (filtre conservé), expand aligné, pas de sticky / badge statut
- Produits et intervenants en **texte** (écrans encore stub)
- Contexte en texte préformaté (pas de rendu Markdown)
