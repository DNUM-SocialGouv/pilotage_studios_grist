# Fiche mission — `/missions/:id`

[← Missions](README.md) › **Fiche**

## Objet

Détail d’une mission master : en-tête P2 (bandeau), onglets — aligné UI sur l’app sœur ([PR #222](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/222), [PR #224](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/224), [PR #225](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/225), drawer [#227](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/227)). Édition master via drawer ; CRUD prestations via drawer dédié ; **Note studio** éditable sur place (textarea Markdown) ; **Docs** gérés dans la colonne Contexte (télécharger / ajouter / détacher) ; pas d’IA ni d’édition inline des champs narratifs Contexte.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions/:id` |
| Onglet | Query `?onglet=contexte` \| `equipe` \| `notes` (alias : `note-studio`, `tab`). Alias legacy `realisations` → **Équipe & prestations** ; alias `pieces-jointes` / `note-pieces-jointes` → **Contexte** |
| Page | `src/pages/MissionsDetailView.tsx` |
| Retour | Fil d’Ariane : Accueil › Missions › nom de la mission |

## États

Même gate que la liste (`MissionsLayout`). Mission introuvable : alerte warning + retour liste. Pendant un rechargement après création : « Chargement de la mission… » (évite un faux introuvable).

## En-tête (P2)

| Élément | Contenu |
|---------|---------|
| Ligne titre | Badge statut + **H1** (`Nom_de_la_mission`) + bouton **Modifier** (drawer edit) |
| Bandeau méta | 2–3 colonnes bordées : **Produit** (texte) · **Département** (`departement_sdpc` du produit SDPC lié) · **Dernière mise à jour** (masquée si vide). Pas d’intervenants ni de TTC CRA dans l’en-tête |

Pas de CR / estimation / IA.

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
| **Contexte** | Champs narratifs (demande, enjeux, historique, utilisateurs / périmètre, liens FIGMA/Notion) : titres `#`–`######`, paragraphes, listes `*` / `-`, gras `**…**`, liens Markdown `[libellé](https://…)` — colonne gauche ; **Pièces jointes** (`Docs`) en panneau latéral droit sticky (desktop) — usages app sœur : télécharger · **Supprimer** (détache l’id de la cellule) · **Ajouter un document** (upload REST jeton non-readonly + rattachement ; PDF/Office/MD/ODT/image, 20 Mo max) |
| **Équipe & prestations** | Filtres **équipe** + **période CRA** (Du mois / Au mois, bornes inclusives sur `Realise.Periode`) + **barre empilée** % TTC par équipe (montant affiché `… € TTC · … jours`, sans titre « TTC par équipe ») ; CTA **Ajouter une prestation** ; tableau prestations avec **CRA dépliables** (chevron si ≥1 CRA dans la plage, sinon spacer ; sous-lignes période / tâches / jours / TTC) — colonnes : **Prestation**, **Statut** (badge), intervenant, équipe, **date de début**, **jours envisagés**, Nb CRA, TTC CRA, action **Modifier**. Si une borne période est active : seules les prestations avec ≥1 CRA dans la plage apparaissent. Composant partagé avec la fiche produit (`MissionEquipePrestationsPanel`). |
| **Note studio** | `Suivi_resp_studio` — lecture Markdown léger (`MissionProse`) ; **édition sur place** (bouton Ajouter / Modifier → textarea + aide Markdown → valider / annuler) via `updateMissionRecord` ; pas de WYSIWYG |

Les CRA sont consultés via les lignes dépliables de l’onglet Équipe (plus d’onglet Réalisations dédié).
