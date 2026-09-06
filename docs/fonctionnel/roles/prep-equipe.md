# Préparation `Equipe.Role` et emails

## Colonne `Role` (fait)

| Champ | Valeur |
|-------|--------|
| tableId | `Equipe` |
| columnId | `Role` |
| label | Rôle ACL |
| type | Choice (`isFormula: false`) |
| choices | `Admin`, `Responsable de département`, `Freelance`, `Invité` |

Remplissage des valeurs : **manuel / HITL** après validation de [matrice-droits.md](matrice-droits.md). Aucune ligne pré-remplie automatiquement.

## Emails Actifs à compléter

Compteur anonymisé : **15** Actifs sans `E_mail` (voir [inventaire-partage.md](inventaire-partage.md)).  
Liste nominative : dossier local gitignoré `docs/fonctionnel/roles/private/` (hors git).

## Alias email

Règle : stocker dans `E_mail` **exactement** l’adresse du compte Grist.  
Cas concrets : section « Alias » du fichier nominatif local sous `private/` (si présent).

## Repo public

Pas de noms ni d’adresses mail dans les docs versionnées.  
Inventaires détaillés = `docs/fonctionnel/roles/private/` uniquement (gitignore). Suppression : `rm -rf docs/fonctionnel/roles/private`.
