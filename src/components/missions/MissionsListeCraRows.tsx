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
 * - `fiche` : colonnes fiche Équipe & prestations
 *   (période colspan 4 = titre+statut+intervenant+équipe, [date], jours, —, TTC, [actions]).
 */
export function MissionsListeCraRows({
  rows,
  firstRowId,
  indentLevel,
  layout = "liste",
  showDateColumn = false,
  showActions = true,
  onEditCra,
  onDuplicateCra,
}: {
  rows: SuiviMensuel[];
  firstRowId: string;
  indentLevel: 1 | 2;
  layout?: MissionsListeCraRowsLayout;
  /** Colonne « Date de début » (mode planifié fiche mission). */
  showDateColumn?: boolean;
  /** Colonne actions (édition prestation et/ou CRA). */
  showActions?: boolean;
  /** Admin : ouvrir le drawer Modifier. */
  onEditCra?: (suivi: SuiviMensuel) => void;
  /** Admin : ouvrir le drawer Dupliquer. */
  onDuplicateCra?: (suivi: SuiviMensuel) => void;
}) {
  const canEditCra = Boolean(onEditCra || onDuplicateCra);

  return (
    <>
      {rows.map((s, craIdx) => {
        const taches = s.Taches_realisees?.trim();
        const periodeLabel = formatGristPeriodeMoisAnnee(s.Periode, s);
        const periodeEtTaches = (
          <>
            <p className="fr-mb-0 fr-text--sm">{periodeLabel}</p>
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

        const craActions =
          canEditCra ? (
            <td className="pilotage-col-actions pilotage-expandable-child-cell">
              <div className="fr-btns-group fr-btns-group--sm fr-btns-group--inline-reverse fr-btns-group--inline-sm fr-mb-0">
                {onEditCra ? (
                  <button
                    type="button"
                    className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
                    title={`Modifier le CRA ${periodeLabel}`}
                    onClick={() => onEditCra(s)}
                  >
                    Modifier
                  </button>
                ) : null}
                {onDuplicateCra ? (
                  <button
                    type="button"
                    className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-file-add-line fr-btn--icon-left"
                    title={`Dupliquer le CRA ${periodeLabel}`}
                    onClick={() => onDuplicateCra(s)}
                  >
                    Dupliquer
                  </button>
                ) : null}
              </div>
            </td>
          ) : showActions ? (
            <td className="pilotage-col-actions pilotage-expandable-child-cell" />
          ) : null;

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
              {showDateColumn ? <ExpandableChildCell>—</ExpandableChildCell> : null}
              {joursCell}
              <ExpandableChildCell>—</ExpandableChildCell>
              {ttcCell}
              {craActions}
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
