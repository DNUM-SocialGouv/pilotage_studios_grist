import { Alert } from "@codegouvfr/react-dsfr/Alert";

const STUB_COPY: Record<
  string,
  { title: string; description: string; severity?: "info" | "warning" }
> = {
  bdc: {
    title: "Bons de commande",
    description: "Écran à venir dans le widget Grist. Disponible dans l’app Pilotage studios (`/bdc`).",
  },
  produits: {
    title: "Produits SDPC",
    description: "Écran à venir. Disponible dans l’app Pilotage studios (`/produits`).",
  },
  missions: {
    title: "Missions",
    description: "Écran à venir. Disponible dans l’app Pilotage studios (`/missions`).",
  },
  intervenants: {
    title: "Intervenants",
    description: "Écran à venir. Disponible dans l’app Pilotage studios (`/intervenants`).",
  },
  cra: {
    title: "CRA / Réalisé",
    description: "Écran à venir. Disponible dans l’app Pilotage studios (`/cra`).",
  },
  pv: {
    title: "PV / Constatations",
    description: "Écran à venir. Disponible dans l’app Pilotage studios (`/pv`).",
  },
  evaluations: {
    title: "Évaluations de maturité",
    description: "Écran à venir. Disponible dans l’app Pilotage studios (`/evaluations`).",
  },
  analyse: {
    title: "Analyse (IA)",
    description:
      "Non disponible dans ce widget : l’analyse IA nécessite un backend avec secrets LLM. Utilisez l’app Pilotage studios (`/analyse`).",
    severity: "warning",
  },
};

type StubPageProps = {
  slug: keyof typeof STUB_COPY;
};

export function StubPage({ slug }: StubPageProps) {
  const copy = STUB_COPY[slug];
  return (
    <>
      <h1 className="fr-h3">{copy.title}</h1>
      <Alert
        severity={copy.severity ?? "info"}
        title="À venir"
        description={copy.description}
      />
    </>
  );
}
