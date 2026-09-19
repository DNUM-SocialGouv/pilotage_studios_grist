# Access Rules — état des lieux

Snapshot **2026-09-19** — MCP `grist_get_acl_rules`, doc `nei9DeARs5Eo`.  
Anonymisé — pas de noms ni d’emails.

## En clair

La table **Équipe** a des règles par **rôle** : lecture seule pour la plupart, écriture Owner/Admin, e-mail protégé, et les **Freelances** ne voient que Prénom-Nom · département · Spécialité sur l’annuaire. **TJM** et **Total TTC** : aujourd’hui encore **Owners only** ; cible produit = Owner / Admin sur toutes les fiches, et **soi-même** sur sa fiche (HITL ci-dessous).

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| User Attributes | **OK** — Name `Equipe`, `user.Email` → `Equipe.E_mail` |
| Montants BDC / summaries… | **`-RU`** si non-Owner (inchangé) |
| `Equipe.TJM`, `Total_TTC` | **À mettre à jour** — voir § HITL (cible Admin + soi) |
| `Equipe` table (`*`) | Owner **ou** `Role_ACL == Admin` → `+CRUD` ; `True` → `+R -CUD` |
| `Equipe.E_mail` | non-(Owner\|Admin) → `-RU` |
| `Equipe` colonnes « hors carte » | `Role_ACL == Freelance` → `-RU` (voir liste) |
| Distinction rôles sur `Realise` | **pas encore** (#47) |

## Lecture des permissions

| Préfixe | Sens |
|---------|------|
| `+RU` / `+CRUD` | Accorder |
| `-RU` / `-CUD` | Refuser |
| `-S` | Refuser structure |

## Table `Equipe` (détail #55 + TJM soi #60)

| Colonnes | Condition | Droits | Mémo |
|----------|-----------|--------|------|
| `TJM`, `Total_TTC` | **État actuel** : `user.Access != "OWNER"` | `-RU` | Non-Owners : pas de lecture/modif |
| `TJM`, `Total_TTC` | **Cible HITL** : `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin" and user.Email != rec.E_mail` | `-RU` | Refus sauf Owner, Admin, ou **sa** ligne |
| `E_mail` | `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin"` | `-RU` | Seuls Owner et Admin voient ou modifient l’e-mail |
| `Role_ACL` | idem (non-Owner et non-Admin) | `-RU` | Rôle réservé Owner/Admin |
| Multi (voir ci-dessous) | `user.Equipe.Role_ACL == "Freelance"` | `-RU` | Freelances : seulement Prénom-Nom, Equipe, Spécialité |
| `*` (Toutes) | `user.Access == "OWNER" or user.Equipe.Role_ACL == "Admin"` | `+CRUD` | Écriture complète |
| `*` (Toutes) | `True` | `+R -CUD` | Autres : lecture seule |

### HITL Owner — assouplir TJM / Total TTC (#60)

**Interdit** : mutation ACL via API / MCP. Uniquement UI Grist (Owner).

1. Ouvrir le document → **Access Rules**
2. Sur la ressource `Equipe` / colonnes `TJM,Total_TTC`, remplacer la condition actuelle  
   `user.Access != "OWNER"`  
   par :  
   `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin" and user.Email != rec.E_mail`  
   (permissions inchangées : `-RU`)
3. Mémo suggéré : « Owner / Admin : toutes les fiches ; chacun lit son TJM et Total TTC ; les collègues non »
4. Tester **Voir comme** : Freelance A sur sa fiche → montants visibles ; Freelance A sur fiche B → masqués ; Admin → toutes les fiches
5. Mettre à jour ce snapshot + journal [`matrice-droits.md`](matrice-droits.md)

Le widget ([#61](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/61)) n’affiche TJM / Total TTC que si Grist les livre (nombre lisible).

Colonnes du bloc Freelance (`-RU`) :  
`Portage`, `Statut`, `Nb_Jours`, `Ordinateur2`, `Nom_BdC`, `BdC_Chorus`, `Droits_d_acces_aux_tables_budgets`, `Mode_recrutement`, `Missions_en_cours`, `Missions_en_cours2`, `Portage_en_cours`, `Role_ACL`.

Colonnes **laissées visibles** aux Freelances : `Prenom_Nom`, `Equipe`, `Specialite` (+ héritage lecture table).

**UI Grist** : le CRUD se configure sur le bloc **Toutes** (`*`), pas dans un bloc colonnes (qui n’offre que R/U).

## Table `Acl_profil` (pont droits pages)

| Condition | Droits | Mémo (texte d’aide UI) |
|-----------|--------|------------------------|
| `user.Access == "OWNER" or user.Equipe.Role_ACL == "Admin"` | `+CRUD` | Owner du document ou Admin (rôle Équipe) : peuvent créer, lire, modifier et supprimer toutes les fiches — utile pour le ménage (doublons) et le dépannage. |
| `user.Email == rec.E_mail` | `+CR` | Chaque personne peut créer et lire uniquement sa propre fiche (e-mail = compte connecté). Le widget s’en sert pour afficher les bons menus. Pas de modification ni de suppression par soi-même. |
| `True` | `-CRUD` | Par défaut, personne d’autre ne voit ni n’écrit dans cette table. Sans cette règle de refus, les droits seraient trop ouverts. |

Le widget crée automatiquement la fiche si elle manque (`E_mail` seulement ; `Role` / `Page_*` restent des formules Grist).

## Autres règles (inchangées, synthèse)

| Table | Colonnes | Condition | Droits |
|-------|----------|-----------|--------|
| `*` | `*` | `user.Access != OWNER` | `-S` |
| `Previsionnel` / summaries / `Realise.Calcul_TTC` / `BDC` montants / Malt… | (sensibles) | non-Owner | `-RU` |
| `Constatations` | `*` | `user.Access == "OWNER"` | `+CRUD` |
| `Acl_profil` | `*` | Owner **ou** Admin → `+CRUD` ; `user.Email == rec.E_mail` → `+CR` ; `True` → `-CRUD` | Ménage Owner/Admin ; create/read soi ; reste interdit |
| `Droits_pages` | `*` | Owner **ou** Admin → `+CRUD` ; `True` → `-CRUD` | |

## Widget

L’annuaire `/equipe` s’adapte : si `Statut` / `Portage` / `Rôle` sont illisibles, pas de filtre Actif forcé, colonnes masquées. Feedback : e-mail `CENSORED` ignoré dans le select auteur.

## Qui peut modifier quoi

| Action | Qui |
|--------|-----|
| Lire / documenter | Agent (MCP lecture) |
| Modifier Access Rules | **Owner, UI Grist uniquement** |
| Mutation API / MCP des ACL | **Interdit** |

## Référence

- [Intro Access Rules](https://support.getgrist.com/access-rules/)
- MCP : `grist_get_acl_rules` · [matrice-droits.md](matrice-droits.md) · issue [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55)
