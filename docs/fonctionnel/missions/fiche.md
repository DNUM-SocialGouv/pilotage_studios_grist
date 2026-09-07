# Fiche mission — `/missions/:id`

[← Missions](README.md) › **Fiche**

## Objet

Détail d’une mission master : en-tête sobre, onglets lecture.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions/:id` |
| Page | `src/pages/MissionsDetailView.tsx` |
| Retour | Lien vers `/missions` |

## États

Même gate que la liste (`MissionsLayout`). Mission introuvable : alerte warning + retour liste.

## En-tête

Badge statut (texte), H1 (`Nom_de_la_mission`), ligne : produit, équipe, département, responsable, intervenant(s), TTC CRA, dernière mise à jour si renseignée.

Pas de boutons Modifier / CR / estimation.

## Onglets

| Onglet | Contenu |
|--------|---------|
| **Contexte** | Champs narratifs (demande, enjeux, historique, utilisateurs / périmètre, liens FIGMA/Notion) en texte préformaté |
| **Équipe / prestations** | Totaux CRA + camembert TTC par équipe + tableau des enfants (libellé, intervenant, équipe, type, nb CRA, TTC, statut) |
| **Réalisations (CRA)** | Lignes `Realise` du master, pagination 10 ; lien `/bdc/:id` si `BDC_cible` / `Bdc_Chorus2` |
| **Note studio** | `Suivi_resp_studio` (lecture) |
| **Pièces jointes** | Téléchargement `Docs` (`GristAttachmentDownloadLink`) — pas d’ajout / suppression |
