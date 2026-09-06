import type { ReactNode } from "react";
import { WidgetKpi } from "./WidgetKpi";
import { formatMontantEur } from "../utils/formatMontant";

type FinanceRecapProps = {
  enveloppe: number;
  engage: number;
  payeSofiane: number;
  resteAConsommer: number;
};

export function FinanceRecap({
  enveloppe,
  engage,
  payeSofiane,
  resteAConsommer,
}: FinanceRecapProps) {
  const pctPaye =
    enveloppe > 0 && Number.isFinite(payeSofiane)
      ? Math.round((Math.max(0, payeSofiane) / enveloppe) * 100)
      : 0;
  const pctEngage =
    enveloppe > 0 && Number.isFinite(engage)
      ? Math.round((Math.max(0, engage) / enveloppe) * 100)
      : 0;
  const payeWidth =
    enveloppe > 0 && payeSofiane > 0 ? Math.min(100, (payeSofiane / enveloppe) * 100) : 0;
  const engageExtra =
    enveloppe > 0
      ? Math.max(
          0,
          Math.min(100 - payeWidth, (Math.max(0, engage - payeSofiane) / enveloppe) * 100),
        )
      : 0;

  return (
    <div className="fr-mb-3w">
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <WidgetKpi title="Enveloppe" value={formatMontantEur(enveloppe)} />
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <WidgetKpi title="Engagé" value={formatMontantEur(engage)} />
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <WidgetKpi title="Payé Sofiane" value={formatMontantEur(payeSofiane)} />
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <WidgetKpi
            title="Reste à consommer"
            value={formatMontantEur(resteAConsommer)}
            error={resteAConsommer < 0}
          />
        </div>
      </div>
      <div
        className="widget-finance-bar"
        role="img"
        aria-label={`${pctPaye} % payé · ${pctEngage} % engagé`}
        title={`${pctPaye} % payé · ${pctEngage} % engagé — ${formatMontantEur(payeSofiane)} payé / ${formatMontantEur(enveloppe)}`}
      >
        <span className="widget-finance-bar__paye" style={{ width: `${payeWidth}%` }} />
        <span className="widget-finance-bar__engage" style={{ width: `${engageExtra}%` }} />
      </div>
      <p className="fr-text--xs fr-mt-1v fr-mb-0">
        {pctPaye} % payé · {pctEngage} % engagé
      </p>
    </div>
  );
}

type TableShellProps = {
  children: ReactNode;
  className?: string;
};

/** Enveloppe tableau DSFR minimale (spike — pas le DsfrTableShell de l’app). */
export function TableShell({ children, className }: TableShellProps) {
  return (
    <div className={["fr-table", "fr-table--bordered", className].filter(Boolean).join(" ")}>
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">{children}</div>
        </div>
      </div>
    </div>
  );
}
