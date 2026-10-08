/** Préférence d’affichage de la liste `/missions` (HITL kanban). */
export type MissionsListeVue = "detail" | "kanban";

export const MISSIONS_LISTE_VUE_STORAGE_KEY = "pilotage.missions.listeVue";

export function loadMissionsListeVue(): MissionsListeVue {
  if (typeof window === "undefined") {
    return "detail";
  }
  try {
    const raw = window.localStorage.getItem(MISSIONS_LISTE_VUE_STORAGE_KEY);
    // Legacy « Par lot » (`lot`) → Kanban.
    if (raw === "kanban" || raw === "lot") {
      return "kanban";
    }
    return "detail";
  } catch {
    return "detail";
  }
}

export function saveMissionsListeVue(vue: MissionsListeVue): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(MISSIONS_LISTE_VUE_STORAGE_KEY, vue);
  } catch {
    /* quota / private mode */
  }
}
