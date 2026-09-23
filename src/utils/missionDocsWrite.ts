/**
 * Upload / rattachement de pièces jointes mission (`Missions.Docs`).
 * Upload via `getAccessToken({ readOnly: false })` + REST multipart ;
 * rattachement cellule via `updateMissionRecord` (plugin API).
 */

import {
  buildGristAttachmentsList,
  extractGristAttachmentIds,
  validateMissionDocFile,
} from "./gristAttachments.ts";
import { getGristAccessToken, gristAuthedUrl } from "./gristAccessToken.ts";
import { updateMissionRecord } from "./missionGristWrite.ts";

function parseUploadedAttachmentIds(payload: unknown): number[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const ids: number[] = [];
  for (const item of payload) {
    if (typeof item === "number" && Number.isFinite(item) && item > 0) {
      ids.push(Math.trunc(item));
      continue;
    }
    if (typeof item === "string") {
      const n = Number.parseInt(item, 10);
      if (Number.isFinite(n) && n > 0) {
        ids.push(n);
      }
    }
  }
  return ids;
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

/** Ajoute un fichier aux Docs existants (validation type/taille). */
export async function addMissionDoc(missionId: number, currentDocs: unknown, file: File): Promise<void> {
  const validationError = validateMissionDocFile(file);
  if (validationError) {
    throw new Error(validationError);
  }
  const uploaded = await uploadGristAttachments([file]);
  const next = [...extractGristAttachmentIds(currentDocs), ...uploaded];
  await setMissionDocs(missionId, next);
}

/** Retire un id de la cellule Docs (ne purge pas le fichier du document). */
export async function removeMissionDoc(
  missionId: number,
  currentDocs: unknown,
  attachmentId: number,
): Promise<void> {
  const next = extractGristAttachmentIds(currentDocs).filter((id) => id !== attachmentId);
  await setMissionDocs(missionId, next);
}
