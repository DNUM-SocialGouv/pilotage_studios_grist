# Vue Studio — prototypes HTML (spike)

## En clair

Deux maquettes HTML autonomes pour faire réagir l’équipe (Philippe et autres) sur une
idée de « vue studio » : qui travaille sur quels produits. Ce n’est **pas** encore
l’écran Accueil du widget React — seulement des fichiers à ouvrir dans le navigateur
ou via des liens publics stables après merge.

| Prototype | Idée |
|-----------|------|
| **Constellation** | Personnes (cercles) reliées aux produits (carrés) par des traits = prestations |
| **Orbites** | Chaque produit = planète ; les personnes gravitent autour (satellites) |

Données fictives. Pas de météo Weekly. Pas de connexion Grist.

## Ouvrir en local

Depuis la racine du dépôt :

```bash
open design/vue-studio/prototype-constellation-studio.html
open design/vue-studio/prototype-orbites-studio.html
```

Ou double-clic dans le Finder. Aucun serveur n’est requis.

Les mêmes fichiers sont aussi sous `public/design/vue-studio/` : Vite les copie dans
`dist/` au build, ce qui les publie sur GitHub Pages après merge sur `main`.

## URLs Pages (après merge)

Base : `https://dnum-socialgouv.github.io/pilotage_studios_grist/`

- [Constellation](https://dnum-socialgouv.github.io/pilotage_studios_grist/design/vue-studio/prototype-constellation-studio.html)
- [Orbites](https://dnum-socialgouv.github.io/pilotage_studios_grist/design/vue-studio/prototype-orbites-studio.html)

## Hors scope

- Implémentation React Accueil / nav / gardes
- Écriture Grist / kanban Feedback (commentaire carte = hors ce spike dépôt)
