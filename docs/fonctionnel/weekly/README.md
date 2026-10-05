# Weekly Ops

## En clair

Écran de **synchro** pour la team Product Ops et les coachs : un kanban des
**missions** (titres issus de Grist) et une liste de **sujets à aborder** partagée.
Un **clic sur la carte** ouvre un **tiroir** (météo, membre équipe, note,
échanges liés). La phase, le suivi ops et l’agenda vivent dans des **tables
satellites Weekly** — on ne modifie **pas** les colonnes de `Missions` /
`Missions_enfants`. Le lien CRA viendra plus tard.

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
| `Missions` | Lecture seule — titre carte (`Nom_de_la_mission`), statut, département, produit (**pas** d’écriture suivi ops) |
| `Missions_enfants` | Lecture — intervenants sur la carte |
| `Equipe` | Lecture — noms intervenants |
| Produits SDPC | Lecture — libellé produit |
| **`Weekly_phase`** | Create + update — 1 ligne / mission : `Mission` (Ref) · `Phase` (`prochainement` \| `cadrage` \| `actif` \| `autonomie`) · `Meteo` · `Note_ops` · `Membre_equipe` (Ref → `Equipe`) |
| **`Weekly_agenda`** | Create + update `Traite` / `Texte` (titre) / `Detail` / `Mission` — sujets : `Texte` (titre) · `Detail` (opt., drawer) · `Auteur` · `Email` · `Mission` (opt.) · `Traite` · `Cree_le` |
| **`Weekly_coachs`** | Lecture widget (allowlist) — `E_mail` ; écriture **hors widget** (Owner / Admin UI) |

### Cartes kanban (variante A)

| UI | Source |
|----|--------|
| Carte entière (clic / clavier) | Ouvre le drawer suivi — titre texte (pas de lien) |
| Titre | Lecture `Missions.Nom_de_la_mission` |
| Badge météo (coin) | `Weekly_phase.Meteo` — pastille tonée + icône (absent si vide) |
| Membre + avatar | `Weekly_phase.Membre_equipe` → avatar carré (`EquipeAvatar`) + **prénom seul** — **absent** si non assigné |
| Indicateur note | Icône (style Trello) si `Weekly_phase.Note_ops` non vide — **pas** le texte sur la carte |
| Phase | **Colonne** kanban uniquement — **pas** de select Phase sur la carte |

### Drawer suivi mission (V1)

| UI | Source |
|----|--------|
| Titre | Lecture `Missions.Nom_de_la_mission` |
| Phase | Badge lecture = colonne kanban (`Weekly_phase.Phase`) — **pas** de select |
| Météo | `Weekly_phase.Meteo` — 3 boutons : **Au vert** · **À surveiller** · **En difficulté** (icônes soleil / nuage / orage) |
| Membre équipe | `Weekly_phase.Membre_equipe` (Ref → `Equipe`, select annuaire) |
| Note ops | `Weekly_phase.Note_ops` (markdown léger) |
| Derniers échanges | `Weekly_agenda` filtrés par mission + Voir / Nouveau sujet |
| Lien fiche | Navigation `/missions/:id` (secondaire) — **pas** de sync note/météo |

**Hors V1** : point bloquant · actions structurées · timer · clôture.

**Colonnes ops** (confirmées MCP 2026-10-05, doc `nei9DeARs5Eo`) :

| Colonne (`colId`) | Table | Type | Usage |
|-------------------|-------|------|-------|
| `Meteo` | `Weekly_phase` | TEXT | Libellés métier : `Au vert` · `À surveiller` · `En difficulté` (anciens Calme/Nuageux/Orageux normalisés à la lecture) |
| `Note_ops` | `Weekly_phase` | TEXT | Note markdown |
| `Membre_equipe` | `Weekly_phase` | INTEGER (Ref → `Equipe`) | Membre équipe (libellé UI « Membre équipe ») |

Flag `WEEKLY_PHASE_OPS_COLUMNS_READY = true`. **Aucune** colonne / écriture sur `Missions`. Coach texte libre **annulé** (remplacé par `Membre_equipe`).

### Agenda (sujets)

| UI | Colonne Grist |
|----|---------------|
| **Titre** (liste + drawer + create) | `Texte` |
| **Détail** (drawer lecture / édition + create optionnel — **pas** dans la liste) | `Detail` (TEXT, markdown léger) — active |
| **Mission liée** (create + édition drawer) | `Mission` (Ref → `Missions`, optionnel) |
| Méta liste / drawer | `Auteur` (prénom) · `Cree_le` (date relative) · `Traite` |

- Section **Sujets à aborder** : liste d’abord ; CTA **« Nouveau sujet »** dans l’**en-tête** (option B) — **pas** de formulaire permanent sous la liste.
- Liste compacte : **titre** + méta `Prénom · date relative` (+ lien mission éventuel) + **Voir** / **Modifier** — pas le détail.
- Drawer lecture : titre, détail (`MissionProse` — markdown léger + liens internes), mission (lien fiche), méta date / auteur.
- Drawer édition : titre, détail optionnel (textarea markdown), select mission → **Enregistrer**.
- Drawer **create** (même tiroir) : titre, détail, mission, prénom auteur → **Ajouter** ; focus titre à l’ouverture ; focus retour au CTA après fermeture create.
- État vide : message « Aucun sujet… » sous l’en-tête (CTA unique en en-tête).
- Champ auteur « Votre prénom » (create) : prérempli avec le **prénom seul** —
  1. `Equipe.Prenom_Nom` de la session (`firstNameFromDisplayName`) ;
  2. sinon premier segment de l’e-mail de session (avant `.` / `_` / `-`, pas `prenom.nom`).
- Flag code `WEEKLY_AGENDA_DETAIL_COLUMN_READY = true` (colonne `Detail` confirmée MCP doc `nei9DeARs5Eo`).

### Règles kanban

- 1 carte = 1 mission.
- Sans ligne `Weekly_phase` : colonne **Prochainement**, sauf `Statut === "Terminé"` → **Terminé** (heuristique lecture seule).
- Changement de phase = **glisser-déposer** vers une autre colonne → upsert `Weekly_phase` uniquement (pas de select Phase carte/drawer).
- Clic **carte** (clavier Enter/Espace) → drawer suivi (SM) ; lien fiche **dans** le drawer (secondaire).
- Badge météo carte : `Weekly_phase.Meteo` seulement (jamais `Missions.Meteo` pour le suivi ops).

## Hors scope (ce bolt)

Timer weekly, clôture / historique, point bloquant, actions structurées, écriture
`Meteo` / note / coach sur `Missions`, CRA. Colonne Équipe dédiée (modèle plus global plus tard).

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
