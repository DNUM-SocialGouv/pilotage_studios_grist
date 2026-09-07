import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { missionEnfantLibelle } from "./missionEnfants.ts";
import { type CraTotaux, montantTtcLigneSuivi } from "./suiviMensuel.ts";

/** Bucket CRA sans `Mission_enfant` (legacy), éventuellement sous un master. */
export const SANS_PRESTATION_GROUP_KEY = "sans-prestation" as const;

/** Bucket CRA sans master résolvable. */
export const SANS_MISSION_GROUP_KEY = "sans-mission" as const;

export type SuiviMissionEnfantGroupKey =
  | number
  | typeof SANS_PRESTATION_GROUP_KEY
  | `legacy-${number}`;

export type SuiviMissionMasterGroupKey = number | typeof SANS_MISSION_GROUP_KEY;

export type GroupSuiviByMissionEnfantOptions = {
  masterById?: Map<number, Mission>;
  masterLibelleById?: Map<number, string>;
  intervenantLabelById?: Map<number, string>;
};

/** Branche niveau 2 : prestation (`Mission_enfant`) → CRA. */
export type SuiviEnfantBranch = {
  key: SuiviMissionEnfantGroupKey;
  enfant: MissionEnfant | null;
  libelle: string;
  rows: SuiviMensuel[];
  totaux: CraTotaux;
};

/** Branche niveau 1 : mission master → prestations. */
export type SuiviMasterGroup = {
  key: SuiviMissionMasterGroupKey;
  masterId?: number;
  libelle: string;
  enfants: SuiviEnfantBranch[];
  totaux: CraTotaux;
};

function emptyTotaux(): CraTotaux {
  return { jours: 0, ttc: 0, count: 0 };
}

function addRowToTotaux(totaux: CraTotaux, row: SuiviMensuel): CraTotaux {
  const j = typeof row.Nb_jours === "number" && Number.isFinite(row.Nb_jours) ? row.Nb_jours : 0;
  return {
    jours: totaux.jours + j,
    ttc: totaux.ttc + montantTtcLigneSuivi(row),
    count: totaux.count + 1,
  };
}

function mergeTotaux(a: CraTotaux, b: CraTotaux): CraTotaux {
  return {
    jours: a.jours + b.jours,
    ttc: a.ttc + b.ttc,
    count: a.count + b.count,
  };
}

function masterLibelleFor(
  masterId: number | undefined,
  opts: GroupSuiviByMissionEnfantOptions,
): string | undefined {
  if (masterId == null) {
    return undefined;
  }
  const fromMap = opts.masterLibelleById?.get(masterId)?.trim();
  if (fromMap) {
    return fromMap;
  }
  const mission = opts.masterById?.get(masterId);
  const nom = mission?.Nom_de_la_mission?.trim();
  return nom || undefined;
}

/**
 * Libellé prestation sans préfixe master.
 * Si `Libelle` commence par « Master — … », on garde uniquement le suffixe.
 */
export function enfantLibelleSansMaster(
  enfant: MissionEnfant,
  masterLibelle: string | undefined,
  intervenantLabel?: string,
): string {
  const raw = enfant.Libelle?.trim();
  if (raw && masterLibelle) {
    const separators = [" — ", " - ", " – "];
    for (const sep of separators) {
      const prefix = `${masterLibelle}${sep}`;
      if (raw.toLowerCase().startsWith(prefix.toLowerCase())) {
        const rest = raw.slice(prefix.length).trim();
        if (rest) {
          return rest;
        }
      }
    }
  }
  if (raw) {
    return raw;
  }
  return missionEnfantLibelle(enfant, intervenantLabel);
}

type EnfantAcc = {
  enfant: MissionEnfant | null;
  rows: SuiviMensuel[];
  totaux: CraTotaux;
  libelle: string;
  masterId?: number;
  masterLibelle?: string;
};

/**
 * Regroupe les CRA en hiérarchie Mission master → Mission enfant → CRA.
 * Legacy sans `Mission_enfant` : branche « Sans prestation » sous le master `Missions` si connu,
 * sinon bucket racine « Sans mission ».
 */
export function groupSuiviByMissionHierarchy(
  suivi: SuiviMensuel[],
  enfants: MissionEnfant[],
  opts: GroupSuiviByMissionEnfantOptions = {},
): SuiviMasterGroup[] {
  const enfantsById = new Map(enfants.map((e) => [e.id, e]));
  const byEnfant = new Map<SuiviMissionEnfantGroupKey, EnfantAcc>();

  const ensureEnfant = (
    key: SuiviMissionEnfantGroupKey,
    init: Omit<EnfantAcc, "rows" | "totaux"> & { row: SuiviMensuel },
  ): EnfantAcc => {
    const prev = byEnfant.get(key);
    if (prev) {
      prev.rows.push(init.row);
      prev.totaux = addRowToTotaux(prev.totaux, init.row);
      return prev;
    }
    const created: EnfantAcc = {
      enfant: init.enfant,
      libelle: init.libelle,
      masterId: init.masterId,
      masterLibelle: init.masterLibelle,
      rows: [init.row],
      totaux: addRowToTotaux(emptyTotaux(), init.row),
    };
    byEnfant.set(key, created);
    return created;
  };

  for (const row of suivi) {
    const enfantId = extractGristReferenceId(row.Mission_enfant);
    if (enfantId != null && enfantId !== 0) {
      const enfant = enfantsById.get(enfantId) ?? null;
      if (enfant) {
        const masterId = extractGristReferenceId(enfant.Mission) ?? undefined;
        const masterLibelle = masterLibelleFor(masterId, opts);
        const iid = extractGristReferenceId(enfant.Intervenant);
        const ivLabel = iid != null ? opts.intervenantLabelById?.get(iid) : undefined;
        ensureEnfant(enfantId, {
          enfant,
          libelle: enfantLibelleSansMaster(enfant, masterLibelle, ivLabel),
          masterId,
          masterLibelle,
          row,
        });
      } else {
        const legacyMaster = extractGristReferenceId(row.Missions) ?? undefined;
        ensureEnfant(enfantId, {
          enfant: null,
          libelle: `Prestation #${enfantId}`,
          masterId: legacyMaster,
          masterLibelle: masterLibelleFor(legacyMaster, opts),
          row,
        });
      }
      continue;
    }

    const legacyMaster = extractGristReferenceId(row.Missions) ?? undefined;
    if (legacyMaster != null && legacyMaster !== 0) {
      const key = `legacy-${legacyMaster}` as const;
      ensureEnfant(key, {
        enfant: null,
        libelle: "Sans prestation (legacy)",
        masterId: legacyMaster,
        masterLibelle: masterLibelleFor(legacyMaster, opts),
        row,
      });
    } else {
      ensureEnfant(SANS_PRESTATION_GROUP_KEY, {
        enfant: null,
        libelle: "Sans prestation (legacy)",
        masterId: undefined,
        masterLibelle: undefined,
        row,
      });
    }
  }

  const byMaster = new Map<
    SuiviMissionMasterGroupKey,
    {
      masterId?: number;
      libelle: string;
      enfants: SuiviEnfantBranch[];
      totaux: CraTotaux;
    }
  >();

  for (const [key, acc] of byEnfant) {
    const masterKey: SuiviMissionMasterGroupKey =
      acc.masterId != null && acc.masterId !== 0 ? acc.masterId : SANS_MISSION_GROUP_KEY;
    const masterLibelle =
      acc.masterLibelle ??
      (masterKey === SANS_MISSION_GROUP_KEY ? "Sans mission" : `Mission #${masterKey}`);

    const branch: SuiviEnfantBranch = {
      key,
      enfant: acc.enfant,
      libelle: acc.libelle,
      rows: acc.rows,
      totaux: acc.totaux,
    };

    const prev = byMaster.get(masterKey);
    if (prev) {
      prev.enfants.push(branch);
      prev.totaux = mergeTotaux(prev.totaux, branch.totaux);
    } else {
      byMaster.set(masterKey, {
        masterId: acc.masterId,
        libelle: masterLibelle,
        enfants: [branch],
        totaux: { ...branch.totaux },
      });
    }
  }

  const groups: SuiviMasterGroup[] = [...byMaster.entries()].map(([key, g]) => {
    g.enfants.sort((a, b) => a.libelle.localeCompare(b.libelle, "fr", { sensitivity: "base" }));
    return {
      key,
      masterId: g.masterId,
      libelle: g.libelle,
      enfants: g.enfants,
      totaux: g.totaux,
    };
  });

  groups.sort((a, b) => {
    if (a.key === SANS_MISSION_GROUP_KEY) return 1;
    if (b.key === SANS_MISSION_GROUP_KEY) return -1;
    return a.libelle.localeCompare(b.libelle, "fr", { sensitivity: "base" });
  });

  return groups;
}
