import type { SuiviMensuel } from "../../types.ts";
import type { MissionCraDrawerContext } from "../../utils/missionCraFormFields.ts";

export type MissionCraDrawerHandle = {
  openEdit: (ctx: MissionCraDrawerContext) => void;
  openDuplicate: (ctx: MissionCraDrawerContext) => void;
  close: () => void;
};

export type { MissionCraDrawerContext };

/** Raccourci typé pour les callbacks lignes CRA. */
export type MissionCraOpenPayload = {
  suivi: SuiviMensuel;
  prestationLibelle: string;
  intervenantLibelle: string;
  equipeLabel: string;
  missionId: number;
  enfantId: number;
  intervenantId: number;
};
