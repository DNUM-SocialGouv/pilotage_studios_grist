# Missions studio

[← Documentation](../../README.md) › **Missions**

> **Routes** : `/missions`, `/missions/:id`  
> **Studio** : Produit / Tech

## Objet métier

Une **mission master** (`Missions`) est un lot d’accompagnement (contexte, produit, statut). Les **enfants** (`Missions_enfants`) portent le staffing (`Mission_parent` → master, **`Titre_de_la_prestation`** — équivalent de `Nom_de_la_mission` sur le master ; fallbacks lecture : `Libelle`, colonne texte `Mission_enfant`). Les lignes CRA (`Realise`) se rattachent d’abord à l’enfant (`Realise.Mission_enfant`, **référence** — homonyme du texte `Missions_enfants.Mission_enfant`), sinon au master (`Realise.Missions`).

| Outil | Rôle |
|-------|------|
| **Grist** (`Missions`, `Missions_enfants`, `Realise`, `Equipe`, produits SDPC) | Référentiel |
| **Ce widget** | Liste / fiche + **drawer** create/edit master + **drawer** create/edit prestations |
| **App sœur** | Parité drawer + CSV, IA — [doc missions app](https://github.com/DNUM-SocialGouv/pilotage_studios/blob/main/docs/fonctionnel/missions/README.md) |

## Données Grist

| Table | Usage |
|-------|--------|
| `Missions` | Lignes liste / fiche (masters) ; **écriture** create + update (drawer Nom / Produit / Statut ; Note studio `Suivi_resp_studio` ; Docs `Docs` via panneau Contexte) |
| `Missions_enfants` | Prestations ; **écriture** create + update (drawer fiche ; 1ʳᵉ prestation optionnelle à la création mission) |
| `Equipe` | Libellés intervenants / équipe |
| `Tableau_de_pilotage_SDPC_Produits_SDPC` | Libellés produit |
| `Realise` | Agrégats jours / TTC + réalisations fiche |
| `BDC` | Liens BDC sur l’onglet CRA (déjà chargé au boot) |

Écriture **uniquement** via `grist.getTable` dans l’iframe (pas de clé API) — voir [`SECURITY.md`](../../../SECURITY.md) et `writeTableAllowlist.ts`.

Chargement **lazy** sur `/missions` uniquement (`useMissionsData`) — pas au boot widget, **indépendant** du chargement REST BDC. Allowlist lecture : `src/security/fetchTableAllowlist.ts`. Accès **full** obligatoire pour `fetchTable` et écriture.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/missions` |
| Fiche | [fiche.md](fiche.md) | `/missions/:id` |

## Écarts vs l’app

- Drawer master **slim** (Nom · Produit · Statut) ; drawer prestation **slim** (Titre · Intervenant · Jours · Statut · Date de début) — pas d’édition inline des champs **Contexte** ; **Note studio** éditable sur place (textarea Markdown) ; **Docs** ajout / détachement dans la colonne Contexte
- `Type_prestation` figé Freelance à la création, non éditable / non affiché (forfait = [#36](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/36))
- Pas de `Date_de_fin` prestation (hypothèse CRA = [#37](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/37))
- Pas d’IA (rapport d’investissement, CR, estimation)
- Pas d’export CSV
- Pas de **delete** widget sur missions / prestations
- Liste ISO #216/#218/#219 + drawer [#227](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/227)
- Fiche ISO #222 / #224 / #225 + bouton **modifier** (drawer edit) + CRUD prestations [#31](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31)
- Produits encore stub ; écran **Équipe** = `/equipe` (lien croisé depuis la fiche personne vers `/missions/:id` ; pas encore l’inverse depuis la fiche mission)
- Contexte / note studio : formatage léger (titres `#`–`######`, paragraphes, listes `*` / `-` / `1.`, tableaux GFM, gras `**…**`, liens Markdown http(s) — pas de HTML brut) ; pièces jointes `Docs` dans l’onglet **Contexte** (colonne droite) : télécharger, ajouter, détacher (pas de purge fichier document) ; note éditable sur place (pas de WYSIWYG)
