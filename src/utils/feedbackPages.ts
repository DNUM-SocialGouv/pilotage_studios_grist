/** Options « Page concernée » alignées sur la nav / stubs du widget. */

export const FEEDBACK_PAGE_OPTIONS = [
  "Accueil",
  "Bons de commande",
  "Plans d’activité",
  "Produits",
  "Missions",
  "Intervenants",
  "Prestation / CRA",
  "Procès-verbaux",
  "Évaluations",
  "Analyse",
  "Autre",
] as const;

export type FeedbackPageOption = (typeof FEEDBACK_PAGE_OPTIONS)[number];

/** Mappe un pathname MemoryRouter vers une option du select. */
export function pageOptionFromPathname(pathname: string): FeedbackPageOption {
  if (pathname === "/" || pathname === "") {
    return "Accueil";
  }
  if (pathname === "/pa" || pathname.startsWith("/pa/")) {
    return "Plans d’activité";
  }
  if (pathname === "/bdc" || pathname.startsWith("/bdc/")) {
    return "Bons de commande";
  }
  if (pathname === "/missions" || pathname.startsWith("/missions/")) {
    return "Missions";
  }
  if (pathname === "/produits" || pathname.startsWith("/produits/")) {
    return "Produits";
  }
  if (pathname === "/intervenants" || pathname.startsWith("/intervenants/")) {
    return "Intervenants";
  }
  if (pathname === "/cra" || pathname.startsWith("/cra/")) {
    return "Prestation / CRA";
  }
  if (pathname === "/pv" || pathname.startsWith("/pv/")) {
    return "Procès-verbaux";
  }
  if (pathname === "/evaluations" || pathname.startsWith("/evaluations/")) {
    return "Évaluations";
  }
  if (pathname === "/analyse" || pathname.startsWith("/analyse/")) {
    return "Analyse";
  }
  return "Autre";
}
