# Access Rules — état des lieux

Snapshot **2026-09-19** — MCP `grist_get_acl_rules`, doc `nei9DeARs5Eo`.  
Anonymisé — pas de noms ni d’emails.

## En clair

La table **Équipe** a des règles par **rôle** : lecture seule pour la plupart, écriture Owner/Admin, e-mail protégé, et les **Freelances** ne voient que Prénom-Nom · département · Spécialité sur l’annuaire. **TJM** et **Total TTC** : Owner / Admin sur toutes les fiches, et **soi-même** sur sa fiche (#60 — appliqué 2026-09-19).

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| User Attributes | **OK** — Name `Equipe`, `user.Email` → `Equipe.E_mail` |
| Montants BDC / summaries… | **`-RU`** si non-Owner (inchangé) |
| `Equipe.TJM`, `Total_TTC` | **Appliqué** — refus sauf Owner, Admin, ou soi (`user.Email == rec.E_mail`) |
| `Equipe` table (`*`) | Owner **ou** `Role_ACL == Admin` → `+CRUD` ; `True` → `+R -CUD` |
| `Equipe.E_mail` | **HITL #33** : deny hors soi (comme TJM) — voir détail |
| `Equipe` colonnes « hors carte » | `Role_ACL == Freelance` → `-RU` (voir liste) |
| Distinction rôles sur `Realise` | **pas encore** (#47) — après la V1 déclaration widget |

## Lecture des permissions

| Préfixe | Sens |
|---------|------|
| `+RU` / `+CRUD` | Accorder |
| `-RU` / `-CUD` | Refuser |
| `-S` | Refuser structure |

## Table `Equipe` (détail #55 + TJM soi #60)

| Colonnes | Condition | Droits | Mémo |
|----------|-----------|--------|------|
| `TJM`, `Total_TTC` | `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin" and user.Email != rec.E_mail` | `-RU` | Owner / Admin : toutes les fiches ; chacun lit sa ligne ; collègues non (**appliqué** 2026-09-19) |
| `E_mail` (**HITL #33 — à poser comme le TJM**) | `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin" and user.Email != rec.E_mail` | `-RU` | **Une seule règle de refus**, calquée sur TJM. Owner / Admin voient tout ; chacun lit **sa** ligne ; collègues non. |
| ~~`E_mail` deny global + `+R` soi~~ | — | — | **Ne pas** cumuler un `-RU` « non-Owner/Admin » **et** un `+R` soi : en Grist le refus l’emporte, le freelance ne lit toujours pas son e-mail. |
| `Role_ACL` | idem (non-Owner et non-Admin) | `-RU` | Rôle réservé Owner/Admin |
| Multi (voir ci-dessous) | `user.Equipe.Role_ACL == "Freelance"` | `-RU` | Freelances : seulement Prénom-Nom, Equipe, Spécialité |
| `*` (Toutes) | `user.Access == "OWNER" or user.Equipe.Role_ACL == "Admin"` | `+CRUD` | Écriture complète |
| `*` (Toutes) | `True` | `+R -CUD` | Autres : lecture seule |

**Vérif MCP** (règle ressource `Equipe` / `TJM,Total_TTC`) : condition et `-RU` conformes ; mémo UI : « Admin voit toutes les fiches ; chacun voit sa ligne ; les collègues non. »

**Point d’attention** : l’e-mail du compte Grist doit être **identique** à `Equipe.E_mail` (sinon « soi » ne matche pas — voir [prep-equipe.md](prep-equipe.md)).

Le widget ([#61](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/61)) n’affiche TJM / Total TTC que si Grist les livre (nombre lisible).

Colonnes du bloc Freelance (`-RU`) :  
`Portage`, `Statut`, `Nb_Jours`, `Ordinateur2`, `Nom_BdC`, `BdC_Chorus`, `Droits_d_acces_aux_tables_budgets`, `Mode_recrutement`, `Missions_en_cours`, `Missions_en_cours2`, `Portage_en_cours`, `Role_ACL`.

Colonnes **laissées visibles** aux Freelances : `Prenom_Nom`, `Equipe`, `Specialite`, `Avatar` (+ héritage lecture table).

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
