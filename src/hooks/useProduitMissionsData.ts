import { useEffect, useState } from "react";
import type { Intervenant, Mission, MissionEnfant, SuiviMensuel } from "../types";
import { loadMissionsTables } from "./useMissionsData";

export type ProduitMissionsStatus = "idle" | "loading" | "ok" | "error";

export type ProduitMissionsData = {
  status: ProduitMissionsStatus;
  error: string | null;
  refsError: string | null;
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  intervenants: Intervenant[];
  suivi: SuiviMensuel[];
};

const EMPTY: ProduitMissionsData = {
  status: "idle",
  error: null,
  refsError: null,
  missions: [],
  missionEnfants: [],
  intervenants: [],
  suivi: [],
};

/**
 * Missions + prestations + CRA + Equipe — lazy fiche `/produits/:id`
 * (filtre Produit_SDPC côté UI pour l’onglet Missions).
 */
export function useProduitMissionsData(enabled: boolean): ProduitMissionsData {
  const [state, setState] = useState<ProduitMissionsData>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const loaded = await loadMissionsTables();
        if (cancelled) {
          return;
        }
        setState({
          status: "ok",
          error: null,
          refsError: loaded.refsError,
          missions: loaded.missions,
          missionEnfants: loaded.missionEnfants,
          intervenants: loaded.intervenants,
          suivi: loaded.suivi,
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
              : "Les missions liées n’ont pas pu être chargées.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
