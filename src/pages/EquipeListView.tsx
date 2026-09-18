import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { TableShell } from "../components/FinanceRecap";
import {
  EQUIPE_DEFAULT_STATUT,
  equipeDisplayName,
  filterEquipeMembers,
  uniqueSortedLabels,
} from "../utils/equipeList";
import { useEquipeOutlet } from "./EquipeLayout";

const PAGE_SIZE = 10;

function dash(value: string | undefined): string {
  const t = value?.trim();
  return t || "—";
}

export function EquipeListView() {
  const { data } = useEquipeOutlet();
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [statutFilter, setStatutFilter] = useState(EQUIPE_DEFAULT_STATUT);
  const [equipeFilter, setEquipeFilter] = useState("");
  const [portageFilter, setPortageFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const statutOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Statut)),
    [data.members],
  );
  const equipeOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Equipe)),
    [data.members],
  );
  const portageOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Portage)),
    [data.members],
  );
  const roleOptions = useMemo(
    () => uniqueSortedLabels(data.members.map((m) => m.Role_ACL)),
    [data.members],
  );

  const rows = useMemo(
    () =>
      filterEquipeMembers(data.members, {
        search,
        statut: statutFilter,
        equipe: equipeFilter,
        portage: portageFilter,
        role: roleFilter,
      }),
    [data.members, equipeFilter, portageFilter, roleFilter, search, statutFilter],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive = Boolean(
    search.trim() ||
      statutFilter !== EQUIPE_DEFAULT_STATUT ||
      equipeFilter ||
      portageFilter ||
      roleFilter,
  );

  const resetFilters = () => {
    setSearch("");
    setSearchDraft("");
    setStatutFilter(EQUIPE_DEFAULT_STATUT);
    setEquipeFilter("");
    setPortageFilter("");
    setRoleFilter("");
    setPage(1);
  };

  if (data.status === "loading" || data.status === "idle") {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Équipe</h1>
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
        <h1 className="fr-h3">Équipe</h1>
        <Alert
          severity="error"
          title="Erreur"
          description={data.error ?? "La liste de l’équipe n’a pas pu être chargée."}
        />
      </div>
    );
  }

  return (
    <div className="fr-py-1w">
      <h1 className="fr-h3">Équipe</h1>
      <p className="fr-text--sm fr-mb-2w">
        Annuaire des personnes du pilotage — consultation uniquement.
      </p>

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-1w">
        <div className="fr-col-12">
          <div className="fr-search-bar" role="search">
            <label className="fr-label" htmlFor="equipe-widget-search">
              Rechercher (nom, département, portage, spécialité, rôle)
            </label>
            <input
              className="fr-input"
              type="search"
              id="equipe-widget-search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setSearch(searchDraft);
                  setPage(1);
                }
              }}
            />
            <button
              type="button"
              className="fr-btn"
              title="Rechercher"
              onClick={() => {
                setSearch(searchDraft);
                setPage(1);
              }}
            >
              Rechercher
            </button>
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Statut"
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
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Département"
            nativeSelectProps={{
              value: equipeFilter,
              onChange: (e) => {
                setEquipeFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Tous les départements</option>
            {equipeOptions.map((equipe) => (
              <option key={equipe} value={equipe}>
                {equipe}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Portage"
            nativeSelectProps={{
              value: portageFilter,
              onChange: (e) => {
                setPortageFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Tous les portages</option>
            {portageOptions.map((portage) => (
              <option key={portage} value={portage}>
                {portage}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Rôle"
            nativeSelectProps={{
              value: roleFilter,
              onChange: (e) => {
                setRoleFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Tous les rôles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtersActive ? (
        <p className="fr-mb-2w">
          <button type="button" className="fr-link" onClick={resetFilters}>
            Réinitialiser les filtres
          </button>
        </p>
      ) : null}

      <p className="fr-text--sm fr-mb-2w">
        {rows.length === 0
          ? filtersActive
            ? "Aucune personne ne correspond aux filtres."
            : "Aucune personne."
          : `${rows.length} personne${rows.length > 1 ? "s" : ""}.`}
      </p>

      <TableShell className="fr-mb-3w">
        <table>
          <caption className="fr-sr-only">Liste de l’équipe</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Département</th>
              <th scope="col">Portage</th>
              <th scope="col">Statut</th>
              <th scope="col">Spécialité</th>
              <th scope="col">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6}>—</td>
              </tr>
            ) : (
              paginated.map((member) => (
                <tr key={member.id}>
                  <th scope="row">
                    <Link className="fr-link" to={`/equipe/${member.id}`}>
                      {equipeDisplayName(member)}
                    </Link>
                  </th>
                  <td>{dash(member.Equipe)}</td>
                  <td>{dash(member.Portage)}</td>
                  <td>{dash(member.Statut)}</td>
                  <td>{dash(member.Specialite)}</td>
                  <td>{dash(member.Role_ACL)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {pageCount > 1 ? (
        <Pagination
          id="widget-equipe-list-pagination"
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
