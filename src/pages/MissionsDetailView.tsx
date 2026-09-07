import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { CraTtcPiePanel } from "../components/CraTtcPiePanel";
import { EquipeBadges } from "../components/EquipeBadges";
import { TableShell } from "../components/FinanceRecap";
import { GristAttachmentDownloadLink } from "../components/GristAttachmentDownloadLink";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types";
import { totauxCraForEnfant } from "../utils/craByMission";
import { formatGristDateTime } from "../utils/formatGristDate";
import { formatMontantEur } from "../utils/formatMontant";
import { extractGristReferenceId, extractGristReferenceIds, extractGristStringTokens } from "../utils/gristReferences";
import { formatGristPeriodeMoisAnnee } from "../utils/gristPeriode";
import {
  enfantsOfMaster,
  intervenantIdsForMaster,
  missionEnfantLibelle,
  suiviBelongsToMasterMission,
} from "../utils/missionEnfants";
import {
  libelleParRefsIds,
  libelleProduitMission,
  missionLibelle,
  produitsByIdFromRows,
} from "../utils/missionsList";
import { labelIntervenantSuivi } from "../utils/suiviLabels";
import { aggregateTtcByLabel, montantTtcSuiviMensuel } from "../utils/suiviMensuel";
import { useMissionsOutlet } from "./MissionsLayout";

const CRA_PAGE_SIZE = 10;

type MissionTabId = "contexte" | "equipe" | "realisations" | "note-studio" | "pieces-jointes";

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

function isTextFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function MissionProse({ value }: { value: string }) {
  return <p className="mission-fiche-prose fr-mb-0">{value}</p>;
}

function extractSuiviBdcId(row: SuiviMensuel): number | undefined {
  const cible = extractGristReferenceId(row.BDC_cible);
  if (cible != null && cible !== 0) {
    return cible;
  }
  const chorus = extractGristReferenceId(row.Bdc_Chorus2);
  if (chorus != null && chorus !== 0) {
    return chorus;
  }
  return undefined;
}

function departementLabel(m: Mission): string {
  const tokens = extractGristStringTokens(m.Departement);
  if (tokens.length > 0) {
    return tokens.join(", ");
  }
  return "—";
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
  suivi,
  intervenantsById,
  equipesByIntervenantId,
}: {
  missionTitre: string;
  enfants: MissionEnfant[];
  suivi: SuiviMensuel[];
  intervenantsById: Map<number, string>;
  equipesByIntervenantId: Map<number, string>;
}) {
  const totaux = useMemo(() => {
    let jours = 0;
    let ttc = 0;
    for (const s of suivi) {
      if (typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours)) {
        jours += s.Nb_jours;
      }
      ttc += montantTtcSuiviMensuel(s) ?? 0;
    }
    return { jours, ttc, count: suivi.length };
  }, [suivi]);

  const slices = useMemo(
    () =>
      aggregateTtcByLabel(suivi, (s) => s.Equipe?.trim() || "Sans équipe").map((e) => ({
        label: e.label,
        value: e.ttc,
      })),
    [suivi],
  );

  return (
    <>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
        <div className="fr-col-12 fr-col-md-6">
          <p className="fr-mb-1w">
            <strong>{totaux.count}</strong> ligne{totaux.count > 1 ? "s" : ""} CRA ·{" "}
            {totaux.jours.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} j ·{" "}
            {formatMontantEur(totaux.ttc)}
          </p>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <CraTtcPiePanel slices={slices} title="TTC par équipe" size="lg" />
        </div>
      </div>

      {enfants.length === 0 ? (
        <p className="fr-mb-0">Aucune prestation rattachée à cette mission.</p>
      ) : (
        <TableShell className="fr-mb-0">
          <table>
            <caption className="fr-sr-only">Prestations de la mission {missionTitre}</caption>
            <thead>
              <tr>
                <th scope="col">Libellé</th>
                <th scope="col">Intervenant</th>
                <th scope="col">Équipe</th>
                <th scope="col">Type</th>
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
              {enfants.map((e) => {
                const intervenantId = extractGristReferenceId(e.Intervenant);
                const intervenantLabel =
                  intervenantId != null && intervenantId !== 0
                    ? (intervenantsById.get(intervenantId) ?? `#${intervenantId}`)
                    : undefined;
                const equipe =
                  intervenantId != null ? equipesByIntervenantId.get(intervenantId) : undefined;
                const cra = totauxCraForEnfant(suivi, e.id);
                return (
                  <tr key={e.id}>
                    <th scope="row">{missionEnfantLibelle(e, intervenantLabel)}</th>
                    <td>{intervenantLabel ?? "—"}</td>
                    <td>
                      {equipe ? <EquipeBadges value={equipe} /> : "—"}
                    </td>
                    <td>{e.Type_prestation?.trim() || "Freelance_jours"}</td>
                    <td className="fr-cell--right">{cra.count.toLocaleString("fr-FR")}</td>
                    <td className="fr-cell--right">{formatMontantEur(cra.ttc)}</td>
                    <td>{e.Statut?.trim() || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </>
  );
}

function MissionCraPanel({
  realisations,
  intervenantsById,
  bdcById,
}: {
  realisations: SuiviMensuel[];
  intervenantsById: Map<number, string>;
  bdcById: Map<number, string>;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(realisations.length / CRA_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = realisations.slice(
    (safePage - 1) * CRA_PAGE_SIZE,
    safePage * CRA_PAGE_SIZE,
  );

  if (realisations.length === 0) {
    return <p className="fr-mb-0">Aucune ligne de suivi mensuel pour cette mission.</p>;
  }

  return (
    <>
      <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
        <strong>{realisations.length}</strong> ligne{realisations.length === 1 ? "" : "s"}
        {pageCount > 1
          ? ` (affichage de ${(safePage - 1) * CRA_PAGE_SIZE + 1} à ${Math.min(safePage * CRA_PAGE_SIZE, realisations.length)}, ${CRA_PAGE_SIZE} par page)`
          : null}
      </p>
      <TableShell className="fr-mb-2w">
        <table>
          <caption className="fr-sr-only">Réalisations CRA liées à la mission</caption>
          <thead>
            <tr>
              <th scope="col">Période</th>
              <th scope="col">Équipe</th>
              <th scope="col">Intervenant</th>
              <th scope="col" className="fr-cell--right">
                Jours
              </th>
              <th scope="col" className="fr-cell--right">
                Montant TTC
              </th>
              <th scope="col">Tâches réalisées</th>
              <th scope="col">Bon de commande</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s) => {
              const bid = extractSuiviBdcId(s);
              const nomLigne = s.Nom_BdC?.trim();
              const bdcLabel =
                bid != null
                  ? (bdcById.get(bid) ?? nomLigne ?? `BDC #${bid}`)
                  : nomLigne || "—";
              let bdcCell: ReactNode = bdcLabel;
              if (bid != null && bdcLabel !== "—") {
                bdcCell = (
                  <Link className="fr-link" to={`/bdc/${bid}`}>
                    {bdcLabel}
                  </Link>
                );
              }
              return (
                <tr key={s.id}>
                  <td>{formatGristPeriodeMoisAnnee(s.Periode, s)}</td>
                  <td>
                    {s.Equipe?.trim() ? <EquipeBadges value={s.Equipe} /> : "—"}
                  </td>
                  <td>{labelIntervenantSuivi(s, intervenantsById)}</td>
                  <td className="fr-cell--right">
                    {s.Nb_jours != null && Number.isFinite(s.Nb_jours)
                      ? s.Nb_jours.toLocaleString("fr-FR")
                      : "—"}
                  </td>
                  <td className="fr-cell--right">{formatMontantEur(montantTtcSuiviMensuel(s))}</td>
                  <td>{s.Taches_realisees?.trim() || "—"}</td>
                  <td>{bdcCell}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
      {pageCount > 1 ? (
        <Pagination
          id="widget-mission-cra-pagination"
          count={pageCount}
          defaultPage={safePage}
          getPageLinkProps={(p) => ({
            href: `#cra-page-${p}`,
            onClick: (e) => {
              e.preventDefault();
              setPage(p);
            },
          })}
        />
      ) : null}
    </>
  );
}

export function MissionsDetailView() {
  const { id } = useParams();
  const { pa, data } = useMissionsOutlet();
  const [tabId, setTabId] = useState<MissionTabId>("contexte");
  const missionId = id ? Number.parseInt(id, 10) : Number.NaN;
  const mission = data.missions.find((m) => m.id === missionId);

  const produitsById = useMemo(
    () => produitsByIdFromRows(data.produits),
    [data.produits],
  );

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

  const bdcById = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of pa.bdcList) {
      map.set(b.id, b.Nom_BdC?.trim() || `BDC #${b.id}`);
    }
    return map;
  }, [pa.bdcList]);

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

  const ttcMission = useMemo(
    () => realisations.reduce((sum, s) => sum + (montantTtcSuiviMensuel(s) ?? 0), 0),
    [realisations],
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
  const intervenantsLabel = libelleParRefsIds(
    intervenantIdsForMaster(data.missionEnfants, mission.id, mission.Intervenants),
    intervenantsById,
  );
  const respLabel = libelleParRefsIds(
    extractGristReferenceIds(mission.Resp_),
    intervenantsById,
  );

  return (
    <div className="fr-py-1w">
      <p className="fr-mb-2w">
        <Link className="fr-link" to="/missions">
          ← Retour à la liste
        </Link>
      </p>
      <p className="fr-text--sm fr-mb-1v">{mission.Statut?.trim() || "Sans statut"}</p>
      <h1 className="fr-h3">{titre}</h1>
      <p className="fr-text--sm fr-mb-4w">
        <strong>Produit :</strong> {libelleProduitMission(mission, produitsById)}
        {" · "}
        <strong>Équipe :</strong>{" "}
        {extractGristStringTokens(mission.Equipe2).join(", ") || "—"}
        {" · "}
        <strong>Département :</strong> {departementLabel(mission)}
        {" · "}
        <strong>Responsable :</strong> {respLabel}
        {" · "}
        <strong>Intervenant(s) :</strong> {intervenantsLabel}
        {" · "}
        <strong>TTC CRA :</strong> {formatMontantEur(ttcMission)}
        {mission.Derniere_mise_a_jour ? (
          <>
            {" · "}
            <strong>Dernière mise à jour :</strong>{" "}
            {formatGristDateTime(mission.Derniere_mise_a_jour)}
          </>
        ) : null}
      </p>

      <Tabs
        label="Sections de la fiche mission"
        className="fr-mb-2w"
        selectedTabId={tabId}
        onTabChange={(next) => {
          if (
            next === "contexte" ||
            next === "equipe" ||
            next === "realisations" ||
            next === "note-studio" ||
            next === "pieces-jointes"
          ) {
            setTabId(next);
          }
        }}
        tabs={[
          { tabId: "contexte", label: "Contexte", iconId: "fr-icon-file-text-line" },
          { tabId: "equipe", label: "Équipe / prestations", iconId: "fr-icon-user-line" },
          { tabId: "realisations", label: "Réalisations (CRA)", iconId: "fr-icon-table-line" },
          { tabId: "note-studio", label: "Note studio", iconId: "fr-icon-information-line" },
          { tabId: "pieces-jointes", label: "Pièces jointes", iconId: "fr-icon-file-line" },
        ]}
      >
        {tabId === "contexte" ? (
          <MissionContextePanel mission={mission} />
        ) : tabId === "equipe" ? (
          <MissionEquipePanel
            missionTitre={titre}
            enfants={enfants}
            suivi={realisations}
            intervenantsById={intervenantsById}
            equipesByIntervenantId={equipesByIntervenantId}
          />
        ) : tabId === "realisations" ? (
          <MissionCraPanel
            realisations={realisations}
            intervenantsById={intervenantsById}
            bdcById={bdcById}
          />
        ) : tabId === "note-studio" ? (
          isTextFilled(mission.Suivi_resp_studio) ? (
            <MissionProse value={mission.Suivi_resp_studio!} />
          ) : (
            <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Aucune note studio renseignée.</p>
          )
        ) : (
          <>
            <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
              Documents rattachés à cette mission (`Docs` dans Grist). Lecture seule.
            </p>
            <GristAttachmentDownloadLink value={mission.Docs} label="Télécharger le document" />
          </>
        )}
      </Tabs>
    </div>
  );
}
