import { useId } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMontantEur } from "../utils/formatMontant";

const SLICE_COLORS = [
  "var(--background-action-high-blue-france)",
  "var(--background-action-high-green-menthe)",
  "var(--background-action-high-purple-glycine)",
  "var(--background-action-high-pink-macaron)",
  "var(--background-action-high-yellow-tournesol)",
  "var(--background-action-high-orange-terre-battue)",
  "var(--background-action-high-blue-ecume)",
  "var(--background-action-high-green-emeraude)",
  "var(--background-action-high-blue-cumulus)",
  "var(--background-action-high-brown-caramel)",
  "var(--background-action-high-green-archipel)",
  "var(--background-action-high-pink-tuile)",
];

const TOOLTIP_STYLE = {
  background: "var(--background-default-grey)",
  border: "1px solid var(--border-default-grey)",
};

const PIE_RADIUS = {
  md: { outer: 68, inner: 28 },
  lg: { outer: 96, inner: 40 },
} as const;

export type CraTtcPieSlice = {
  label: string;
  value: number;
};

export type CraTtcPieProps = {
  slices: CraTtcPieSlice[];
  title?: string;
  size?: "md" | "lg";
};

function emptyMessageForTitle(title: string): string {
  const suffix = title.replace(/^TTC par /i, "").trim();
  return suffix ? `Aucun TTC CRA à répartir par ${suffix}.` : "Aucun TTC CRA à répartir.";
}

/**
 * Camembert compact — % TTC CRA (chunk recharts via React.lazy).
 */
export default function CraTtcPie({
  slices,
  title = "TTC par produit",
  size = "md",
}: CraTtcPieProps) {
  const titleId = useId();
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0 || slices.length === 0) {
    return (
      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{emptyMessageForTitle(title)}</p>
    );
  }

  const chartData = slices.map((s) => ({
    name: s.label,
    value: s.value,
    pct: Math.round((s.value / total) * 100),
  }));

  const ariaLabel = chartData
    .map((d) => `${d.name} : ${d.pct} % (${formatMontantEur(d.value)})`)
    .join(" · ");

  const radius = PIE_RADIUS[size];

  return (
    <div
      className={size === "lg" ? "cra-ttc-pie cra-ttc-pie--lg" : "cra-ttc-pie"}
      role="img"
      aria-labelledby={titleId}
      aria-label={`Répartition ${title} — ${ariaLabel}`}
    >
      <p className="fr-text--sm fr-text--bold fr-mb-0" id={titleId}>
        {title}
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="42%"
            cy="50%"
            outerRadius={radius.outer}
            innerRadius={radius.inner}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name, item) => {
              const pct = typeof item?.payload?.pct === "number" ? item.payload.pct : undefined;
              const label =
                pct != null ? `${formatMontantEur(value)} (${pct} %)` : formatMontantEur(value);
              return [label, "TTC CRA"];
            }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            formatter={(value) => {
              const row = chartData.find((d) => d.name === value);
              return row ? `${value} (${row.pct} %)` : value;
            }}
            wrapperStyle={{ fontSize: "0.8125rem", color: "var(--text-mention-grey)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
