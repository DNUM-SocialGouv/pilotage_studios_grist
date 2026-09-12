/**
 * Création d’une ligne `Retours` via plugin API (`getTable().create`).
 * Garde runtime : seule la table allowlistée écriture.
 */

import {
  RETOURS_TABLE_ID,
  assertWritableTableId,
} from "../security/writeTableAllowlist.ts";
import { isUsableDisplayName } from "./gristUserProfile.ts";

export type FeedbackType = "Anomalie" | "Suggestion" | "Question";

export type CreateRetoursInput = {
  userName: string;
  userEmail: string;
  type: FeedbackType;
  page: string;
  message: string;
  niveau: string;
  joinContext: boolean;
  /** URL widget / contexte technique (si joinContext). */
  href?: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  now?: Date;
};

export type RetoursFields = {
  Date: string;
  Auteur?: string;
  Email?: string;
  Type: FeedbackType;
  Page: string;
  Message: string;
  Niveau_gene: string;
  Contexte_technique: string;
  Statut: "Nouveau";
};

/** Construit le payload champs (pur — testable hors Grist). */
export function buildRetoursFields(input: CreateRetoursInput): RetoursFields {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Message obligatoire");
  }

  const href = input.href ?? "";
  const userAgent = input.userAgent ?? "";
  const w = input.screenWidth ?? 0;
  const h = input.screenHeight ?? 0;
  const contexte = input.joinContext
    ? `${href} · ${userAgent} · ${w}x${h}`
    : "";

  const fields: RetoursFields = {
    Date: (input.now ?? new Date()).toISOString(),
    Type: input.type,
    Page: input.page,
    Message: message,
    Niveau_gene: input.type === "Anomalie" ? input.niveau : "",
    Contexte_technique: contexte,
    Statut: "Nouveau",
  };

  // Si le nom est inutilisable (Anonymous…), on omet Auteur/Email pour laisser
  // les trigger formulas Grist (`user.Name` / `user.Email`) les remplir.
  if (isUsableDisplayName(input.userName)) {
    fields.Auteur = input.userName;
    fields.Email = input.userEmail;
  }

  return fields;
}

/**
 * Écrit une ligne dans `Retours`. Refuse toute autre table.
 * @returns id de la ligne créée
 */
export async function createRetoursRecord(input: CreateRetoursInput): Promise<number> {
  assertWritableTableId(RETOURS_TABLE_ID);

  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }

  const fields = buildRetoursFields(input);
  const result = await grist.getTable(RETOURS_TABLE_ID).create({ fields });
  const first = Array.isArray(result) ? result[0] : result;
  const id = first && typeof first === "object" && "id" in first ? Number(first.id) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Création Retours : réponse sans id valide.");
  }
  return id;
}
