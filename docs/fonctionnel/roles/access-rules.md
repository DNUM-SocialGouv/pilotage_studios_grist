# Access Rules — état des lieux

Snapshot **2026-09-18** (soir) — MCP `grist_get_acl_rules`, doc `nei9DeARs5Eo`.  
Anonymisé — pas de noms ni d’emails.

## En clair

Les colonnes sensibles (montants, TJM, devis…) sont **refusées aux non-Owners** (`-RU`). La table **Constatations** est **Owners only** via une règle d’**autorisation** explicite (`user.Access == "OWNER"` → `+CRUD`). La propriété d’utilisateur Equipe reste en place.

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| Règles actives (hors entrée User Attribute) | **16** |
| User Attributes | **OK** — Name `Equipe`, lookup `user.Email` → `Equipe.E_mail` |
| Pattern montants / colonnes sensibles | **`-RU`** si `user.Access != "OWNER"` → **Owners only** |
| Distinction Admin / Resp. / Freelance / Invité dans les règles | **pas encore** (toujours Owner vs reste) |
| Colonne `Equipe.Role` | 4 Admin — via `user.Equipe.Role` |
| Ménage BDC | **fait** |
| Correction sens des droits | **fait** (soir) — était `+RU` (erreur), maintenant `-RU` |

## Lecture des permissions

Légende : **R**ead · **U**pdate · **C**reate · **D**elete · **S**chema.

| Préfixe | Sens |
|---------|------|
| `+RU` | **Accorder** lecture + modification |
| `-RU` | **Refuser** lecture + modification |
| `-S` | Refuser modification de structure |

Forme typique des règles sensibles (corrigée) :

> Si la personne **n’est pas** Owner → **`-RU`** sur ces colonnes → seuls les Owners les voient / modifient.

## Inventaire des 16 règles

| # | Table | Colonnes | Condition | Droits |
|---|-------|----------|-----------|--------|
| 1 | `*` (tout le document) | `*` | `user.Access != OWNER` | **-S** |
| 2 | `Equipe` | `TJM`, `Total_TTC` | `user.Access != "OWNER"` | **-RU** |
| 3 | `Previsionnel` | `TTC` | idem | **-RU** |
| 4 | `Realise` | `Calcul_TTC` | idem | **-RU** |
| 5 | `BDC` | Devis, Montant_TTC, Nombre_de_CRA, Plateforme, SOFIANE, Solde_TTC_CRA, Solde_TTC_MALT, Total_TTC_CRA | idem | **-RU** |
| 6 | `Previsionnel_summary_Freelance` | `TTC` | idem | **-RU** |
| 7 | `Realise_summary_Periode` | Calcul_TTC, TTC, TTC_Design, TTC_Product, TTC_RGAA, TTC_RU, Total_TTC | idem | **-RU** |
| 8 | `Realise_summary_Periode_Produit` | `Calcul_TTC` | idem | **-RU** |
| 9 | `Realise_summary_Produit` | `Calcul_TTC` | idem | **-RU** |
| 10 | `Realise_summary_Intervenants_Periode` | `Calcul_TTC` | idem | **-RU** |
| 11 | `Realise_summary_Equipe_Periode_Produit` | `Calcul_TTC` | idem | **-RU** |
| 12 | `Realise_summary_Equipe_Periode` | `Calcul_TTC` | idem | **-RU** |
| 13 | `Realise_summary_Equipe_Financeur_Periode` | `Calcul_TTC` | idem | **-RU** |
| 14 | `Realise_summary_Equipe` | Calcul_TTC, TTC, TJM, TTC_Design, TTC_Product, TTC_RGAA, TTC_RU, Total_TTC | idem | **-RU** |
| 15 | `MARS_26_Export_Factures_Malt_` | `*` | idem | **-RU** |
| 16 | `Constatations` | `*` | `user.Access == "OWNER"` | **+CRUD** (Owners only — pattern allow explicite) |

## Point d’attention

**Constatations** : pattern **allow Owners** (`user.Access == "OWNER"` → `+CRUD`). Les non-Owners n’ont pas de règle d’autorisation → pas d’accès.  
Si la page disparaît pour un Owner : vérifier « Voir en tant que », puis que cette règle allow est bien présente (ne garder **pas** seulement un deny `!= OWNER` sans allow).

**App sœur** : la clé API agit comme un utilisateur Grist. Elle doit être un **Owner** (ou bénéficier d’une règle dédiée) pour lire/écrire Constatations et les tables protégées.

## Tables métier du widget **sans** règle ACL dédiée sur le reste

`Plan_activite`, `Missions`, `Missions_enfants`, `Retours`, `Commandes_Sofiane`, `Equipe` hors TJM/TTC, `Realise` hors `Calcul_TTC`  
→ Accès = partage document + **-S** global. Les lignes CRA hors montant restent lisibles pour les non-Owners (voulu pour plus tard / freelances).

## Tranche UX « écrans selon rôle » — avancement

1. ~~Propriété d’utilisateur `Equipe`~~ — **fait**
2. ~~Sens des règles montants (`-RU`)~~ — **fait**
3. ~~Pont `Acl_profil` + `Droits_pages`~~ — **fait**
4. ~~Code widget nav + gardes~~ — **fait**
5. Règles par `Equipe.Role_ACL` sur `Realise` — **plus tard**

### Tables droits (2026-09-18 soir)

| Table | Règles |
|-------|--------|
| `Acl_profil` | `user.Email == rec.E_mail` → `+CR` ; `True` → `-CRUD` |
| `Droits_pages` | `user.Access == "OWNER" or user.Equipe.Role_ACL == "Admin"` → `+CRUD` ; `True` → `-CRUD` |

## Qui peut modifier quoi

| Action | Qui |
|--------|-----|
| Lire / documenter | Agent (MCP lecture) |
| Modifier Access Rules | **Owner, UI Grist uniquement** |
| Mutation API / MCP des ACL | **Interdit** |

## Référence

- [Intro Access Rules](https://support.getgrist.com/access-rules/)
- MCP : `grist_get_acl_rules` · [matrice-droits.md](matrice-droits.md)
