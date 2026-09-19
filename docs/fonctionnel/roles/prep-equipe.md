# Préparation `Equipe.Role_ACL` et emails

## Colonne `Role_ACL` (fait)

| Champ | Valeur |
|-------|--------|
| tableId | `Equipe` |
| columnId | `Role_ACL` |
| label | Rôle ACL |
| type | Choice |
| choices | `Admin`, `Responsable de département`, `Freelance`, `Invité` |

Remplissage : **manuel / HITL**. Compteurs (2026-09-19) : Admin et Freelance bien présents ; **Resp. / Invité** encore rares ou absents ; nombreuses lignes sans rôle.

Les Access Rules (#55) s’appuient sur `user.Equipe.Role_ACL` (User Attribute via `E_mail`).

## Emails Actifs à compléter

Compteur anonymisé : **~15** Actifs sans `E_mail` (voir [inventaire-partage.md](inventaire-partage.md) / gap MCP).  
Liste nominative : dossier local gitignoré `docs/fonctionnel/roles/private/` (hors git).

Sans e-mail aligné sur le compte Grist → pas de match User Attribute → pas de rôle résolu (Freelance / Admin).

## Alias email

Stocker dans `E_mail` **exactement** l’adresse du compte Grist.

## Repo public

Pas de noms ni d’adresses mail dans les docs versionnées.
