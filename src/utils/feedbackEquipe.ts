/**
 * Options auteur pour le widget feedback — table Grist `Equipe`.
 */

import type { GristFetchTableResult } from "../gristTypes.ts";
import { asGristChoice } from "./gristReferences.ts";

export type FeedbackAuteurOption = {
  /** Id ligne Equipe (string pour le select). */
  value: string;
  label: string;
  name: string;
  email: string;
};

function asText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  const choice = asGristChoice(value);
  return choice?.trim() ?? "";
}

/** Construit les options triées (Prenom_Nom) depuis un `fetchTable('Equipe')`. */
export function feedbackAuteurOptionsFromEquipeTable(
  table: GristFetchTableResult,
): FeedbackAuteurOption[] {
  const ids = table.id;
  if (!Array.isArray(ids)) {
    return [];
  }
  const noms = Array.isArray(table.Prenom_Nom) ? table.Prenom_Nom : [];
  const emails = Array.isArray(table.E_mail) ? table.E_mail : [];

  const options: FeedbackAuteurOption[] = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (typeof id !== "number" || !Number.isFinite(id)) {
      continue;
    }
    const name = asText(noms[i]);
    if (!name) {
      continue;
    }
    const email = asText(emails[i]);
    options.push({
      value: String(id),
      name,
      email,
      label: email ? `${name} (${email})` : name,
    });
  }

  options.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return options;
}
