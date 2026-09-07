import { createContext, useContext, type ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Link, Outlet } from "react-router-dom";
import { useGristPa } from "../GristPaContext";
import { useMissionsData, type MissionsData } from "../hooks/useMissionsData";
import type { GristPaData } from "../hooks/useGristPaData";
import { NothingHerePage } from "../security/NothingHerePage";

export type MissionsOutletContext = {
  pa: GristPaData;
  data: MissionsData;
};

const MissionsOutletReactContext = createContext<MissionsOutletContext | null>(null);

export function useMissionsOutlet(): MissionsOutletContext {
  const ctx = useContext(MissionsOutletReactContext);
  if (!ctx) {
    throw new Error("useMissionsOutlet doit être utilisé sous MissionsLayout");
  }
  return ctx;
}

function MissionsGate({ children }: { children: ReactNode }) {
  const pa = useGristPa();
  const enabled =
    !pa.untrustedEmbed &&
    !pa.outsideGrist &&
    !pa.loading &&
    !pa.error &&
    pa.relatedStatus === "ok";
  const data = useMissionsData(enabled);

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

  if (pa.relatedStatus === "denied" || pa.relatedStatus === "error") {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Missions</h1>
        <Alert
          severity="warning"
          title="Accès multi-tables indisponible"
          description={
            pa.relatedError ??
            "Accordez l’accès « full » au widget pour charger les missions."
          }
        />
      </div>
    );
  }

  if (pa.relatedStatus === "loading" || pa.relatedStatus === "idle") {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Missions</h1>
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Chargement des tables liées…"
          role="status"
        />
      </div>
    );
  }

  if (data.status === "idle" || data.status === "loading") {
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

  if (data.status === "error") {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/missions">
            ← Retour à la liste
          </Link>
        </p>
        <h1 className="fr-h3">Missions</h1>
        <Alert
          severity="error"
          title="Erreur"
          description={data.error ?? "La liste des missions n’a pas pu être chargée."}
        />
      </div>
    );
  }

  return (
    <MissionsOutletReactContext.Provider value={{ pa, data }}>
      {children}
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
