import { createContext, useContext, useMemo } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Outlet } from "react-router-dom";
import { EquipeFormDrawer } from "../components/equipe/EquipeFormDrawer";
import {
  EquipeFormDrawerProvider,
  useEquipeFormDrawerRef,
} from "../components/equipe/EquipeFormDrawerContext";
import { useGristPa } from "../GristPaContext";
import { useEquipeData, type EquipeDataState } from "../hooks/useEquipeData";
import { NothingHerePage } from "../security/NothingHerePage";
import { uniqueSortedLabels } from "../utils/equipeList";

export type EquipeOutletContext = {
  data: EquipeDataState;
};

const EquipeOutletReactContext = createContext<EquipeOutletContext | null>(null);

export function useEquipeOutlet(): EquipeOutletContext {
  const ctx = useContext(EquipeOutletReactContext);
  if (!ctx) {
    throw new Error("useEquipeOutlet doit être utilisé sous EquipeLayout");
  }
  return ctx;
}

function EquipeDrawerHost({ data }: { data: EquipeDataState }) {
  const drawerRef = useEquipeFormDrawerRef();
  const equipeOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Equipe)),
    [data.members],
  );
  const specialiteOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Specialite)),
    [data.members],
  );
  const statutOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Statut)),
    [data.members],
  );
  const portageOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Portage)),
    [data.members],
  );
  const ordinateurOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Ordinateur2)),
    [data.members],
  );
  const modeRecrutementOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Mode_recrutement)),
    [data.members],
  );

  return (
    <EquipeFormDrawer
      ref={drawerRef}
      equipeOptions={equipeOptions}
      specialiteOptions={specialiteOptions}
      statutOptions={statutOptions}
      portageOptions={portageOptions}
      ordinateurOptions={ordinateurOptions}
      modeRecrutementOptions={modeRecrutementOptions}
      onRecordsChanged={data.reloadEquipe}
    />
  );
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
    <EquipeFormDrawerProvider>
      <EquipeOutletReactContext.Provider value={{ data }}>
        <Outlet />
        <EquipeDrawerHost data={data} />
      </EquipeOutletReactContext.Provider>
    </EquipeFormDrawerProvider>
  );
}
