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

## ACL (HITL Owner)

Les tables satellites sont créées ; les **Access Rules** (lecture + C/U pour les
rôles concernés, pas de delete widget) restent à poser / vérifier côté Owner UI
Grist — pas via le widget.
