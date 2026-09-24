# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Tickets** : table Grist unique `Kanban` (`Nature` = Feedback \| Produit)  
> **Conversation** : table Grist `Kanban_commentaires` + drawer `TicketDrawer`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist : titre + pictogramme + **feuille de route en kanban** (Feedback · Backlog · En cours · Livré). Chaque carte ouvre un **tiroir** (résumé → en pratique / détail → pastilles méta → actions → conversation). La navigation des modules se fait via la **nav** (`WidgetNav`), pas une liste sur l’accueil.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| En-tête | Titre « Pilotage studios » + pictogramme `Factory` |
| Kanban | Titre « Feuille de route » + **4 colonnes** : **Feedback** (CTA + tickets `Nature=Feedback` en colonne `feedback`) · **Backlog** · **En cours** · **Livré** (dernier livré en haut) |
| Carte | Cliquable → drawer SM (`TicketDrawer`) |
| Drawer (ordre) | En-tête (badges + titre + colonne **Admin** compacte) → Résumé → En pratique (Produit) ou Détail (Feedback) → pastilles méta → actions (page / GitHub) → Conversation |
| Colonne Admin | Update `Colonne_kanban` (+ sync `Statut_produit` / `Statut` feedback) via widget ; ACL Grist = vraie barrière |
| Conversation | Tout utilisateur peut commenter (identité via liste Équipe) |
| Nav | `WidgetNav` : Accueil icône home ; **Mon carnet** (Freelance/Admin) ; **Budget** / **Outils** en menus |
| Layout | Panneau large (`welcome-page__panel--wide`) pour 4 colonnes |
| Fallback | Route `*` → redirection vers `/` |

## Données Grist

- `Kanban` : create Feedback via bouton « Un retour ? » ; lecture kanban ; update colonne **Admin** (UX) / Owner·Admin (ACL).
- Cartes **unifiées** (Feedback et Produit) : titre · badge · thème · résumé · auteur/date si présents.
- `Kanban_commentaires` : create + lecture fil (`Cible_id` = id ligne `Kanban`) — ordre **plus récent en haut**.
- Anciennes tables `Retours` / `Roadmap` : migrées ; plus utilisées par le widget (archivables Owner).

## Hors scope

- Contenu marketing / branding Marianne
- Liste de modules / raccourcis sur l’accueil (retirée — doublon nav + roadmap)
- Drag-and-drop des cartes
- Édition du texte / guide depuis le widget
- Modifier / supprimer un commentaire côté widget
- Sync automatique GitHub ↔ Grist ; notifications mail
