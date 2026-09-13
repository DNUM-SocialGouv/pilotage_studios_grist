import type { MissionEnfant } from "../../types.ts";

export type MissionEnfantDrawerHandle = {
  openCreate: (masterId: number) => void;
  openEdit: (enfant: MissionEnfant) => void;
  close: () => void;
};
