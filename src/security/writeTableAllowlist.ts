/**
 * Allowlist des tableIds autorisés pour une écriture widget (`getTable().create|update`).
 * Ne jamais accepter un id libre depuis l’UI — passer uniquement par les gardes dédiées.
 *
 * - `Kanban` : create (feedback) + update colonne / corps Resume+Message (Admin).
 * - `Kanban_commentaires` : create only (conversation tickets).
 * - `Missions` : create + update (drawer mission master — pas de delete).
 * - `Missions_enfants` : create + update (drawer prestation — pas de delete).
 * - `Realise` : create + update (déclaration CRA freelance + revue équipe manager — pas de delete).
 * - `Droits_pages` : update only (page Admin droits des écrans — pas de create/delete).
 * - `Acl_profil` : create only (fiche session auto si absente — pas d’update/delete).
 * - `Equipe` : create + update (drawer Admin nouvelle / modifier personne — pas de delete).
 * - `Weekly_phase` : create + update (phase kanban Weekly — pas de delete).
 * - `Weekly_agenda` : create + update (sujets à aborder — pas de delete).
 */

export const KANBAN_TABLE_ID = "Kanban";
export const KANBAN_COMMENTAIRES_TABLE_ID = "Kanban_commentaires";
export const MISSIONS_TABLE_ID = "Missions";
export const MISSIONS_ENFANTS_TABLE_ID = "Missions_enfants";
export const REALISE_TABLE_ID = "Realise";
export const DROITS_PAGES_TABLE_ID = "Droits_pages";
export const ACL_PROFIL_TABLE_ID = "Acl_profil";
export const EQUIPE_TABLE_ID = "Equipe";
export const WEEKLY_PHASE_TABLE_ID = "Weekly_phase";
export const WEEKLY_AGENDA_TABLE_ID = "Weekly_agenda";
/** Allowlist e-mails coachs Weekly — lecture seule widget (pas d’écriture). */
export const WEEKLY_COACHS_TABLE_ID = "Weekly_coachs";

export const WRITE_TABLE_ALLOWLIST = [
  KANBAN_TABLE_ID,
  KANBAN_COMMENTAIRES_TABLE_ID,
  MISSIONS_TABLE_ID,
  MISSIONS_ENFANTS_TABLE_ID,
  REALISE_TABLE_ID,
  ACL_PROFIL_TABLE_ID,
  EQUIPE_TABLE_ID,
  WEEKLY_PHASE_TABLE_ID,
  WEEKLY_AGENDA_TABLE_ID,
] as const;

export type WritableTableId = (typeof WRITE_TABLE_ALLOWLIST)[number];

/** Tables autorisées pour `getTable().update` (sous-ensemble). */
export const WRITE_TABLE_UPDATE_ALLOWLIST = [
  KANBAN_TABLE_ID,
  MISSIONS_TABLE_ID,
  MISSIONS_ENFANTS_TABLE_ID,
  REALISE_TABLE_ID,
  DROITS_PAGES_TABLE_ID,
  EQUIPE_TABLE_ID,
  WEEKLY_PHASE_TABLE_ID,
  WEEKLY_AGENDA_TABLE_ID,
] as const;

export type WritableUpdateTableId = (typeof WRITE_TABLE_UPDATE_ALLOWLIST)[number];

export function isWritableTableId(tableId: string): tableId is WritableTableId {
  return (WRITE_TABLE_ALLOWLIST as readonly string[]).includes(tableId);
}

export function isWritableUpdateTableId(tableId: string): tableId is WritableUpdateTableId {
  return (WRITE_TABLE_UPDATE_ALLOWLIST as readonly string[]).includes(tableId);
}

export function assertWritableTableId(tableId: string): asserts tableId is WritableTableId {
  if (!isWritableTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour écriture widget : ${tableId}`);
  }
}

export function assertWritableUpdateTableId(
  tableId: string,
): asserts tableId is WritableUpdateTableId {
  if (!isWritableUpdateTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour mise à jour widget : ${tableId}`);
  }
}
