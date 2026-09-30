# Weekly coachs

## En clair

Écran de **synchro** pour la team Product Ops et les coachs : un kanban des
**missions** (titres issus de Grist) et une liste de **sujets à aborder** partagée.
La phase du kanban et l’agenda vivent dans des **tables satellites** — on ne
modifie pas les colonnes de `Missions` / `Missions_enfants`. Le lien CRA viendra
plus tard.

## Route & accès

| | |
|--|--|
| Route | `/weekly` |
| Nav | **Weekly** (niveau 1) |
| Accès | Hors `Page_*` : Admin · Responsable de département · Freelance (`WeeklyCoachRoleGuard`) |
| Invité | Masqué |

## Données

| Table | Rôle |
|-------|------|
| `Missions` | Lecture — titre carte (`Nom_de_la_mission`), statut, département, produit, `Meteo` |
| `Missions_enfants` | Lecture — intervenants sur la carte |
| `Equipe` | Lecture — noms intervenants |
| Produits SDPC | Lecture — libellé produit |
| **`Weekly_phase`** | Create + update — 1 ligne / mission : `Mission` (Ref) · `Phase` (`prochainement` \| `cadrage` \| `actif` \| `autonomie`) |
| **`Weekly_agenda`** | Create + update `Traite` — sujets : `Texte` · `Auteur` · `Email` · `Mission` (opt.) · `Traite` · `Cree_le` |

### Règles kanban

- 1 carte = 1 mission.
- Sans ligne `Weekly_phase` : colonne **Prochainement**, sauf `Statut === "Terminé"` → **Terminé** (heuristique lecture seule).
- Changement de phase (menu accessible ou glisser-déposer) → upsert `Weekly_phase` uniquement.
- Lien « Ouvrir la fiche mission » → `/missions/:id` (navigue, ne modifie pas la fiche).

## Hors scope (ce bolt)

Timer weekly, clôture / historique, suivi perso, fiche Weekly dédiée, écriture
`Meteo` / bloquant sur `Missions`, CRA.

## ACL (HITL Owner — UI Grist uniquement)

Même jeu de règles sur **`Weekly_phase`** et **`Weekly_agenda`** (ressource `*` /
Toutes). Ordre : du plus spécifique au défaut. **`OWNER` sans guillemets**.

| # | Condition (coller tel quel) | Droits | Mémo UI |
|---|----------------------------|--------|---------|
| 1 | `user.Access == OWNER or user.Equipe.Role_ACL == "Admin"` | `+CRUD` | Owner / Admin : ménage (dont suppression des doublons de phase). |
| 2 | `user.Equipe.Role_ACL == "Responsable de département" or user.Equipe.Role_ACL == "Freelance"` | `+CRU` | Coachs : lire, créer, modifier ; pas de delete. |
| 3 | `True` | `-CRUD` | Invité et autres : aucun accès. |

User Attribute `Equipe` déjà requis. Après pose : View As Freelance / Invité / Admin.
