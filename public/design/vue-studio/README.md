# Vue Studio — prototypes HTML (spike)

## En clair

Deux maquettes HTML autonomes pour faire réagir l’équipe (Philippe et autres) sur une
idée de « vue studio » : qui travaille sur quels produits. Ce n’est **pas** encore
l’écran Accueil du widget React — seulement des fichiers à ouvrir dans le navigateur
ou via des liens publics.

| Prototype | Idée |
|-----------|------|
| **Constellation** | Personnes (cercles) reliées aux produits (carrés) par des traits = prestations |
| **Orbites** | Chaque produit = planète ; les personnes gravitent autour (satellites) |

Données fictives. Pas de météo Weekly. Pas de connexion Grist.

## Voir le dessin (branche PR, un clic)

Liens **jsDelivr** (rendu HTML, pas le code source) — branche `spike/vue-studio-prototypes-html` :

- [Constellation](https://cdn.jsdelivr.net/gh/DNUM-SocialGouv/pilotage_studios_grist@spike/vue-studio-prototypes-html/design/vue-studio/prototype-constellation-studio.html)
- [Orbites](https://cdn.jsdelivr.net/gh/DNUM-SocialGouv/pilotage_studios_grist@spike/vue-studio-prototypes-html/design/vue-studio/prototype-orbites-studio.html)

Secours [raw.githack](https://raw.githack.com/) (mêmes chemins) :

- [Constellation](https://raw.githack.com/DNUM-SocialGouv/pilotage_studios_grist/spike/vue-studio-prototypes-html/design/vue-studio/prototype-constellation-studio.html)
- [Orbites](https://raw.githack.com/DNUM-SocialGouv/pilotage_studios_grist/spike/vue-studio-prototypes-html/design/vue-studio/prototype-orbites-studio.html)

Les liens blob GitHub (`…/blob/…`) montrent le **code**, pas le rendu — à éviter pour le feedback.

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
- Sync kanban Nature=Produit (cette carte Feedback reste hors feuille de route produit)
