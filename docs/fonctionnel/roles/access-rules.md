# Access Rules — état actuel et procédure cible

## État actuel (lecture `_grist_ACLRules` / `_grist_ACLResources`)

- **16 règles**, **30 ressources**, **pas de User Attributes** configurés (`userAttributes` vide).
- Pas de matching `user.Email` → `Equipe` aujourd’hui.
- Schéma document : non-Owners **ne peuvent pas** modifier la structure (`-S` sur `*` si `user.Access != OWNER`).
- Colonnes / tables **financières** : non-Owners ont souvent **+RU** (ou +CRUD) sur des ressources ciblées — en pratique, pattern « Owners-only pour les montants » via conditions `user.Access != "OWNER"` associées à des `colIds` sensibles.

### Ressources sensibles déjà protégées (extrait)

| Table | Colonnes (extrait) | Pattern |
|-------|--------------------|---------|
| `Equipe` | `TJM`, `Total_TTC` | Owner-centric |
| `BDC` | Devis, Engagement, montants, Sofiane… | Owner-centric |
| `Realise` | `Calcul_TTC` | Owner-centric |
| `Previsionnel` | `TTC` | Owner-centric |
| Summaries Realise / Previsionnel | colonnes TTC / Calcul_TTC | Owner-centric |
| `MARS_26_Export_Factures_Malt_` | `*` | Owner-centric |
| `Constatations` | `*` | +CRUD si non-Owner (à challenger en atelier) |

Les règles actuelles **ne distinguent pas** Admin / Resp. / Freelance / Invité — seulement Owner vs reste.

Outil MCP : `grist_get_acl_rules` (lecture).

## Cible — User Attributes

Dans **Règles d’accès** (Owner) → **Add User Attributes** :

| Champ | Valeur |
|-------|--------|
| Name | `Equipe` |
| Attribute to look up | `user.Email` |
| Lookup table | `Equipe` |
| Lookup column | `E_mail` |

Ensuite disponibles : `user.Equipe.Role`, `user.Equipe.Equipe`, `user.Equipe.Droits_d_acces_aux_tables_budgets`, etc.

**Prérequis** : emails = email de connexion Grist (voir [inventaire-partage.md](inventaire-partage.md)).

## Cible — règles par rôle (après validation [matrice-droits.md](matrice-droits.md))

Exemples à adapter (ne pas coller aveuglément) :

```text
# Admin : tout sauf structure réservée Owners si souhaité
user.Equipe.Role == "Admin"
→ +CRUD (tables métier)

# Responsable : lecture département
user.Equipe.Role == "Responsable de département" and user.Equipe.Equipe == rec.Equipe
→ +R

# Freelance : ses lignes Realise (à caler sur le modèle de données)
user.Equipe.Role == "Freelance" and rec.Intervenants == user.Equipe.id
→ +RU

# Invité : deny by default, allow tables whitelist lecture
user.Equipe.Role == "Invité"
→ +R sur tables autorisées seulement

# Default non-Owner
user.Access != OWNER
→ Deny All (sauf règles plus spécifiques au-dessus)
```

Conserver une **règle de secours Owners** pour éviter le lock-out.

## Procédure de déploiement (HITL)

1. Valider la matrice.
2. Remplir `Equipe.Role` + emails Actifs.
3. Ajouter User Attribute (ci-dessus).
4. Ajouter règles **progressivement** (une table à la fois).
5. Tester avec **View As** (`grist_users_for_view_as` + UI) pour 1 Admin, 1 Resp., 1 Freelance, 1 Invité.
6. Documenter le résultat dans ce fichier (date + qui a testé).

## Écriture API des ACL

**Hors scope V1** : ne pas muter `_grist_ACLRules` via API/MCP (risque lock-out). Configuration **UI Grist uniquement**.

## Référence

- [Intro Access Rules](https://support.getgrist.com/access-rules/)
- MCP : `grist_access_rules_reference`
