import { useEffect, useState } from "react";
import type { Intervenant, Mission, MissionEnfant, ProduitSdpc, SuiviMensuel } from "../types";
import type { GristFetchTableResult, GristRecord } from "../gristTypes";
import {
  recordsFromFetchTable,
  toIntervenant,
  toMission,
  toMissionEnfant,
  toProduitSdpc,
  toSuiviMensuel,
} from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import { suiviRowLinksToBdc } from "../utils/gristReferences";
import { fetchGristRecordsViaToken } from "../utils/gristRest";

export type BdcDepensesStatus = "idle" | "loading" | "ok" | "error";

export type BdcDepensesData = {
  status: BdcDepensesStatus;
  error: string | null;
  refsError: string | null;
  suivi: SuiviMensuel[];
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  intervenants: Intervenant[];
  produits: ProduitSdpc[];
};

const EMPTY: BdcDepensesData = {
  status: "idle",
  error: null,
  refsError: null,
  suivi: [],
  missions: [],
  missionEnfants: [],
  intervenants: [],
  produits: [],
};

async function loadSuiviForBdc(bdcId: number): Promise<SuiviMensuel[]> {
  const idVariants: (number | string)[] = [bdcId, String(bdcId)];

  const filterLocal = (rows: SuiviMensuel[]) =>
    rows.filter((row) => suiviRowLinksToBdc(row as unknown as Record<string, unknown>, bdcId));

  const mergeFiltered = (chunks: SuiviMensuel[][]): SuiviMensuel[] => {
    const byId = new Map<number, SuiviMensuel>();
    for (const chunk of chunks) {
      for (const r of chunk) {
        byId.set(r.id, r);
      }
    }
    return filterLocal([...byId.values()]);
  };

  const settled = await Promise.allSettled([
    fetchGristRecordsViaToken("Realise", { BDC_cible: idVariants }),
    fetchGristRecordsViaToken("Realise", { Bdc_Chorus2: idVariants }),
  ]);

  const chunks: SuiviMensuel[][] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") {
      chunks.push(s.value.map((row) => toSuiviMensuel(row as GristRecord)));
    }
  }

  if (chunks.length > 0) {
    return mergeFiltered(chunks);
  }

  throw new Error("Lecture Realise impossible (filtres BDC_cible / Bdc_Chorus2).");
}

async function loadReferentials(): Promise<{
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  intervenants: Intervenant[];
  produits: ProduitSdpc[];
  refsError: string | null;
}> {
  const labels = ["Missions", "Missions_enfants", "Equipe", "produits"] as const;
  const settled = await Promise.allSettled([
    fetchAllowlistedTable("Missions"),
    fetchAllowlistedTable("Missions_enfants"),
    fetchAllowlistedTable("Equipe"),
    fetchAllowlistedTable("Tableau_de_pilotage_SDPC_Produits_SDPC"),
  ]);

  const failed: string[] = [];
  const pick = <T>(
    index: number,
    map: (raw: GristFetchTableResult) => T[],
  ): T[] => {
    const result = settled[index];
    if (result?.status === "fulfilled") {
      return map(result.value);
    }
    failed.push(labels[index]!);
    return [];
  };

  return {
    missions: pick(0, (raw) => recordsFromFetchTable(raw).map(toMission)),
    missionEnfants: pick(1, (raw) => recordsFromFetchTable(raw).map(toMissionEnfant)),
    intervenants: pick(2, (raw) => recordsFromFetchTable(raw).map(toIntervenant)),
    produits: pick(3, (raw) => recordsFromFetchTable(raw).map(toProduitSdpc)),
    refsError:
      failed.length > 0
        ? `Référentiels partiels indisponibles : ${failed.join(", ")}. Le regroupement des dépenses peut être incomplet.`
        : null,
  };
}

/**
 * Suivi CRA + référentiels pour l’onglet Dépenses — chargé uniquement sur la fiche BDC.
 * Jeton REST toujours `readOnly: true` (via `fetchGristRecordsViaToken`).
 */
export function useBdcDepensesData(bdcId: number | undefined): BdcDepensesData {
  const [state, setState] = useState<BdcDepensesData>(EMPTY);

  useEffect(() => {
    if (bdcId == null || !Number.isFinite(bdcId)) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const suivi = await loadSuiviForBdc(bdcId);
        if (cancelled) {
          return;
        }
        const refs = await loadReferentials();
        if (cancelled) {
          return;
        }
        setState({
          status: "ok",
          error: null,
          refsError: refs.refsError,
          suivi,
          missions: refs.missions,
          missionEnfants: refs.missionEnfants,
          intervenants: refs.intervenants,
          produits: refs.produits,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        setState({
          ...EMPTY,
          status: "error",
          error:
            err instanceof Error
              ? err.message
              : "La liste des dépenses mensuelles n’a pas pu être chargée.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bdcId]);

  return state;
}
