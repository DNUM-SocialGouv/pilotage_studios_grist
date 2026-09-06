# Matrice de droits (brouillon HITL)

À valider en atelier avant toute modification large des Access Rules.  
Les cellules sont des **propositions** — pas encore appliquées côté Grist.

Légende permissions Grist : **R**ead · **U**pdate · **C**reate · **D**elete · **S**chema · **—** deny.

Rôles = valeurs `Equipe.Role` :

- **Admin**
- **Resp.** = Responsable de département
- **Freelance**
- **Invité**

Filtre ligne typique Resp. : `user.Equipe.Equipe == rec.Equipe` (département).  
Filtre Freelance (à affiner) : lignes où l’intervenant = `user.Equipe` (ref id) ou email.

## Matrice tables sensibles

| Table / ressource | Admin | Resp. | Freelance | Invité | Notes |
|-------------------|-------|-------|-----------|--------|-------|
| `Equipe` (hors TJM/TTC) | CRUD | R (+ U limité ?) | R soi | R restreint / — | Voir colonnes sensibles ci-dessous |
| `Equipe.TJM`, `Total_TTC` | RU | — ou R si besoin | — | — | **Déjà** restreint Owners en ACL actuelle |
| `Plan_activite` | CRUD | R (filtre bureau ?) | R / — | R / — | Ancre widget |
| `BDC` (métadonnées) | CRUD | R (+ filtre `Equipe2` ?) | R limité | R / — | |
| `BDC` montants / Devis / Sofiane… | RU | — ou R | — | — | **Déjà** colonnes Owner-only |
| `Constatations` | CRUD | R | — | — | ACL actuelle : +CRUD si non-Owner (à revoir) |
| `Commandes_Sofiane` | CRUD | R | — | — | |
| `Realise` (CRA) hors montants | CRUD | R département | R/U ses lignes | — | |
| `Realise.Calcul_TTC` | RU | — | — | — | **Déjà** Owner-only |
| `Previsionnel` / TTC | CRUD / RU | — | — | — | **Déjà** TTC Owner-only |
| Summaries `*_summary_*` montants | RU | — | — | — | **Déjà** Owner-only |
| `MARS_26_Export_Factures_Malt_` | RU | — | — | — | **Déjà** Owner-only |
| `Missions` / `Missions_enfants` | CRUD | R/U département | R ses missions | R / — | Stub widget |
| `Demandes` | CRUD | R/U | R / — | — | |
| Structure tables (S) | Admin/Owner | — | — | — | ACL actuelle : `-S` si non-Owner |

## Mapping partage Grist ↔ rôle métier (proposition)

| Partage | Role métier suggéré |
|---------|---------------------|
| Owner | Admin (sauf exception) |
| Editor | Resp. ou Freelance selon profil |
| Viewer | Invité ou Freelance lecture seule |

Le booléen existant `Droits_d_acces_aux_tables_budgets` (2 personnes) peut être **absorbé** par `Role=Admin` ou conservé comme condition `user.Equipe.Droits_d_acces_aux_tables_budgets` en transition.

## Questions ouvertes (atelier)

1. Un **Resp. Product** voit-il les BDC Design / Tech, ou seulement Product ?
2. Un **Freelance** peut-il éditer ses CRA (`Realise`) ou lecture seule ?
3. Les **Invités** (Viewers métier) voient-ils le Custom Widget PA/BDC, ou seulement des pages Grist dédiées ?
4. Faut-il une table `Utilisateurs_ACL` séparée de `Equipe` (RH freelance vs comptes Grist) ?
5. Que faire des 12 Owners actuels : tous `Admin`, ou réduire le partage Owner ?

## Critères de fin atelier

- [ ] Matrice ci-dessus validée ou corrigée
- [ ] Décision table `Equipe` vs `Utilisateurs_ACL`
- [ ] Liste nominative Role remplie pour Actifs avec email
- [ ] Plan de test View As (1 compte par rôle)
