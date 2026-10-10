# Weekly Ops

## En clair

Écran de **synchro** pour la team Product Ops et les coachs, organisé en
**trois onglets** : **Sujets** à aborder, **Actions** (kanban À faire /
En cours / Done), et **Kanban** des missions. Un **clic sur une carte** du kanban ouvre un **tiroir** (météo,
**un ou plusieurs** membres équipe Ops, note, échanges liés). La phase, le
suivi ops, l’agenda et les actions vivent dans des **tables satellites Weekly**
— on ne modifie **pas** les colonnes de `Missions` / `Missions_enfants`.
Le lien CRA viendra plus tard.

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

## Mise en page (onglets V1)

Sur `/weekly`, **Tabs DSFR** (pattern fiches BDC / Missions) — **pas** un
SegmentedControl Sujets|Actions seul :

| Onglet | Contenu |
|--------|---------|
| **Sujets** | Liste agenda + sous-nav SegmentedControl **À faire \| Historique** (sujets traités) |
| **Actions** | Kanban 3 colonnes **À faire \| En cours \| Done** + drawer create / édition |
| **Kanban** | Board missions (phases `Weekly_phase`) — **plus** affiché en permanence au-dessus |

**Pas en V1** : 4ᵉ onglet **Historique** global (sujets + actions) — prévu plus
tard ; l’historique sujets reste **sous** l’onglet Sujets d’ici là.

Accessibilité : clavier (flèches / tabulation DSFR Tabs), `aria-selected` sur
l’onglet actif, **un seul** panneau visible à la fois.

## Affichage (clair / sombre)

Fonds de colonnes et cartes : tokens DSFR (`background-contrast-*`,
`background-default-grey`, `text-label-*`, `text-mention-grey`, `fr-hint-text`).
Pas de couleurs hex « papier » figées — le thème sombre reste lisible.

## Données

| Table | Rôle |
|-------|------|
| `Missions` | Lecture seule — titre carte (`Nom_de_la_mission`), statut, département, produit (**pas** d’écriture suivi ops) |
| `Missions_enfants` | Lecture — intervenants sur la carte |
| `Equipe` | Lecture — noms / avatars ; `E_mail` pour jointure porteurs Ops ↔ `Weekly_coachs` (si Access Rules le livrent) |
| Produits SDPC | Lecture — libellé produit |
| **`Weekly_phase`** | Create + update — 1 ligne / mission : `Mission` (Ref) · `Phase` (`prochainement` \| `cadrage` \| `actif` \| `autonomie`) · `Meteo` · `Note_ops` · `Membre_equipe` (RefList → `Equipe`) |
| **`Weekly_agenda`** | Create + update `Traite` / `Traite_le` / `Texte` (titre) / `Detail` / `Mission` — sujets : `Texte` (titre) · `Detail` (opt., drawer) · `Auteur` · `Email` · `Mission` (opt.) · `Traite` · `Traite_le` (Date, jour du coche) · `Cree_le` |
| **`Weekly_action`** | Create + update + **delete** (exception widget) — actions Ops (kanban + drawer SM create / édition) : `Titre` · `Statut` (`A faire` \| `En cours`) · `Porteur` (Ref→Equipe) · `Mission` (opt.) · **`Sujet`** (opt., Ref→`Weekly_agenda` — **HITL Owner**, flag `WEEKLY_ACTION_SUJET_COLUMN_READY`) · `Date_fin` · `Weekly_du` · `Notes` · `Fait` · `Fait_le` · `Cree_le` · `Email` ; delete **une** ligne après confirmation (menu ⋮ carte + bouton drawer) — **pas** de delete en masse ; **Lier** depuis carte Kanban / sujet (Créer pré-lié ou Rattacher) |
| **`Weekly_coachs`** | Lecture widget (allowlist) — `E_mail` ; écriture **hors widget** (Owner / Admin UI) |

### Cartes kanban (variante A)

Shell UI commun avec la liste Missions (`KanbanBoard` / `KanbanCardShell` : colonnes, drag, menu clavier « Déplacer vers… ») — **données séparées** (`Weekly_phase` ≠ `Missions.Statut`).

| UI | Source |
|----|--------|
| Carte entière (clic / clavier) | Ouvre le drawer suivi — titre texte (pas de lien) |
| Menu Actions | Ouvrir le suivi · **Lier une action** · **Déplacer vers…** (phase) |
| Titre | Lecture `Missions.Nom_de_la_mission` |
| Badge météo (coin) | `Weekly_phase.Meteo` — pastille tonée + icône (absent si vide) |
| Membres + avatars | `Weekly_phase.Membre_equipe` (RefList) → **avatars empilés** (max 3 + « +k ») — `aria-label` = prénoms joints — **absent** si non assigné |
| Indicateur note | Icône (style Trello) si `Weekly_phase.Note_ops` non vide — **pas** le texte sur la carte |
| Phase | **Colonne** kanban uniquement — **pas** de select Phase sur la carte |

### Drawer suivi mission (V1)

| UI | Source |
|----|--------|
| Titre | Lecture `Missions.Nom_de_la_mission` |
| Phase | Badge lecture = colonne kanban (`Weekly_phase.Phase`) — **pas** de select |
| Ouverture | **Lecture** par défaut |
| Météo + Membres | Lecture ; bouton **Modifier** → édition (3 boutons météo · select **multi** porteurs Ops = `Equipe` ∩ e-mails `Weekly_coachs`, + orphelins déjà assignés) puis Enregistrer / Annuler |
| Note ops | Lecture `MissionProse` ; **Modifier** / **Ajouter** → textarea Markdown (pattern contexte mission / note studio) ; icônes Enregistrer / Annuler — **pas** de fermeture auto du drawer |
| Actions liées | `Weekly_action` filtrées `Mission` = carte + **Lier une action** (Créer \| Rattacher) |
| Derniers échanges | `Weekly_agenda` filtrés par mission + Voir / Nouveau sujet |
| Lien fiche | Navigation `/missions/:id` (secondaire) — **pas** de sync note/météo |

**Hors V1 drawer** : point bloquant · timer · clôture magique.

**Colonnes ops** (confirmées MCP 2026-10-05, doc `nei9DeARs5Eo`) :

| Colonne (`colId`) | Table | Type | Usage |
|-------------------|-------|------|-------|
| `Meteo` | `Weekly_phase` | TEXT | Libellés métier : `Au vert` · `À surveiller` · `En difficulté` (anciens Calme/Nuageux/Orageux normalisés à la lecture) |
| `Note_ops` | `Weekly_phase` | TEXT | Note markdown |
| `Membre_equipe` | `Weekly_phase` | RefList → `Equipe` | Porteurs Ops (libellé UI « Membres équipe ») — multi |

Flag `WEEKLY_PHASE_OPS_COLUMNS_READY = true`. **Aucune** colonne / écriture sur `Missions`. Coach texte libre **annulé** (remplacé par `Membre_equipe`).

### Agenda (sujets)

| UI | Colonne Grist |
|----|---------------|
| **Titre** (liste + drawer + create) | `Texte` |
| **Détail** (drawer lecture / édition + create optionnel — **pas** dans la liste) | `Detail` (TEXT, markdown léger) — active |
| **Mission liée** (create + édition drawer) | `Mission` (Ref → `Missions`, optionnel) |
| Méta liste / drawer | `Auteur` (prénom) · `Cree_le` (date relative) · `Traite` |
| **Date de traitement** (historique) | `Traite_le` (Date) — écrite au coche `Traite` ; vidée si on décoche |

#### Sous-nav À faire | Historique (sous l’onglet Sujets)

- Dans l’onglet principal **Sujets** : bascule **À faire** / **Historique** (SegmentedControl DSFR) — **pas** de route dédiée, **pas** de `Page_*`, **pas** encore l’onglet Historique global.
- **À faire** : sujets `Traite = false` uniquement. CTA **« Nouveau sujet »** dans l’en-tête (option B) — **pas** de formulaire permanent sous la liste.
- **Historique** : sujets `Traite = true`, timeline par **jour exact** de `Traite_le` (pastille), regroupés par **mois**. **Pas** de colonne Actions (V1.1).
- Coche Traite → écrit `Traite = true` + `Traite_le` = jour calendaire local ; le sujet **disparaît** de À faire et apparaît dans Historique.
- Décoche → `Traite = false` + `Traite_le` vidé ; le sujet revient dans À faire.
- Sujets déjà traités **sans** `Traite_le` (avant cette colonne) : best-effort regroupement via `Cree_le`, sinon bucket « Sans date ».
- **Owner** : créer la colonne `Weekly_agenda.Traite_le` (type **Date**) si absente — le widget lit/écrit cette colonne.

#### Liste & drawer

- Liste compacte : **titre** + méta `Prénom · date relative` (+ lien mission éventuel) + **Voir** / **Modifier** — pas le détail.
- Drawer lecture : titre, détail (`MissionProse` — markdown léger + liens internes), mission (lien fiche), méta date / auteur.
- Drawer édition : titre, détail optionnel (textarea markdown), select mission → **Enregistrer**.
- Drawer **create** (même tiroir) : titre, détail, mission, prénom auteur → **Ajouter** ; focus titre à l’ouverture ; focus retour au CTA après fermeture create.
- État vide À faire : « Aucun sujet à aborder… » ; Historique vide : message d’aide.
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

### Actions Ops (V1 — kanban + drawer)

Table **`Weekly_action`** (singulier). ACL = patron `Weekly_agenda`
(Owner + coachs). Choice `Statut` : `A faire` / `En cours` ; « Fait » =
booléen `Fait` + `Fait_le` (pas de 3ᵉ Choice).

Sur `/weekly`, onglet **Actions** (Tabs principaux — voir « Mise en page ») :

Shell UI commun missions / Weekly phase (`KanbanBoard` / `KanbanCardShell` :
colonnes, drag, menu clavier « Déplacer vers… »).

| Colonne UI | Données |
|------------|---------|
| **À faire** | `Fait=false` et `Statut` ∈ `A faire` (variantes espaces tolérées) |
| **En cours** | `Fait=false` et `Statut` = `En cours` |
| **Done** | `Fait=true` (affichée même si `Statut` ancien) |

| UI | Comportement |
|----|--------------|
| Onglet **Actions** | Board 3 colonnes (Done visibles) + compteur « N ouvertes » dans le libellé d’onglet |
| CTA header | **« Ajouter une action »** → drawer SM create (pas de barre inline) |
| Carte | Titre · badge statut (ou « Fait ») · Porté par · mission · Weekly du · Fin le (alerte retard) |
| Drag / menu → Done | `Fait=true` + `Fait_le` = aujourd’hui (`Statut` inchangé) |
| Drag / menu hors Done | `Fait=false`, `Fait_le` vidé, `Statut` = colonne cible |
| Drag À faire ↔ En cours | update `Statut` (+ reset `Fait` idempotent) |
| Clic carte | Ouvre le **drawer SM** édition (prérempli) |
| Drawer create / edit | Titre · Porteur (session à create) · Mission opt. · Statut (À faire / En cours) · Date de fin · Weekly du (défaut = jour create) · Notes · case **Fait** (édition seulement) → Enregistrer / Ajouter ; Échap / Annuler / scrim ferment sans save |
| **Supprimer** | Menu ⋮ carte **et** bouton tertiaire drawer édition → dialogue « Supprimer cette action ? » (irréversible) → `destroy` une ligne ; **pas** de delete en masse |

### Lier une action (carte mission ou sujet)

Même dialogue **Créer \| Rattacher** depuis :

| Entrée | Persistance |
|--------|-------------|
| Menu ⋮ carte Kanban · bouton drawer suivi « Lier une action » | `Weekly_action.Mission` = mission de la carte |
| Bouton « Action » sur une ligne sujet | `Sujet` = id agenda (**si** colonne Owner) + `Mission` = mission du sujet si présente |

- **Créer** → drawer action avec Mission (et Sujet) préremplis.
- **Rattacher** → update des liens sur une action ouverte non déjà liée à ce contexte.
- Flag `WEEKLY_ACTION_SUJET_COLUMN_READY` : `false` tant que Owner n’a pas créé `Weekly_action.Sujet` (Ref → `Weekly_agenda`). UI sujet reste visible ; écriture `Sujet` et rattachement sujet-seul bloqués avec message d’aide.

## Hors scope (ce bolt)

Timer weekly, clôture magique / table `Weekly_session`, point bloquant,
écriture `Meteo` / note / coach sur `Missions`, CRA. Colonne Équipe dédiée
(modèle plus global plus tard). Historique actions groupées par `Weekly_du` =
tranche suivante.

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

### Tables `Weekly_phase`, `Weekly_agenda` et `Weekly_action` (`*` / Toutes)

Ordre 1 → 3. **`OWNER` sans guillemets**. Pas d’accès automatique Admin / Resp. par rôle.  
**Appliqué** Owner UI (`Weekly_phase` / `Weekly_agenda` : 2026-10-03 ;
`Weekly_action` : vérif MCP 2026-10-09).

| # | Condition | Droits | Mémo |
|---|-----------|--------|------|
| 1 | `user.Access == OWNER` | `+CRUD` | Owner document : ménage (doublons, etc.). |
| 2 | `user.Email == user.Weekly_coach.E_mail` | `+CRUD` | Listé dans `Weekly_coachs` (lookup réussi) — préférer à `!= ""` (plus sûr en View As). |
| 3 | `True` | `-CRUD` | Tout le reste (y compris Admin hors liste) : aucun accès. |

Après pose : View As une personne listée / un Admin hors liste / Invité.
