import { Fragment, useMemo, type ReactNode } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types";
import { formatMontantEur } from "../utils/formatMontant";
import {
  groupSuiviByMissionHierarchy,
  type SuiviEnfantBranch,
  type SuiviMasterGroup,
  type SuiviMissionEnfantGroupKey,
  type SuiviMissionMasterGroupKey,
} from "../utils/groupSuiviByMissionEnfant";
import { extractGristReferenceId } from "../utils/gristReferences";
import { formatGristPeriodeMoisAnnee } from "../utils/gristPeriode";
import { labelIntervenantSuivi, labelProduitSuivi } from "../utils/suiviLabels";
import { montantTtcSuiviMensuel } from "../utils/suiviMensuel";
import {
  ExpandToggle,
  ExpandableChildCell,
  ExpandableChildRow,
  useExpandableRowIds,
} from "./expandable";
import { TableShell } from "./FinanceRecap";

function libellePeriode(s: SuiviMensuel): string {
  return formatGristPeriodeMoisAnnee(s.Periode, s);
}

function consensusString(values: Array<string | undefined | null>): string | undefined {
  const cleaned = values.map((v) => v?.trim()).filter((v): v is string => Boolean(v) && v !== "—");
  if (cleaned.length === 0) {
    return undefined;
  }
  const first = cleaned[0]!;
  return cleaned.every((v) => v === first) ? first : undefined;
}

function consensusProduit(
  rows: SuiviMensuel[],
  produitsById: Map<number, string>,
): string | undefined {
  if (rows.length === 0) {
    return undefined;
  }
  return consensusString(rows.map((s) => labelProduitSuivi(s, produitsById)));
}

function masterExpandId(key: SuiviMissionMasterGroupKey): string {
  return `bdc-expand-master-${String(key)}`;
}

function enfantExpandId(key: SuiviMissionEnfantGroupKey): string {
  return `bdc-expand-enfant-${String(key)}`;
}

export type BdcDepensesByPrestationTableProps = {
  suivi: SuiviMensuel[];
  missionEnfants: MissionEnfant[];
  missions?: Mission[];
  intervenantsById: Map<number, string>;
  produitsById: Map<number, string>;
  caption?: string;
  className?: string;
};

/**
 * Tableau dépenses BDC : Mission master → Mission enfant → CRA.
 * Exception documentée à la pagination 10 lignes (ISO app sœur, hiérarchie expansible).
 */
export function BdcDepensesByPrestationTable({
  suivi,
  missionEnfants,
  missions = [],
  intervenantsById,
  produitsById,
  caption = "Dépenses — Mission → prestation → CRA",
  className,
}: BdcDepensesByPrestationTableProps) {
  const masterById = useMemo(() => new Map(missions.map((m) => [m.id, m])), [missions]);

  const groups = useMemo(
    () =>
      groupSuiviByMissionHierarchy(suivi, missionEnfants, {
        masterById,
        intervenantLabelById: intervenantsById,
      }),
    [suivi, missionEnfants, masterById, intervenantsById],
  );

  const expandResetKey = useMemo(
    () => groups.map((g) => `${String(g.key)}:${g.enfants.length}:${g.totaux.count}`).join("|"),
    [groups],
  );

  const { isExpanded: isMasterExpanded, toggle: toggleMaster } =
    useExpandableRowIds<SuiviMissionMasterGroupKey>(undefined, expandResetKey);

  const { isExpanded: isEnfantExpanded, toggle: toggleEnfant } = useExpandableRowIds<string>(
    undefined,
    expandResetKey,
  );

  if (groups.length === 0) {
    return <p className="fr-text--sm fr-mb-0">Aucune dépense pour ce BDC.</p>;
  }

  return (
    <TableShell className={className}>
      <table>
        <caption className="fr-h6">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Mission / prestation / période</th>
            <th scope="col">Équipe</th>
            <th scope="col">Intervenant</th>
            <th scope="col" className="fr-cell--right">
              Jours
            </th>
            <th scope="col" className="fr-cell--right">
              Montant TTC
            </th>
            <th scope="col">Produit</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((master) => (
            <MasterGroupRows
              key={String(master.key)}
              master={master}
              masterExpanded={isMasterExpanded(master.key)}
              onToggleMaster={() => toggleMaster(master.key)}
              isEnfantExpanded={(k) => isEnfantExpanded(String(k))}
              onToggleEnfant={(k) => toggleEnfant(String(k))}
              intervenantsById={intervenantsById}
              produitsById={produitsById}
            />
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

function MasterGroupRows({
  master,
  masterExpanded,
  onToggleMaster,
  isEnfantExpanded,
  onToggleEnfant,
  intervenantsById,
  produitsById,
}: {
  master: SuiviMasterGroup;
  masterExpanded: boolean;
  onToggleMaster: () => void;
  isEnfantExpanded: (key: SuiviMissionEnfantGroupKey) => boolean;
  onToggleEnfant: (key: SuiviMissionEnfantGroupKey) => void;
  intervenantsById: Map<number, string>;
  produitsById: Map<number, string>;
}) {
  const controlsId = masterExpandId(master.key);
  const allRows = master.enfants.flatMap((e) => e.rows);
  const masterEquipe = consensusString(allRows.map((s) => s.Equipe));
  const masterProduit = consensusProduit(allRows, produitsById);
  const prestationCount = master.enfants.length;

  return (
    <Fragment>
      <tr
        className={cx(
          "pilotage-expandable-parent-row",
          masterExpanded && "pilotage-expandable-parent-row--open",
        )}
      >
        <th scope="row">
          <div className="pilotage-expandable-parent-label">
            <ExpandToggle
              expanded={masterExpanded}
              childCount={prestationCount}
              controlsId={controlsId}
              onClick={onToggleMaster}
              titleExpand={`Afficher les ${prestationCount} prestations`}
              titleCollapse="Masquer les prestations"
            />
            <span className="pilotage-expandable-parent-label__title">{master.libelle}</span>
          </div>
        </th>
        <td>{masterEquipe ?? "—"}</td>
        <td>—</td>
        <td className="fr-cell--right">{master.totaux.jours.toLocaleString("fr-FR")}</td>
        <td className="fr-cell--right">{formatMontantEur(master.totaux.ttc)}</td>
        <td>{masterProduit ?? "—"}</td>
      </tr>
      {masterExpanded
        ? master.enfants.map((branch, idx) => (
            <EnfantBranchRows
              key={String(branch.key)}
              branch={branch}
              controlsId={idx === 0 ? controlsId : undefined}
              expanded={isEnfantExpanded(branch.key)}
              onToggle={() => onToggleEnfant(branch.key)}
              parentEquipe={masterEquipe}
              parentProduit={masterProduit}
              intervenantsById={intervenantsById}
              produitsById={produitsById}
            />
          ))
        : null}
    </Fragment>
  );
}

function EnfantBranchRows({
  branch,
  controlsId,
  expanded,
  onToggle,
  parentEquipe,
  parentProduit,
  intervenantsById,
  produitsById,
}: {
  branch: SuiviEnfantBranch;
  controlsId?: string;
  expanded: boolean;
  onToggle: () => void;
  parentEquipe?: string;
  parentProduit?: string;
  intervenantsById: Map<number, string>;
  produitsById: Map<number, string>;
}) {
  const enfantControlsId = enfantExpandId(branch.key);
  const enfantIv =
    branch.enfant != null ? extractGristReferenceId(branch.enfant.Intervenant) : undefined;
  const branchIntervenant =
    (enfantIv != null ? intervenantsById.get(enfantIv) : undefined) ??
    consensusString(branch.rows.map((s) => labelIntervenantSuivi(s, intervenantsById)));
  const branchEquipe =
    consensusString(branch.rows.map((s) => s.Equipe)) ??
    branch.enfant?.Specialite?.toString().trim() ??
    undefined;
  const branchProduit = consensusProduit(branch.rows, produitsById);

  const equipeVsMaster =
    parentEquipe && branchEquipe === parentEquipe ? "—" : (branchEquipe ?? "—");
  const produitVsMaster: ReactNode =
    parentProduit && branchProduit && branchProduit === parentProduit
      ? "—"
      : (branchProduit ?? "—");

  return (
    <Fragment>
      <ExpandableChildRow
        id={controlsId}
        className={cx(
          "pilotage-expandable-mid-row",
          expanded && "pilotage-expandable-parent-row--open",
        )}
      >
        <ExpandableChildCell indent className="pilotage-expandable-mid-cell">
          <div className="pilotage-expandable-parent-label">
            <ExpandToggle
              expanded={expanded}
              childCount={branch.totaux.count}
              controlsId={enfantControlsId}
              onClick={onToggle}
              titleExpand={`Afficher les ${branch.totaux.count} CRA`}
              titleCollapse="Masquer les CRA"
            />
            <span className="pilotage-expandable-parent-label__title">{branch.libelle}</span>
          </div>
        </ExpandableChildCell>
        <ExpandableChildCell>{equipeVsMaster}</ExpandableChildCell>
        <ExpandableChildCell>{branchIntervenant ?? "—"}</ExpandableChildCell>
        <ExpandableChildCell className="fr-cell--right">
          {branch.totaux.jours.toLocaleString("fr-FR")}
        </ExpandableChildCell>
        <ExpandableChildCell className="fr-cell--right">
          {formatMontantEur(branch.totaux.ttc)}
        </ExpandableChildCell>
        <ExpandableChildCell>{produitVsMaster}</ExpandableChildCell>
      </ExpandableChildRow>
      {expanded
        ? branch.rows.map((s, idx) => {
            const prodLabel = labelProduitSuivi(s, produitsById);
            const equipe = s.Equipe?.trim() || undefined;
            const intervenant = labelIntervenantSuivi(s, intervenantsById);
            const effectiveEquipeParent = branchEquipe ?? parentEquipe;
            const effectiveProduitParent = branchProduit ?? parentProduit;

            const equipeCell =
              effectiveEquipeParent && equipe === effectiveEquipeParent ? "—" : equipe || "—";
            const intervenantCell =
              branchIntervenant && intervenant === branchIntervenant ? "—" : intervenant;
            const craProduit =
              effectiveProduitParent != null && prodLabel === effectiveProduitParent
                ? "—"
                : prodLabel;

            return (
              <ExpandableChildRow
                key={s.id}
                id={idx === 0 ? enfantControlsId : undefined}
                className="pilotage-expandable-leaf-row"
              >
                <ExpandableChildCell className="pilotage-expandable-child-cell--indent-l2">
                  {libellePeriode(s)}
                </ExpandableChildCell>
                <ExpandableChildCell>{equipeCell}</ExpandableChildCell>
                <ExpandableChildCell>{intervenantCell}</ExpandableChildCell>
                <ExpandableChildCell className="fr-cell--right">
                  {s.Nb_jours != null ? s.Nb_jours.toLocaleString("fr-FR") : "—"}
                </ExpandableChildCell>
                <ExpandableChildCell className="fr-cell--right">
                  {formatMontantEur(montantTtcSuiviMensuel(s))}
                </ExpandableChildCell>
                <ExpandableChildCell>{craProduit}</ExpandableChildCell>
              </ExpandableChildRow>
            );
          })
        : null}
    </Fragment>
  );
}
