# Prestation Malt — gabarit drawer (spike)

## En clair

Maquettes HTML du tiroir « Modifier la prestation » enrichi : champs actuels
(titre, intervenant, jours, statut, date) + proposition **Mission Malt (URL)**,
**bon de commande**, et **lien Sofiane en lecture seule** (récupéré depuis le
BDC choisi — pas de champ Sofiane éditable), plus un bloc **Questions ouvertes**.
Ce n’est **pas** encore le drawer React du widget — seulement un fichier à
ouvrir pour discuter le feedback Kanban « Mission malt dans prestation ».

Données fictives. Pas de connexion Grist. Pas d’écriture.

## Voir le dessin (branche PR, un clic)

Lien **raw.githack** (rendu HTML avec `Content-Type: text/html`) — branche
de travail ou `main` après merge :

- [Gabarit drawer prestation Malt (main)](https://raw.githack.com/DNUM-SocialGouv/pilotage_studios_grist/main/design/prestation-malt/gabarit-drawer-prestation-malt.html)

Ne pas utiliser jsDelivr pour les `.html` de ce dépôt : il sert souvent
`text/plain`, donc le navigateur affiche le **code source** au lieu du dessin.

Les liens blob GitHub (`…/blob/…`) montrent aussi le **code**, pas le rendu —
à éviter pour le feedback.

## Ouvrir en local

```bash
open design/prestation-malt/gabarit-drawer-prestation-malt.html
```

Même fichier sous `public/design/prestation-malt/` : Vite le copie dans `dist/`
au build → GitHub Pages après merge sur `main`.

## URL Pages (après merge)

- [Gabarit drawer](https://dnum-socialgouv.github.io/pilotage_studios_grist/design/prestation-malt/gabarit-drawer-prestation-malt.html)

## Hors scope

- Implémentation React `MissionEnfantDrawer` / colonnes Grist
- Sync kanban Nature=Produit (feedback hors feuille de route produit)
- Matrice rôles / portage app solo
