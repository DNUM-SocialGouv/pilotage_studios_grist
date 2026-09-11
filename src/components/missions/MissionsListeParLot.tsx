import { Fragment } from "react";
import { Link } from "react-router-dom";
import { StatutBadge } from "../StatutBadge";
import { tdEquipeTag } from "../EquipeTags";
import { DsfrDropdownMenu } from "../dsfr/DsfrDropdownMenu";
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
import { enfantLibelleOptionnel } from "../../utils/missionEnfants.ts";
import { equipeTagBackgroundVar, equipeTagTextVar } from "../../utils/equipeTagColors.ts";
import type { CraTotaux } from "../../utils/suiviMensuel.ts";
import {
  craRowsSorted,
  equipeLabelForEnfant,
  formatCraJours,
  formatCraMontant,
  missionListeLibelle,
  produitLibelle,
  totauxCraDuLot,
  type CraCellState,
} from "../../utils/missionsListeTotaux.ts";

function produitLien(m: Mission, produitsById: Map<number, string>) {
  const ref = extractGristReferenceId(m.Produit_SDPC);
  const label = produitLibelle(m, produitsById);
  if (ref === undefined) {
    return <span className="fr-text--sm">{label}</span>;
  }
  return (
    <Link className="fr-link" to={`/produits/${ref}`}>
      {label}
    </Link>
  );
}

type TeamShare = {
  equipe: string;
  count: number;
  pct: number;
};

function teamSharesForLot(
  enfants: MissionEnfant[],
  equipesByIntervenantId: Map<number, string>,
): TeamShare[] {
  const map = new Map<string, number>();
  for (const e of enfants) {
    const eq = equipeLabelForEnfant(e, equipesByIntervenantId) ?? "—";
    map.set(eq, (map.get(eq) ?? 0) + 1);
  }
  const total = enfants.length;
  return Array.from(map.entries()).map(([equipe, count]) => ({
    equipe,
    count,
    pct: total > 0 ? (count / total) * 100 : 0,
  }));
}

export function MissionsListeParLot({
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
    <div className="missions-lot-list fr-mb-4w">
      {missions.map((m) => {
        const enfants = enfantsByMasterId.get(m.id) ?? [];
        const hasPrestations = enfants.length > 0;
        const expanded = hasPrestations && isMasterExpanded(m.id);
        const expandControlsId = `mission-lot-expand-${m.id}`;
        const totaux = totauxCraDuLot(enfants, craByEnfantId);
        const shares = teamSharesForLot(enfants, equipesByIntervenantId);
        const name = missionListeLibelle(m);
        const ficheTo = `/missions/${m.id}`;
        return (
          <article key={m.id} className="missions-lot-card">
            <div className="missions-lot-bandeau">
              <div className="missions-lot-bandeau__main">
                {hasPrestations ? (
                  <ExpandToggle
                    className="missions-lot-bandeau__toggle"
                    expanded={expanded}
                    childCount={enfants.length}
                    controlsId={expandControlsId}
                    showCount={false}
                    titleExpand={`Afficher les prestations de ${name}`}
                    titleCollapse={`Masquer les prestations de ${name}`}
                    onClick={() => toggleMaster(m.id)}
                  />
                ) : (
                  <span className="missions-lot-bandeau__chevron-slot" aria-hidden="true" />
                )}
                <span className="missions-lot-bandeau__title" title={name}>
                  {name}
                </span>
                <div className="missions-lot-bandeau__meta">
                  <StatutBadge statut={m.Statut} />
                  <p className="fr-mb-0 missions-lot-bandeau__produit">
                    {produitLien(m, produitsById)}
                  </p>
                </div>
              </div>
              <div className="missions-lot-bandeau__kpi">
                <div className="missions-lot-kpi-grid">
                  <div>
                    <p className="fr-text--xs fr-hint-text fr-mb-0">Jours</p>
                    <p className="fr-mb-0 fr-text--bold">
                      {formatCraJours(totaux, craState)}
                    </p>
                  </div>
                  <div>
                    <p className="fr-text--xs fr-hint-text fr-mb-0">Montant</p>
                    <p className="fr-mb-0 fr-text--bold">
                      {formatCraMontant(totaux, craState)}
                    </p>
                  </div>
                </div>
                {hasPrestations ? (
                  <>
                    <div
                      className="missions-lot-timeline"
                      role="img"
                      aria-label="Répartition des prestations par équipe"
                    >
                      {shares.map((share) => (
                        <span
                          key={share.equipe}
                          className="missions-lot-timeline__seg"
                          style={{
                            width: `${share.pct}%`,
                            backgroundColor:
                              share.equipe === "—"
                                ? "var(--background-contrast-grey)"
                                : equipeTagBackgroundVar(share.equipe),
                          }}
                          title={`${share.equipe} : ${share.count}`}
                        />
                      ))}
                    </div>
                    <ul className="missions-lot-teams fr-mb-0">
                      {shares.map((share) => (
                        <li key={share.equipe}>
                          {share.equipe === "—" ? (
                            <span className="fr-text--sm">Sans équipe</span>
                          ) : (
                            tdEquipeTag(share.equipe)
                          )}
                          <span
                            className="fr-badge fr-badge--sm fr-badge--no-icon"
                            style={{
                              backgroundColor:
                                share.equipe === "—"
                                  ? "var(--background-contrast-grey)"
                                  : equipeTagBackgroundVar(share.equipe),
                              color:
                                share.equipe === "—"
                                  ? "var(--text-default-grey)"
                                  : equipeTagTextVar(share.equipe),
                            }}
                          >
                            {share.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="fr-text--sm fr-hint-text fr-mb-0">
                    Aucune prestation
                  </p>
                )}
              </div>
            </div>
            {hasPrestations && expanded ? (
              <div id={expandControlsId} className="missions-lot-card__prestations">
                <TableShell className="fr-mb-0 fr-mt-0">
                  <table>
                    <caption className="fr-sr-only">
                      Prestations du lot {name}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Prestation</th>
                        <th scope="col">Équipe</th>
                        <th scope="col">Intervenant</th>
                        <th scope="col">Statut</th>
                        <th scope="col" className="fr-cell--right">
                          Jours
                        </th>
                        <th scope="col" className="fr-cell--right">
                          TTC
                        </th>
                        <th scope="col" className="pilotage-col-actions">
                          <span className="fr-sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enfants.map((e) => (
                        <LotPrestationRows
                          key={e.id}
                          enfant={e}
                          intervenantsById={intervenantsById}
                          equipesByIntervenantId={equipesByIntervenantId}
                          craByEnfantId={craByEnfantId}
                          suiviByEnfantId={suiviByEnfantId}
                          craState={craState}
                          isEnfantExpanded={isEnfantExpanded}
                          toggleEnfant={toggleEnfant}
                        />
                      ))}
                    </tbody>
                  </table>
                </TableShell>
              </div>
            ) : null}
            <div className="missions-lot-card__edit">
              <DsfrDropdownMenu
                label="Actions"
                title={`Actions du lot ${name}`}
                items={[
                  {
                    id: "fiche",
                    label: "Ouvrir la fiche",
                    iconClassName: "fr-icon-arrow-right-line",
                    to: ficheTo,
                  },
                ]}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function LotPrestationRows({
  enfant,
  intervenantsById,
  equipesByIntervenantId,
  craByEnfantId,
  suiviByEnfantId,
  craState,
  isEnfantExpanded,
  toggleEnfant,
}: {
  enfant: MissionEnfant;
  intervenantsById: Map<number, string>;
  equipesByIntervenantId: Map<number, string>;
  craByEnfantId: Map<number, CraTotaux> | undefined;
  suiviByEnfantId: Map<number, SuiviMensuel[]>;
  craState: CraCellState;
  isEnfantExpanded: (key: string) => boolean;
  toggleEnfant: (key: string) => void;
}) {
  const craKey = `cra-${enfant.id}`;
  const craRows = craRowsSorted(suiviByEnfantId.get(enfant.id) ?? []);
  const hasCra = craRows.length > 0;
  const craOpen = hasCra && isEnfantExpanded(craKey);
  const enfantControlsId = `mission-lot-enfant-expand-${enfant.id}`;
  const iid = extractGristReferenceId(enfant.Intervenant);
  const ivLabel =
    iid != null && iid !== 0
      ? (intervenantsById.get(iid) ?? `#${iid}`)
      : undefined;
  const equipe = equipeLabelForEnfant(enfant, equipesByIntervenantId);
  const libelle = enfantLibelleOptionnel(enfant) || "—";

  return (
    <Fragment>
      <ExpandableChildRow
        className={
          craOpen
            ? "pilotage-expandable-mid-row pilotage-expandable-parent-row--open"
            : "pilotage-expandable-mid-row"
        }
      >
        <ExpandableChildCell>
          <div className="pilotage-expandable-parent-label">
            {hasCra ? (
              <ExpandToggle
                expanded={craOpen}
                childCount={craRows.length}
                controlsId={enfantControlsId}
                showCount={false}
                titleExpand={`Afficher les CRA de ${libelle}`}
                titleCollapse={`Masquer les CRA de ${libelle}`}
                onClick={() => toggleEnfant(craKey)}
              />
            ) : null}
            <div className="pilotage-expandable-parent-label__copy">
              <span className="fr-text--bold">{libelle}</span>
              {hasCra ? (
                <p className="fr-badge fr-badge--sm fr-mb-0" aria-hidden="true">
                  {craRows.length}
                </p>
              ) : null}
            </div>
          </div>
        </ExpandableChildCell>
        <ExpandableChildCell>
          {equipe ? tdEquipeTag(equipe) : "—"}
        </ExpandableChildCell>
        <ExpandableChildCell>{ivLabel ?? "—"}</ExpandableChildCell>
        <ExpandableChildCell>
          <StatutBadge statut={enfant.Statut} />
        </ExpandableChildCell>
        <ExpandableChildCell className="fr-cell--right">
          {formatCraJours(craByEnfantId?.get(enfant.id), craState)}
        </ExpandableChildCell>
        <ExpandableChildCell className="fr-cell--right">
          {formatCraMontant(craByEnfantId?.get(enfant.id), craState)}
        </ExpandableChildCell>
        <td className="pilotage-col-actions pilotage-expandable-child-cell" />
      </ExpandableChildRow>
      {craOpen ? (
        <MissionsListeCraRows
          rows={craRows}
          firstRowId={enfantControlsId}
          indentLevel={1}
        />
      ) : null}
    </Fragment>
  );
}
