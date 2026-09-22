import { useId } from "react";
import { formatMontantEur } from "../utils/formatMontant";
import { equipeTagBackgroundVar } from "../utils/equipeTagColors";
import { tdEquipeTag } from "./EquipeTags";

export type CraTtcStackBarSlice = {
  label: string;
  value: number;
};

export type CraTtcStackBarProps = {
  slices: CraTtcStackBarSlice[];
  /** Omit ou chaîne vide : pas de titre au-dessus de la barre. */
  title?: string;
  /**
   * Texte après le total (ex. `283,55 jours` → `269 213,85 € · 283,55 jours`,
   * ou `269 213,85 € TTC · …` si `showTtcOnAmount`).
   * Omit pour le total seul (comportement BDC).
   */
  amountsExtra?: string;
  /** Suffixe « TTC » après le montant € (fiche mission / produit). */
  showTtcOnAmount?: boolean;
};

function emptyMessageForTitle(title: string | undefined): string {
  if (!title?.trim()) {
    return "Aucun TTC CRA à répartir.";
  }
  const suffix = title.replace(/^TTC par /i, "").trim();
  return suffix ? `Aucun TTC CRA à répartir par ${suffix}.` : "Aucun TTC CRA à répartir.";
}

/**
 * Barre horizontale empilée — même langage visuel que PA / BDC (`widget-usage-bar`).
 * Légende = tags DSFR (comme colonne Équipe des prestations) + %.
 */
export function CraTtcStackBar({
  slices,
  title,
  amountsExtra,
  showTtcOnAmount = false,
}: CraTtcStackBarProps) {
  const titleId = useId();
  const titleTrimmed = title?.trim() ?? "";
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0 || slices.length === 0) {
    return (
      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
        {emptyMessageForTitle(titleTrimmed || undefined)}
      </p>
    );
  }

  const segments = slices.map((s) => {
    const width = (s.value / total) * 100;
    const pct = Math.round(width);
    return {
      label: s.label,
      value: s.value,
      width,
      pct,
      bg: equipeTagBackgroundVar(s.label),
    };
  });

  const pctLabelPlain = segments.map((s) => `${s.label} ${s.pct} %`).join(" · ");
  const amountCore = showTtcOnAmount
    ? `${formatMontantEur(total)} TTC`
    : formatMontantEur(total);
  const amountsExtraTrimmed = amountsExtra?.trim();
  const amounts = amountsExtraTrimmed
    ? `${amountCore} · ${amountsExtraTrimmed}`
    : amountCore;
  const ariaLabel = segments
    .map((s) => `${s.label} : ${s.pct} % (${formatMontantEur(s.value)})`)
    .join(" · ");
  const repartitionLabel = titleTrimmed || "TTC";

  return (
    <div className="cra-ttc-stack-bar">
      {titleTrimmed ? (
        <p id={titleId} className="fr-text--sm fr-mb-1w">
          <strong>{titleTrimmed}</strong>
        </p>
      ) : null}
      <div
        className="widget-usage-bar"
        role="img"
        aria-labelledby={titleTrimmed ? titleId : undefined}
        aria-label={`Répartition ${repartitionLabel} — ${ariaLabel} — ${amounts}`}
        title={`${pctLabelPlain} — ${amounts}`}
      >
        <div className="widget-usage-bar__header">
          <div className="widget-usage-bar__label cra-ttc-stack-bar__legend">
            {segments.map((s) => (
              <span key={s.label} className="cra-ttc-stack-bar__legend-item">
                {tdEquipeTag(s.label, { small: true })}
                <span className="cra-ttc-stack-bar__legend-pct">{s.pct} %</span>
              </span>
            ))}
          </div>
          <p className="widget-usage-bar__amounts">{amounts}</p>
        </div>
        <div className="widget-usage-bar__track">
          {segments.map((s) =>
            s.width > 0 ? (
              <span
                key={s.label}
                className="widget-usage-bar__seg"
                style={{ width: `${s.width}%`, background: s.bg }}
                title={`${s.label} : ${s.pct} % — ${formatMontantEur(s.value)}`}
              />
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
