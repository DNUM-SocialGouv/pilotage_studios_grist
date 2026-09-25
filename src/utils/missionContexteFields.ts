import type { Mission } from "../types.ts";

/** Clés Grist des champs narratifs de l’onglet Contexte (hors liens / PJ / note). */
export const MISSION_CONTEXTE_KEYS = [
  "Demande",
  "Enjeux",
  "Historique",
  "Cible_profils_utilisateurs",
  "Pb_utilisateurs_identifies",
  "Fonctionnalites_produit",
  "Volumes_d_usages_utilisateurs_utilisations_",
] as const;

export type MissionContexteKey = (typeof MISSION_CONTEXTE_KEYS)[number];

export type MissionContexteDraft = Record<MissionContexteKey, string>;

export const MISSION_CONTEXTE_FIELD_LABELS: Record<MissionContexteKey, string> = {
  Demande: "Demande",
  Enjeux: "Enjeux",
  Historique: "Historique",
  Cible_profils_utilisateurs: "Cible profils utilisateurs",
  Pb_utilisateurs_identifies: "Problèmes utilisateurs identifiés",
  Fonctionnalites_produit: "Fonctionnalités produit",
  Volumes_d_usages_utilisateurs_utilisations_: "Volumes d’usages / utilisations",
};

export const MISSION_CONTEXTE_SECTIONS: {
  title: string;
  keys: MissionContexteKey[];
}[] = [
  { title: "Contexte et demande", keys: ["Demande", "Enjeux", "Historique"] },
  {
    title: "Utilisateurs et périmètre produit",
    keys: [
      "Cible_profils_utilisateurs",
      "Pb_utilisateurs_identifies",
      "Fonctionnalites_produit",
      "Volumes_d_usages_utilisateurs_utilisations_",
    ],
  },
];

function asDraftText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function emptyMissionContexteDraft(): MissionContexteDraft {
  return {
    Demande: "",
    Enjeux: "",
    Historique: "",
    Cible_profils_utilisateurs: "",
    Pb_utilisateurs_identifies: "",
    Fonctionnalites_produit: "",
    Volumes_d_usages_utilisateurs_utilisations_: "",
  };
}

export function missionToContexteDraft(mission: Mission): MissionContexteDraft {
  const out = emptyMissionContexteDraft();
  for (const key of MISSION_CONTEXTE_KEYS) {
    out[key] = asDraftText(mission[key]);
  }
  return out;
}

export function isContexteTextFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasAnyContexteNarrative(mission: Mission): boolean {
  return MISSION_CONTEXTE_KEYS.some((key) => isContexteTextFilled(mission[key]));
}

/**
 * Diff brouillon ↔ valeurs initiales.
 * Chaîne vide autorisée (vider un champ) ; seuls les champs modifiés sont renvoyés.
 */
export function buildContextePatch(
  draft: MissionContexteDraft,
  initial: MissionContexteDraft,
): Partial<Pick<Mission, MissionContexteKey>> {
  const out: Partial<Pick<Mission, MissionContexteKey>> = {};
  for (const key of MISSION_CONTEXTE_KEYS) {
    if (draft[key] !== initial[key]) {
      out[key] = draft[key];
    }
  }
  return out;
}
