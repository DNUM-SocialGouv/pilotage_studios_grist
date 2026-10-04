# Feuille de route

[← Accueil](README.md) › **Feuille de route**

> **Route** : `/feuille-de-route`  
> **Page** : `src/pages/FeuilleDeRoutePage.tsx`  
> **Entrée** : menu compte (avatar) → Mon carnet · **Feuille de route** · Documentation · CTA Admin sur l’accueil  
> **Tickets** : table Grist `Kanban` (`Nature` = Feedback \| Produit)  
> **Conversation** : table Grist `Kanban_commentaires` + drawer `TicketDrawer`

## Objet

Page dédiée au **kanban partagé** (Feedback · Backlog · En cours · Livré). Elle remplace le kanban qui occupait l’accueil : l’accueil sert désormais aux raccourcis par rôle ; la feuille de route se retrouve depuis le **menu compte** (icône avatar en haut à droite).

## Comportement

| Élément | Détail |
|---------|--------|
| Accès | **Ouvert à tous** les profils qui voient le widget — **hors `Page_*`** (fixé ouvert, rappel Admin « Fixés par rôle ») |
| Colonnes | Feedback · Backlog · En cours · Livré (inchangé) |
| Drawer | Conversation ; déplacement de colonne Admin ; édition Résumé / Détail Admin (`Resume` / `Message`) |
| Feedback flottant | Bouton « Un retour ? » reste disponible sur cette page |
| Nav | Pas d’entrée dans la nav principale — uniquement menu compte (+ CTA Admin accueil) |

### Droits / `Page_*`

| Sujet | Choix | Motif |
|-------|-------|--------|
| Route `/feuille-de-route` | **Fixé ouvert** — pas de `Page_feuille_de_route` | Équivalent de l’ancien kanban d’accueil visible par tous |
| Menu compte | **N/A** | Conteneur ; le lien suit la règle ci-dessus |

## Données Grist

`Kanban` (lecture + create Feedback + update colonne / corps Admin) · `Kanban_commentaires` (create + lecture drawer). Pas de nouvelle table.

### Édition corps (Admin)

| Champ drawer | Colonne Grist | Qui |
|--------------|---------------|-----|
| Résumé | `Resume` (obligatoire) | Admin (`isAdminRole` / standalone) |
| Détail | `Message` (optionnel) | Admin |

Pas d’édition Titre / guides / commentaires depuis ce chantier. ACL document déjà Owner/Admin `+CRUD` sur `Kanban`.

## Hors scope

- Drag-and-drop des cartes ; édition commentaires ; édition Titre / guides
- Mini-kanban sur l’accueil en plus de cette page
- Interrupteur Admin pour couper la page par rôle (V1)
- Sync automatique GitHub ↔ Grist ; notifications mail
