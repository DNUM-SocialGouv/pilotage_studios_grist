import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { TableShell } from "../components/FinanceRecap";
import { tdEquipeTag } from "../components/EquipeTags";
import {
  canApplyInvestissementFilter,
  filterProduits,
  PRODUITS_DEFAULT_AVEC_INVESTISSEMENT,
  produitDepartement,
  produitDepartementOptions,
  produitDisplayName,
  produitEnProdLabel,
  produitIdsAvecInvestissement,
  produitStatutOptions,
} from "../utils/produitsList";
import { useProduitsOutlet } from "./ProduitsLayout";

const PAGE_SIZE = 10;

function dash(value: string | undefined): string {
  const t = value?.trim();
  return t || "—";
}

export function ProduitsListView() {
  const { data } = useProduitsOutlet();
  const [search, setSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [departementFilter, setDepartementFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [avecInvestissementStudio, setAvecInvestissementStudio] = useState(
    PRODUITS_DEFAULT_AVEC_INVESTISSEMENT,
  );
  const [page, setPage] = useState(1);

  const departementOptions = useMemo(
    () => produitDepartementOptions(data.produits),
    [data.produits],
  );
  const statutOptions = useMemo(
    () => produitStatutOptions(data.produits),
    [data.produits],
  );

  const produitIdsInvestis = useMemo(
    () =>
      produitIdsAvecInvestissement(data.missions, data.missionEnfants, data.suivi),
    [data.missionEnfants, data.missions, data.suivi],
  );

  /** Pas de CRA lisible → ne pas vider le catalogue (droits Realise / tables absentes). */
  const investFilterApplicable = canApplyInvestissementFilter(produitIdsInvestis);
  const applyInvestFilter = avecInvestissementStudio && investFilterApplicable;

  const rows = useMemo(
    () =>
      filterProduits(
        data.produits,
        {
          search,
          departement: departementFilter,
          statut: statutFilter,
          avecInvestissementStudio: applyInvestFilter,
        },
        produitIdsInvestis,
      ),
    [
      applyInvestFilter,
      data.produits,
      departementFilter,
      produitIdsInvestis,
      search,
      statutFilter,
    ],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtresActifsCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n += 1;
    if (departementFilter) n += 1;
    if (statutFilter) n += 1;
    if (avecInvestissementStudio !== PRODUITS_DEFAULT_AVEC_INVESTISSEMENT) n += 1;
    return n;
  }, [avecInvestissementStudio, departementFilter, search, statutFilter]);

  const showReset =
    filtresActifsCount > 0 ||
    (avecInvestissementStudio && rows.length === 0 && data.produits.length > 0);

  const investFilterIneffective =
    avecInvestissementStudio &&
    !investFilterApplicable &&
    data.produits.length > 0 &&
    data.status === "ok";

  const resetFilters = () => {
    setSearch("");
    setSearchKey((k) => k + 1);
    setDepartementFilter("");
    setStatutFilter("");
    // Liste vide à cause du filtre investissement → désactiver plutôt que revenir au défaut ON.
    if (avecInvestissementStudio && rows.length === 0 && data.produits.length > 0) {
      setAvecInvestissementStudio(false);
    } else {
      setAvecInvestissementStudio(PRODUITS_DEFAULT_AVEC_INVESTISSEMENT);
    }
    setPage(1);
  };

  if (data.status === "loading" || data.status === "idle") {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Produits</h1>
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
        <h1 className="fr-h3">Produits</h1>
        <Alert
          severity="error"
          title="Erreur"
          description={data.error ?? "Le catalogue produits n’a pas pu être chargé."}
        />
      </div>
    );
  }

  return (
    <div className="fr-py-1w">
      <h1 className="fr-h3">Produits</h1>

      {data.refsError ? (
        <Alert
          className="fr-mb-2w"
          severity="warning"
          small
          title="Données partielles"
          description={data.refsError}
        />
      ) : null}

      {investFilterIneffective ? (
        <Alert
          className="fr-mb-2w"
          severity="info"
          small
          title="Filtre investissement non appliqué"
          description="Aucun CRA (réalisations) lisible pour calculer l’investissement studio — catalogue complet affiché. Vérifiez vos droits sur les réalisations, ou désactivez l’interrupteur."
        />
      ) : null}

      <Accordion
        id="produits-liste-filtres"
        className="missions-liste-filtres fr-mb-2w"
        titleAs="h2"
        defaultExpanded
        label={
          filtresActifsCount > 0
            ? `Filtres (${filtresActifsCount} actif${filtresActifsCount > 1 ? "s" : ""})`
            : "Filtres"
        }
      >
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
          <div className="fr-col-12">
            <SearchBar
              key={searchKey}
              label="Rechercher (nom, département, statut, chef de produit)"
              allowEmptySearch
              onButtonClick={(text) => {
                setSearch(text);
                setPage(1);
              }}
            />
          </div>
          <div className="fr-col-12">
            <ToggleSwitch
              id="produits-filtre-investissement-studio"
              label="Afficher uniquement les produits avec investissement studio"
              checked={avecInvestissementStudio}
              showCheckedHint={false}
              onChange={(checked) => {
                setAvecInvestissementStudio(checked);
                setPage(1);
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-md-6">
            <Select
              label="Département"
              nativeSelectProps={{
                value: departementFilter,
                onChange: (e) => {
                  setDepartementFilter(e.currentTarget.value);
                  setPage(1);
                },
              }}
            >
              <option value="">Tous les départements</option>
              {departementOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </div>
          <div className="fr-col-12 fr-col-md-6">
            <Select
              label="Statut actuel"
              nativeSelectProps={{
                value: statutFilter,
                onChange: (e) => {
                  setStatutFilter(e.currentTarget.value);
                  setPage(1);
                },
              }}
            >
              <option value="">Tous les statuts</option>
              {statutOptions.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Accordion>

      {showReset ? (
        <div className="fr-mb-2w">
          <a
            href="#reinitialiser-filtres"
            className="fr-link"
            onClick={(e) => {
              e.preventDefault();
              resetFilters();
            }}
          >
            Réinitialiser les filtres
          </a>
        </div>
      ) : null}

      <p className="fr-text--sm fr-mb-2w">
        {rows.length === 0
          ? filtresActifsCount > 0 || applyInvestFilter
            ? "Aucun produit ne correspond aux filtres. Désactivez l’interrupteur investissement studio pour voir tout le catalogue."
            : "Aucun produit."
          : filtresActifsCount > 0 || applyInvestFilter
            ? `${rows.length} produit${rows.length > 1 ? "s" : ""} correspondent aux filtres.`
            : `${rows.length} produit${rows.length > 1 ? "s" : ""}.`}
      </p>

      <TableShell className="fr-mb-3w">
        <table>
          <caption className="fr-sr-only">Liste des produits SDPC</caption>
          <thead>
            <tr>
              <th scope="col">Produit</th>
              <th scope="col">Département</th>
              <th scope="col">Statut actuel</th>
              <th scope="col">En production</th>
              <th scope="col">Chef de produit</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5}>—</td>
              </tr>
            ) : (
              paginated.map((produit) => {
                const dept = produitDepartement(produit);
                const enProd = produitEnProdLabel(produit.En_prod);
                return (
                  <tr key={produit.id}>
                    <th scope="row">
                      <Link className="fr-link" to={`/produits/${produit.id}`}>
                        {produitDisplayName(produit)}
                      </Link>
                    </th>
                    <td>{dept ? tdEquipeTag(dept) : "—"}</td>
                    <td>{dash(produit.Statut_actuel)}</td>
                    <td>
                      {enProd === "—" ? (
                        "—"
                      ) : (
                        <Badge
                          small
                          as="span"
                          noIcon
                          severity={produit.En_prod ? "success" : undefined}
                        >
                          {enProd}
                        </Badge>
                      )}
                    </td>
                    <td>{dash(produit.Chef_de_produit)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableShell>

      {pageCount > 1 ? (
        <Pagination
          key={safePage}
          id="widget-produits-list-pagination"
          count={pageCount}
          defaultPage={safePage}
          getPageLinkProps={(p) => ({
            href: `#page-${p}`,
            onClick: (e) => {
              e.preventDefault();
              setPage(p);
            },
          })}
        />
      ) : null}
    </div>
  );
}
