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
| 6 | Règles d’accès (tables) | Access Rules Grist | Protéger les données (fins) | **Partiel** — `Equipe` par rôle (#55) ; `Realise` par rôle (#47/#70) ; montants BDC Owner/Admin (corr. 2026-09-25) ; summaries encore `"OWNER"` Const |

Détail technique des règles actuelles : [access-rules.md](access-rules.md).

---

## A — Écrans du widget (couche 5)

Légende cellules : **oui** = accessible · **non** = masqué / refusé · **?** = non décidé · **—** = hors sujet.

| Écran / parcours | Route | Admin | Resp. | Freelance | Invité | Statut | Notes |
|------------------|-------|-------|-------|-----------|--------|--------|-------|
| Accueil | `/` | oui | oui | oui | oui | **Appliqué** (widget + `Droits_pages`) | `Page_accueil` inchangé ; **CTA par rôle** (N/A `Page_*`) ; **recherche** Admin/Resp./Freelance (N/A `Page_*`) — pas Invité ; **Vos retours** tous rôles y compris Invité si e-mail session (N/A `Page_*` — variante sur `/`) ; kanban complet sur `/feuille-de-route` |
| Recherche d’accueil (suggestions) | `/` (inline) | **oui*** | **oui*** | **oui*** | **non** | **Appliqué** UX | *Si au moins une cible `Page_produits` / `Page_missions` / `Page_equipe` ouverte ; navigation fiches existantes ; **pas** de route `/recherche` ni nouvelle `Page_*` |
| **Feuille de route** | `/feuille-de-route` | oui | oui | oui | oui | **Appliqué** UX (hors `Page_*`) | **Fixé ouvert** — menu compte + CTA Admin accueil ; rappel lecture seule Admin « Fixés par rôle » ; pas de nouvelle colonne `Page_*` |
| Plans d’activité | `/pa` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Couche 5 ; données encore ouvertes (couche 6 plus tard) |
| Bons de commande | `/bdc` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Idem |
| Prestation / CRA (liste) | `/cra` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Freelances : déclaration via `/cra/declarer` |
| Déclarer mon CRA / **Mon carnet** | `/cra/declarer` | **oui*** | **oui*** | **oui** | **non** | **Appliqué** UX (rôle) | *Admin/Resp. : liste lecture missions via prestations du **département** (`Equipe.Equipe`) ; Freelance : saisie CRA « moi » ; **menu compte** (plus nav niveau 1) ; hors `Page_*` ; rappel lecture seule Admin « Fixés par rôle » ; Invité masqué |
| **Weekly Ops** | `/weekly` | **si table*** | **si table*** | **si table*** | **si table*** | **Appliqué** UX (`Weekly_coachs`) | *E-mail dans `Weekly_coachs` uniquement — **pas** d’accès automatique Admin/Resp. ; hors `Page_*` |
| Revue CRA équipe | `/cra/revue-equipe` | **oui*** | **oui*** | **non** | **non** | **Appliqué** UX (rôle + dép.) | *Uniquement si `Equipe.Equipe` renseigné ; périmètre = même département ; hors `Page_*` ; rappel lecture seule Admin « Fixés par rôle » ; ACL `Realise` par rôle **faite** (#47/#70) |
| Récap porteurs | `/outils/recap-porteurs` | **oui** | **non** | **non** | **non** | **Appliqué** UX | |
| **Documentation** (guide règles métier) | `/outils/regles-metier` | **oui** | **oui** | **oui** | **oui** | **Appliqué** UX (widget) · **Owner UI** colonne | Libellé menu **Documentation** ; entrée **menu compte** (plus Outils) ; flag `Page_regles_metier` ; fail-closed widget = ouvert ; Invité = `true` en `Droits_pages` (HITL porteur 2026-10-04) |
| Procès-verbaux | `/pv` | **oui** | **non** | **non** | **non** | **Appliqué** UX (stub) | |
| Missions | `/missions` | oui | oui | oui | oui | **Appliqué** UX | Fiche : Modifier / Dupliquer CRA sous prestation = **Admin** seulement (drawer) |
| Équipe | `/equipe` | oui | oui | oui | oui | **Configurable** Admin | Flag `Page_equipe` ; réglé via `/outils/droits-pages` ([#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54)) |
| Créer fiche Équipe | `/equipe` (drawer) | **oui** | **non** | **non** | **non** | **Appliqué** UX + ACL | Bouton Admin ; `Equipe` create allowlisté |
| Éditer fiche Équipe | `/equipe/:id` (drawer) | **oui** | **non** | **non** | **non** | **Appliqué** UX + ACL | Bouton Modifier Admin ; `Equipe` update allowlisté ([#63](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/63)) |
| Droits des pages | `/outils/droits-pages` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Garde rôle Admin (pas de `Page_*`) ; édite `Droits_pages` ; rappel lecture seule dans section « Fixés par rôle » |
| Produits | `/produits`, `/produits/:id` | oui | oui | oui | oui | **Appliqué** UX (liste + fiche lecture) | Flag `Page_produits` ; section Admin « Produits » (plus « À venir ») |

---

## B — Données Grist (couche 6) — cible atelier

Légende permissions : **R**ead · **U**pdate · **C**reate · **D**elete · **S**chema · **—** deny.

Cellules = **propositions** sauf mention « appliqué » / « partiel (Owner) ».

| Table / ressource | Admin | Resp. | Freelance | Invité | Appliqué ? | Notes |
|-------------------|-------|-------|-----------|--------|------------|-------|
| `Equipe` (hors TJM/TTC) | CRUD | R | R (3 cols) | R | **Appliqué** | Table `+R-CUD` ; Freelance : seulement `Prenom_Nom` / `Equipe` / `Specialite` ([#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55)) ; widget **create + update** Admin (drawer) |
| `Equipe.TJM`, `Total_TTC` | RU | RU | R soi | R soi | **Appliqué** | `-RU` sauf Owner / Admin / soi (`user.Email == rec.E_mail`) — [#60](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60) ; TJM saisissable à la **création / édition** Admin (droit table C/U) |
| `Equipe.E_mail` | RU | — | — | — | **Appliqué** | `-RU` si non-(Owner\|Admin) ; saisie création / édition Admin (pas d’affichage liste/fiche) |
| `Plan_activite` | CRUD | R ? | R / — | R / — | Non (rôle) | Ancre widget |
| `BDC` métadonnées | CRUD | R ? | R limité | R / — | **Partiel (widget)** | Widget : **update cadre** Admin UX (#108) — create/delete hors scope ; ACL métadonnées encore « Non (rôle) » côté couche 6 |
| `BDC` montants / Devis / Sofiane… | RU | — | — | — | **Appliqué (Owner ou Admin)** | `== OWNER or Role_ACL == Admin` → `+RU` ; hors → `-RU` ; widget écrit `Montant_TTC` / `Plateforme` / `SOFIANE` (pas `Devis`) via drawer Admin (#108) |
| `Constatations` | CRUD | — | — | — | **Appliqué (Owner)** | encore `== "OWNER"` (Const) — **à corriger** en `== OWNER` |
| `Commandes_Sofiane` | CRUD | R | — | — | Non (rôle) | |
| `Realise` (CRA) hors montants | CRUD | R/U département | **R/U + C** ses lignes | — | **Appliqué** (ACL) + widget | Déclaration `#33` ; revue `#70` ; mur `#47` HITL 2026-09-21 ; fiche mission Modifier/Dupliquer Admin (`cra-fiche-mission`) |
| `Realise.Calcul_TTC` | R ; U Owner | R | R | R | **Appliqué** | `+R -U` si non-Owner |
| `Missions` / `Missions_enfants` | CRUD | R/U dép. | R ses missions | R / — | Non (rôle) | |
| `Weekly_phase` | CRUD* | —† | —† | — | **Appliqué** ACL + widget (allowlist) | *Owner document ; †si `user.Email == user.Weekly_coach.E_mail` |
| `Weekly_agenda` | CRUD* | —† | —† | — | **Appliqué** ACL + widget (allowlist) | Idem |
| `Weekly_coachs` | CRUD | — | R soi | — | **Appliqué** ACL ; widget lecture | Allowlist e-mails — **pas** dans git ; pas d’écriture widget |
| `Kanban` (feedback + produit) | CRU (liste + colonne + corps Admin) | C (+ R) | C (+ R) | C (+ R) | **Appliqué** (ACL) + widget | Owner/Admin `+CRUD` (colonne + `Resume`/`Message`) ; `True` → `+CR-UD` |
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
| 2026-10-07 | Accueil « Vos retours » : onglets **Actifs / Archivés** (Option C) ; Archivés = Livré lus sans badge (`localStorage` #112) ; **pas** de colonne Grist ; **N/A `Page_*`** (variante confort sur `/`) | 5 | kanban `vos-retours-actifs-archives` id=56 |
| 2026-10-05 | Weekly Ops drawer suivi : écriture `Weekly_phase` (`Phase` · `Meteo` · `Note_ops` · `Membre_equipe` Ref→`Equipe`) ; échanges `Weekly_agenda` ; **pas** coach texte ; **aucune** écriture / colonne `Missions` ; **N/A `Page_*`** ; accès `Weekly_coachs` inchangé | 5, 6 (doc) | [#114](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/pull/114) · kanban `weekly-suivi-missions-drawer` |
| 2026-10-05 | Accueil `/` : bloc **Vos retours** (Feedback auteur = e-mail session, 5 max, badges réponse / colonne, lu = localStorage) ; composition **Option 3** (recherche + split raccourcis \| retours) ; **N/A `Page_*`** (variante sur `Page_accueil`) ; Invité inclus si e-mail OK | 5 | kanban `vos-retours-accueil` |
| 2026-10-05 | Édition cadre BDC (fiche `/bdc/:id`) : bouton Modifier + drawer Admin/Owner ; update allowlisté `Nom_BdC` · `Statut` · `Montant_TTC` · `Financeur` · `BdC_Chorus` · `PA` · `Equipe2` · `Plateforme` · `SOFIANE` ; pas create/delete ni Dépenses/`Devis` ; **N/A `Page_*`** (action dans écran déjà listé) | 5, 6 (doc) | [#108](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/108) / kanban `editer-bdc` |
| 2026-10-05 | Weekly Ops : colonne `Detail` confirmée (MCP) → flag `WEEKLY_AGENDA_DETAIL_COLUMN_READY=true` ; lecture/écriture + rendu markdown drawer ; **N/A `Page_*`** | 5, 6 (doc) | #105 suite |
| 2026-10-05 | Weekly Ops sujets : `Texte` = titre ; update `Mission` en édition ; UI détail → colonne `Detail` (**HITL Owner** création colonne) ; allowlist create/update `Texte` / `Detail` / `Mission` / `Traite` ; **N/A `Page_*`** | 5, 6 (doc) | #105 |
| 2026-10-04 | Weekly Ops agenda : update `Weekly_agenda.Texte` (modale Voir/Modifier) en plus de `Traite` ; prénom auteur ; date `Cree_le` ; **N/A `Page_*`** (écran déjà hors Page_*) ; ACL couche 6 inchangée (CRUD coachs) | 5, 6 (doc) | #105 · kanban `update-page-weekly` |
| 2026-10-04 | Paramètres d’affichage V1 (clair / sombre / système) : entrée **menu compte** ; modale DSFR ; défaut `system` ; préférence `localStorage` navigateur ; **N/A `Page_*`** (pas d’écran nav / garde) ; N/A tableaux A/B | 5 (confort) | feat/parametres-affichage · kanban `parametres-affichage` |
| 2026-10-04 | Recherche d’accueil `/` : **option A** — « Bonjour » + barre dans bandeau **pleine largeur** ; CTA hors bandeau ; badge statut missions (`StatutBadge`) ; cibles Produit + Mission + Personne ; **N/A `Page_*`** (variante rôle) ; filtrées par `Page_produits` / `Page_missions` / `Page_equipe` ; pas Invité ; pas de route `/recherche` | 5 | feat/recherche-accueil · #103 · kanban `recherche-accueil` |
| 2026-10-04 | Feuille de route : Admin peut éditer le corps carte (`Resume` / `Message`) dans le drawer ; allowlist écriture élargie ; ACL déjà Owner/Admin CRUD ; hors `Page_*` | 5, 6 (doc) | feat/kanban-edit-body-admin |
| 2026-10-04 | Invité : `Droits_pages.Page_regles_metier` = **true** (HITL porteur OK) ; autres rôles inchangés ; formule `Acl_profil` déjà miroir `Droits_pages.lookupOne(Role=$Role).Page_regles_metier` | 5 | feat/feuille-de-route-user-menu · suite #100 |
| 2026-10-04 | Weekly Ops (`/weekly`) : renommage libellé (nav / page / docs) ; contrastes dark mode (tokens DSFR colonnes / cartes) ; retrait sous-titres redondants — **N/A `Page_*`** (écran déjà hors Page_*) | 5 | cursor/fix-weekly-ops-dark-mode |
| 2026-10-04 | Menu compte : **Mon carnet** + **Documentation** (`/outils/regles-metier`, libellé) + Feuille de route ; retrait nav principale / Outils (anti-doublon) ; gardes inchangées (`Page_regles_metier` / rôle carnet) | 5 | cursor/user-menu-docs-carnet · suite #100 |
| 2026-10-04 | Feuille de route `/feuille-de-route` : **fixé ouvert** hors `Page_*` (tous rôles) ; menu compte (identité + lien) ; kanban retiré de `/` ; rappel Admin `DROITS_PAGES_ROLE_FIXED` | 5 | feat/feuille-de-route-user-menu · kanban `accueil-nav-refonte` |
| 2026-10-04 | Accueil `/` par rôle (CTA Freelance / Resp. / Admin / Invité) : **N/A `Page_*`** (variante d’écran sur `Role` + gardes nav) ; `Page_accueil` inchangé ; kanban temporaire sous les CTA ; pas de nouvelle route | 5 | feat/accueil-par-role · kanban `accueil-nav-refonte` |
| 2026-10-04 | Chrome nav PR0 (Retour MemoryRouter + slot menu user) : **pas** de nouvel écran / garde / `Page_*` — N/A tableaux A/B ; kanban `accueil-nav-refonte` | 5 (confort) | feat/nav-fondation-retour-user-slot |
| 2026-10-03 | Guide règles métier V1 (`/outils/regles-metier`) : nav Outils ; `Page_regles_metier` (widget + thématique Admin) ; défaut tous rôles oui ; colonne Grist = Owner UI (pas d’ACL API) ; N/A kanban Feedback id=34 (K3) | 4, 5 | feat/guide-regles-metier · HITL Owner OK create colonne |
| 2026-10-03 | Weekly ACL appliquées : User Attribute `Weekly_coach` ; `Weekly_coachs` Owner/Admin CRUD + soi R ; phase/agenda Owner + listés CRUD ; formule cible `user.Email == user.Weekly_coach.E_mail` | 6 | HITL Owner + vérif MCP |
| 2026-10-01 | Weekly : accès **uniquement** via `Weekly_coachs` (plus d’ouverture auto Admin/Resp.) ; ACL phase/agenda resserrées (Owner + listés) | 5, 6 (doc HITL) | Suite PR #95 |
| 2026-10-01 | Weekly : allowlist coachs = table Grist `Weekly_coachs` (e-mails hors git) ; User Attribute `Weekly_coach` + formules ACL documentées ; widget lit la table (Freelance) | 5, 6 (doc HITL) | PR #95 |
| 2026-10-01 | Weekly : accès Freelance restreint (allowlist) ; Admin/Resp. inchangés ; pas de colonne Équipe | 5, 6 (doc HITL) | PR #95 |
| 2026-10-01 | Weekly ACL : formules Owner UI documentées (`Weekly_phase` / `Weekly_agenda`) ; à poser / vérif MCP | 6 (doc HITL) | PR #95 revue |
| 2026-09-30 | Weekly (`/weekly`) : nav + garde Admin/Resp./Freelance (hors `Page_*`) ; kanban missions + agenda ; tables satellites `Weekly_phase` / `Weekly_agenda` (allowlist) ; ACL couches 6 à finaliser Owner | 5, 6 (doc) | Kanban `weekly-coachs-ab` |
| 2026-09-30 | Spike datatable (`/outils/spike-datatable`) : page labo Admin-only (`adminOnly` + `AdminRoleGuard`), hors `Page_*` ; lecture `Realise` ; N/A tableau A (pas un écran métier) | 5 | POC TanStack + TableShell |
| 2026-09-30 | Page Admin Droits des pages : section Produits (ex « À venir ») ; section **Fixés par rôle** (lecture seule : Mon carnet, Revue CRA équipe, Droits des pages) ; pas de nouveaux `Page_*` ; rule/checklist revue `Page_*` à chaque nouvel écran | 5 | Sync inventaire droits pages (A) |
| 2026-09-28 | Fiche mission drawer CRA Admin : + BDC (`BDC_cible`) + bloc calcul TTC indicatif (TJM × markup 15 % × TVA) ; `Calcul_TTC` lecture seule | 5 | Kanban `cra-fiche-mission` (TTC/BDC) |
| 2026-09-28 | Fiche mission : Admin peut Modifier / Dupliquer un CRA sous prestation (drawer mois · jours · description ; create prérempli ; collision mois refusée) ; hors Admin = lecture seule des sous-lignes | 5 | Kanban `cra-fiche-mission` |
| 2026-09-25 | Mon carnet : Admin/Resp. = liste lecture missions du département (presta intervenant même `Equipe.Equipe`, missions mixtes incluses) ; Freelance = saisie inchangée ; Invité masqué ; Resp. ajouté à la nav/garde ; note Revue CRA : ACL `Realise` faite | 5 | Carnet périmètre département / PR #90 |
| 2026-09-25 | Access Rules BDC montants : Owner **ou** Admin `+RU` ; hors `-RU` ; `OWNER` sans guillemets (Const `"OWNER"` censurait aussi les Owners) ; vérif MCP OK | 6 | HITL Owner — récap fiche BDC à 0 € |
| 2026-09-24 | Édition fiche Équipe (Admin) : bouton Modifier + drawer (mêmes champs que création, TJM inclus) ; `Equipe` update allowlisté | 5, 6 (doc) | [#63](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/63) / kanban `equipe-fiche-edition-admin` |
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
