# Fiche mission — `/missions/:id`

[← Missions](README.md) › **Fiche**

## Objet

Détail lecture d’une mission master : en-tête P2 (bandeau), onglets — aligné UI sur l’app sœur ([PR #222](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/222), [PR #224](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/224)), **sans** actions d’écriture / IA.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions/:id` |
| Onglet | Query `?onglet=contexte` \| `equipe` \| `realisations` \| `notes` (alias : `note-studio`, `pieces-jointes`, `tab`) |
| Page | `src/pages/MissionsDetailView.tsx` |
| Retour | Lien vers `/missions` |

## États

Même gate que la liste (`MissionsLayout`). Mission introuvable : alerte warning + retour liste.

## En-tête (P2)

| Élément | Contenu |
|---------|---------|
| Ligne titre | Badge statut + **H1** (`Nom_de_la_mission`) |
| Bandeau méta | 2–3 colonnes bordées : **Produit** (texte) · **Département** (`departement_sdpc` du produit SDPC lié) · **Dernière mise à jour** (masquée si vide). Pas d’intervenants ni de TTC CRA dans l’en-tête |

Pas de boutons Modifier / CR / estimation.

## Onglets

| Onglet | Contenu |
|--------|---------|
| **Contexte** | Champs narratifs (demande, enjeux, historique, utilisateurs / périmètre, liens FIGMA/Notion) en texte préformaté |
| **Équipe & prestations** | Synthèse `TTC CRA mission · Jours` ; filtre équipe + camembert % TTC (tranche **Hors prestation** si CRA sans enfant) ; tableau prestations avec **CRA dépliables** (chevron si ≥1 CRA, sinon spacer ; sous-lignes période / tâches / jours / TTC) — colonnes : prestation, intervenant, équipe, type, **jours envisagés**, Nb CRA, TTC, statut |
| **Réalisations** | Lignes `Realise` du master, pagination 10 ; lien `/bdc/:id` si `BDC_cible` / `Bdc_Chorus2` |
| **Note & pièces jointes** | `Suivi_resp_studio` (lecture) + téléchargement `Docs` (`GristAttachmentDownloadLink`) — pas d’ajout / suppression |
