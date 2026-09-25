# Fiche mission — `/missions/:id`

[← Missions](README.md) › **Fiche**

## Objet

Détail d’une mission master : hero type Mon carnet / produit (bandeau CallOut), onglets — aligné UI sur la fiche produit pour l’en-tête ; contenu métier mission (statut, produit, département, Modifier). Édition master via drawer ; CRUD prestations via drawer dédié ; **Note studio** éditable sur place (textarea Markdown) ; **Liens FIGMA / Notion** éditables sur place (panneau Contexte, au-dessus des PJ) ; **Docs** gérés dans la colonne Contexte (télécharger / ajouter / détacher) ; pas d’IA ni d’édition inline des champs narratifs Contexte (demande, enjeux…).

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions/:id` |
| Onglet | Query `?onglet=contexte` \| `equipe` \| `notes` (alias : `note-studio`, `tab`). Alias legacy `realisations` → **Équipe & prestations** ; alias `pieces-jointes` / `note-pieces-jointes` → **Contexte** |
| Page | `src/pages/MissionsDetailView.tsx` |
| Retour | Fil d’Ariane : Accueil › Missions › nom de la mission |

## États

Même gate que la liste (`MissionsLayout`). Mission introuvable : alerte warning + retour liste. Pendant un rechargement après création : « Chargement de la mission… » (évite un faux introuvable).

## Hero (style Mon carnet / produit)

| Zone | Contenu |
|------|---------|
| Fil d’Ariane | Dans le hero : Accueil › Missions › nom de la mission |
| Titre | CallOut `titleAs="h2"` — `Nom_de_la_mission` (DSFR CallOut : pas de `h1`) |
| Badge | Statut (`StatutBadge`) sous le titre |
| Méta | Produit (texte) · Département (pastille `tdEquipeTag` si renseigné, sinon `—`) · Dernière mise à jour (masquée si vide) |
| Actions | Colonne droite du hero : bouton **Modifier** (drawer edit) |

Pas de CR / estimation / IA. Pas de champs spécifiques produit (En prod, liens site…).

## Drawer « Modifier » (master)

Champs **Nom · Produit · Statut** uniquement. Prestations : renvoi vers l’onglet **Équipe & prestations** (lien in-drawer). Après enregistrement : Alert succès in-drawer.

## Drawer prestation (onglet Équipe)

| Mode | Champs |
|------|--------|
| **Ajouter** / **Modifier** | **Titre de la prestation** (fallback nom intervenant ; colonne Grist `Titre_de_la_prestation`) · Intervenant (obligatoire) · Jours envisagés (optionnel) · Statut (défaut « En cours ») · Date de début (optionnel) |
| Figé / hors formulaire | `Type_prestation` = `Freelance_jours` à la création seulement ; jamais édité ni affiché ; `Mission_parent` figé **dans ce drawer** (réaffectation possible uniquement à la création d’une mission — voir [liste](liste.md)) ; pas de date de fin ni suppression |

Après succès : Alert in-drawer (edit) ou fermeture (create) + rechargement des données missions.

## Onglets

| Onglet | Contenu |
|--------|---------|
| **Contexte** | Colonne gauche : champs narratifs (demande, enjeux, historique, utilisateurs / périmètre) — titres `#`–`######`, paragraphes, listes `*` / `-` / `1.`, tableaux GFM `| … |`, gras `**…**`, liens Markdown `[libellé](https://…)`. Colonne droite sticky (desktop) : **Liens FIGMA / Notion** (`Liens_FIGMA_Notion` — URLs nues ou Markdown, cliquables, édition sur place Ajouter / Modifier) **au-dessus** des **Pièces jointes** (`Docs` — télécharger · **Supprimer** · **Ajouter un document** ; PDF/Office/MD/ODT/image, 20 Mo max) |
| **Équipe & prestations** | Filtres **équipe** + **période CRA** (Du mois / Au mois, bornes inclusives sur `Realise.Periode`) + **barre empilée** % TTC par équipe (montant affiché `… € TTC · … jours`, sans titre « TTC par équipe ») ; CTA **Ajouter une prestation** ; tableau prestations avec **CRA dépliables** (chevron si ≥1 CRA dans la plage, sinon spacer ; sous-lignes période / tâches / jours / TTC) — colonnes : **Prestation**, **Statut** (badge), intervenant, équipe, **date de début**, **jours envisagés**, Nb CRA, TTC CRA, action **Modifier**. Si une borne période est active : seules les prestations avec ≥1 CRA dans la plage apparaissent. Composant partagé avec la fiche produit (`MissionEquipePrestationsPanel`). |
| **Note studio** | `Suivi_resp_studio` — lecture Markdown léger (`MissionProse`) ; **édition sur place** (bouton Ajouter / Modifier → textarea + aide Markdown → valider / annuler) via `updateMissionRecord` ; pas de WYSIWYG |

Les CRA sont consultés via les lignes dépliables de l’onglet Équipe (plus d’onglet Réalisations dédié).
