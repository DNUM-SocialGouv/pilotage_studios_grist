import { Fragment, useMemo, useState } from "react";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { CraTtcStackBar, type CraTtcStackBarSlice } from "../CraTtcStackBar";
import { ExpandToggle, useExpandableRowIds } from "../expandable";
import { tdEquipeTag } from "../EquipeTags";
import { TableShell } from "../FinanceRecap";
import { StatutBadge } from "../StatutBadge";
import type { MissionEnfant, SuiviMensuel } from "../../types";
import {
  aggregateCraByEnfantId,
  groupSuiviRowsByEnfantId,
  sumSuiviTtcHorsPrestationForMission,
} from "../../utils/craByMission";
import { formatGristDate } from "../../utils/formatGristDate";
import { formatMontantEur } from "../../utils/formatMontant";
import {
  collectPeriodeMonthKeys,
  formatGristPeriodeMonthKeyLabel,
  suiviInPeriodeRange,
} from "../../utils/gristPeriode";
import { extractGristReferenceId } from "../../utils/gristReferences";
import { missionEnfantLibelle } from "../../utils/missionEnfants";
import { craRowsSorted, equipeLabelForEnfant } from "../../utils/missionsListeTotaux";
import { MissionsListeCraRows } from "./MissionsListeCraRows";

const EQUIPE_SANS_LABEL = "Sans équipe";
const EQUIPE_HORS_PRESTATION_LABEL = "Hors prestation";

function equipeKeyForEnfant(
  e: MissionEnfant,
  equipesByIntervenantId: Map<number, string>,
): string {
  return equipeLabelForEnfant(e, equipesByIntervenantId) ?? EQUIPE_SANS_LABEL;
}

function formatDecimalFr2(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Agrège le TTC CRA des prestations par libellé d’équipe (barre empilée).
 * `horsPrestationTtc` : CRA legacy du master.
 */
function aggregateTtcByEquipe(
  enfants: MissionEnfant[],
  ttcByEnfantId: Map<number, number>,
  equipesByIntervenantId: Map<number, string>,
  horsPrestationTtc = 0,
): CraTtcStackBarSlice[] {
  const map = new Map<string, number>();
  for (const e of enfants) {
    const eq = equipeKeyForEnfant(e, equipesByIntervenantId);
    map.set(eq, (map.get(eq) ?? 0) + (ttcByEnfantId.get(e.id) ?? 0));
  }
  if (horsPrestationTtc > 0) {
    map.set(
      EQUIPE_HORS_PRESTATION_LABEL,
      (map.get(EQUIPE_HORS_PRESTATION_LABEL) ?? 0) + horsPrestationTtc,
    );
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((s) => s.value > 0)
    .sort(
      (a, b) =>
        b.value - a.value || a.label.localeCompare(b.label, "fr", { sensitivity: "base" }),
    );
}

export type MissionEquipePrestationsPanelProps = {
  missionId: number;
  missionTitre: string;
  enfants: MissionEnfant[];
  realisations: SuiviMensuel[];
  intervenantsById: Map<number, string>;
  equipesByIntervenantId: Map<number, string>;
  /** Si absents : mode consultation (pas de CTA ajouter / modifier). */
  onAddPrestation?: (missionId: number) => void;
  onEditPrestation?: (enfant: MissionEnfant) => void;
  /** Filtres équipe / période (défaut : oui — fiche mission). */
  showFilters?: boolean;
  /**
   * Colonnes tableau :
   * - `planifie` : date de début + jours envisagés (fiche mission)
   * - `realise` : jours réalisés CRA (fiche produit)
   */
  columns?: "planifie" | "realise";
};

/**
 * Bloc « Équipe & prestations » (barre TTC, tableau avec CRA dépliables).
 * Partagé fiche mission et onglet Missions de la fiche produit.
 */
export function MissionEquipePrestationsPanel({
  missionId,
  missionTitre,
  enfants,
  realisations,
  intervenantsById,
  equipesByIntervenantId,
  onAddPrestation,
  onEditPrestation,
  showFilters = true,
  columns = "planifie",
}: MissionEquipePrestationsPanelProps) {
  const canEdit = Boolean(onAddPrestation || onEditPrestation);
  const showPlanifie = columns === "planifie";
  const [equipeFilter, setEquipeFilter] = useState("");
  const [periodeDebut, setPeriodeDebut] = useState("");
  const [periodeFin, setPeriodeFin] = useState("");
  const expandResetKey = showFilters
    ? `${equipeFilter}|${periodeDebut}|${periodeFin}`
    : "all";
  const { isExpanded, toggle } = useExpandableRowIds<string>(undefined, expandResetKey);

  const periodeFilterActive = showFilters && Boolean(periodeDebut || periodeFin);

  const periodeOptions = useMemo(
    () => (showFilters ? collectPeriodeMonthKeys(realisations) : []),
    [realisations, showFilters],
  );

  const realisationsFiltrees = useMemo(
    () =>
      showFilters
        ? realisations.filter((row) => suiviInPeriodeRange(row, periodeDebut, periodeFin))
        : realisations,
    [realisations, periodeDebut, periodeFin, showFilters],
  );

  const suiviByEnfantId = useMemo(
    () => groupSuiviRowsByEnfantId(realisationsFiltrees),
    [realisationsFiltrees],
  );

  const craParEnfant = useMemo(
    () => aggregateCraByEnfantId(realisationsFiltrees),
    [realisationsFiltrees],
  );

  const ttcByEnfantId = useMemo(() => {
    const map = new Map<number, number>();
    for (const [eid, totaux] of craParEnfant) {
      map.set(eid, totaux.ttc);
    }
    return map;
  }, [craParEnfant]);

  const craCountByEnfantId = useMemo(() => {
    const map = new Map<number, number>();
    for (const [eid, totaux] of craParEnfant) {
      map.set(eid, totaux.count);
    }
    return map;
  }, [craParEnfant]);

  const joursByEnfantId = useMemo(() => {
    const map = new Map<number, number>();
    for (const [eid, totaux] of craParEnfant) {
      map.set(eid, totaux.jours);
    }
    return map;
  }, [craParEnfant]);

  const horsPrestationTtc = useMemo(
    () => sumSuiviTtcHorsPrestationForMission(realisationsFiltrees, missionId, enfants),
    [realisationsFiltrees, missionId, enfants],
  );

  const joursLabel = useMemo(() => {
    let jours = 0;
    for (const s of realisationsFiltrees) {
      if (typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours)) {
        jours += s.Nb_jours;
      }
    }
    return jours.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
  }, [realisationsFiltrees]);

  const enfantsApresPeriode = useMemo(() => {
    if (!periodeFilterActive) {
      return enfants;
    }
    return enfants.filter((e) => (craCountByEnfantId.get(e.id) ?? 0) > 0);
  }, [enfants, periodeFilterActive, craCountByEnfantId]);

  const equipesPresentes = useMemo(() => {
    if (!showFilters) {
      return [];
    }
    const set = new Set<string>();
    let hasSansEquipe = false;
    for (const e of enfantsApresPeriode) {
      const eq = equipeLabelForEnfant(e, equipesByIntervenantId);
      if (eq) {
        set.add(eq);
      } else {
        hasSansEquipe = true;
      }
    }
    if (hasSansEquipe) {
      set.add(EQUIPE_SANS_LABEL);
    }
    if (horsPrestationTtc > 0) {
      set.add(EQUIPE_HORS_PRESTATION_LABEL);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [enfantsApresPeriode, equipesByIntervenantId, horsPrestationTtc, showFilters]);

  const enfantsFiltres = useMemo(() => {
    if (!showFilters || !equipeFilter || equipeFilter === EQUIPE_HORS_PRESTATION_LABEL) {
      return showFilters && equipeFilter === EQUIPE_HORS_PRESTATION_LABEL
        ? []
        : enfantsApresPeriode;
    }
    return enfantsApresPeriode.filter(
      (e) => equipeKeyForEnfant(e, equipesByIntervenantId) === equipeFilter,
    );
  }, [enfantsApresPeriode, equipeFilter, equipesByIntervenantId, showFilters]);

  const ttcParEquipe = useMemo(() => {
    if (!showFilters || !equipeFilter) {
      return aggregateTtcByEquipe(
        enfantsApresPeriode,
        ttcByEnfantId,
        equipesByIntervenantId,
        horsPrestationTtc,
      );
    }
    if (equipeFilter === EQUIPE_HORS_PRESTATION_LABEL) {
      return aggregateTtcByEquipe([], ttcByEnfantId, equipesByIntervenantId, horsPrestationTtc);
    }
    return aggregateTtcByEquipe(enfantsFiltres, ttcByEnfantId, equipesByIntervenantId, 0);
  }, [
    enfantsApresPeriode,
    enfantsFiltres,
    equipeFilter,
    ttcByEnfantId,
    equipesByIntervenantId,
    horsPrestationTtc,
    showFilters,
  ]);

  const emptyMessage = (() => {
    if (enfants.length === 0) {
      return null;
    }
    if (enfantsFiltres.length > 0) {
      return null;
    }
    if (showFilters && equipeFilter === EQUIPE_HORS_PRESTATION_LABEL) {
      return "Les CRA hors prestation n’apparaissent pas dans le tableau des prestations.";
    }
    if (periodeFilterActive && enfantsApresPeriode.length === 0) {
      return "Aucune prestation avec CRA sur cette période.";
    }
    if (showFilters && equipeFilter) {
      return `Aucune prestation pour l’équipe « ${equipeFilter} ».`;
    }
    return null;
  })();

  return (
    <>
      {horsPrestationTtc > 0 ? (
        <p className="fr-text--xs fr-text-mention--grey fr-mb-2w">
          Dont {formatMontantEur(horsPrestationTtc)} hors prestation (CRA sans rattachement
          enfant)
          {showFilters && equipeFilter && equipeFilter !== EQUIPE_HORS_PRESTATION_LABEL
            ? " — masqué du graphique avec ce filtre"
            : ""}
          .
        </p>
      ) : null}
      <div className="fr-grid-row fr-grid-row--gutters mission-equipe-recap fr-mb-3w">
        {showFilters ? (
          <>
            <div className="fr-col-12 fr-col-md-4">
              <Select
                label="Équipe"
                nativeSelectProps={{
                  value: equipeFilter,
                  onChange: (e) => setEquipeFilter(e.currentTarget.value),
                }}
              >
                <option value="">Toutes les équipes</option>
                {equipesPresentes.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </Select>
            </div>
            <div className="fr-col-12 fr-col-md-4">
              <Select
                label="Du mois"
                nativeSelectProps={{
                  value: periodeDebut,
                  onChange: (e) => setPeriodeDebut(e.currentTarget.value),
                }}
              >
                <option value="">Tous</option>
                {periodeOptions.map((key) => (
                  <option key={key} value={key}>
                    {formatGristPeriodeMonthKeyLabel(key)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="fr-col-12 fr-col-md-4">
              <Select
                label="Au mois"
                nativeSelectProps={{
                  value: periodeFin,
                  onChange: (e) => setPeriodeFin(e.currentTarget.value),
                }}
              >
                <option value="">Tous</option>
                {periodeOptions.map((key) => (
                  <option key={key} value={key}>
                    {formatGristPeriodeMonthKeyLabel(key)}
                  </option>
                ))}
              </Select>
            </div>
          </>
        ) : null}
        <div className="fr-col-12">
          <CraTtcStackBar
            slices={ttcParEquipe}
            amountsExtra={`${joursLabel} jours`}
            showTtcOnAmount
          />
        </div>
      </div>

      {onAddPrestation ? (
        <div className="fr-grid-row fr-grid-row--right fr-mb-3w">
          <div className="fr-col-auto">
            <button
              type="button"
              className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-add-line fr-btn--icon-left"
              onClick={() => onAddPrestation(missionId)}
            >
              Ajouter une prestation
            </button>
          </div>
        </div>
      ) : null}

      {enfants.length === 0 ? (
        <p className="fr-mb-0">Aucune prestation rattachée à cette mission.</p>
      ) : null}

      {emptyMessage ? <p className="fr-mb-0">{emptyMessage}</p> : null}

      {enfantsFiltres.length > 0 ? (
        <TableShell multiline className="fr-mb-0 mission-equipe-prestations-table">
          <table>
            <caption className="fr-sr-only">
              Prestations de la mission {missionTitre}
              {showFilters && equipeFilter ? ` — équipe ${equipeFilter}` : ""}
              {periodeFilterActive
                ? ` — période CRA${periodeDebut ? ` du ${formatGristPeriodeMonthKeyLabel(periodeDebut)}` : ""}${periodeFin ? ` au ${formatGristPeriodeMonthKeyLabel(periodeFin)}` : ""}`
                : ""}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="pilotage-col-mission-libelle">
                  Prestation
                </th>
                <th scope="col" className="pilotage-col-statut-nowrap">
                  Statut
                </th>
                <th scope="col">Intervenant</th>
                <th scope="col" className="pilotage-col-equipe-nowrap">
                  Équipe
                </th>
                {showPlanifie ? (
                  <>
                    <th scope="col">Date de début</th>
                    <th scope="col" className="fr-cell--right">
                      Jours envisagés
                    </th>
                  </>
                ) : (
                  <th scope="col" className="fr-cell--right">
                    Jours réalisés
                  </th>
                )}
                <th scope="col" className="fr-cell--right">
                  Nb CRA
                </th>
                <th scope="col" className="fr-cell--right">
                  TTC CRA
                </th>
                {canEdit ? (
                  <th scope="col" className="pilotage-col-actions">
                    <span className="fr-sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {enfantsFiltres.map((e) => {
                const intervenantId = extractGristReferenceId(e.Intervenant);
                const intervenantLabel =
                  intervenantId != null && intervenantId !== 0
                    ? (intervenantsById.get(intervenantId) ?? `#${intervenantId}`)
                    : undefined;
                const equipe = equipeLabelForEnfant(e, equipesByIntervenantId);
                const ttc = ttcByEnfantId.get(e.id) ?? 0;
                const nbCra = craCountByEnfantId.get(e.id) ?? 0;
                const joursRealises = joursByEnfantId.get(e.id) ?? 0;
                const libelle = missionEnfantLibelle(e, intervenantLabel);
                const craKey = `cra-${e.id}`;
                const craRows = craRowsSorted(suiviByEnfantId.get(e.id) ?? []);
                const hasCra = craRows.length > 0;
                const craOpen = hasCra && isExpanded(craKey);
                const enfantControlsId = `mission-equipe-enfant-cra-${missionId}-${e.id}`;
                return (
                  <Fragment key={e.id}>
                    <tr
                      className={
                        craOpen
                          ? "pilotage-expandable-parent-row pilotage-expandable-parent-row--open"
                          : hasCra
                            ? "pilotage-expandable-parent-row"
                            : undefined
                      }
                    >
                      <th scope="row" className="pilotage-col-mission-libelle">
                        <div className="pilotage-expandable-parent-label">
                          {hasCra ? (
                            <ExpandToggle
                              expanded={craOpen}
                              childCount={craRows.length}
                              controlsId={enfantControlsId}
                              showCount={false}
                              titleExpand={`Afficher les CRA de ${libelle}`}
                              titleCollapse={`Masquer les CRA de ${libelle}`}
                              onClick={() => toggle(craKey)}
                            />
                          ) : (
                            <span
                              className="pilotage-expand-toggle-spacer"
                              aria-hidden="true"
                            />
                          )}
                          <span className="fr-text--bold pilotage-expandable-parent-label__title">
                            {libelle}
                          </span>
                        </div>
                      </th>
                      <td className="pilotage-col-statut-nowrap">
                        {e.Statut?.trim() ? <StatutBadge statut={e.Statut} /> : "—"}
                      </td>
                      <td>{intervenantLabel ?? "—"}</td>
                      <td className="pilotage-col-equipe-nowrap">
                        {equipe ? tdEquipeTag(equipe) : "—"}
                      </td>
                      {showPlanifie ? (
                        <>
                          <td>{formatGristDate(e.Date_de_debut)}</td>
                          <td className="fr-cell--right">
                            {typeof e.Jours_envisages === "number" &&
                            Number.isFinite(e.Jours_envisages)
                              ? formatDecimalFr2(e.Jours_envisages)
                              : "—"}
                          </td>
                        </>
                      ) : (
                        <td className="fr-cell--right">
                          {nbCra > 0 || joursRealises > 0
                            ? formatDecimalFr2(joursRealises)
                            : "—"}
                        </td>
                      )}
                      <td className="fr-cell--right">{nbCra.toLocaleString("fr-FR")}</td>
                      <td className="fr-cell--right">{formatMontantEur(ttc)}</td>
                      {canEdit ? (
                        <td className="pilotage-col-actions">
                          {onEditPrestation ? (
                            <button
                              type="button"
                              className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
                              title={`Modifier la prestation ${libelle}`}
                              onClick={() => onEditPrestation(e)}
                            >
                              Modifier
                            </button>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                    {craOpen ? (
                      <MissionsListeCraRows
                        rows={craRows}
                        firstRowId={enfantControlsId}
                        indentLevel={1}
                        layout="fiche"
                        showDateColumn={showPlanifie}
                        showActions={canEdit}
                      />
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      ) : null}
    </>
  );
}
