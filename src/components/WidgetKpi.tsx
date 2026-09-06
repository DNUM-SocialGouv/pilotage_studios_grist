type WidgetKpiProps = {
  title: string;
  value: string;
  error?: boolean;
};

/** Bloc KPI réutilisé (liste/fiche PA, fiche BDC). */
export function WidgetKpi({ title, value, error }: WidgetKpiProps) {
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
