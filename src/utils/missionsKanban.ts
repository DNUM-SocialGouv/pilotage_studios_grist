/**
 * Colonnes kanban liste `/missions` — mapping `Missions.Statut` (HITL V1).
 * Indépendant de `Weekly_phase`.
 */

export type MissionsKanbanColumnKey = string;

export type MissionsKanbanColumnDef = {
  key: MissionsKanbanColumnKey;
  label: string;
  /** Statuts Grist regroupés dans cette colonne. */
  statuses: readonly string[];
  /** Valeur écrite au drop / menu vers cette colonne. */
  writeStatus: string;
  /** Toujours affichée même vide. */
  defaultVisible: boolean;
  /** Masquée sauf toggle ou filtre statut explicite. */
  hiddenByDefault: boolean;
  dot: string;
  colBg: string;
};

const EN_COURS_STATUSES = [
  "En cours",
  "Récurrent",
  "Suivi et amélioration continue",
] as const;

/** Pipeline connu (ordre fixe). */
export const MISSIONS_KANBAN_PIPELINE: readonly MissionsKanbanColumnDef[] = [
  {
    key: "a_instruire",
    label: "A instruire",
    statuses: ["A instruire"],
    writeStatus: "A instruire",
    defaultVisible: true,
    hiddenByDefault: false,
    dot: "var(--text-label-blue-cumulus)",
    colBg: "var(--background-contrast-blue-cumulus)",
  },
  {
    key: "en_investigation",
    label: "En investigation",
    statuses: ["En investigation"],
    writeStatus: "En investigation",
    defaultVisible: true,
    hiddenByDefault: false,
    dot: "var(--text-label-purple-glycine)",
    colBg: "var(--background-contrast-purple-glycine)",
  },
  {
    key: "en_cours",
    label: "En cours",
    statuses: EN_COURS_STATUSES,
    writeStatus: "En cours",
    defaultVisible: true,
    hiddenByDefault: false,
    dot: "var(--text-label-yellow-tournesol)",
    colBg: "var(--background-contrast-yellow-tournesol)",
  },
  {
    key: "termine",
    label: "Terminé",
    statuses: ["Terminé"],
    writeStatus: "Terminé",
    defaultVisible: false,
    hiddenByDefault: true,
    dot: "var(--text-label-green-emeraude)",
    colBg: "var(--background-contrast-green-emeraude)",
  },
  {
    key: "annule",
    label: "Annulé",
    statuses: ["Annulé"],
    writeStatus: "Annulé",
    defaultVisible: false,
    hiddenByDefault: true,
    dot: "var(--text-label-grey)",
    colBg: "var(--background-contrast-grey)",
  },
  {
    key: "archivee",
    label: "[Archivée]",
    statuses: ["[Archivée]", "Archivée"],
    writeStatus: "[Archivée]",
    defaultVisible: false,
    hiddenByDefault: true,
    dot: "var(--text-label-grey)",
    colBg: "var(--background-alt-grey)",
  },
] as const;

export const MISSIONS_KANBAN_AUTRE_KEY = "autre";

const AUTRE_COLUMN: MissionsKanbanColumnDef = {
  key: MISSIONS_KANBAN_AUTRE_KEY,
  label: "Autre",
  statuses: [],
  writeStatus: "",
  defaultVisible: false,
  hiddenByDefault: false,
  dot: "var(--text-label-grey)",
  colBg: "var(--background-contrast-grey)",
};

const KNOWN_STATUS_TO_KEY = (() => {
  const map = new Map<string, string>();
  for (const col of MISSIONS_KANBAN_PIPELINE) {
    for (const s of col.statuses) {
      map.set(normalizeStatut(s), col.key);
    }
  }
  return map;
})();

export function normalizeStatut(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function columnKeyForMissionStatut(
  statut: string | null | undefined,
): MissionsKanbanColumnKey {
  const raw = normalizeStatut(statut);
  if (!raw) {
    return MISSIONS_KANBAN_AUTRE_KEY;
  }
  return KNOWN_STATUS_TO_KEY.get(raw) ?? `statut:${raw}`;
}

function dedicatedColumn(statut: string): MissionsKanbanColumnDef {
  return {
    key: `statut:${statut}`,
    label: statut,
    statuses: [statut],
    writeStatus: statut,
    defaultVisible: false,
    hiddenByDefault: false,
    dot: "var(--text-label-orange-terre-battue)",
    colBg: "var(--background-contrast-orange-terre-battue)",
  };
}

export type BuildMissionsKanbanColumnsArgs = {
  /** Statuts présents dans le résultat filtré (cartes). */
  presentStatuts: readonly string[];
  /** Filtre statut multi explicite (réaffiche colonnes masquées). */
  statutFilter: readonly string[];
  /** Toggle « Afficher terminées / annulées / archivées ». */
  showClosed: boolean;
};

/**
 * Colonnes visibles : défauts + présentes dans le filtre ;
 * terminées masquées sauf toggle ou filtre statut.
 */
export function buildMissionsKanbanColumns(
  args: BuildMissionsKanbanColumnsArgs,
): MissionsKanbanColumnDef[] {
  const { presentStatuts, statutFilter, showClosed } = args;
  const filterSet = new Set(statutFilter.map(normalizeStatut).filter(Boolean));
  const presentKeys = new Set(
    presentStatuts.map((s) => columnKeyForMissionStatut(s)),
  );
  const presentRaw = new Set(
    presentStatuts.map(normalizeStatut).filter((s) => s.length > 0),
  );

  const knownNormalized = new Set<string>();
  for (const col of MISSIONS_KANBAN_PIPELINE) {
    for (const s of col.statuses) {
      knownNormalized.add(normalizeStatut(s));
    }
  }

  const out: MissionsKanbanColumnDef[] = [];

  for (const col of MISSIONS_KANBAN_PIPELINE) {
    if (col.defaultVisible) {
      out.push(col);
      continue;
    }
    if (col.hiddenByDefault) {
      const filterHits = col.statuses.some((s) => filterSet.has(s));
      if (showClosed || filterHits) {
        out.push(col);
      }
      continue;
    }
    if (presentKeys.has(col.key)) {
      out.push(col);
    }
  }

  const rare = [...presentRaw]
    .filter((s) => !knownNormalized.has(s))
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  for (const s of rare) {
    out.push(dedicatedColumn(s));
  }

  if (presentStatuts.some((s) => !normalizeStatut(s))) {
    out.push(AUTRE_COLUMN);
  }

  return out;
}

export function writeStatusForColumnKey(
  columnKey: string,
  columns: readonly MissionsKanbanColumnDef[],
): string | null {
  const col = columns.find((c) => c.key === columnKey);
  if (!col || col.key === MISSIONS_KANBAN_AUTRE_KEY) {
    return null;
  }
  return col.writeStatus;
}

export function groupMissionsByKanbanColumn<T extends { Statut?: string | null }>(
  missions: readonly T[],
  columns: readonly MissionsKanbanColumnDef[],
): Map<string, T[]> {
  const keys = new Set(columns.map((c) => c.key));
  const map = new Map<string, T[]>();
  for (const col of columns) {
    map.set(col.key, []);
  }
  for (const m of missions) {
    const key = columnKeyForMissionStatut(m.Statut);
    if (keys.has(key)) {
      map.get(key)!.push(m);
    }
    // Colonne masquée (ex. Terminé sans toggle) → carte absente du board
  }
  return map;
}
