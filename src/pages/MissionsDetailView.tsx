import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { CraTtcPiePanel, type CraTtcPieSlice } from "../components/CraTtcPiePanel";
import { ExpandToggle, useExpandableRowIds } from "../components/expandable";
import { tdEquipeTag } from "../components/EquipeTags";
import { TableShell } from "../components/FinanceRecap";
import { GristAttachmentDownloadLink } from "../components/GristAttachmentDownloadLink";
import { MissionsListeCraRows } from "../components/missions/MissionsListeCraRows";
import { StatutBadge } from "../components/StatutBadge";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types";
import {
  aggregateCraByEnfantId,
  groupSuiviRowsByEnfantId,
  sumSuiviTtcHorsPrestationForMission,
} from "../utils/craByMission";
import { formatGristDateTime } from "../utils/formatGristDate";
import { formatMontantEur } from "../utils/formatMontant";
import { extractGristReferenceId } from "../utils/gristReferences";
import {
  enfantsOfMaster,
  missionEnfantLibelle,
  suiviBelongsToMasterMission,
  typePrestationLabel,
} from "../utils/missionEnfants";
import {
  libelleProduitMission,
  missionLibelle,
  produitsByIdFromRows,
} from "../utils/missionsList";
import { craRowsSorted, equipeLabelForEnfant } from "../utils/missionsListeTotaux";
import { departementProduitSdpc } from "../utils/pilotageProduits";
import { montantTtcSuiviMensuel } from "../utils/suiviMensuel";
import { useMissionsOutlet } from "./MissionsLayout";

type MissionTabId = "contexte" | "equipe" | "notes";

const EQUIPE_SANS_LABEL = "Sans équipe";
const EQUIPE_HORS_PRESTATION_LABEL = "Hors prestation";

const NARRATIVE_SECTIONS: { title: string; keys: (keyof Mission)[] }[] = [
  { title: "Contexte et demande", keys: ["Demande", "Enjeux", "Historique"] },
  {
    title: "Utilisateurs et périmètre produit",
    keys: [
      "Cible_profils_utilisateurs",
      "Pb_utilisateurs_identifies",
      "Fonctionnalites_produit",
      "Volumes_d_usages_utilisateurs_utilisations_",
    ],
  },
];

const FIELD_LABELS: Record<string, string> = {
  Demande: "Demande",
  Enjeux: "Enjeux",
  Historique: "Historique",
  Cible_profils_utilisateurs: "Cible profils utilisateurs",
  Pb_utilisateurs_identifies: "Problèmes utilisateurs identifiés",
  Fonctionnalites_produit: "Fonctionnalités produit",
  Volumes_d_usages_utilisateurs_utilisations_: "Volumes d’usages / utilisations",
  Liens_FIGMA_Notion: "Liens FIGMA / Notion",
  Suivi_resp_studio: "Suivi resp. studio",
};

function parseMissionTabId(params: URLSearchParams): MissionTabId {
  const raw = params.get("onglet") ?? params.get("tab");
  if (raw === "equipe" || raw === "equipe-prestations" || raw === "realisations") {
    return "equipe";
  }
  if (
    raw === "notes" ||
    raw === "note-studio" ||
    raw === "pieces-jointes" ||
    raw === "note-pieces-jointes"
  ) {
    return "notes";
  }
  return "contexte";
}

function isTextFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function formatDecimalFr2(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function MissionProse({ value }: { value: string }) {
  return <p className="mission-fiche-prose fr-mb-0">{value}</p>;
}

function equipeKeyForEnfant(
  e: MissionEnfant,
  equipesByIntervenantId: Map<number, string>,
): string {
  return equipeLabelForEnfant(e, equipesByIntervenantId) ?? EQUIPE_SANS_LABEL;
}

/**
 * Agrège le TTC CRA des prestations par libellé d’équipe (camembert).
 * `horsPrestationTtc` : CRA legacy du master.
 */
function aggregateTtcByEquipe(
  enfants: MissionEnfant[],
  ttcByEnfantId: Map<number, number>,
  equipesByIntervenantId: Map<number, string>,
  horsPrestationTtc = 0,
): CraTtcPieSlice[] {
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

function MissionContextePanel({ mission }: { mission: Mission }) {
  const sections = NARRATIVE_SECTIONS.map((section) => ({
    ...section,
    fields: section.keys
      .map((key) => ({ key, value: mission[key] }))
      .filter((f) => isTextFilled(f.value)),
  })).filter((s) => s.fields.length > 0);
  const liens = isTextFilled(mission.Liens_FIGMA_Notion) ? mission.Liens_FIGMA_Notion : null;

  if (sections.length === 0 && !liens) {
    return (
      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
        Aucun contenu détaillé renseigné pour cette mission.
      </p>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="fr-mb-4w">
          <h2 className="fr-h5 fr-mb-3w">{section.title}</h2>
          {section.fields.map(({ key, value }) => (
            <div key={key} className="fr-mb-3w">
              <h3 className="fr-h6 fr-mb-1w">{FIELD_LABELS[key] ?? key}</h3>
              <MissionProse value={String(value)} />
            </div>
          ))}
        </section>
      ))}
      {liens ? (
        <div className="fr-mb-0">
          <h3 className="fr-h6 fr-mb-1w">{FIELD_LABELS.Liens_FIGMA_Notion}</h3>
          <MissionProse value={liens} />
        </div>
      ) : null}
    </>
  );
}

function MissionEquipePanel({
  missionTitre,
  enfants,
  suiviByEnfantId,
  ttcByEnfantId,
  craCountByEnfantId,
  horsPrestationTtc,
  ttcLabel,
  joursLabel,
  intervenantsById,
  equipesByIntervenantId,
}: {
  missionTitre: string;
  enfants: MissionEnfant[];
  suiviByEnfantId: Map<number, SuiviMensuel[]>;
  ttcByEnfantId: Map<number, number>;
  craCountByEnfantId: Map<number, number>;
  horsPrestationTtc: number;
  ttcLabel: string;
  joursLabel: string;
  intervenantsById: Map<number, string>;
  equipesByIntervenantId: Map<number, string>;
}) {
  const [equipeFilter, setEquipeFilter] = useState("");
  const { isExpanded, toggle } = useExpandableRowIds<string>(undefined, equipeFilter);

  const equipesPresentes = useMemo(() => {
    const set = new Set<string>();
    let hasSansEquipe = false;
    for (const e of enfants) {
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
  }, [enfants, equipesByIntervenantId, horsPrestationTtc]);

  const enfantsFiltres = useMemo(() => {
    if (!equipeFilter || equipeFilter === EQUIPE_HORS_PRESTATION_LABEL) {
      return equipeFilter === EQUIPE_HORS_PRESTATION_LABEL ? [] : enfants;
    }
    return enfants.filter(
      (e) => equipeKeyForEnfant(e, equipesByIntervenantId) === equipeFilter,
    );
  }, [enfants, equipeFilter, equipesByIntervenantId]);

  const ttcParEquipe = useMemo(() => {
    if (!equipeFilter) {
      return aggregateTtcByEquipe(
        enfants,
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
    enfants,
    enfantsFiltres,
    equipeFilter,
    ttcByEnfantId,
    equipesByIntervenantId,
    horsPrestationTtc,
  ]);

  return (
    <>
      <div className="mission-equipe-synthese fr-mb-2w">
        <p className="fr-text--sm fr-mb-0">
          <strong>TTC CRA mission :</strong> {ttcLabel}
          <span className="fr-text-mention--grey"> · </span>
          <strong>Jours :</strong> {joursLabel}
        </p>
      </div>
      {horsPrestationTtc > 0 ? (
        <p className="fr-text--xs fr-text-mention--grey fr-mb-2w">
          Dont {formatMontantEur(horsPrestationTtc)} hors prestation (CRA sans rattachement
          enfant)
          {equipeFilter && equipeFilter !== EQUIPE_HORS_PRESTATION_LABEL
            ? " — masqué du camembert avec ce filtre"
            : ""}
          .
        </p>
      ) : null}
      <div className="fr-grid-row fr-grid-row--gutters mission-equipe-recap fr-mb-2w">
        <div className="fr-col-12 fr-col-md-6">
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
        <div className="fr-col-12 fr-col-md-6">
          <CraTtcPiePanel slices={ttcParEquipe} title="TTC par équipe" size="lg" />
        </div>
      </div>

      {enfants.length === 0 ? (
        <p className="fr-mb-0">Aucune prestation rattachée à cette mission.</p>
      ) : null}

      {enfants.length > 0 && enfantsFiltres.length === 0 ? (
        <p className="fr-mb-0">
          {equipeFilter === EQUIPE_HORS_PRESTATION_LABEL
            ? "Les CRA hors prestation n’apparaissent pas dans le tableau des prestations."
            : `Aucune prestation pour l’équipe « ${equipeFilter} ».`}
        </p>
      ) : null}

      {enfantsFiltres.length > 0 ? (
        <TableShell multiline className="fr-mb-0">
          <table>
            <caption className="fr-sr-only">
              Prestations de la mission {missionTitre}
              {equipeFilter ? ` — équipe ${equipeFilter}` : ""}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="pilotage-col-mission-libelle">
                  Prestation
                </th>
                <th scope="col">Intervenant</th>
                <th scope="col" className="pilotage-col-equipe-nowrap">
                  Équipe
                </th>
                <th scope="col">Type</th>
                <th scope="col" className="fr-cell--right">
                  Jours envisagés
                </th>
                <th scope="col" className="fr-cell--right">
                  Nb CRA
                </th>
                <th scope="col" className="fr-cell--right">
                  TTC CRA
                </th>
                <th scope="col">Statut</th>
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
                const libelle = missionEnfantLibelle(e, intervenantLabel);
                const craKey = `cra-${e.id}`;
                const craRows = craRowsSorted(suiviByEnfantId.get(e.id) ?? []);
                const hasCra = craRows.length > 0;
                const craOpen = hasCra && isExpanded(craKey);
                const enfantControlsId = `mission-fiche-enfant-cra-${e.id}`;
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
                      <td>{intervenantLabel ?? "—"}</td>
                      <td className="pilotage-col-equipe-nowrap">
                        {equipe ? tdEquipeTag(equipe) : "—"}
                      </td>
                      <td>{typePrestationLabel(e.Type_prestation)}</td>
                      <td className="fr-cell--right">
                        {typeof e.Jours_envisages === "number" &&
                        Number.isFinite(e.Jours_envisages)
                          ? formatDecimalFr2(e.Jours_envisages)
                          : "—"}
                      </td>
                      <td className="fr-cell--right">{nbCra.toLocaleString("fr-FR")}</td>
                      <td className="fr-cell--right">{formatMontantEur(ttc)}</td>
                      <td>{e.Statut?.trim() || "—"}</td>
                    </tr>
                    {craOpen ? (
                      <MissionsListeCraRows
                        rows={craRows}
                        firstRowId={enfantControlsId}
                        indentLevel={1}
                        layout="fiche"
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

function MissionNotesPanel({ mission }: { mission: Mission }) {
  return (
    <>
      <div className="fr-mb-4w">
        <h2 className="fr-h5 fr-mb-2w">Note studio</h2>
        {isTextFilled(mission.Suivi_resp_studio) ? (
          <MissionProse value={mission.Suivi_resp_studio!} />
        ) : (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Aucune note studio renseignée.
          </p>
        )}
      </div>
      <div>
        <h2 className="fr-h5 fr-mb-2w">Pièces jointes</h2>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
          Documents rattachés à cette mission (`Docs` dans Grist). Lecture seule.
        </p>
        <GristAttachmentDownloadLink value={mission.Docs} label="Télécharger le document" />
      </div>
    </>
  );
}

export function MissionsDetailView() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useMissionsOutlet();
  const missionTabId = parseMissionTabId(searchParams);
  const rawOnglet = searchParams.get("onglet") ?? searchParams.get("tab");
  const missionId = id ? Number.parseInt(id, 10) : Number.NaN;
  const mission = data.missions.find((m) => m.id === missionId);

  useEffect(() => {
    if (rawOnglet === "realisations") {
      setSearchParams({ onglet: "equipe" }, { replace: true });
    }
  }, [rawOnglet, setSearchParams]);

  const produitsById = useMemo(
    () => produitsByIdFromRows(data.produits),
    [data.produits],
  );

  const produitsRecordsById = useMemo(() => {
    const map = new Map<number, Record<string, unknown>>();
    for (const p of data.produits) {
      map.set(p.id, p as unknown as Record<string, unknown>);
    }
    return map;
  }, [data.produits]);

  const intervenantsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const i of data.intervenants) {
      map.set(i.id, i.Prenom_Nom?.trim() || `Intervenant #${i.id}`);
    }
    return map;
  }, [data.intervenants]);

  const equipesByIntervenantId = useMemo(() => {
    const map = new Map<number, string>();
    for (const i of data.intervenants) {
      const equipe = i.Equipe?.trim();
      if (equipe) {
        map.set(i.id, equipe);
      }
    }
    return map;
  }, [data.intervenants]);

  const enfants = useMemo(
    () => (Number.isFinite(missionId) ? enfantsOfMaster(data.missionEnfants, missionId) : []),
    [data.missionEnfants, missionId],
  );

  const realisations = useMemo(() => {
    if (!Number.isFinite(missionId)) {
      return [];
    }
    const enfantsById = new Map(data.missionEnfants.map((e) => [e.id, e]));
    return data.suivi.filter((row) =>
      suiviBelongsToMasterMission(row, missionId, enfantsById),
    );
  }, [data.missionEnfants, data.suivi, missionId]);

  const suiviByEnfantId = useMemo(
    () => groupSuiviRowsByEnfantId(realisations),
    [realisations],
  );

  const craParEnfant = useMemo(
    () => aggregateCraByEnfantId(realisations),
    [realisations],
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

  const ttcMission = useMemo(
    () => realisations.reduce((sum, s) => sum + (montantTtcSuiviMensuel(s) ?? 0), 0),
    [realisations],
  );

  const joursMission = useMemo(() => {
    let jours = 0;
    for (const s of realisations) {
      if (typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours)) {
        jours += s.Nb_jours;
      }
    }
    return jours;
  }, [realisations]);

  const horsPrestationTtc = useMemo(
    () =>
      Number.isFinite(missionId)
        ? sumSuiviTtcHorsPrestationForMission(realisations, missionId, enfants)
        : 0,
    [realisations, missionId, enfants],
  );

  if (!Number.isFinite(missionId) || !mission) {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/missions">
            ← Retour à la liste
          </Link>
        </p>
        <Alert
          severity="warning"
          title="Mission introuvable"
          description={`Aucune ligne Missions avec l’id ${id ?? "—"}.`}
        />
      </div>
    );
  }

  const titre = missionLibelle(mission);
  const produitId = extractGristReferenceId(mission.Produit_SDPC);
  const produitRecord =
    produitId != null && produitId !== 0 ? produitsRecordsById.get(produitId) : undefined;
  const departementLabel = produitRecord ? departementProduitSdpc(produitRecord) : "—";
  const majRaw = mission.Derniere_mise_a_jour;
  const derniereMajLabel =
    typeof majRaw === "number" && Number.isFinite(majRaw) && majRaw !== 0
      ? formatGristDateTime(majRaw)
      : null;
  const metaColCount = derniereMajLabel != null ? 3 : 2;
  const metaColClass =
    metaColCount === 3 ? "fr-col-12 fr-col-md-4" : "fr-col-12 fr-col-md-6";

  function selectMissionTab(nextId: string) {
    if (nextId === "contexte" || nextId === "equipe" || nextId === "notes") {
      setSearchParams({ onglet: nextId }, { replace: true });
    }
  }

  return (
    <div className="fr-py-1w">
      <p className="fr-mb-2w">
        <Link className="fr-link" to="/missions">
          ← Retour à la liste
        </Link>
      </p>

      <div className="mission-fiche-title-row fr-mb-2w">
        <div className="mission-fiche-title-row__identity">
          <ul className="fr-badges-group fr-mb-0">
            <li>
              <StatutBadge statut={mission.Statut} />
            </li>
          </ul>
          <h1 className="fr-mb-0 fr-h3 mission-fiche-title-row__title">{titre}</h1>
        </div>
      </div>

      <div
        className="fr-grid-row mission-fiche-meta-bandeau fr-mb-4w"
        role="group"
        aria-label="Informations de la mission"
      >
        <div className={`${metaColClass} mission-fiche-meta-bandeau__cell`}>
          <div className="fr-text--xs fr-mb-1v mission-fiche-meta-bandeau__label">Produit</div>
          <div className="fr-text--sm fr-mb-0">
            {libelleProduitMission(mission, produitsById)}
          </div>
        </div>
        <div className={`${metaColClass} mission-fiche-meta-bandeau__cell`}>
          <div className="fr-text--xs fr-mb-1v mission-fiche-meta-bandeau__label">
            Département
          </div>
          <div className="fr-text--sm fr-mb-0">{departementLabel}</div>
        </div>
        {derniereMajLabel != null ? (
          <div className={`${metaColClass} mission-fiche-meta-bandeau__cell`}>
            <div className="fr-text--xs fr-mb-1v mission-fiche-meta-bandeau__label">
              Dernière mise à jour
            </div>
            <div className="fr-text--sm fr-mb-0">{derniereMajLabel}</div>
          </div>
        ) : null}
      </div>

      <Tabs
        label="Sections de la fiche mission"
        className="fr-mb-2w"
        selectedTabId={missionTabId}
        onTabChange={selectMissionTab}
        tabs={[
          { tabId: "contexte", label: "Contexte", iconId: "fr-icon-file-text-line" },
          {
            tabId: "equipe",
            label: "Équipe & prestations",
            iconId: "fr-icon-team-line",
          },
          {
            tabId: "notes",
            label: "Note & pièces jointes",
            iconId: "fr-icon-attachment-line",
          },
        ]}
      >
        {missionTabId === "contexte" ? <MissionContextePanel mission={mission} /> : null}
        {missionTabId === "equipe" ? (
          <MissionEquipePanel
            key={mission.id}
            missionTitre={titre}
            enfants={enfants}
            suiviByEnfantId={suiviByEnfantId}
            ttcByEnfantId={ttcByEnfantId}
            craCountByEnfantId={craCountByEnfantId}
            horsPrestationTtc={horsPrestationTtc}
            ttcLabel={formatMontantEur(ttcMission)}
            joursLabel={joursMission.toLocaleString("fr-FR", { maximumFractionDigits: 4 })}
            intervenantsById={intervenantsById}
            equipesByIntervenantId={equipesByIntervenantId}
          />
        ) : null}
        {missionTabId === "notes" ? <MissionNotesPanel mission={mission} /> : null}
      </Tabs>
    </div>
  );
}
