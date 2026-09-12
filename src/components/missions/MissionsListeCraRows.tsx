import {
  ExpandableChildCell,
  ExpandableChildRow,
} from "../expandable";
import type { SuiviMensuel } from "../../types.ts";
import { formatGristPeriodeMoisAnnee } from "../../utils/gristPeriode.ts";
import { formatMontantEur } from "../../utils/formatMontant.ts";
import { montantTtcSuiviMensuel } from "../../utils/suiviMensuel.ts";

export type MissionsListeCraRowsLayout = "liste" | "fiche";

/**
 * Sous-lignes CRA sous une prestation.
 * - `liste` : colonnes liste missions (libellé, —, —, —, jours, TTC, actions).
 * - `fiche` : colonnes fiche Équipe (période colspan 4, jours, —, TTC, —).
 */
export function MissionsListeCraRows({
  rows,
  firstRowId,
  indentLevel,
  layout = "liste",
}: {
  rows: SuiviMensuel[];
  firstRowId: string;
  indentLevel: 1 | 2;
  layout?: MissionsListeCraRowsLayout;
}) {
  return (
    <>
      {rows.map((s, craIdx) => {
        const taches = s.Taches_realisees?.trim();
        const periodeEtTaches = (
          <>
            <p className="fr-mb-0 fr-text--sm">
              {formatGristPeriodeMoisAnnee(s.Periode, s)}
            </p>
            {taches ? (
              <p className="fr-text--xs fr-hint-text fr-mb-0">{taches}</p>
            ) : null}
          </>
        );
        const joursCell = (
          <ExpandableChildCell className="fr-cell--right">
            {s.Nb_jours != null
              ? s.Nb_jours.toLocaleString("fr-FR", {
                  maximumFractionDigits: 4,
                })
              : "—"}
          </ExpandableChildCell>
        );
        const ttcCell = (
          <ExpandableChildCell className="fr-cell--right">
            {formatMontantEur(montantTtcSuiviMensuel(s))}
          </ExpandableChildCell>
        );

        if (layout === "fiche") {
          return (
            <ExpandableChildRow
              key={s.id}
              id={craIdx === 0 ? firstRowId : undefined}
              className="pilotage-expandable-leaf-row"
            >
              <ExpandableChildCell
                colSpan={4}
                indent
                className="pilotage-col-mission-libelle"
              >
                {periodeEtTaches}
              </ExpandableChildCell>
              {joursCell}
              <ExpandableChildCell>—</ExpandableChildCell>
              {ttcCell}
              <ExpandableChildCell>—</ExpandableChildCell>
            </ExpandableChildRow>
          );
        }

        return (
          <ExpandableChildRow
            key={s.id}
            id={craIdx === 0 ? firstRowId : undefined}
            className="pilotage-expandable-leaf-row"
          >
            <ExpandableChildCell
              indent={indentLevel === 1}
              className={
                indentLevel === 2
                  ? "pilotage-expandable-child-cell--indent-l2"
                  : undefined
              }
            >
              {periodeEtTaches}
            </ExpandableChildCell>
            <ExpandableChildCell>—</ExpandableChildCell>
            <ExpandableChildCell>—</ExpandableChildCell>
            <ExpandableChildCell>—</ExpandableChildCell>
            {joursCell}
            {ttcCell}
            <td className="pilotage-col-actions pilotage-expandable-child-cell" />
          </ExpandableChildRow>
        );
      })}
    </>
  );
}
