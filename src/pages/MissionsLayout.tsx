import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Link, Outlet, useLocation } from "react-router-dom";
import { MissionEnfantDrawer } from "../components/missions/MissionEnfantDrawer";
import {
  MissionEnfantDrawerProvider,
  useMissionEnfantDrawerRef,
} from "../components/missions/MissionEnfantDrawerContext";
import { MissionFormDrawer } from "../components/missions/MissionFormDrawer";
import {
  MissionFormDrawerProvider,
  useMissionFormDrawerRef,
} from "../components/missions/MissionFormDrawerContext";
import { useGristPa } from "../GristPaContext";
import { useMissionsData, type MissionsData, type MissionsDataState } from "../hooks/useMissionsData";
import type { GristPaData } from "../hooks/useGristPaData";
import { NothingHerePage } from "../security/NothingHerePage";
import { DEFAULT_MISSION_ENFANT_STATUT } from "../utils/missionEnfantFormFields";
import { missionStatutOptions } from "../utils/missionsList";
import { libelleProduitGrist } from "../utils/pilotageProduits";

export type MissionsOutletContext = {
  pa: GristPaData;
  data: MissionsData;
  isReloading: boolean;
  reloadMissions: () => Promise<void>;
};

const MissionsOutletReactContext = createContext<MissionsOutletContext | null>(null);

export function useMissionsOutlet(): MissionsOutletContext {
  const ctx = useContext(MissionsOutletReactContext);
  if (!ctx) {
    throw new Error("useMissionsOutlet doit être utilisé sous MissionsLayout");
  }
  return ctx;
}

function isMissionDetailPath(pathname: string): boolean {
  return pathname.startsWith("/missions/") && pathname !== "/missions/";
}

function missionEnfantStatutOptions(
  enfants: MissionsDataState["missionEnfants"],
): string[] {
  const set = new Set<string>([DEFAULT_MISSION_ENFANT_STATUT]);
  for (const e of enfants) {
    const s = e.Statut?.trim();
    if (s) {
      set.add(s);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

function MissionDrawersHost({ missionsState }: { missionsState: MissionsDataState }) {
  const missionDrawerRef = useMissionFormDrawerRef();
  const enfantDrawerRef = useMissionEnfantDrawerRef();
  const statutOptions = useMemo(
    () => missionStatutOptions(missionsState.missions),
    [missionsState.missions],
  );
  const enfantStatutOptions = useMemo(
    () => missionEnfantStatutOptions(missionsState.missionEnfants),
    [missionsState.missionEnfants],
  );
  const produitOptions = useMemo(
    () =>
      missionsState.produits
        .map((p) => ({
          id: p.id,
          label: libelleProduitGrist(p as unknown as Record<string, unknown>, p.id),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })),
    [missionsState.produits],
  );
  const intervenantOptions = useMemo(
    () =>
      missionsState.intervenants
        .map((i) => ({
          id: i.id,
          label: i.Prenom_Nom?.trim() || `Intervenant #${i.id}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })),
    [missionsState.intervenants],
  );

  return (
    <>
      <MissionFormDrawer
        ref={missionDrawerRef}
        statutOptions={statutOptions}
        produitOptions={produitOptions}
        intervenantOptions={intervenantOptions}
        onRecordsChanged={missionsState.reloadMissions}
      />
      <MissionEnfantDrawer
        ref={enfantDrawerRef}
        statutOptions={enfantStatutOptions}
        intervenantOptions={intervenantOptions}
        onRecordsChanged={missionsState.reloadMissions}
      />
    </>
  );
}

function MissionsGate({ children }: { children: ReactNode }) {
  const pa = useGristPa();
  const { pathname } = useLocation();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const missionsState = useMissionsData(enabled);

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  if (pa.loading) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Missions</h1>
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Connexion à Grist…"
          role="status"
        />
      </div>
    );
  }

  if (pa.error) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Missions</h1>
        <Alert severity="error" title="Erreur" description={pa.error} />
      </div>
    );
  }

  if (missionsState.status === "idle" || missionsState.status === "loading") {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Missions</h1>
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Chargement des missions…"
          role="status"
        />
      </div>
    );
  }

  if (missionsState.status === "error") {
    return (
      <div className="fr-py-1w">
        {isMissionDetailPath(pathname) ? (
          <p className="fr-mb-2w">
            <Link className="fr-link" to="/missions">
              ← Retour à la liste
            </Link>
          </p>
        ) : null}
        <h1 className="fr-h3">Missions</h1>
        <Alert
          severity="error"
          title="Erreur"
          description={missionsState.error ?? "La liste des missions n’a pas pu être chargée."}
        />
      </div>
    );
  }

  const outletValue: MissionsOutletContext = {
    pa,
    data: missionsState,
    isReloading: missionsState.isReloading,
    reloadMissions: missionsState.reloadMissions,
  };

  return (
    <MissionsOutletReactContext.Provider value={outletValue}>
      <MissionFormDrawerProvider>
        <MissionEnfantDrawerProvider>
          {children}
          <MissionDrawersHost missionsState={missionsState} />
        </MissionEnfantDrawerProvider>
      </MissionFormDrawerProvider>
    </MissionsOutletReactContext.Provider>
  );
}

export function MissionsLayout() {
  return (
    <MissionsGate>
      <Outlet />
    </MissionsGate>
  );
}
