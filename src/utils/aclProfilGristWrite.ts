/**
 * Crée la fiche `Acl_profil` de l’utilisateur courant si absente (ACL : CR soi).
 */

import {
  ACL_PROFIL_TABLE_ID,
  assertWritableTableId,
} from "../security/writeTableAllowlist.ts";
import { resolveGristUserEmail } from "./gristUserEmail.ts";

function getWritableTable(tableId: string) {
  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }
  return grist.getTable(tableId);
}

/**
 * Insert une ligne `E_mail` = compte connecté.
 * `Role` / `Page_*` restent des formules Grist.
 */
export async function createOwnAclProfilRecord(): Promise<void> {
  assertWritableTableId(ACL_PROFIL_TABLE_ID);
  const email = await resolveGristUserEmail();
  await getWritableTable(ACL_PROFIL_TABLE_ID).create({
    fields: { E_mail: email },
  });
}
