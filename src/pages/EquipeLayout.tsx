import { createContext, useContext } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Outlet } from "react-router-dom";
import { useGristPa } from "../GristPaContext";
import { useEquipeData, type EquipeData } from "../hooks/useEquipeData";
import { NothingHerePage } from "../security/NothingHerePage";

export type EquipeOutletContext = {
  data: EquipeData;
};

const EquipeOutletReactContext = createContext<EquipeOutletContext | null>(null);

export function useEquipeOutlet(): EquipeOutletContext {
  const ctx = useContext(EquipeOutletReactContext);
  if (!ctx) {
    throw new Error("useEquipeOutlet doit être utilisé sous EquipeLayout");
  }
  return ctx;
}

/**
 * Liste + fiche `/equipe` : un seul fetch `Equipe`, gate hors Grist comme Missions/PA.
 */
export function EquipeLayout() {
  const pa = useGristPa();
  const enabled = !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useEquipeData(enabled);

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  if (pa.loading) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Équipe</h1>
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
        <h1 className="fr-h3">Équipe</h1>
        <Alert severity="error" title="Erreur" description={pa.error} />
      </div>
    );
  }

  return (
    <EquipeOutletReactContext.Provider value={{ data }}>
      <Outlet />
    </EquipeOutletReactContext.Provider>
  );
}
