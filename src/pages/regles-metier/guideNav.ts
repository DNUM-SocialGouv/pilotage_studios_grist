/** Sommaire du guide métier (liens MemoryRouter). */

export type GuideNavItem = {
  path: string;
  label: string;
  /** Sous-titre court pour la page d’accueil. */
  teaser: string;
};

export const GUIDE_BASE = "/outils/regles-metier";

export const GUIDE_NAV: readonly GuideNavItem[] = [
  {
    path: GUIDE_BASE,
    label: "Accueil du guide",
    teaser: "Pourquoi ces règles et comment les lire",
  },
  {
    path: `${GUIDE_BASE}/missions`,
    label: "Missions & prestations",
    teaser: "Lot d’accompagnement et qui intervient (personne × métier × période)",
  },
  {
    path: `${GUIDE_BASE}/cra`,
    label: "CRA / réalisations",
    teaser: "Déclarer, revoir, rattacher au bon de commande",
  },
  {
    path: `${GUIDE_BASE}/bdc-pa`,
    label: "Bons de commande & plans d’activité",
    teaser: "Enveloppe, engagement, consommation",
  },
  {
    path: `${GUIDE_BASE}/qui-voit-quoi`,
    label: "Qui voit quoi",
    teaser: "Admin, responsable, freelance, invité — en langage métier",
  },
] as const;

export function guideNavIndex(pathname: string): number {
  const path = pathname.split("?")[0] || GUIDE_BASE;
  const exact = GUIDE_NAV.findIndex((item) => item.path === path);
  if (exact >= 0) {
    return exact;
  }
  return 0;
}

/** Voisins Précédent / Suivant (null aux extrémités). */
export function guideNavNeighbors(pathname: string): {
  prev: GuideNavItem | null;
  next: GuideNavItem | null;
} {
  const index = guideNavIndex(pathname);
  return {
    prev: index > 0 ? (GUIDE_NAV[index - 1] ?? null) : null,
    next: index < GUIDE_NAV.length - 1 ? (GUIDE_NAV[index + 1] ?? null) : null,
  };
}
