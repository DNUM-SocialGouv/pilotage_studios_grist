/** Préférence d’affichage de la liste `/missions` (HITL #218). */
export type MissionsListeVue = "detail" | "lot";

export const MISSIONS_LISTE_VUE_STORAGE_KEY = "pilotage.missions.listeVue";

export function loadMissionsListeVue(): MissionsListeVue {
  if (typeof window === "undefined") {
    return "detail";
  }
  try {
    const raw = window.localStorage.getItem(MISSIONS_LISTE_VUE_STORAGE_KEY);
    return raw === "lot" ? "lot" : "detail";
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
