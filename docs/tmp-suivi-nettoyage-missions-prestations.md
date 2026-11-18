# Suivi temporaire — nettoyage Missions / Prestations

> **Fichier temporaire** (hors doc produit durable).  
> Source : état des lieux chat (2026-11-17) · document Grist `nei9DeARs5Eo`.  
> Usage : cocher / avancer **item par item** ; supprimer ce fichier quand le ménage est clos.

| | |
|--|--|
| **Statut global** | En cours |
| **Dernière MAJ** | 2026-11-18 (B clos · orphelins Realise Plan A) |
| **Kanban** | N/A (ménage schéma + dette technique) sauf si un item devient correctif visible widget |

Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait · `[-]` reporté / abandonné

---

## En clair

On allège les tables **missions** (lots) et **prestations** (`Prestations`) : enlever les doublons et champs morts, puis améliorer ce qui reste trompeur (filtre équipe, jours du lot, libellés). Chaque ligne ci-dessous est une unité de décision Owner / widget.

---

## A. Doublon titre prestation (`Mission_enfant`)

Objectif : une seule colonne titre = `Titre_de_la_prestation`.

| # | Item | Qui | Statut | Notes |
|---|------|-----|--------|-------|
| A1 | Sur `Realise.Prestation`, colonne d’affichage → `Titre_de_la_prestation` | Owner Grist | [x] | Confirmé 2026-11-17 · helper `gristHelper_Display9` = `$Prestation.Titre_de_la_prestation` |
| A2 | Vérifier qu’aucune vue Grist native n’affiche encore `Mission_enfant` | Owner Grist | [x] | Confirmé 2026-11-17 |
| A3 | Supprimer la colonne `Prestations.Mission_enfant` | Owner Grist | [x] | Confirmé MCP 2026-11-17 · colonne absente du schéma |
| A4 | Retirer le fallback lecture widget (`missionEnfants.ts` + tests + docs) | Widget / agent | [x] | Fait 2026-11-17 — titre = `Titre_de_la_prestation` uniquement |

### Critères de fin A4

- [x] Plus de fallback `record.Mission_enfant` dans `missionEnfantFromGrist`
- [x] Tests `missionEnfants.test.ts` mis à jour
- [x] Mentions AGENTS.md / `docs/fonctionnel/missions/` alignées
- [x] `npm run lint && npm run test` OK

---

## B. Suppressions Grist — priorité haute (champs morts)

À valider Owner avant delete. Pas de dépendance widget connue.

| # | Table | Colonne | Rempli (≈) | Statut | Notes |
|---|-------|---------|------------|--------|-------|
| B1 | `Missions` | `MAJ_ST` | 0/138 | [x] | Supprimée 2026-11-18 (MCP · Plan A) |
| B2 | `Missions` | `URL_espace_collaboratif` | 0/138 | [x] | Supprimée 2026-11-18 (MCP · Plan A) |
| B3 | `Prestations` | `UUID2` | 427 (doublon) | [x] | Supprimée 2026-11-18 (MCP · Plan A) |
| B4 | `Prestations` | `UUID` | 427 | [x] | **Gardé volontairement** (Plan A) — un seul identifiant |

---

## C. Suppressions Grist — priorité moyenne (clarifier avant)

Chaîne Portage / météo / champs hors parcours widget.

| # | Table | Colonne | Rempli (≈) | Statut | Décision à prendre |
|---|-------|---------|------------|--------|-------------------|
| C1 | `Missions` | `Portage` | 3/138 | [ ] | Portage géré ailleurs (`Equipe.Portage`, BDC) ? |
| C2 | `Missions` | `Financeur` (formule via Portage) | 3 | [ ] | Suit C1 |
| C3 | `Missions` | `BDC` (formule via Portage) | — | [ ] | Suit C1 |
| C4 | `Prestations` | `Mission_parent_Financeur` | 24 | [ ] | Suit C1 |
| C5 | `Missions` | `Meteo` | 2/138 | [ ] | Doublon conceptuel `Weekly_phase.Meteo` ? |
| C6 | `Missions` | `Budget_dev_` | 2 | [ ] | Hors widget |
| C7 | `Missions` | `Date_de_livraison_attendue` | 1 | [ ] | Texte quasi vide |
| C8 | `Missions` | `Type_de_service` | souvent 0 | [ ] | Ref `Services` non utilisée widget |
| C9 | `Missions` | `Avancement` | 138 souvent 0 | [ ] | Non affiché widget |
| C10 | `Missions` | `Annee` | 44 | [ ] | Non utilisé widget |
| C11 | `Prestations` | `Notes` | 31 | [ ] | Hors drawer widget |
| C12 | `Prestations` | `Date_de_fin` | 61 | [ ] | Volontairement hors widget (#37) — garder ou archive ? |

---

## D. Améliorations (sans delete immédiat)

| # | Item | Zone | Statut | Détail |
|---|------|------|--------|--------|
| D1 | Filtre « équipe » liste missions via prestations | Widget | [ ] | Aujourd’hui `Equipe2` ← `Resp_` (trompeur si Resp_ vide) → baser sur `Intervenant.Equipe` des enfants |
| D2 | `Missions.Jours_envisages` | Grist + évent. UI | [ ] | Soit formule = somme enfants, soit retiré des vues (aujourd’hui incohérent avec les prestations) |
| D3 | Renommer `Prestations.Specialite` | Owner Grist | [ ] | Formule = `$Intervenant.Equipe` → libellé type `Equipe_intervenant` |
| D4 | Harmoniser Choice `Statut` master / enfant | Owner Grist | [ ] | Valeurs orphelines : `[Archivée]`, `Récurrent`, etc. |
| D5 | Contexte mission (Demande / Enjeux / …) | Produit / Design | [ ] | Peu rempli (≈5–15 %) — simplifier parcours ou laisser secondaire |
| D6 | Staffing legacy master (`Intervenants` / `Resp_` / `Equipe2` / `Specialite` formule) | Widget puis Grist | [ ] | D’abord D1 ; puis décider de déprécier / supprimer colonnes master |

---

## E. Ne pas toucher (garde-fous)

| Élément | Pourquoi |
|---------|----------|
| `Missions` cœur : Nom · Produit_SDPC · Statut · textes Contexte · Liens · Docs · Note studio · `Departement` (formule) | Parcours widget vivant |
| `Prestations` cœur : `Mission_parent` · `Titre_de_la_prestation` · `Intervenant` · `Jours_envisages` · `Statut` · `Date_de_debut` | Drawer prestations |
| `Type_prestation` | Garder jusqu’au forfait (#36) — figé Freelance à la création |
| `Realise.Prestation` + formule `Realise.Mission` | Lien CRA → prestation → lot |
| Alias code `SuiviMensuel.Mission_enfant` | = ref `Prestation` en interne — **pas** l’ancienne colonne texte |

---

## F. Renommage tableId `Missions_enfants` → `Prestations`

Objectif : même nom partout (menu Grist, tableId, widget, docs) pour éviter la confusion équipe.

| # | Item | Qui | Statut | Notes |
|---|------|-----|--------|-------|
| F1 | Renommer **Nom de la table** Grist → `Prestations` | Owner Grist | [x] | Confirmé MCP 2026-11-17 — plus de `Missions_enfants` |
| F2 | Vérifier `Realise.Prestation` = `Ref:Prestations` | Owner / agent | [x] | Confirmé · formule `Mission` = `$Prestation.Mission_parent` · 427 lignes |
| F3 | Allowlists + hooks + écriture widget | Widget / agent | [x] | `PRESTATIONS_TABLE_ID = "Prestations"` |
| F4 | Docs AGENTS / SECURITY / fonctionnel / matrice journal | Widget / agent | [x] | Mis à jour |
| F5 | `npm run lint && npm run test` | Agent | [x] | 2026-11-17 — lint OK · 477 tests pass |
| F6 | Smoke iframe : liste missions + drawer prestation + CRA | Humain | [x] | Confirmé 2026-11-17 |

**Hors-scope F** : renommer types/fichiers TS `MissionEnfant` / `missionEnfants*` (dette code, pas bloquant métier).

---

## Journal

| Date | Quoi |
|------|------|
| 2026-11-17 | État des lieux initial (schéma + peuplement + usage widget) |
| 2026-11-17 | **A1–A3 faits** Owner : display Realise → Titre ; vues OK ; colonne `Mission_enfant` supprimée |
| 2026-11-17 | Création de ce fichier de suivi · **A4** reste ouvert |
| 2026-11-17 | **A4 fait** : fallback lecture `Mission_enfant` / `Libelle` retiré du widget ; docs alignées |
| 2026-11-17 | **F lancé** : code widget → tableId `Prestations` ; **attente rename Owner Grist (F1)** |
| 2026-11-17 | **F1–F2 faits** Owner : table `Prestations` · `Realise.Prestation` = `Ref:Prestations` · 427 lignes |
| 2026-11-17 | **F6 smoke OK** · section F close |
| 2026-11-18 | **B1–B3 faits** : `MAJ_ST`, `URL_espace_collaboratif`, `UUID2` supprimées (prod) · **B4** `UUID` gardé (Plan A) |
| 2026-11-18 | **Orphelins Realise** : 3 CRA Charlotte rattaches (557→131, 589→56, 647→56) · **14** lignes ops (TTC 0, sans mission) **exclues du calcul** · helper `realisePrestation.ts` |

---

## G. Orphelins `Realise.Prestation` (Plan A)

**Règle métier** : un CRA compte seulement s’il est lié à une prestation.

Code : [`src/utils/realisePrestation.ts`](../src/utils/realisePrestation.ts) (`realiseHasPrestation` / `filterRealiseWithPrestation`).

| Décision | Ids | Motif |
|----------|-----|--------|
| Rattachés 2026-11-18 | 557→presta 131 (transverses) ; 589 & 647→presta 56 (VAO) | Charlotte Tyrode · TTC + BDC renseignés |
| **Exclus du calcul** (conservés en base) | 31, 32, 56, 57, 83, 84, 114, 115, 162, 209, 210, 244, 245, 272 | Ops Mathieu/Matthias · `Prestation=0` · `Mission=0` · `Calcul_TTC=0` · pas de BDC |

Compteur restant (`Prestation` vide) : **14** — registre « exclues », pas de delete.

---

## Prochain item suggéré

**C / D** hors scope chat (Plan A) — ou alignement base test assistant.
