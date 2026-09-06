import { formatMontantEur } from "../utils/formatMontant";

type BdcFinanceRecapProps = {
  budgetTtc: number | null | undefined;
  consommeCra: number | null | undefined;
  soldeCra: number | null | undefined;
};

function asFinite(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function pctConsomme(consomme: number, budget: number): number {
  if (!(budget > 0) || !Number.isFinite(consomme)) {
    return 0;
  }
  return Math.round((Math.max(0, consomme) / budget) * 100);
}

function widthConsomme(consomme: number, budget: number): number {
  if (!(budget > 0) || !Number.isFinite(consomme) || consomme <= 0) {
    return 0;
  }
  return Math.min(100, (consomme / budget) * 100);
}

function Kpi({ title, value, error }: { title: string; value: string; error?: boolean }) {
  return (
    <div className="widget-kpi">
      <p className="fr-text--sm fr-mb-0">{title}</p>
      <p
        className="fr-text--lg fr-mb-0 fr-text--bold"
        style={error ? { color: "var(--text-default-error)" } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Récap financier fiche BDC — aligné sur l’app sœur (`BdcFinanceRecap` / PR #198) :
 * 3 KPI + barre % consommé CRA vs budget.
 */
export function BdcFinanceRecap({ budgetTtc, consommeCra, soldeCra }: BdcFinanceRecapProps) {
  const budget = asFinite(budgetTtc);
  const consomme = asFinite(consommeCra);
  const solde =
    typeof soldeCra === "number" && Number.isFinite(soldeCra) ? soldeCra : budget - consomme;

  const pct = pctConsomme(consomme, budget);
  const width = widthConsomme(consomme, budget);
  const label = `${pct} % consommé`;
  const amounts = `${formatMontantEur(consomme)} consommé / ${formatMontantEur(budget)}`;

  return (
    <div className="fr-mb-3w">
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
          <Kpi title="Budget TTC" value={formatMontantEur(budget)} />
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
          <Kpi title="Total consommé (CRA)" value={formatMontantEur(consomme)} />
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
          <Kpi title="Solde CRA" value={formatMontantEur(solde)} error={solde < 0} />
        </div>
      </div>
      <div className="widget-usage-bar" role="img" aria-label={`${label}. ${amounts}.`}>
        <div className="widget-usage-bar__header">
          <p className="widget-usage-bar__label">{label}</p>
          <p className="widget-usage-bar__amounts">{amounts}</p>
        </div>
        <div className="widget-usage-bar__track">
          {width > 0 ? (
            <span className="widget-usage-bar__seg" style={{ width: `${width}%` }} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
