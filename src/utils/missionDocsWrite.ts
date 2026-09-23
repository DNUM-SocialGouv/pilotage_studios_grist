/**
 * Upload / rattachement de pièces jointes mission (`Missions.Docs`).
 * Upload via `getAccessToken({ readOnly: false })` + REST multipart ;
 * rattachement cellule via `updateMissionRecord` (plugin API).
 *
 * Avant chaque update de cellule : relecture de `Docs` pour limiter les courses
 * (dernier geste gagne encore, mais on ne part plus d’un props stale).
 */

import { recordsFromFetchTable, toMission } from "../gristMap.ts";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist.ts";
import {
  buildGristAttachmentsList,
  extractGristAttachmentIds,
  mergeAttachmentIds,
  parseUploadedAttachmentIds,
  validateMissionDocFile,
} from "./gristAttachments.ts";
import { getGristAccessToken, gristAuthedUrl } from "./gristAccessToken.ts";
import { updateMissionRecord } from "./missionGristWrite.ts";

/** Relit `Docs` depuis Grist (évite un props React périmé). */
export async function fetchMissionDocs(missionId: number): Promise<unknown> {
  if (!Number.isFinite(missionId) || missionId <= 0) {
    throw new Error("Identifiant mission invalide.");
  }
  const raw = await fetchAllowlistedTable("Missions");
  const mission = recordsFromFetchTable(raw)
    .map(toMission)
    .find((m) => m.id === missionId);
  if (!mission) {
    throw new Error(`Mission #${missionId} introuvable pour mise à jour des pièces jointes.`);
  }
  return mission.Docs;
}

/** POST multipart `/attachments` — retourne les ids créés. */
export async function uploadGristAttachments(files: readonly File[]): Promise<number[]> {
  if (files.length === 0) {
    return [];
  }
  const access = await getGristAccessToken(false);
  const form = new FormData();
  for (const file of files) {
    form.append("upload", file, file.name);
  }
  const response = await fetch(gristAuthedUrl(access.baseUrl, "/attachments", access.token), {
    method: "POST",
    body: form,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) {
    throw new Error(`Upload impossible (${response.status}).`);
  }
  const payload: unknown = await response.json();
  const ids = parseUploadedAttachmentIds(payload);
  if (ids.length === 0) {
    throw new Error("Upload : réponse Grist sans identifiant de pièce jointe.");
  }
  return ids;
}

/** Remplace la liste `Docs` d’une mission. */
export async function setMissionDocs(
  missionId: number,
  attachmentIds: readonly number[],
): Promise<void> {
  await updateMissionRecord(missionId, {
    Docs: buildGristAttachmentsList(attachmentIds),
  });
}

function attachFailedMessage(uploadedIds: readonly number[]): string {
  const ids = uploadedIds.join(", ");
  return (
    `Le fichier a été déposé dans Grist (id ${ids}) mais n’a pas pu être rattaché à la mission. ` +
    `Réessayez « Ajouter un document », ou rattachez-le depuis Grist.`
  );
}

/** Ajoute un fichier aux Docs existants (validation type/taille + relecture fraîche). */
export async function addMissionDoc(missionId: number, file: File): Promise<void> {
  const validationError = validateMissionDocFile(file);
  if (validationError) {
    throw new Error(validationError);
  }
  const uploaded = await uploadGristAttachments([file]);
  try {
    const freshDocs = await fetchMissionDocs(missionId);
    const next = mergeAttachmentIds(extractGristAttachmentIds(freshDocs), uploaded);
    await setMissionDocs(missionId, next);
  } catch (err) {
    const message = attachFailedMessage(uploaded);
    throw err instanceof Error ? new Error(message, { cause: err }) : new Error(message);
  }
}

/** Retire un id de la cellule Docs (relecture fraîche ; ne purge pas le fichier du document). */
export async function removeMissionDoc(missionId: number, attachmentId: number): Promise<void> {
  const freshDocs = await fetchMissionDocs(missionId);
  const next = extractGristAttachmentIds(freshDocs).filter((id) => id !== attachmentId);
  await setMissionDocs(missionId, next);
}
