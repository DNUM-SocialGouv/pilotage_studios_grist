import {
  ExpandableChildCell,
  ExpandableChildRow,
} from "../expandable";
import type { SuiviMensuel } from "../../types.ts";
import { formatGristPeriodeMoisAnnee } from "../../utils/gristPeriode.ts";
import { formatMontantEur } from "../../utils/formatMontant.ts";
import { montantTtcSuiviMensuel } from "../../utils/suiviMensuel.ts";

export function MissionsListeCraRows({
  rows,
  firstRowId,
  indentLevel,
}: {
  rows: SuiviMensuel[];
  firstRowId: string;
  indentLevel: 1 | 2;
}) {
  return (
    <>
      {rows.map((s, craIdx) => (
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
            <p className="fr-mb-0 fr-text--sm">
              {formatGristPeriodeMoisAnnee(s.Periode, s)}
            </p>
            {s.Taches_realisees?.trim() ? (
              <p className="fr-text--xs fr-hint-text fr-mb-0">
                {s.Taches_realisees.trim()}
              </p>
            ) : null}
          </ExpandableChildCell>
          <ExpandableChildCell>—</ExpandableChildCell>
          <ExpandableChildCell>—</ExpandableChildCell>
          <ExpandableChildCell>—</ExpandableChildCell>
          <ExpandableChildCell className="fr-cell--right">
            {s.Nb_jours != null
              ? s.Nb_jours.toLocaleString("fr-FR", {
                  maximumFractionDigits: 4,
                })
              : "—"}
          </ExpandableChildCell>
          <ExpandableChildCell className="fr-cell--right">
            {formatMontantEur(montantTtcSuiviMensuel(s))}
          </ExpandableChildCell>
          <td className="pilotage-col-actions pilotage-expandable-child-cell" />
        </ExpandableChildRow>
      ))}
    </>
  );
}
