import type { CraCellState } from "../../utils/missionsListeTotaux.ts";
import type { CraTotaux } from "../../utils/suiviMensuel.ts";
import type { Mission, MissionEnfant, SuiviMensuel } from "../../types.ts";

export type MissionsListeHierarchieProps = {
  missions: Mission[];
  enfantsByMasterId: Map<number, MissionEnfant[]>;
  intervenantsById: Map<number, string>;
  equipesByIntervenantId: Map<number, string>;
  produitsById: Map<number, string>;
  craByEnfantId: Map<number, CraTotaux> | undefined;
  suiviByEnfantId: Map<number, SuiviMensuel[]>;
  craState: CraCellState;
  isMasterExpanded: (id: number) => boolean;
  toggleMaster: (id: number) => void;
  isEnfantExpanded: (key: string) => boolean;
  toggleEnfant: (key: string) => void;
};
