/**
 * Helpers formulaire « Déclarer mon CRA » — filtre prestations + upsert Realise.
 */

import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import {
  buildEquipePrestationRows,
  filterEquipePrestationRows,
  groupEquipePrestationRowsByMission,
  type EquipePrestationMissionGroup,
  type EquipePrestationRow,
} from "./equipeMemberPrestations.ts";
import {
  extractGristReferenceId,
  extractSuiviBdcRowRef,
} from "./gristReferences.ts";
import {
  formatGristPeriodeMonthKeyLabel,
  gristPeriodeFilterKey,
  gristPeriodeMonthKeyToTimestamp,
} from "./gristPeriode.ts";

export type CraDeclarerDraft = {
  enfantId: number;
  nbJours: string;
  taches: string;
  /** Id Realise existant pour (moi, prestation, mois), si déjà saisi. */
  existingRealiseId: number | null;
};

export type CraDeclarerSaveRow = {
  enfantId: number;
  missionId: number;
  nbJours: number;
  taches: string;
  existingRealiseId: number | null;
};

/** Prestations en cours du freelance, groupées par mission. */
export function craDeclarerPrestationGroups(
  memberId: number,
  enfants: MissionEnfant[],
  missions: Mission[],
): EquipePrestationMissionGroup[] {
  const rows = filterEquipePrestationRows(
    buildEquipePrestationRows(memberId, enfants, missions),
    "en-cours",
  );
  return groupEquipePrestationRowsByMission(rows);
}

/** Lignes plates des prestations en cours (ordre des groupes). */
export function craDeclarerPrestationRowsFlat(
  groups: EquipePrestationMissionGroup[],
): EquipePrestationRow[] {
  return groups.flatMap((g) => g.prestations);
}

/**
 * Id Realise pour (intervenant, prestation, mois YYYY-MM), ou null.
 * En cas de doublons, garde l’id le plus récent (id max).
 */
export function findExistingRealiseId(
  suivi: SuiviMensuel[],
  intervenantId: number,
  enfantId: number,
  monthKey: string,
): number | null {
  const key = monthKey.trim();
  if (!key || intervenantId <= 0 || enfantId <= 0) {
    return null;
  }
  let best: number | null = null;
  for (const s of suivi) {
    const iv = extractGristReferenceId(s.Intervenants);
    if (iv !== intervenantId) {
      continue;
    }
    const enf = extractGristReferenceId(s.Mission_enfant);
    if (enf !== enfantId) {
      continue;
    }
    if (gristPeriodeFilterKey(s.Periode, s) !== key) {
      continue;
    }
    if (best == null || s.id > best) {
      best = s.id;
    }
  }
  return best;
}

export function initCraDeclarerDrafts(
  rows: EquipePrestationRow[],
  suivi: SuiviMensuel[],
  intervenantId: number,
  monthKey: string,
): CraDeclarerDraft[] {
  return rows.map((row) => {
    const existingId = findExistingRealiseId(
      suivi,
      intervenantId,
      row.enfantId,
      monthKey,
    );
    const existing =
      existingId != null ? suivi.find((s) => s.id === existingId) : undefined;
    return {
      enfantId: row.enfantId,
      nbJours:
        existing?.Nb_jours != null && Number.isFinite(existing.Nb_jours)
          ? String(existing.Nb_jours)
          : "",
      taches: existing?.Taches_realisees?.trim() ?? "",
      existingRealiseId: existingId,
    };
  });
}

/** Parse un champ jours : nombre ≥ 0, demi-journées OK ; vide = null (ligne ignorée). */
export function parseCraDeclarerJours(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) {
    return null;
  }
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Nombre de jours invalide.");
  }
  return n;
}

/** Total HT indicatif du carnet : jours saisis × TJM (si TJM lisible). */
export function craDeclarerTotalHt(
  joursSaisis: number,
  tjm: number | undefined,
): number | undefined {
  if (
    typeof tjm !== "number" ||
    !Number.isFinite(tjm) ||
    !Number.isFinite(joursSaisis)
  ) {
    return undefined;
  }
  return joursSaisis * tjm;
}

/**
 * Prépare les lignes à enregistrer.
 * Une ligne avec jours vide et description vide est ignorée (pas d’écriture).
 * Jours = 0 explicite avec description est accepté (mise à jour volontaire).
 * Jours vide + description (ou ligne existante) → erreur (évite d’écraser à 0).
 */
export function buildCraDeclarerSaveRows(
  drafts: CraDeclarerDraft[],
  rowsByEnfantId: Map<number, EquipePrestationRow>,
): CraDeclarerSaveRow[] {
  const out: CraDeclarerSaveRow[] = [];
  for (const d of drafts) {
    const meta = rowsByEnfantId.get(d.enfantId);
    if (!meta) {
      continue;
    }
    const joursRaw = d.nbJours.trim();
    const taches = d.taches.trim();
    if (!joursRaw && !taches && d.existingRealiseId == null) {
      continue;
    }
    if (!joursRaw) {
      throw new Error(
        `Indiquez le nombre de jours pour « ${meta.prestationLibelle} » (ou laissez la saisie précédente).`,
      );
    }
    const nbJours = parseCraDeclarerJours(joursRaw);
    if (nbJours == null) {
      continue;
    }
    out.push({
      enfantId: d.enfantId,
      missionId: meta.missionId,
      nbJours,
      taches,
      existingRealiseId: d.existingRealiseId,
    });
  }
  return out;
}

/** Clés mois pour le select : mois courant ± 6 mois (UTC calendaire local). */
export function craDeclarerMonthOptions(
  now: Date = new Date(),
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based local
  for (let offset = -6; offset <= 1; offset++) {
    const d = new Date(y, m + offset, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: formatGristPeriodeMonthKeyLabel(value) });
  }
  return options.reverse();
}

export function craDeclarerDefaultMonthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function periodeTimestampForMonthKey(monthKey: string): number {
  const ts = gristPeriodeMonthKeyToTimestamp(monthKey);
  if (ts == null) {
    throw new Error("Mois de déclaration invalide.");
  }
  return ts;
}

/**
 * Champs Realise pour create / update (sans Calcul_TTC, BDC, ni Equipe).
 * `Equipe` et `Mission` sont des formules Grist — ne pas les écrire.
 * Le rattachement prestation s’écrit dans `Prestation` (ref → `Prestations`).
 * L’ancienne paire `Mission_enfant` + `Missions` n’existe plus dans le document.
 */
export function buildRealiseDeclarerFields(input: {
  intervenantId: number;
  enfantId: number;
  nbJours: number;
  taches: string;
  periodeTs: number;
  /** @deprecated Ignoré — colonne formule côté Grist. */
  equipeLabel?: string;
}): Record<string, unknown> {
  return {
    Intervenants: input.intervenantId,
    Prestation: input.enfantId,
    Nb_jours: input.nbJours,
    Taches_realisees: input.taches,
    Periode: input.periodeTs,
  };
}

/** Libellés BDC déjà chargés (boot PA) pour l’affichage lecture seule du carnet. */
export type CraCarnetBdcLabelMaps = {
  bdcById: Map<number, string>;
  bdcChorusById: Map<number, string>;
};

/**
 * Libellé BDC sous une prestation déjà saisie ce mois (lecture seule).
 * « Sans BDC » si la ligne Realise n’a pas de rattachement.
 * Sinon : nom du BDC, éventuellement suivi du n° Chorus (`Nom · Chorus`).
 */
export function formatCraCarnetBdcLabel(
  s: SuiviMensuel,
  maps: CraCarnetBdcLabelMaps,
): string {
  const bid = extractSuiviBdcRowRef(s as unknown as Record<string, unknown>);
  if (bid === undefined) {
    return "Sans BDC";
  }
  const nom =
    maps.bdcById.get(bid)?.trim() ||
    s.Nom_BdC?.trim() ||
    `BDC #${bid}`;
  const chorus = maps.bdcChorusById.get(bid)?.trim();
  if (chorus) {
    return `${nom} · ${chorus}`;
  }
  return nom;
}
