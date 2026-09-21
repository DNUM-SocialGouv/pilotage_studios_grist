/**
 * Helpers « Revue CRA équipe » — filtre département + drafts update Realise.
 */

import type { EquipeMember, SuiviMensuel } from "../types.ts";
import { extractGristReferenceId, extractSuiviBdcRowRef } from "./gristReferences.ts";
import { gristPeriodeFilterKey } from "./gristPeriode.ts";
import { parseCraDeclarerJours } from "./craDeclarer.ts";

export type CraRevueEquipeDraft = {
  realiseId: number;
  nbJours: string;
  taches: string;
  /** Id BDC choisi ; "" = non rattaché. */
  bdcId: string;
};

export type CraRevueEquipeSaveRow = {
  realiseId: number;
  nbJours: number;
  taches: string;
  /** null = effacer le rattachement BDC_cible. */
  bdcId: number | null;
};

/** Normalise un libellé département pour comparaison. */
export function normalizeEquipeLabel(label: string | null | undefined): string {
  return (label ?? "").trim();
}

/**
 * Membres du même département que le manager (hors soi).
 * Département vide → liste vide (pas de périmètre).
 */
export function filterEquipeMembersByDepartement(
  members: EquipeMember[],
  managerDepartement: string,
  managerId: number,
): EquipeMember[] {
  const dept = normalizeEquipeLabel(managerDepartement);
  if (!dept) {
    return [];
  }
  return members
    .filter((m) => {
      if (m.id === managerId) {
        return false;
      }
      return normalizeEquipeLabel(m.Equipe) === dept;
    })
    .slice()
    .sort((a, b) =>
      (a.Prenom_Nom ?? "").localeCompare(b.Prenom_Nom ?? "", "fr", {
        sensitivity: "base",
      }),
    );
}

/** Lignes Realise d’un intervenant pour un mois YYYY-MM. */
export function filterSuiviForIntervenantMonth(
  suivi: SuiviMensuel[],
  intervenantId: number,
  monthKey: string,
): SuiviMensuel[] {
  const key = monthKey.trim();
  if (!key || intervenantId <= 0) {
    return [];
  }
  return suivi
    .filter((s) => {
      const iv = extractGristReferenceId(s.Intervenants);
      if (iv !== intervenantId) {
        return false;
      }
      return gristPeriodeFilterKey(s.Periode, s) === key;
    })
    .slice()
    .sort((a, b) => b.id - a.id);
}

/** True si la ligne n’a ni BDC_cible ni Bdc_Chorus2. */
export function suiviSansBdc(s: SuiviMensuel): boolean {
  return extractSuiviBdcRowRef(s as unknown as Record<string, unknown>) === undefined;
}

export function initCraRevueEquipeDrafts(rows: SuiviMensuel[]): CraRevueEquipeDraft[] {
  return rows.map((s) => {
    const bdc = extractSuiviBdcRowRef(s as unknown as Record<string, unknown>);
    return {
      realiseId: s.id,
      nbJours:
        s.Nb_jours != null && Number.isFinite(s.Nb_jours) ? String(s.Nb_jours) : "",
      taches: s.Taches_realisees?.trim() ?? "",
      bdcId: bdc != null ? String(bdc) : "",
    };
  });
}

/**
 * KPI équipe pour un mois : freelances avec au moins une ligne, jours, sans BDC, HT indicatif
 * (somme jours × TJM par personne quand TJM lisible).
 */
export function craRevueEquipeTeamKpis(
  members: EquipeMember[],
  suivi: SuiviMensuel[],
  monthKey: string,
): {
  freelanceCount: number;
  joursTotal: number;
  sansBdcCount: number;
  totalHt: number | undefined;
} {
  const key = monthKey.trim();
  let freelanceCount = 0;
  let joursTotal = 0;
  let sansBdcCount = 0;
  let totalHt = 0;
  let anyHt = false;

  for (const m of members) {
    const rows = filterSuiviForIntervenantMonth(suivi, m.id, key);
    if (rows.length === 0) {
      continue;
    }
    freelanceCount += 1;
    let joursPerso = 0;
    for (const s of rows) {
      const j =
        typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours) ? s.Nb_jours : 0;
      joursPerso += j;
      joursTotal += j;
      if (suiviSansBdc(s)) {
        sansBdcCount += 1;
      }
    }
    if (typeof m.TJM === "number" && Number.isFinite(m.TJM)) {
      totalHt += joursPerso * m.TJM;
      anyHt = true;
    }
  }

  return {
    freelanceCount,
    joursTotal,
    sansBdcCount,
    totalHt: anyHt ? totalHt : undefined,
  };
}

/** Prépare les updates ; ignore les brouillons inchangés vs lignes sources. */
export function buildCraRevueEquipeSaveRows(
  drafts: CraRevueEquipeDraft[],
  sourceById: Map<number, SuiviMensuel>,
): CraRevueEquipeSaveRow[] {
  const out: CraRevueEquipeSaveRow[] = [];
  for (const d of drafts) {
    const source = sourceById.get(d.realiseId);
    if (!source) {
      continue;
    }
    const joursRaw = d.nbJours.trim();
    if (!joursRaw) {
      throw new Error(`Indiquez le nombre de jours pour la ligne CRA #${d.realiseId}.`);
    }
    const nbJours = parseCraDeclarerJours(joursRaw);
    if (nbJours == null) {
      throw new Error(`Indiquez le nombre de jours pour la ligne CRA #${d.realiseId}.`);
    }
    const taches = d.taches.trim();
    const bdcRaw = d.bdcId.trim();
    const bdcId = bdcRaw ? Number.parseInt(bdcRaw, 10) : null;
    if (bdcRaw && (!Number.isFinite(bdcId) || (bdcId as number) <= 0)) {
      throw new Error("Bon de commande invalide.");
    }

    const prevBdc = extractSuiviBdcRowRef(source as unknown as Record<string, unknown>);
    const prevJours =
      typeof source.Nb_jours === "number" && Number.isFinite(source.Nb_jours)
        ? source.Nb_jours
        : null;
    const prevTaches = source.Taches_realisees?.trim() ?? "";

    const joursChanged = prevJours !== nbJours;
    const tachesChanged = prevTaches !== taches;
    const bdcChanged = (prevBdc ?? null) !== bdcId;
    if (!joursChanged && !tachesChanged && !bdcChanged) {
      continue;
    }

    out.push({
      realiseId: d.realiseId,
      nbJours,
      taches,
      bdcId,
    });
  }
  return out;
}

/** Champs update Realise (jours, description, BDC_cible). */
export function buildRealiseRevueEquipeFields(input: {
  nbJours: number;
  taches: string;
  bdcId: number | null;
}): Record<string, unknown> {
  return {
    Nb_jours: input.nbJours,
    Taches_realisees: input.taches,
    // Ref Grist : 0 = non rattaché.
    BDC_cible: input.bdcId ?? 0,
  };
}
