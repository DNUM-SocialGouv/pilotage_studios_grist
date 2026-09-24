---
name: pilotage-grist-kanban
description: >-
  Consulte et propose la sync de la feuille de route kanban Grist (table Kanban,
  Nature=Produit) : créer ou déplacer une carte Backlog / En cours / Livré.
  Use when starting a feature, issue, or user-visible fix on pilotage_studios_grist,
  or when the user mentions kanban, feuille de route, Backlog, En cours, or Livré.
---

# Feuille de route kanban — pilotage_studios_grist

## En clair

Avant de coder un sujet **visible utilisateurs**, regarder le tableau d’accueil
(Backlog · En cours · Livré), retrouver ou inventer la carte, **proposer** le
changement, et n’écrire dans Grist **qu’après OK**.

## Contexte

| | |
|--|--|
| Document | `nei9DeARs5Eo` |
| Table | `Kanban` |
| Nature | **Produit** uniquement (jamais Feedback) |
| Canal | MCP `user-grist` — **pas** le bundle widget |
| HITL | **Toujours** proposer avant `grist_add_records` / `grist_update_records` |

## Mapping colonne ↔ `Statut_produit`

Aligné sur `statutProduitForColumn` (`src/utils/kanbanTickets.ts`) :

| `Colonne_kanban` | `Statut_produit` |
|------------------|------------------|
| `backlog` | `later` |
| `en_cours` | `current` |
| `livre` | `done` |

## Workflow

### 1. Lire

```text
grist_fetch_table
  docId: nei9DeARs5Eo
  tableId: Kanban
  filter: { Nature: ["Produit"] }
  sort: Ordre
```

Repérer les cartes en `backlog`, `en_cours`, `livre`.

### 2. Matcher (dans cet ordre)

1. `Cle` (slug) connue
2. `Lien_github` contient le n° d’issue
3. Titre / thème proches du sujet

### 3. Proposer (avant toute écriture)

Utiliser **exactement** ce gabarit :

```markdown
## Proposition kanban

- **Périmètre** : feature | issue #<N> | correctif visible | **N/A** (motif)
- **Carte** : existante id=<id> « <Titre> » en `<colonne>` | **à créer**
- **Action** : create en `<colonne>` | move `<from>` → `<to>` | aucun
- **Champs** (si create / update) :
  - Titre :
  - Resume :
  - Theme :
  - Cle :
  - Colonne_kanban / Statut_produit :
  - Lien_github : (optionnel)
  - Ordre : (optionnel)
  - Page_path / Page_lien_libelle : (si écran connu)
  - Guide_* : (optionnel au démarrage ; recommander à Livré)

**Attente OK** avant écriture MCP.
```

Hors périmètre (chore, docs, rules, revue) → une ligne :
`N/A kanban : <motif>` — pas de fetch obligatoire.

### 4. Après OK humain

Avant create :

1. Vérifier que `Cle` est **absente** des cartes `Nature=Produit` déjà lues.
2. Poser `Ordre = max(Ordre existant) + 1` (si table vide → `1`).

- **Create** → `grist_add_records` avec au minimum :

  `Nature=Produit`, `Colonne_kanban`, `Titre`, `Resume`, `Theme`,
  `Statut_produit`, `Cle`, `Ordre` ; optionnel : `Lien_github`,
  `Page_path`, `Page_lien_libelle`, `Guide_lead`, `Guide_intro`, `Guide_etapes`.

- **Move / edit** → `grist_update_records` : toujours sync
  `Colonne_kanban` **et** `Statut_produit`.

### 5. Fin de sujet / merge PR

**Après** merge CI verte : proposer `en_cours` → `livre` + `Statut_produit=done`.  
Si un écran est livré : compléter `Guide_*`, `Page_path`, `Page_lien_libelle`
(modèle : cartes déjà en Livré). **Toujours HITL** avant l’update.

## Moments d’appel

| Moment | Action typique |
|--------|----------------|
| Démarrage feature / issue | Match ou create → proposer `en_cours` (ou `backlog` si pas encore démarré) |
| Fin / merge PR produit | **Après** merge : proposer `livre` |
| Création d’issue roadmap | Proposer create en `backlog` + `Lien_github` |

## Jamais

- Écrire sans OK explicite
- `Nature=Feedback` ou toucher `Kanban_commentaires` pour cette sync
- Delete d’une carte
- Contourner les Access Rules (MCP Owner/API : droits du token MCP seulement)

## Liens

- Rule always-on : [`kanban-feuille-route.mdc`](../../rules/kanban-feuille-route.mdc)
- Issue : [`pilotage-grist-issue`](../pilotage-grist-issue/SKILL.md)
- PR : [`pilotage-grist-pr`](../pilotage-grist-pr/SKILL.md)
