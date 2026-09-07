import type { MissionEnfant } from "../types.ts";

export function missionEnfantLibelle(enfant: MissionEnfant, intervenantLabel?: string): string {
  const lib = enfant.Libelle?.trim();
  if (lib) {
    return lib;
  }
  if (intervenantLabel?.trim()) {
    return intervenantLabel.trim();
  }
  return `Prestation #${enfant.id}`;
}
