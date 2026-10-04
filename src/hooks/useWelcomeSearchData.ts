import { useEffect, useState } from "react";
import { recordsFromFetchTable, toMission } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import type { EquipeMember, Mission, ProduitSdpc } from "../types";
import type { WelcomeSearchTargetFlags } from "../utils/welcomeSearch";
import { loadEquipeTable } from "./useEquipeData";
import { loadProduitsTable } from "./useProduitsData";

export type WelcomeSearchDataStatus = "idle" | "loading" | "ok" | "error";

export type WelcomeSearchData = {
  status: WelcomeSearchDataStatus;
  error: string | null;
  produits: ProduitSdpc[];
  missions: Mission[];
  members: EquipeMember[];
};

const EMPTY: WelcomeSearchData = {
  status: "idle",
  error: null,
  produits: [],
  missions: [],
  members: [],
};

async function loadMissionsOnly(): Promise<Mission[]> {
  const raw = await fetchAllowlistedTable("Missions");
  return recordsFromFetchTable(raw).map(toMission);
}

/**
 * Charge les tables nécessaires à la recherche d’accueil (lazy).
 * - Produits : catalogue seul (pas de Realise).
 * - Missions : table Missions (+ produits pour libellés si missions demandées).
 * - Équipe : annuaire.
 * Aucune écriture ; allowlist lecture inchangée.
 */
export async function loadWelcomeSearchTables(
  targets: WelcomeSearchTargetFlags,
): Promise<Omit<WelcomeSearchData, "status" | "error">> {
  const needProduits = targets.produits || targets.missions;

  const [produitsResult, missionsResult, equipeResult] = await Promise.allSettled([
    needProduits ? loadProduitsTable() : Promise.resolve([] as ProduitSdpc[]),
    targets.missions ? loadMissionsOnly() : Promise.resolve([] as Mission[]),
    targets.equipe ? loadEquipeTable() : Promise.resolve([] as EquipeMember[]),
  ]);

  const produits =
    produitsResult.status === "fulfilled" ? produitsResult.value : [];
  const missions =
    missionsResult.status === "fulfilled" ? missionsResult.value : [];
  const members =
    equipeResult.status === "fulfilled" ? equipeResult.value : [];

  const produitsFailed = needProduits && produitsResult.status === "rejected";
  const missionsFailed = targets.missions && missionsResult.status === "rejected";
  const equipeFailed = targets.equipe && equipeResult.status === "rejected";

  if (
    (produitsFailed || missionsFailed || equipeFailed) &&
    produits.length === 0 &&
    missions.length === 0 &&
    members.length === 0
  ) {
    throw new Error(
      "Impossible de charger la recherche. Utilisez le menu Produits, Missions ou Équipe.",
    );
  }

  return { produits, missions, members };
}

/**
 * Données recherche accueil — chargées au premier besoin (`enabled`),
 * pas au boot de `/` pour tous les rôles.
 */
export function useWelcomeSearchData(
  enabled: boolean,
  targets: WelcomeSearchTargetFlags,
): WelcomeSearchData {
  const [state, setState] = useState<WelcomeSearchData>(EMPTY);
  const wantProduits = targets.produits;
  const wantMissions = targets.missions;
  const wantEquipe = targets.equipe;

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    const flags: WelcomeSearchTargetFlags = {
      produits: wantProduits,
      missions: wantMissions,
      equipe: wantEquipe,
    };

    void (async () => {
      try {
        const loaded = await loadWelcomeSearchTables(flags);
        if (cancelled) {
          return;
        }
        setState({ status: "ok", error: null, ...loaded });
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
              : "Impossible de charger la recherche. Utilisez le menu Produits, Missions ou Équipe.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, wantProduits, wantMissions, wantEquipe]);

  return state;
}
