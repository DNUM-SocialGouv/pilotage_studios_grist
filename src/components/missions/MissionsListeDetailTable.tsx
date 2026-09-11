import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { StatutBadge } from "../StatutBadge";
import { tdEquipeTag } from "../EquipeTags";
import {
  ExpandToggle,
  ExpandableChildCell,
  ExpandableChildRow,
} from "../expandable";
import { TableShell } from "../FinanceRecap";
import { MissionsListeCraRows } from "./MissionsListeCraRows";
import type { MissionsListeHierarchieProps } from "./missionsListeTypes";
import type { Mission, MissionEnfant, SuiviMensuel } from "../../types.ts";
import { extractGristReferenceId } from "../../utils/gristReferences.ts";
import { formatGristMonthYear } from "../../utils/formatGristDate.ts";
import { enfantLibelleOptionnel } from "../../utils/missionEnfants.ts";
import type { CraTotaux } from "../../utils/suiviMensuel.ts";
import {
  craRowsSorted,
  equipeLabelForEnfant,
  formatCraJours,
  formatCraMontant,
  missionListeLibelle,
  produitLibelle,
  samePersonLabel,
  totauxCraDuLot,
  type CraCellState,
} from "../../utils/missionsListeTotaux.ts";

function produitCell(m: Mission, produitsById: Map<number, string>): ReactNode {
  const ref = extractGristReferenceId(m.Produit_SDPC);
  if (ref === undefined) {
    return "—";
  }
  return (
    <Link className="fr-link" to={`/produits/${ref}`}>
      {produitLibelle(m, produitsById)}
    </Link>
  );
}

function EnfantRowsDetail({
  enfants,
  masterExpandControlsId,
  intervenantsById,
  equipesByIntervenantId,
  craByEnfantId,
  suiviByEnfantId,
  craState,
  isEnfantExpanded,
  toggleEnfant,
}: {
  enfants: MissionEnfant[];
  masterExpandControlsId: string;
  intervenantsById: Map<number, string>;
  equipesByIntervenantId: Map<number, string>;
  craByEnfantId: Map<number, CraTotaux> | undefined;
  suiviByEnfantId: Map<number, SuiviMensuel[]>;
  craState: CraCellState;
  isEnfantExpanded: (key: string) => boolean;
  toggleEnfant: (key: string) => void;
}) {
  return (
    <>
      {enfants.map((e, idx) => {
        const craKey = `cra-${e.id}`;
        const craRows = craRowsSorted(suiviByEnfantId.get(e.id) ?? []);
        const hasCra = craRows.length > 0;
        const craOpen = hasCra && isEnfantExpanded(craKey);
        const enfantControlsId = `mission-enfant-expand-${e.id}`;
        const iid = extractGristReferenceId(e.Intervenant);
        const ivLabel =
          iid != null && iid !== 0
            ? (intervenantsById.get(iid) ?? `#${iid}`)
            : undefined;
        const equipe = equipeLabelForEnfant(e, equipesByIntervenantId);
        const libelle = enfantLibelleOptionnel(e);
        const primary = libelle || "—";
        const showIntervenant = Boolean(
          ivLabel && !samePersonLabel(ivLabel, primary),
        );
        return (
          <Fragment key={`enfant-${e.id}`}>
            <ExpandableChildRow
              id={idx === 0 ? masterExpandControlsId : undefined}
              className={
                craOpen
                  ? "pilotage-expandable-mid-row pilotage-expandable-parent-row--open"
                  : "pilotage-expandable-mid-row"
              }
            >
              <ExpandableChildCell
                className="pilotage-col-mission-libelle"
                indent
              >
                <div className="pilotage-expandable-parent-label">
                  {hasCra ? (
                    <ExpandToggle
                      expanded={craOpen}
                      childCount={craRows.length}
                      controlsId={enfantControlsId}
                      showCount={false}
                      titleExpand={`Afficher les CRA de ${primary}`}
                      titleCollapse={`Masquer les CRA de ${primary}`}
                      onClick={() => toggleEnfant(craKey)}
                    />
                  ) : null}
                  <div>
                    <div className="pilotage-expandable-parent-label__copy">
                      <span className="fr-text--bold pilotage-expandable-child-libelle">
                        {primary}
                      </span>
                      {hasCra ? (
                        <p
                          className="fr-badge fr-badge--sm fr-mb-0"
                          aria-hidden="true"
                        >
                          {craRows.length}
                        </p>
                      ) : null}
                    </div>
                    {equipe || showIntervenant ? (
                      <div className="missions-liste-prestation-meta">
                        {equipe ? tdEquipeTag(equipe, { small: true }) : null}
                        {showIntervenant ? (
                          <span className="fr-text--xs fr-hint-text">{ivLabel}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </ExpandableChildCell>
              <ExpandableChildCell>—</ExpandableChildCell>
              <ExpandableChildCell>
                <StatutBadge statut={e.Statut} />
              </ExpandableChildCell>
              <ExpandableChildCell>—</ExpandableChildCell>
              <ExpandableChildCell className="fr-cell--right">
                {formatCraJours(craByEnfantId?.get(e.id), craState)}
              </ExpandableChildCell>
              <ExpandableChildCell className="fr-cell--right">
                {formatCraMontant(craByEnfantId?.get(e.id), craState)}
              </ExpandableChildCell>
              <td className="pilotage-col-actions pilotage-expandable-child-cell" />
            </ExpandableChildRow>
            {craOpen ? (
              <MissionsListeCraRows
                rows={craRows}
                firstRowId={enfantControlsId}
                indentLevel={2}
              />
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}

export function MissionsListeDetailTable({
  missions,
  enfantsByMasterId,
  intervenantsById,
  equipesByIntervenantId,
  produitsById,
  craByEnfantId,
  suiviByEnfantId,
  craState,
  isMasterExpanded,
  toggleMaster,
  isEnfantExpanded,
  toggleEnfant,
}: MissionsListeHierarchieProps) {
  return (
    <TableShell multiline className="fr-mb-4w">
      <table>
        <caption className="fr-sr-only">
          Liste des missions — lots, prestations et CRA
        </caption>
        <thead>
          <tr>
            <th scope="col" className="pilotage-col-mission-libelle">
              Mission (lot)
            </th>
            <th scope="col">Produit</th>
            <th scope="col">Statut</th>
            <th scope="col">Début</th>
            <th scope="col" className="fr-cell--right">
              Jours
            </th>
            <th scope="col" className="fr-cell--right">
              Montant TTC
            </th>
            <th scope="col" className="pilotage-col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => {
            const enfants = enfantsByMasterId.get(m.id) ?? [];
            const expanded = isMasterExpanded(m.id);
            const expandControlsId = `mission-expand-${m.id}`;
            const totaux = totauxCraDuLot(enfants, craByEnfantId);
            return (
              <Fragment key={m.id}>
                <tr
                  className={
                    expanded
                      ? "pilotage-expandable-parent-row pilotage-expandable-parent-row--open"
                      : enfants.length > 0
                        ? "pilotage-expandable-parent-row"
                        : undefined
                  }
                >
                  <th scope="row" className="pilotage-col-mission-libelle">
                    <div className="pilotage-expandable-parent-label">
                      {enfants.length > 0 ? (
                        <ExpandToggle
                          expanded={expanded}
                          childCount={enfants.length}
                          controlsId={expandControlsId}
                          showCount={false}
                          titleExpand={`Afficher les prestations de ${missionListeLibelle(m)}`}
                          titleCollapse={`Masquer les prestations de ${missionListeLibelle(m)}`}
                          onClick={() => toggleMaster(m.id)}
                        />
                      ) : null}
                      <div className="pilotage-expandable-parent-label__copy">
                        <Link
                          className="fr-link fr-text--sm"
                          to={`/missions/${m.id}`}
                          title={missionListeLibelle(m)}
                        >
                          {missionListeLibelle(m)}
                        </Link>
                        {enfants.length > 0 ? (
                          <p
                            className="fr-badge fr-badge--sm fr-mb-0"
                            aria-hidden="true"
                          >
                            {enfants.length}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </th>
                  <td>{produitCell(m, produitsById)}</td>
                  <td>
                    <StatutBadge statut={m.Statut} />
                  </td>
                  <td>{formatGristMonthYear(m.Date_de_debut)}</td>
                  <td className="fr-cell--right">
                    {formatCraJours(totaux, craState)}
                  </td>
                  <td className="fr-cell--right">
                    {formatCraMontant(totaux, craState)}
                  </td>
                  <td className="pilotage-col-actions">
                    <Link
                      className="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-arrow-right-line"
                      to={`/missions/${m.id}`}
                      title="Ouvrir la fiche de cette mission"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
                {expanded ? (
                  <EnfantRowsDetail
                    enfants={enfants}
                    masterExpandControlsId={expandControlsId}
                    intervenantsById={intervenantsById}
                    equipesByIntervenantId={equipesByIntervenantId}
                    craByEnfantId={craByEnfantId}
                    suiviByEnfantId={suiviByEnfantId}
                    craState={craState}
                    isEnfantExpanded={isEnfantExpanded}
                    toggleEnfant={toggleEnfant}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </TableShell>
  );
}
