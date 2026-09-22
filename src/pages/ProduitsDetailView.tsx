import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { MissionEquipePrestationsPanel } from "../components/missions/MissionEquipePrestationsPanel";
import { ReferentielTilesGrid } from "../components/ProduitReferentielTiles";
import { WidgetBreadcrumb } from "../components/WidgetBreadcrumb";
import { tdEquipeTag } from "../components/EquipeTags";
import { StatutBadge } from "../components/StatutBadge";
import {
  useProduitMissionsData,
  type ProduitMissionsData,
} from "../hooks/useProduitMissionsData";
import type { Mission, ProduitSdpc } from "../types";
import {
  enfantsOfMaster,
  suiviBelongsToMasterMission,
} from "../utils/missionEnfants";
import { missionLibelle } from "../utils/missionsList";
import {
  fieldsForTheme,
  formatReferentielField,
  produitNomComplet,
  themeFilledCount,
  type ProduitReferentielTheme,
} from "../utils/produitReferentiel";
import {
  missionsLieesAuProduit,
  produitDepartement,
  produitDisplayName,
  safeHttpUrl,
} from "../utils/produitsList";
import { useProduitsOutlet } from "./ProduitsLayout";

const PRODUITS_CRUMB = [{ label: "Produits", to: "/produits" }] as const;

const REFERENTIEL_THEMES: ProduitReferentielTheme[] = [
  "identite",
  "securite",
  "utilisateurs",
  "cycle",
];

const REFERENTIEL_TAB_SHORT: Record<ProduitReferentielTheme, string> = {
  identite: "Identité",
  securite: "Sécurité",
  utilisateurs: "Utilisateurs",
  cycle: "Cycle de vie",
};

type ProduitFicheTabId = "missions" | ProduitReferentielTheme;

function isProduitFicheTabId(id: string): id is ProduitFicheTabId {
  return (
    id === "missions" ||
    id === "identite" ||
    id === "securite" ||
    id === "utilisateurs" ||
    id === "cycle"
  );
}

function ProduitMissionBlock({
  mission,
  data,
  intervenantsById,
  equipesByIntervenantId,
}: {
  mission: Mission;
  data: ProduitMissionsData;
  intervenantsById: Map<number, string>;
  equipesByIntervenantId: Map<number, string>;
}) {
  const titre = missionLibelle(mission);
  const enfants = useMemo(
    () => enfantsOfMaster(data.missionEnfants, mission.id),
    [data.missionEnfants, mission.id],
  );
  const realisations = useMemo(() => {
    const enfantsById = new Map(data.missionEnfants.map((e) => [e.id, e]));
    return data.suivi.filter((row) =>
      suiviBelongsToMasterMission(row, mission.id, enfantsById),
    );
  }, [data.missionEnfants, data.suivi, mission.id]);

  return (
    <section
      className="produit-fiche__mission-block fr-mb-5w"
      aria-labelledby={`produit-mission-heading-${mission.id}`}
    >
      <div className="produit-fiche__mission-heading fr-mb-3w">
        <h2
          id={`produit-mission-heading-${mission.id}`}
          className="fr-h4 fr-mb-0 produit-fiche__mission-title"
        >
          <Link className="fr-link" to={`/missions/${mission.id}`}>
            {titre}
          </Link>
        </h2>
        {mission.Statut?.trim() ? (
          <StatutBadge statut={mission.Statut} />
        ) : (
          <Badge small as="span" noIcon>
            Sans statut
          </Badge>
        )}
      </div>
      <MissionEquipePrestationsPanel
        missionId={mission.id}
        missionTitre={titre}
        enfants={enfants}
        realisations={realisations}
        intervenantsById={intervenantsById}
        equipesByIntervenantId={equipesByIntervenantId}
        showFilters={false}
        columns="realise"
      />
    </section>
  );
}

function ProduitMissionsPanel({
  produitId,
  data,
}: {
  produitId: number;
  data: ProduitMissionsData;
}) {
  const linked = useMemo(
    () => missionsLieesAuProduit(data.missions, produitId),
    [data.missions, produitId],
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

  if (data.status === "loading" || data.status === "idle") {
    return (
      <Alert
        severity="info"
        small
        title="Chargement"
        description="Chargement des missions…"
        role="status"
      />
    );
  }

  if (data.status === "error") {
    return (
      <Alert
        severity="error"
        title="Missions indisponibles"
        description={data.error ?? "Les missions n’ont pas pu être chargées."}
      />
    );
  }

  return (
    <>
      {data.refsError ? (
        <Alert
          severity="warning"
          small
          title="Données partielles"
          description={data.refsError}
          className="fr-mb-2w"
        />
      ) : null}
      {linked.length === 0 ? (
        <p className="fr-text--sm fr-mb-0">Aucune mission rattachée à ce produit.</p>
      ) : (
        linked.map((mission) => (
          <ProduitMissionBlock
            key={mission.id}
            mission={mission}
            data={data}
            intervenantsById={intervenantsById}
            equipesByIntervenantId={equipesByIntervenantId}
          />
        ))
      )}
    </>
  );
}

function themeTiles(produit: ProduitSdpc, theme: ProduitReferentielTheme) {
  return fieldsForTheme(theme).map((field) => ({
    key: String(field.key),
    label: field.label,
    value: formatReferentielField(produit, field),
    wide: field.kind === "longtext" || field.kind === "urls",
  }));
}

function ProduitFicheTabs({
  produit,
  missionsEnabled,
}: {
  produit: ProduitSdpc;
  missionsEnabled: boolean;
}) {
  const [tabId, setTabId] = useState<ProduitFicheTabId>("missions");
  const longDesc = produit.Description_longue?.trim();
  const missionsData = useProduitMissionsData(missionsEnabled);
  const missionsCount =
    missionsData.status === "ok"
      ? missionsLieesAuProduit(missionsData.missions, produit.id).length
      : null;

  const referentielTabs = REFERENTIEL_THEMES.map((theme) => {
    const counts = themeFilledCount(produit, theme);
    return {
      tabId: theme,
      label: `${REFERENTIEL_TAB_SHORT[theme]} (${counts.filled}/${counts.total})`,
    };
  });

  return (
    <section className="fr-mb-4w" aria-label="Fiche produit">
      <Tabs
        label="Sections de la fiche produit"
        className="fr-mb-2w"
        selectedTabId={tabId}
        onTabChange={(id) => {
          if (isProduitFicheTabId(id)) {
            setTabId(id);
          }
        }}
        tabs={[
          {
            tabId: "missions",
            label:
              missionsCount == null
                ? "Missions"
                : `Missions (${missionsCount})`,
          },
          ...referentielTabs,
        ]}
      >
        {tabId === "missions" ? (
          <ProduitMissionsPanel produitId={produit.id} data={missionsData} />
        ) : (
          <>
            <ReferentielTilesGrid items={themeTiles(produit, tabId)} />
            {tabId === "identite" && longDesc ? (
              <div className="fr-mt-3w">
                <h3 className="fr-h6 fr-mb-1w">Description longue</h3>
                <p className="fr-text--sm" style={{ whiteSpace: "pre-wrap" }}>
                  {longDesc}
                </p>
              </div>
            ) : null}
          </>
        )}
      </Tabs>
    </section>
  );
}

export function ProduitsDetailView() {
  const { id } = useParams();
  const { data } = useProduitsOutlet();
  const produitId = id ? Number.parseInt(id, 10) : NaN;
  const produit = data.produits.find((p) => p.id === produitId);

  if (data.status === "loading" || data.status === "idle") {
    return (
      <div className="fr-py-1w">
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...PRODUITS_CRUMB]}
          currentPageLabel="Chargement"
        />
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Connexion à Grist…"
          role="status"
        />
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className="fr-py-1w">
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...PRODUITS_CRUMB]}
          currentPageLabel="Erreur"
        />
        <Alert
          severity="error"
          title="Erreur"
          description={data.error ?? "La fiche n’a pas pu être chargée."}
        />
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="fr-py-1w">
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...PRODUITS_CRUMB]}
          currentPageLabel="Introuvable"
        />
        <Alert
          severity="warning"
          title="Produit introuvable"
          description={`Aucune fiche produit avec l’id ${id ?? "—"}.`}
        />
      </div>
    );
  }

  const name = produitDisplayName(produit);
  const nomComplet = produitNomComplet(produit);
  const dept = produitDepartement(produit);
  const statut = produit.Statut_actuel?.trim();
  const type = produit.Type_de_produit?.trim();
  const statutCible = produit.Statut_cible?.trim();
  const urlProduit = safeHttpUrl(produit.URLs_du_produit);
  const urlFo = safeHttpUrl(produit.URL_Front_Office);
  const urlCollab = safeHttpUrl(produit.Lien_Espace_Collaboratif_Projet);

  const asideLinks: { label: string; href: string }[] = [];
  if (urlProduit) {
    asideLinks.push({ label: "Site", href: urlProduit });
  } else if (urlFo) {
    asideLinks.push({ label: "Front office", href: urlFo });
  }
  if (urlCollab) {
    asideLinks.push({ label: "Espace collab.", href: urlCollab });
  }

  const heroTitleTags: ReactNode[] = [];
  if (dept) {
    heroTitleTags.push(
      <span key="dept" className="produit-fiche__title-tag">
        {tdEquipeTag(dept, { small: true })}
      </span>,
    );
  }
  if (produit.D_Metier?.trim()) {
    heroTitleTags.push(
      <span key="metier" className="produit-fiche__title-tag">
        {tdEquipeTag(produit.D_Metier.trim(), { small: true })}
      </span>,
    );
  }

  return (
    <div className="fr-container fr-container--fluid fr-px-0 produit-fiche cra-carnet">
      <header className="cra-carnet__hero produit-fiche__hero fr-mb-3w">
        <WidgetBreadcrumb
          id="produit-fiche-breadcrumb"
          className="produit-fiche__breadcrumb"
          segments={[...PRODUITS_CRUMB]}
          currentPageLabel={name}
        />
        <CallOut
          className="cra-carnet__callout produit-fiche__callout"
          titleAs="h2"
          title={
            <span className="produit-fiche__title-row">
              <span className="produit-fiche__title-text">{name}</span>
              {heroTitleTags.length > 0 ? (
                <span className="produit-fiche__title-tags">{heroTitleTags}</span>
              ) : null}
            </span>
          }
          bodyAs="div"
        >
          <div className="cra-carnet__hero-grid">
            <div className="cra-carnet__hero-identity">
              <div className="cra-carnet__hero-identity-text">
                {statut ||
                produit.En_prod === true ||
                produit.Obsolescence === true ||
                statutCible ? (
                  <ul className="fr-badges-group fr-mb-1w">
                    {statut ? (
                      <li>
                        <Badge small as="span" noIcon>
                          {statut}
                        </Badge>
                      </li>
                    ) : null}
                    {statutCible ? (
                      <li>
                        <Badge small as="span" severity="info" noIcon>
                          Cible : {statutCible}
                        </Badge>
                      </li>
                    ) : null}
                    {produit.En_prod === true ? (
                      <li>
                        <Badge small as="span" severity="success" noIcon>
                          En production
                        </Badge>
                      </li>
                    ) : null}
                    {produit.Obsolescence === true ? (
                      <li>
                        <Badge small as="span" severity="warning" noIcon>
                          Obsolescence
                        </Badge>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
                {nomComplet ? (
                  <p className="fr-text--sm fr-mb-1w fr-hint-text">{nomComplet}</p>
                ) : null}
                {type ? (
                  <p className="fr-text--sm fr-mb-0 fr-hint-text">{type}</p>
                ) : null}
              </div>
            </div>

            {asideLinks.length > 0 ? (
              <div className="cra-carnet__hero-aside">
                <p className="fr-text--xs fr-mb-1v fr-hint-text">Liens rapides</p>
                <ul className="fr-mb-0 fr-pl-0" style={{ listStyle: "none" }}>
                  {asideLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        className="fr-link"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CallOut>
      </header>

      <div className="fr-px-2w fr-px-md-0">
        <ProduitFicheTabs
          produit={produit}
          missionsEnabled={data.status === "ok"}
        />
      </div>
    </div>
  );
}
