# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Contenu rôle** : `src/utils/welcomeHomeByRole.ts` + `WelcomeRoleHome`  
> **Tickets** (transitoire sous les CTA) : table Grist `Kanban` (`Nature` = Feedback \| Produit)  
> **Conversation** : table Grist `Kanban_commentaires` + drawer `TicketDrawer`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist : un **accueil léger selon le rôle** (Freelance, Responsable de département, Admin, Invité) avec quelques boutons utiles, puis — **temporairement** tant que PR-B n’est pas livrée — la **feuille de route en kanban** (Feedback · Backlog · En cours · Livré). La navigation complète reste dans la **nav** (`WidgetNav`) ; l’accueil ne recopie pas tout le menu.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| Accueil par rôle | Salutation « Bonjour » + libellé de rôle + message court + **2–4 CTA** filtrés comme la nav (`Page_*` + flags rôle / département) |
| Freelance | CTA : Mon carnet · Missions · Règles métier ; rappel déclarer les jours ; pas de Budget |
| Responsable | CTA : Revue CRA équipe (si département) · Mon carnet · Missions ; hint département ; pas de CTA Weekly générique |
| Admin | CTA : Missions · Bons de commande · Droits des pages ; lien Feuille de route **après PR-B** (`includeFeuilleDeRoute`) |
| Invité | CTA : Missions · Produits · Règles métier ; pas de carnet / revue / droits |
| Profil vide / erreur | Message explicite + CTA limités (Règles / Missions si ouverts en fail-closed) — **pas** de 5ᵉ rôle inventé |
| Kanban | Titre « Feuille de route » **sous** les CTA (état transitoire) ; 4 colonnes + drawer inchangés |
| Carte / drawer | Inchangés (voir historique kanban) |
| Nav | `WidgetNav` : chrome **Page précédente** · Accueil · modules · **menu utilisateur** (droite) |
| Layout | Panneau large (`welcome-page__panel--wide`) |
| Fallback | Route `*` → redirection vers `/` |

> **Refonte** (kanban `accueil-nav-refonte`) : PR0 chrome livrée · **PR-A** = cet accueil par rôle · **PR-B** = menu user actif + déplacement kanban vers `/feuille-de-route` (alors retirer le kanban de `/`).

### Droits / `Page_*`

| Sujet | Choix | Motif |
|-------|-------|--------|
| Route `/` | `Page_accueil` existante (non modifiable Admin) | Pas de nouvelle colonne |
| Variante CTA par rôle | **N/A `Page_*`** — branchement sur `Role` (+ mêmes gardes que la nav) | Variante d’écran, pas nouvel interrupteur |
| Feuille de route dédiée | PR-B — **fixé ouvert** sans `Page_*` | Décision porteur |

## Données Grist

- Profil session : `Acl_profil` (rôle + `Page_*`) via `useAclProfil` — déjà chargé pour la nav.
- `Kanban` / `Kanban_commentaires` : inchangés (create Feedback, lecture, update colonne Admin, conversation).
- Pas de nouvelle table ni d’écriture pour l’accueil rôle.

## Hors scope

- Contenu marketing / branding Marianne / hero image
- Tuiles recopiant **toute** la nav
- Tableaux de bord chiffrés (reste BDC, jours CRA, alertes)
- Mini-kanban Admin en plus de la page dédiée
- Redirection auto Freelance → `/cra/declarer`
- Personnalisation éditable dans Grist (CMS d’accueil)
- Drag-and-drop des cartes ; édition texte tickets / commentaires
- Sync automatique GitHub ↔ Grist ; notifications mail
- Features IA / analyse
