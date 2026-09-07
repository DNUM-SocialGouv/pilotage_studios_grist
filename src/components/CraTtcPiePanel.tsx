import { lazy, Suspense } from "react";
import type { CraTtcPieProps } from "./CraTtcPie";

export type { CraTtcPieSlice } from "./CraTtcPie";

const CraTtcPie = lazy(() => import("./CraTtcPie"));

function ChartChunkFallback({ label }: { label: string }) {
  return (
    <div className="fr-mt-2w" role="status" aria-live="polite">
      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{label}</p>
    </div>
  );
}

/** Camembert TTC CRA — lazy load recharts. */
export function CraTtcPiePanel(props: CraTtcPieProps) {
  return (
    <Suspense fallback={<ChartChunkFallback label="Chargement du camembert…" />}>
      <CraTtcPie {...props} />
    </Suspense>
  );
}
