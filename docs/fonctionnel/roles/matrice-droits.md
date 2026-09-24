# Matrice rôles & droits — registre vivant

> **Source de vérité** pour « qui peut voir / faire quoi ».  
> Toute feature ou changement de permissions **doit** mettre à jour ce fichier (rule [`.cursor/rules/roles-matrice.mdc`](../../../.cursor/rules/roles-matrice.mdc)).

Schéma pédagogique (6 couches) : canvas Cursor  
[`roles-droits-schema.canvas.tsx`](/Users/admin/.cursor/projects/Users-admin-Cursor-pilotage-studios-grist/canvases/roles-droits-schema.canvas.tsx)  
(local IDE — pas versionné dans le repo GitHub).

## En clair

Ce document est le **tableau de bord des droits** du Pilotage : pour chaque écran du widget et chaque table sensible, on note ce que chaque rôle (Admin, responsable, freelance, invité) peut faire, et si c’est déjà en place ou seulement prévu. On le met à jour dès qu’on change un menu, une page, ou une règle Grist — pour pouvoir se relire et s’appuyer dessus sans fouiller le code.

**ACL** (*Access Control List*) = liste de contrôle d’accès : les règles qui disent qui a le droit de lire, modifier, créer ou supprimer.

## Lexique rapide

| Terme | Sens |
|-------|------|
| **Rôle ACL** | Valeur dans `Equipe.Role_ACL` : Admin, Responsable de département, Freelance, Invité |
| **Partage** | Invitation au document : Owner / Editor / Viewer |
| **Propriété d’utilisateur** | Câblage Grist : email de connexion → fiche `Equipe` |
| **UX widget** | Masquer un menu / bloquer une page — confort, **pas** la sécurité des données |
| **Access Rules** | Règles Grist sur les tables — **vrai** contrôle des données |

## Les 6 couches

| # | Couche | Où | Rôle | Statut (2026-09-19) |
|---|--------|-----|------|---------------------|
| 1 | Partage du document | Grist → Partager | Porte d’entrée | En place |
| 2 | Rôle ACL (`Equipe.Role_ACL`) | Table Equipe | Qui est quoi | En place (Admin + Freelance ; Resp./Invité à compléter) |
| 3 | Propriété d’utilisateur | Règles d’accès → propriétés | Qui est connecté → fiche Equipe | **Fait** (`Equipe` ← `user.Email` / `E_mail`) |
| 4 | Pont vers le widget | Table `Acl_profil` | Rôle + `Page_*` (formules ← `Droits_pages`) | **Fait** |
| 5 | Confort interface (widget) | Nav + gardes de route | Masquer / bloquer écrans | **Fait** (selon `Page_*`) |
| 6 | Règles d’accès (tables) | Access Rules Grist | Protéger les données (fins) | **Partiel** — `Equipe` par rôle (#55) ; `Realise` par rôle (#47/#70) ; montants BDC / summaries Owner |

Détail technique des règles actuelles : [access-rules.md](access-rules.md).

---

## A — Écrans du widget (couche 5)

Légende cellules : **oui** = accessible · **non** = masqué / refusé · **?** = non décidé · **—** = hors sujet.

| Écran / parcours | Route | Admin | Resp. | Freelance | Invité | Statut | Notes |
|------------------|-------|-------|-------|-----------|--------|--------|-------|
| Accueil | `/` | oui | oui | oui | oui | **Appliqué** (widget + `Droits_pages`) | Kanban Grist + drawer conversation |
| Plans d’activité | `/pa` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Couche 5 ; données encore ouvertes (couche 6 plus tard) |
| Bons de commande | `/bdc` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Idem |
| Prestation / CRA (liste) | `/cra` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Freelances : déclaration via `/cra/declarer` |
| Déclarer mon CRA / **Mon carnet** | `/cra/declarer` | **oui** | **non** | **oui** | **non** | **Appliqué** UX (rôle) | Nav niveau 1 « Mon carnet » (Freelance/Admin) ; pas sous Budget ; hors `Page_*` ; filtre prestations « moi » (UX) |
| Revue CRA équipe | `/cra/revue-equipe` | **oui*** | **oui*** | **non** | **non** | **Appliqué** UX (rôle + dép.) | *Uniquement si `Equipe.Equipe` renseigné ; périmètre = même département ; hors `Page_*` ; ACL `Realise` encore ouverte (#47) |
| Récap porteurs | `/outils/recap-porteurs` | **oui** | **non** | **non** | **non** | **Appliqué** UX | |
| Procès-verbaux | `/pv` | **oui** | **non** | **non** | **non** | **Appliqué** UX (stub) | |
| Missions | `/missions` | oui | oui | oui | oui | **Appliqué** UX | |
| Équipe | `/equipe` | oui | oui | oui | oui | **Configurable** Admin | Flag `Page_equipe` ; réglé via `/outils/droits-pages` ([#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54)) |
| Créer fiche Équipe | `/equipe` (drawer) | **oui** | **non** | **non** | **non** | **Appliqué** UX + ACL | Bouton Admin ; `Equipe` create allowlisté ; édition = [#63](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/63) |
| Droits des pages | `/outils/droits-pages` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Garde rôle Admin (pas de `Page_*`) ; édite `Droits_pages` |
| Produits | `/produits`, `/produits/:id` | oui | oui | oui | oui | **Appliqué** UX (liste + fiche lecture) | Flag `Page_produits` |

---

## B — Données Grist (couche 6) — cible atelier

Légende permissions : **R**ead · **U**pdate · **C**reate · **D**elete · **S**chema · **—** deny.

Cellules = **propositions** sauf mention « appliqué » / « partiel (Owner) ».

| Table / ressource | Admin | Resp. | Freelance | Invité | Appliqué ? | Notes |
|-------------------|-------|-------|-----------|--------|------------|-------|
| `Equipe` (hors TJM/TTC) | CRUD | R | R (3 cols) | R | **Appliqué** | Table `+R-CUD` ; Freelance : seulement `Prenom_Nom` / `Equipe` / `Specialite` ([#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55)) ; widget **create** Admin (drawer) |
| `Equipe.TJM`, `Total_TTC` | RU | RU | R soi | R soi | **Appliqué** | `-RU` sauf Owner / Admin / soi (`user.Email == rec.E_mail`) — [#60](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60) ; TJM aussi saisissable à la **création** Admin (droit table C) |
| `Equipe.E_mail` | RU | — | — | — | **Appliqué** | `-RU` si non-(Owner\|Admin) ; saisie à la **création** Admin seulement (pas d’affichage liste/fiche) |
| `Plan_activite` | CRUD | R ? | R / — | R / — | Non (rôle) | Ancre widget |
| `BDC` métadonnées | CRUD | R ? | R limité | R / — | Non (rôle) | |
| `BDC` montants / Devis / Sofiane… | RU | — | — | — | **Appliqué (Owner)** | `-RU` si non-Owner |
| `Constatations` | CRUD | — | — | — | **Appliqué (Owner)** | `user.Access == "OWNER"` → `+CRUD` |
| `Commandes_Sofiane` | CRUD | R | — | — | Non (rôle) | |
| `Realise` (CRA) hors montants | CRUD | R/U département | **R/U + C** ses lignes | — | **Appliqué** (ACL) + widget | Déclaration `#33` ; revue `#70` ; mur `#47` HITL 2026-09-21 |
| `Realise.Calcul_TTC` | R ; U Owner | R | R | R | **Appliqué** | `+R -U` si non-Owner |
| `Missions` / `Missions_enfants` | CRUD | R/U dép. | R ses missions | R / — | Non (rôle) | |
| `Kanban` (feedback + produit) | CRU (liste + colonne Admin) | C (+ R) ; U colonne Admin | C (+ R) | C (+ R) | **Appliqué** (ACL) + widget | Owner/Admin `+CRUD` ; `True` → `+CR-UD` |
| `Kanban_commentaires` | CR | C (+ R) | C (+ R) | C (+ R) | **Appliqué** (ACL) + widget | Owner/Admin `+CRUD` ; `True` → `+CR-UD` |
| `Retours` / `Roadmap` (legacy) | — | — | — | — | **Hors widget** (migrées → `Kanban`) | Archivables Owner |
| `Acl_profil` | CRUD | CRUD | CR soi | CR soi | **Appliqué** | Owner/Admin `+CRUD` ; `user.Email == rec.E_mail` → `+CR` ; `True` → `-CRUD` |
| `Droits_pages` | CRUD (Owner / Admin) | — | — | — | **Appliqué** | Owner **ou** `Role_ACL == Admin` → `+CRUD` ; `True` → `-CRUD` |
| Structure (S) | Owner | — | — | — | **Appliqué** | `-S` si non-Owner |

### Mapping partage ↔ rôle métier (proposition)

| Partage Grist | Rôle métier suggéré |
|---------------|---------------------|
| Owner | Admin (sauf exception) |
| Editor | Resp. ou Freelance selon profil |
| Viewer | Invité ou Freelance lecture seule |

---

## Journal des mises à jour

| Date | Changement | Couches | PR / contexte |
|------|------------|---------|---------------|
| 2026-09-24 | Création fiche Équipe (Admin) : bouton liste + drawer (identité, e-mail, rôle, TJM…) ; `Equipe` create allowlisté ; pas d’update (#63) | 5, 6 (doc) | Kanban `equipe-fiche-creation-admin` |
| 2026-09-24 | Access Rules `Kanban` / `Kanban_commentaires` posées Owner UI (vérif MCP) | 6 | Post-merge #80 |
| 2026-09-24 | Table unique `Kanban` (fusion Retours+Roadmap) ; drawer ordre lecture + select colonne Admin ; commentaires `Cible_id` ; create feedback → `Kanban` | 5, 6 (doc HITL ACL) | Kanban unifié drawer |
| 2026-09-23 | Kanban accueil 100 % Grist : `Roadmap` + `Kanban_commentaires` ; drawer ticket + conversation pour tous ; GitHub optionnel ; plus de source `publicRoadmap.ts` | 5, 6 (doc HITL ACL) | Kanban conversation |
| 2026-09-23 | Fiche mission Contexte : panneau PJ = télécharger + ajouter + détacher `Docs` (upload jeton non-readonly) ; Note studio éditable ; pas de changement ACL tables | 5 | Note studio + Docs Contexte |
| 2026-09-23 | Fiche produit : 4 onglets référentiel → 1 onglet Informations (groupes métier, page document) ; pas de compteurs ; mêmes droits lecture | 5 | Gabarit A canvas infos produit |
| 2026-09-22 | Produits : liste + fiche lecture (`/produits`, `/produits/:id`) ; nav hors stub ; missions liées sur fiche ; pas d’écriture catalogue | 5 | [#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3) |
| 2026-09-21 | Freelance : nav « Mon carnet » en niveau 1 (`/cra/declarer`) ; retrait du sous-menu Budget (Budget disparaît s’il ne reste aucun enfant accessible) | 5 | Ajustements UX carnet |
| 2026-09-21 | Access Rules `Realise` : Owner/Admin CRUD ; Resp. RU département ; Freelance RU soi + C ; `Calcul_TTC` +R−U hors Owner (mémo) ; vérif MCP OK | 6 | [#47](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47) / [#70](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/70) HITL Owner |
| 2026-09-21 | Revue CRA équipe (`/cra/revue-equipe`) : nav + garde Admin/Resp. **avec** département ; filtre UX même `Equipe.Equipe` ; update `Nb_jours` / `Taches_realisees` / `BDC_cible` ; pas de workflow validation | 5, 6 (doc) | [#70](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/70) (suite [#34](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34)) |
| 2026-09-19 | Déclarer mon CRA (`/cra/declarer`) : nav + garde Freelance/Admin ; filtre UX prestations soi ; écriture `Realise` allowlistée ; ACL `Realise` reportée ; HITL lecture `Equipe.E_mail` soi documentée | 5, 6 (doc) | [#33](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33) V1 |
| 2026-09-19 | Équipe : colonne `Avatar` (seed DiceBear) + affichage liste/fiche ; CSP `img-src` DiceBear ; pas d’écriture widget ni changement ACL Freelance | 5 | [#67](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/pull/67) |
| 2026-09-19 | Fiche Équipe : section Missions & prestations (lecture lazy `Missions` / `Missions_enfants`, liens `/missions/:id`) ; pas de changement nav / ACL tables | 5 | [#62](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62) |
| 2026-09-19 | Access Rules `Equipe.TJM,Total_TTC` : Admin toutes fiches + soi ; vérif MCP OK | 6 | [#60](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60) HITL Owner |
| 2026-09-19 | Fiche Équipe : affiche TJM / Total TTC si lisibles ; cible ACL Admin + soi (#60 HITL) | 5, 6 (doc) | [#61](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/61) / [#60](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60) |
| 2026-09-19 | `Acl_profil` : règle Owner/Admin `+CRUD` (ménage doublons) ; widget création auto fiche absente | 4, 5, 6 | [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55) |
| 2026-09-19 | Widget : création auto `Acl_profil` si fiche absente (create allowlisté) ; doublons → id minimal | 4, 5 | [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55) |
| 2026-09-19 | Access Rules `Equipe` : CRUD Owner/Admin ; lecture seule ailleurs ; Freelance 3 colonnes ; widget annuaire adapté | 5, 6 | [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55) |
| 2026-09-19 | Renommage Grist `Page_intervenants` → `Page_equipe` (`Droits_pages` + `Acl_profil`) ; widget aligné | 4, 5 | [#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54) |
| 2026-09-19 | Page Admin `/outils/droits-pages` : édition `Droits_pages` par thématiques ; Équipe configurable via cette page | 4, 5 | [#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54) |
| 2026-09-19 | Feedback : masquer retours `Fait` / `Écarté` / `Terminé` dans la colonne Feedback (accueil) | 5 | [#56](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/pull/56) |
| 2026-09-19 | Écran Équipe liste + fiche lecture (`/equipe`) ; nav libellé Équipe ; flag page toujours `Page_intervenants` | 5 | [#53](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/53) |
| 2026-09-18 (soir) | Revue #52 : nav sans flash loading ; fetch Acl/Retours après boot PA ; alerte profil ; décision Read `Retours` partagée V1 | 5, 6 (doc) | Correctifs revue |
| 2026-09-18 (soir) | Widget : lecture `Acl_profil`, filtre nav + gardes `/pa` `/bdc` `/cra` `/pv` `/outils/recap-porteurs` | 4, 5 | Feature droits pages |
| 2026-09-18 (soir) | Grist : `Droits_pages` Owner/Admin ; `Acl_profil.Page_*` formules ← `Droits_pages` | 4, 6 | HITL |
| 2026-09-18 (soir) | Constatations : `user.Access == "OWNER"` → `+CRUD` (Owners only) ; leçon = allow explicite Owner, pas deny seul | 6 | HITL + 403 app sœur |
| 2026-09-18 (soir) | Correction sens ACL montants / TJM / summaries / Malt en **`-RU`** | 6 | HITL Owner |
| 2026-09-18 | User Attribute `Equipe` + ménage colonnes fantômes BDC ; registre vivant ; cible UX `/cra` Admin | 3, 5, 6 (doc) | Session droits CRA UX |
| 2026-09-06 | Inventaire partage + matrice brouillon initiale | 1, 2, 6 | Prep #47 |

---

## Questions ouvertes (atelier)

1. Un **Resp. Product** voit-il les BDC Design / Tech, ou seulement Product ?
2. Un **Freelance** peut-il éditer ses CRA (`Realise`) ? **V1 widget** : oui (jours + description, `/cra/declarer`). Mur Access Rules `Realise` : encore à poser (#47).
3. Les **Invités** voient-ils le Custom Widget, ou seulement des pages Grist ?
4. Table `Utilisateurs_ACL` séparée de `Equipe` ?
5. Les 12 Owners actuels : tous `Admin`, ou réduire le partage Owner ?
6. `Retours` Read : garder le kanban partagé V1, ou resserrer Read = Admin/Owner dès l’élargissement freelance ?

## Comment mettre à jour (humain + agent)

1. Identifier la **couche** touchée (1–6).
2. Mettre à jour le tableau **A** (écran) et/ou **B** (données).
3. Ajouter une ligne au **Journal**.
4. Si Access Rules Grist changent : aussi [access-rules.md](access-rules.md).
5. Case PR : « Matrice rôles mise à jour » ou N/A justifié.
