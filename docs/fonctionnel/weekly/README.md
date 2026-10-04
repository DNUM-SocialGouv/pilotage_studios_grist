# Weekly Ops

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
| Nav | **Weekly Ops** (niveau 1) |
| Accès | Hors `Page_*` : **uniquement** les personnes dont l’e-mail est dans **`Weekly_coachs`** (Admin, Resp. ou Freelance hors liste → pas d’accès) |
| Autres | Masqué |

Les e-mails **ne sont pas** dans le dépôt git : uniquement dans Grist
(`Weekly_coachs.E_mail`). Owner / Admin (rôle) maintiennent la liste dans l’UI Grist
— cela n’ouvre **pas** l’écran Weekly Ops s’ils ne sont pas eux-mêmes dans la table.

## Affichage (clair / sombre)

Fonds de colonnes et cartes : tokens DSFR (`background-contrast-*`,
`background-default-grey`, `text-label-*`, `text-mention-grey`, `fr-hint-text`).
Pas de couleurs hex « papier » figées — le thème sombre reste lisible.

## Données

| Table | Rôle |
|-------|------|
| `Missions` | Lecture — titre carte (`Nom_de_la_mission`), statut, département, produit, `Meteo` |
| `Missions_enfants` | Lecture — intervenants sur la carte |
| `Equipe` | Lecture — noms intervenants |
| Produits SDPC | Lecture — libellé produit |
| **`Weekly_phase`** | Create + update — 1 ligne / mission : `Mission` (Ref) · `Phase` (`prochainement` \| `cadrage` \| `actif` \| `autonomie`) |
| **`Weekly_agenda`** | Create + update `Traite` / `Texte` — sujets : `Texte` · `Auteur` · `Email` · `Mission` (opt.) · `Traite` · `Cree_le` |
| **`Weekly_coachs`** | Lecture widget (allowlist) — `E_mail` ; écriture **hors widget** (Owner / Admin UI) |

### Agenda (sujets)

- Liste : texte, auteur, **date de création** (`Cree_le`), mission liée éventuelle.
- Actions : **Voir** / **Modifier** le contenu (`Texte`) dans une modale DSFR (`<dialog>`).
- Champ auteur « Votre prénom » : prérempli avec le **prénom seul** —
  1. `Equipe.Prenom_Nom` de la session (`firstNameFromDisplayName`) ;
  2. sinon premier segment de l’e-mail de session (avant `.` / `_` / `-`, pas `prenom.nom`).

### Règles kanban

- 1 carte = 1 mission.
- Sans ligne `Weekly_phase` : colonne **Prochainement**, sauf `Statut === "Terminé"` → **Terminé** (heuristique lecture seule).
- Changement de phase (menu accessible ou glisser-déposer) → upsert `Weekly_phase` uniquement.
- Lien « Ouvrir la fiche mission » → `/missions/:id` (navigue, ne modifie pas la fiche).

## Hors scope (ce bolt)

Timer weekly, clôture / historique, suivi perso, fiche Weekly dédiée, écriture
`Meteo` / bloquant sur `Missions`, CRA. Colonne Équipe dédiée (modèle plus global plus tard).

## ACL (HITL Owner — UI Grist uniquement)

### Prérequis — User Attribute

Access Rules → **User Attributes** :

| Name | Attribute | Lookup table | Column |
|------|-----------|--------------|--------|
| `Weekly_coach` | `user.Email` | `Weekly_coachs` | `E_mail` |

### Table `Weekly_coachs` (`*` / Toutes)

| # | Condition | Droits | Mémo |
|---|-----------|--------|------|
| 1 | `user.Access == OWNER or user.Equipe.Role_ACL == "Admin"` | `+CRUD` | Owner / Admin : **gérer la liste** (pas l’écran Weekly Ops). |
| 2 | `user.Email == rec.E_mail` | `+R` | Chacun ne lit **que sa** ligne (le widget vérifie la présence). |
| 3 | `True` | `-CRUD` | Autres : aucun accès. |

### Tables `Weekly_phase` et `Weekly_agenda` (`*` / Toutes)

Ordre 1 → 3. **`OWNER` sans guillemets**. Pas d’accès automatique Admin / Resp. par rôle.  
**Appliqué** Owner UI (vérif MCP 2026-10-03).

| # | Condition | Droits | Mémo |
|---|-----------|--------|------|
| 1 | `user.Access == OWNER` | `+CRUD` | Owner document : ménage (doublons, etc.). |
| 2 | `user.Email == user.Weekly_coach.E_mail` | `+CRUD` | Listé dans `Weekly_coachs` (lookup réussi) — préférer à `!= ""` (plus sûr en View As). |
| 3 | `True` | `-CRUD` | Tout le reste (y compris Admin hors liste) : aucun accès. |

Après pose : View As une personne listée / un Admin hors liste / Invité.
