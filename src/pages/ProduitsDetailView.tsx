import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { TableShell } from "../components/FinanceRecap";
import { ReferentielTilesGrid } from "../components/ProduitReferentielTiles";
import { tdEquipeTag } from "../components/EquipeTags";
import { StatutBadge } from "../components/StatutBadge";
import { useProduitMissionsData } from "../hooks/useProduitMissionsData";
import type { ProduitSdpc } from "../types";
import {
  computeReferentielCompletion,
  fieldsForTheme,
  formatReferentielField,
  produitNomComplet,
  PRODUIT_REFERENTIEL_THEME_LABELS,
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

const MISSIONS_PAGE_SIZE = 10;

const DETAIL_THEMES: ProduitReferentielTheme[] = [
  "securite",
  "utilisateurs",
  "cycle",
];

function ProduitMissionsSection({
  produitId,
  enabled,
}: {
  produitId: number;
  enabled: boolean;
}) {
  const data = useProduitMissionsData(enabled);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [produitId]);

  const linked = useMemo(
    () => missionsLieesAuProduit(data.missions, produitId),
    [data.missions, produitId],
  );

  const pageCount = Math.max(1, Math.ceil(linked.length / MISSIONS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = linked.slice(
    (safePage - 1) * MISSIONS_PAGE_SIZE,
    safePage * MISSIONS_PAGE_SIZE,
  );

  return (
    <section className="fr-mb-3w" aria-labelledby="produit-fiche-missions">
      <h2 id="produit-fiche-missions" className="fr-h6 fr-mb-2w">
        Missions liées
      </h2>

      {data.status === "loading" || data.status === "idle" ? (
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Chargement des missions…"
          role="status"
        />
      ) : null}

      {data.status === "error" ? (
        <Alert
          severity="error"
          title="Missions indisponibles"
          description={data.error ?? "Les missions n’ont pas pu être chargées."}
        />
      ) : null}

      {data.status === "ok" ? (
        <>
          <p className="fr-text--sm fr-mb-2w">
            {linked.length === 0
              ? "Aucune mission rattachée à ce produit."
              : `${linked.length} mission${linked.length > 1 ? "s" : ""} rattachée${linked.length > 1 ? "s" : ""}.`}
          </p>
          <TableShell className="fr-mb-2w">
            <table>
              <caption className="fr-sr-only">Missions liées au produit</caption>
              <thead>
                <tr>
                  <th scope="col">Mission</th>
                  <th scope="col">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={2}>—</td>
                  </tr>
                ) : (
                  paginated.map((mission) => (
                    <tr key={mission.id}>
                      <th scope="row">
                        <Link className="fr-link" to={`/missions/${mission.id}`}>
                          {mission.Nom_de_la_mission?.trim() || `Mission #${mission.id}`}
                        </Link>
                      </th>
                      <td>
                        {mission.Statut?.trim() ? (
                          <StatutBadge statut={mission.Statut} />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableShell>
          {pageCount > 1 ? (
            <Pagination
              key={safePage}
              id={`widget-produit-missions-pagination-${produitId}`}
              count={pageCount}
              defaultPage={safePage}
              getPageLinkProps={(p) => ({
                href: `#missions-page-${p}`,
                onClick: (e) => {
                  e.preventDefault();
                  setPage(p);
                },
              })}
            />
          ) : null}
        </>
      ) : null}
    </section>
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

function ProduitReferentielSection({ produit }: { produit: ProduitSdpc }) {
  const completion = computeReferentielCompletion(produit);
  const identiteCount = themeFilledCount(produit, "identite");
  const longDesc = produit.Description_longue?.trim();

  const emptyTags =
    completion.emptyLabels.length > 0 && completion.emptyLabels.length <= 12
      ? completion.emptyLabels
      : [];

  return (
    <section className="fr-mb-4w" aria-labelledby="produit-referentiel">
      <h2 id="produit-referentiel" className="fr-h6 fr-mb-2w">
        Référentiel SDPC
      </h2>

      <Alert
        className="fr-mb-2w"
        severity="info"
        small
        title="Lecture seule — catalogue produits"
        description={
          produit.UUID
            ? `Informations issues de la table produits du document pilotage (UUID ${produit.UUID}), alimentée par la synchronisation depuis le Tableau de pilotage SDPC. Non éditables ici.`
            : "Informations issues de la table produits du document pilotage. Non éditables ici."
        }
      />

      <ul className="fr-badges-group fr-mb-3w">
        <li>
          <Badge small as="span" severity="warning" noIcon>
            Champs non remplis : {completion.empty}
          </Badge>
        </li>
        <li>
          <Badge small as="span" severity="warning" noIcon>
            Taux de complétion : {completion.percent} %
          </Badge>
        </li>
      </ul>

      {emptyTags.length > 0 ? (
        <p className="fr-text--xs fr-mb-3w">
          <span className="fr-hint-text">Manquants : </span>
          {emptyTags.join(" · ")}
        </p>
      ) : null}

      <div className="fr-mb-3w">
        <h3 className="fr-h6 fr-mb-2w">
          Essentiel — identité ({identiteCount.filled}/{identiteCount.total}{" "}
          renseignés)
        </h3>
        <ReferentielTilesGrid items={themeTiles(produit, "identite")} />
      </div>

      {longDesc ? (
        <div className="fr-mb-3w">
          <h3 className="fr-h6 fr-mb-1w">Description longue</h3>
          <p className="fr-text--sm" style={{ whiteSpace: "pre-wrap" }}>
            {longDesc}
          </p>
        </div>
      ) : null}

      <div className="fr-accordions-group">
        {DETAIL_THEMES.map((theme) => {
          const counts = themeFilledCount(produit, theme);
          const label = PRODUIT_REFERENTIEL_THEME_LABELS[theme];
          return (
            <Accordion
              key={theme}
              label={`${label} (${counts.filled}/${counts.total} renseignés)`}
              defaultExpanded={false}
            >
              <ReferentielTilesGrid items={themeTiles(produit, theme)} />
            </Accordion>
          );
        })}
      </div>
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
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/produits">
            ← Retour à la liste
          </Link>
        </p>
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
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/produits">
            ← Retour à la liste
          </Link>
        </p>
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
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/produits">
            ← Retour à la liste
          </Link>
        </p>
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
  const chef = produit.Chef_de_produit?.trim();
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

  const heroMeta: ReactNode[] = [];
  if (dept) {
    heroMeta.push(
      <span key="dept" className="produit-fiche__hero-meta-item">
        {tdEquipeTag(dept, { small: true })}
      </span>,
    );
  }
  if (produit.D_Metier?.trim()) {
    heroMeta.push(
      <span key="metier" className="produit-fiche__hero-meta-item">
        {tdEquipeTag(produit.D_Metier.trim(), { small: true })}
      </span>,
    );
  }
  if (type) {
    heroMeta.push(
      <span key="type" className="fr-text--sm fr-hint-text">
        {type}
      </span>,
    );
  }

  return (
    <div className="fr-container fr-container--fluid fr-px-0 produit-fiche">
      <p className="fr-mb-2w fr-px-2w fr-px-md-0">
        <Link className="fr-link" to="/produits">
          ← Retour à la liste
        </Link>
      </p>

      <header className="produit-fiche__hero fr-mb-3w">
        <CallOut
          className="produit-fiche__callout"
          colorVariant="blue-cumulus"
          titleAs="h2"
          title={name}
          bodyAs="div"
        >
          <div className="cra-carnet__hero-grid">
            <div className="cra-carnet__hero-identity">
              <div className="cra-carnet__hero-identity-text">
                {nomComplet ? (
                  <p className="fr-text--sm fr-mb-1w fr-hint-text">{nomComplet}</p>
                ) : null}
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
                {heroMeta.length > 0 ? (
                  <div className="produit-fiche__hero-meta fr-mb-1w">{heroMeta}</div>
                ) : null}
                {chef ? (
                  <p className="fr-text--sm fr-mb-0">
                    <span className="fr-hint-text">Chef de produit — </span>
                    {chef}
                  </p>
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
        <ProduitReferentielSection produit={produit} />
        <ProduitMissionsSection produitId={produit.id} enabled={data.status === "ok"} />
      </div>
    </div>
  );
}
