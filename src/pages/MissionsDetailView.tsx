import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { tdEquipeTag } from "../components/EquipeTags";
import { useMissionEnfantDrawerRef } from "../components/missions/MissionEnfantDrawerContext";
import { useMissionFormDrawerRef } from "../components/missions/MissionFormDrawerContext";
import { MissionContexteDocsPanel } from "../components/missions/MissionContexteDocsPanel";
import { MissionEquipePrestationsPanel } from "../components/missions/MissionEquipePrestationsPanel";
import { MissionLiensFigmaNotionPanel } from "../components/missions/MissionLiensFigmaNotionPanel";
import { MissionNoteStudioEditor } from "../components/missions/MissionNoteStudioEditor";
import { MissionProse } from "../components/missions/MissionProse";
import { StatutBadge } from "../components/StatutBadge";
import { WidgetBreadcrumb } from "../components/WidgetBreadcrumb";
import type { Mission } from "../types";
import { formatGristDateTime } from "../utils/formatGristDate";
import { extractGristReferenceId } from "../utils/gristReferences";
import {
  enfantsOfMaster,
  suiviBelongsToMasterMission,
} from "../utils/missionEnfants";
import {
  libelleProduitMission,
  missionLibelle,
  produitsByIdFromRows,
} from "../utils/missionsList";
import { departementProduitSdpc } from "../utils/pilotageProduits";
import { useMissionsOutlet } from "./MissionsLayout";

type MissionTabId = "contexte" | "equipe" | "notes";

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
  Suivi_resp_studio: "Suivi resp. studio",
};

function parseMissionTabId(params: URLSearchParams): MissionTabId {
  const raw = params.get("onglet") ?? params.get("tab");
  if (raw === "equipe" || raw === "equipe-prestations" || raw === "realisations") {
    return "equipe";
  }
  if (raw === "notes" || raw === "note-studio") {
    return "notes";
  }
  // Alias legacy PJ → Contexte (les pièces jointes y sont désormais)
  if (raw === "pieces-jointes" || raw === "note-pieces-jointes") {
    return "contexte";
  }
  return "contexte";
}

function isTextFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function MissionContextePanel({
  mission,
  onDocsChanged,
}: {
  mission: Mission;
  onDocsChanged: () => Promise<void>;
}) {
  const sections = NARRATIVE_SECTIONS.map((section) => ({
    ...section,
    fields: section.keys
      .map((key) => ({ key, value: mission[key] }))
      .filter((f) => isTextFilled(f.value)),
  })).filter((s) => s.fields.length > 0);
  const hasNarrative = sections.length > 0;

  return (
    <div className="fr-grid-row fr-grid-row--gutters mission-contexte-layout">
      <div className="fr-col-12 fr-col-md-8 mission-contexte-layout__main">
        {hasNarrative ? (
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
          </>
        ) : (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Aucun contenu détaillé renseigné pour cette mission.
          </p>
        )}
      </div>
      <aside className="fr-col-12 fr-col-md-4 mission-contexte-layout__aside">
        <MissionLiensFigmaNotionPanel
          missionId={mission.id}
          value={mission.Liens_FIGMA_Notion}
          onSaved={onDocsChanged}
        />
        <MissionContexteDocsPanel
          missionId={mission.id}
          docs={mission.Docs}
          onChanged={onDocsChanged}
        />
      </aside>
    </div>
  );
}

function MissionNotesPanel({
  mission,
  onNoteSaved,
}: {
  mission: Mission;
  onNoteSaved: () => Promise<void>;
}) {
  return (
    <MissionNoteStudioEditor
      missionId={mission.id}
      value={mission.Suivi_resp_studio}
      onSaved={onNoteSaved}
    />
  );
}

const MISSIONS_CRUMB = [{ label: "Missions", to: "/missions" }] as const;

export function MissionsDetailView() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isReloading, reloadMissions } = useMissionsOutlet();
  const missionFormDrawerRef = useMissionFormDrawerRef();
  const enfantDrawerRef = useMissionEnfantDrawerRef();
  const missionTabId = parseMissionTabId(searchParams);
  const rawOnglet = searchParams.get("onglet") ?? searchParams.get("tab");
  const missionId = id ? Number.parseInt(id, 10) : Number.NaN;
  const mission = data.missions.find((m) => m.id === missionId);

  useEffect(() => {
    if (rawOnglet === "realisations") {
      setSearchParams({ onglet: "equipe" }, { replace: true });
      return;
    }
    if (rawOnglet === "pieces-jointes" || rawOnglet === "note-pieces-jointes") {
      setSearchParams({ onglet: "contexte" }, { replace: true });
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

  if (!Number.isFinite(missionId)) {
    return (
      <div className="fr-py-1w">
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...MISSIONS_CRUMB]}
          currentPageLabel="Introuvable"
        />
        <Alert
          severity="warning"
          title="Mission introuvable"
          description={`Identifiant de mission invalide : ${id ?? "—"}.`}
        />
      </div>
    );
  }

  if (!mission) {
    if (isReloading) {
      return (
        <div className="fr-py-1w">
          <WidgetBreadcrumb
            className="fr-mb-2w"
            segments={[...MISSIONS_CRUMB]}
            currentPageLabel="Chargement"
          />
          <Alert
            severity="info"
            small
            title="Chargement"
            description="Chargement de la mission…"
            role="status"
          />
        </div>
      );
    }
    return (
      <div className="fr-py-1w">
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...MISSIONS_CRUMB]}
          currentPageLabel="Introuvable"
        />
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
  const departementRaw = produitRecord ? departementProduitSdpc(produitRecord) : "—";
  const departementHasValue = departementRaw !== "—" && departementRaw.trim().length > 0;
  const produitLabel = libelleProduitMission(mission, produitsById);
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
    <div className="fr-container fr-container--fluid fr-px-0 mission-fiche cra-carnet">
      <header className="cra-carnet__hero mission-fiche__hero fr-mb-3w">
        <WidgetBreadcrumb
          id="mission-fiche-breadcrumb"
          className="mission-fiche__breadcrumb"
          segments={[...MISSIONS_CRUMB]}
          currentPageLabel={titre}
        />
        <CallOut
          className="cra-carnet__callout mission-fiche__callout"
          titleAs="h2"
          title={titre}
          bodyAs="div"
        >
          <div className="cra-carnet__hero-grid">
            <div className="cra-carnet__hero-identity">
              <div className="cra-carnet__hero-identity-text">
                <ul className="fr-badges-group fr-mb-2w">
                  <li>
                    <StatutBadge statut={mission.Statut} />
                  </li>
                </ul>
                <div
                  className="fr-grid-row mission-fiche__hero-meta"
                  role="group"
                  aria-label="Informations de la mission"
                >
                  <div className={`${metaColClass} mission-fiche__hero-meta-item`}>
                    <div className="fr-text--xs fr-mb-1v mission-fiche__hero-meta-label">
                      Produit
                    </div>
                    <div className="fr-text--sm fr-mb-0">{produitLabel}</div>
                  </div>
                  <div className={`${metaColClass} mission-fiche__hero-meta-item`}>
                    <div className="fr-text--xs fr-mb-1v mission-fiche__hero-meta-label">
                      Département
                    </div>
                    <div className="fr-text--sm fr-mb-0">
                      {departementHasValue
                        ? tdEquipeTag(departementRaw, { small: true })
                        : "—"}
                    </div>
                  </div>
                  {derniereMajLabel != null ? (
                    <div className={`${metaColClass} mission-fiche__hero-meta-item`}>
                      <div className="fr-text--xs fr-mb-1v mission-fiche__hero-meta-label">
                        Dernière mise à jour
                      </div>
                      <div className="fr-text--sm fr-mb-0">{derniereMajLabel}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="cra-carnet__hero-aside">
              <p className="fr-text--xs fr-mb-1v fr-hint-text">Actions</p>
              <button
                type="button"
                className="fr-btn fr-btn--primary fr-icon-edit-line fr-btn--icon-left"
                onClick={() => missionFormDrawerRef.current?.openEdit(mission)}
              >
                Modifier
              </button>
            </div>
          </div>
        </CallOut>
      </header>

      <div className="fr-px-2w fr-px-md-0">
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
              label: "Note studio",
              iconId: "fr-icon-draft-line",
            },
          ]}
        >
          {missionTabId === "contexte" ? (
            <MissionContextePanel mission={mission} onDocsChanged={reloadMissions} />
          ) : null}
          {missionTabId === "equipe" ? (
            <MissionEquipePrestationsPanel
              key={mission.id}
              missionId={mission.id}
              missionTitre={titre}
              enfants={enfants}
              realisations={realisations}
              intervenantsById={intervenantsById}
              equipesByIntervenantId={equipesByIntervenantId}
              onAddPrestation={(mid) => enfantDrawerRef.current?.openCreate(mid)}
              onEditPrestation={(enfant) => enfantDrawerRef.current?.openEdit(enfant)}
            />
          ) : null}
          {missionTabId === "notes" ? (
            <MissionNotesPanel mission={mission} onNoteSaved={reloadMissions} />
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}
