import { createContext, useContext } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Outlet } from "react-router-dom";
import { useGristPa } from "../GristPaContext";
import { useProduitsData, type ProduitsData } from "../hooks/useProduitsData";
import { NothingHerePage } from "../security/NothingHerePage";

export type ProduitsOutletContext = {
  data: ProduitsData;
};

const ProduitsOutletReactContext = createContext<ProduitsOutletContext | null>(null);

export function useProduitsOutlet(): ProduitsOutletContext {
  const ctx = useContext(ProduitsOutletReactContext);
  if (!ctx) {
    throw new Error("useProduitsOutlet doit être utilisé sous ProduitsLayout");
  }
  return ctx;
}

/**
 * Liste + fiche `/produits` : catalogue SDPC + Missions / prestations / CRA
 * pour le filtre investissement (liste), gate hors Grist comme Équipe.
 */
export function ProduitsLayout() {
  const pa = useGristPa();
  const enabled = !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useProduitsData(enabled);

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  if (pa.loading) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Produits</h1>
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
        <h1 className="fr-h3">Produits</h1>
        <Alert severity="error" title="Erreur" description={pa.error} />
      </div>
    );
  }

  return (
    <ProduitsOutletReactContext.Provider value={{ data }}>
      <Outlet />
    </ProduitsOutletReactContext.Provider>
  );
}
