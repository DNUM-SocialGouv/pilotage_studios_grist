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

| # | Couche | Où | Rôle | Statut (2026-09-18) |
|---|--------|-----|------|---------------------|
| 1 | Partage du document | Grist → Partager | Porte d’entrée | En place |
| 2 | Rôle ACL (`Equipe.Role_ACL`) | Table Equipe | Qui est quoi | En place (Admin renseignés) |
| 3 | Propriété d’utilisateur | Règles d’accès → propriétés | Qui est connecté → fiche Equipe | **Fait** (`Equipe` ← `user.Email` / `E_mail`) |
| 4 | Pont vers le widget | Table `Acl_profil` | Rôle + `Page_*` (formules ← `Droits_pages`) | **Fait** |
| 5 | Confort interface (widget) | Nav + gardes de route | Masquer / bloquer écrans | **Fait** (selon `Page_*`) |
| 6 | Règles d’accès (tables) | Access Rules Grist | Protéger les données (fins) | **Plus tard** (pas de mur Admin-only sur `Realise`) |

Détail technique des règles actuelles : [access-rules.md](access-rules.md).

---

## A — Écrans du widget (couche 5)

Légende cellules : **oui** = accessible · **non** = masqué / refusé · **?** = non décidé · **—** = hors sujet.

| Écran / parcours | Route | Admin | Resp. | Freelance | Invité | Statut | Notes |
|------------------|-------|-------|-------|-----------|--------|--------|-------|
| Accueil | `/` | oui | oui | oui | oui | **Appliqué** (widget + `Droits_pages`) | |
| Plans d’activité | `/pa` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Couche 5 ; données encore ouvertes (couche 6 plus tard) |
| Bons de commande | `/bdc` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Idem |
| Prestation / CRA | `/cra` | **oui** | **non** | **non** | **non** | **Appliqué** UX | Freelances : accès données fins plus tard (couche 6) |
| Récap porteurs | `/outils/recap-porteurs` | **oui** | **non** | **non** | **non** | **Appliqué** UX | |
| Procès-verbaux | `/pv` | **oui** | **non** | **non** | **non** | **Appliqué** UX (stub) | |
| Missions | `/missions` | oui | oui | oui | oui | **Appliqué** UX | |
| Produits / Intervenants | stubs | oui | oui | oui | oui | **Appliqué** UX (stub) | |

---

## B — Données Grist (couche 6) — cible atelier

Légende permissions : **R**ead · **U**pdate · **C**reate · **D**elete · **S**chema · **—** deny.

Cellules = **propositions** sauf mention « appliqué » / « partiel (Owner) ».

| Table / ressource | Admin | Resp. | Freelance | Invité | Appliqué ? | Notes |
|-------------------|-------|-------|-----------|--------|------------|-------|
| `Equipe` (hors TJM/TTC) | CRUD | R (+ U limité ?) | R soi | R / — | Non (rôle) | Partiel historique Owner vs reste |
| `Equipe.TJM`, `Total_TTC` | RU | — | — | — | **Appliqué (Owner)** | `-RU` si non-Owner (2026-09-18 soir) |
| `Plan_activite` | CRUD | R ? | R / — | R / — | Non (rôle) | Ancre widget |
| `BDC` métadonnées | CRUD | R ? | R limité | R / — | Non (rôle) | |
| `BDC` montants / Devis / Sofiane… | RU | — | — | — | **Appliqué (Owner)** | `-RU` si non-Owner |
| `Constatations` | CRUD | — | — | — | **Appliqué (Owner)** | `user.Access == "OWNER"` → `+CRUD` |
| `Commandes_Sofiane` | CRUD | R | — | — | Non (rôle) | |
| `Realise` (CRA) hors montants | CRUD | R département | **R/U ses lignes** | — | **Non** | Lignes hors `Calcul_TTC` encore ouvertes |
| `Realise.Calcul_TTC` | RU | — | — | — | **Appliqué (Owner)** | `-RU` si non-Owner |
| `Missions` / `Missions_enfants` | CRUD | R/U dép. | R ses missions | R / — | Non (rôle) | |
| `Retours` (feedback) | CR (widget liste) | C (+ R liste V1) | C (+ R liste V1) | C ? | Widget create + **Read liste V1** | Kanban Feedback partagé ; resserrer Read = HITL si audience élargie |
| `Acl_profil` | CR soi | CR soi | CR soi | CR soi | **Appliqué** | `user.Email == rec.E_mail` → `+CR` ; `True` → `-CRUD` |
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
2. Un **Freelance** peut-il éditer ses CRA (`Realise`) ou lecture seule au début ?
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
