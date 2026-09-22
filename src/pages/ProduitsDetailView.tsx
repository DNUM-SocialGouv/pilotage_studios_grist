import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { TableShell } from "../components/FinanceRecap";
import { tdEquipeTag } from "../components/EquipeTags";
import { StatutBadge } from "../components/StatutBadge";
import { useProduitMissionsData } from "../hooks/useProduitMissionsData";
import {
  missionsLieesAuProduit,
  produitDepartement,
  produitDescription,
  produitDisplayName,
  safeHttpUrl,
} from "../utils/produitsList";
import { useProduitsOutlet } from "./ProduitsLayout";

const MISSIONS_PAGE_SIZE = 10;

function metaColClassForCount(count: number): string {
  if (count >= 4) return "fr-col-12 fr-col-md-3";
  if (count === 3) return "fr-col-12 fr-col-md-4";
  if (count === 2) return "fr-col-12 fr-col-md-6";
  return "fr-col-12";
}

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
  const dept = produitDepartement(produit);
  const description = produitDescription(produit);
  const statut = produit.Statut_actuel?.trim();
  const type = produit.Type_de_produit?.trim();
  const chef = produit.Chef_de_produit?.trim();
  const equipe = produit.Equipe?.trim();
  const statutCible = produit.Statut_cible?.trim();

  const metaCells: { label: string; value: ReactNode }[] = [
    {
      label: "Département",
      value: dept ? tdEquipeTag(dept) : "—",
    },
  ];
  if (type) {
    metaCells.push({ label: "Type", value: type });
  }
  if (chef) {
    metaCells.push({ label: "Chef de produit", value: chef });
  }
  if (equipe) {
    metaCells.push({ label: "Équipe produit", value: equipe });
  }
  if (statutCible) {
    metaCells.push({ label: "Statut cible", value: statutCible });
  }

  const metaColClass = metaColClassForCount(metaCells.length);

  const links: { label: string; href: string }[] = [];
  const urlProduit = safeHttpUrl(produit.URLs_du_produit);
  const urlFo = safeHttpUrl(produit.URL_Front_Office);
  const urlBo = safeHttpUrl(produit.URL_Back_Office);
  const urlCollab = safeHttpUrl(produit.Lien_Espace_Collaboratif_Projet);
  if (urlProduit) {
    links.push({ label: "URL du produit", href: urlProduit });
  }
  if (urlFo) {
    links.push({ label: "Front office", href: urlFo });
  }
  if (urlBo) {
    links.push({ label: "Back office", href: urlBo });
  }
  if (urlCollab) {
    links.push({ label: "Espace collaboratif", href: urlCollab });
  }

  return (
    <div className="fr-py-1w">
      <p className="fr-mb-2w">
        <Link className="fr-link" to="/produits">
          ← Retour à la liste
        </Link>
      </p>

      <div className="fr-mb-2w">
        {statut || produit.En_prod === true || produit.Obsolescence === true ? (
          <ul className="fr-badges-group fr-mb-1w">
            {statut ? (
              <li>
                <Badge small as="span" noIcon>
                  {statut}
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
        <h1 className="fr-h3 fr-mb-0">{name}</h1>
      </div>

      <div
        className="fr-grid-row equipe-fiche-meta-bandeau fr-mb-4w"
        role="group"
        aria-label="Informations du produit"
      >
        {metaCells.map((cell) => (
          <div
            key={cell.label}
            className={`${metaColClass} equipe-fiche-meta-bandeau__cell`}
          >
            <div className="fr-text--xs fr-mb-1v equipe-fiche-meta-bandeau__label">
              {cell.label}
            </div>
            <div className="fr-text--sm fr-mb-0">{cell.value}</div>
          </div>
        ))}
      </div>

      {description ? (
        <section className="fr-mb-4w" aria-labelledby="produit-description">
          <h2 id="produit-description" className="fr-h6">
            Description
          </h2>
          <p className="fr-text--sm" style={{ whiteSpace: "pre-wrap" }}>
            {description}
          </p>
        </section>
      ) : null}

      {links.length > 0 ? (
        <section className="fr-mb-4w" aria-labelledby="produit-liens">
          <h2 id="produit-liens" className="fr-h6">
            Liens
          </h2>
          <ul className="fr-mb-0">
            {links.map((link) => (
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
        </section>
      ) : null}

      <ProduitMissionsSection produitId={produit.id} enabled={data.status === "ok"} />
    </div>
  );
}
