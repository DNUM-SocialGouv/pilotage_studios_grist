import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { TableShell } from "../components/FinanceRecap";
import { EquipeAvatar } from "../components/equipe/EquipeAvatar";
import { tdEquipeTag } from "../components/EquipeTags";
import {
  equipeDisplayName,
  equipeFieldReadable,
  filterEquipeMembers,
  initialEquipeStatutFilter,
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
  const [searchKey, setSearchKey] = useState(0);
  const [statutFilter, setStatutFilter] = useState("");
  const [equipeFilter, setEquipeFilter] = useState("");
  const [portageFilter, setPortageFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const statutInitialized = useRef(false);

  const showStatut = equipeFieldReadable(data.members, "Statut");
  const showPortage = equipeFieldReadable(data.members, "Portage");
  const showRole = equipeFieldReadable(data.members, "Role_ACL");
  const showSpecialite = equipeFieldReadable(data.members, "Specialite");

  useEffect(() => {
    if (data.status !== "ok" || statutInitialized.current) {
      return;
    }
    setStatutFilter(initialEquipeStatutFilter(data.members));
    statutInitialized.current = true;
  }, [data.status, data.members]);

  useEffect(() => {
    if (!showStatut && statutFilter) {
      setStatutFilter("");
    }
  }, [showStatut, statutFilter]);

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
        statut: showStatut ? statutFilter : "",
        equipe: equipeFilter,
        portage: showPortage ? portageFilter : "",
        role: showRole ? roleFilter : "",
      }),
    [
      data.members,
      equipeFilter,
      portageFilter,
      roleFilter,
      search,
      showPortage,
      showRole,
      showStatut,
      statutFilter,
    ],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const defaultStatut = initialEquipeStatutFilter(data.members);
  const filtresActifsCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n += 1;
    if (showStatut && statutFilter !== defaultStatut) n += 1;
    if (equipeFilter) n += 1;
    if (showPortage && portageFilter) n += 1;
    if (showRole && roleFilter) n += 1;
    return n;
  }, [
    defaultStatut,
    equipeFilter,
    portageFilter,
    roleFilter,
    search,
    showPortage,
    showRole,
    showStatut,
    statutFilter,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSearchKey((k) => k + 1);
    setStatutFilter(defaultStatut);
    setEquipeFilter("");
    setPortageFilter("");
    setRoleFilter("");
    setPage(1);
  };

  const searchLabel = `Rechercher (nom, département${
    showSpecialite ? ", spécialité" : ""
  }${showPortage ? ", portage" : ""}${showRole ? ", rôle" : ""})`;

  const colCount =
    2 + (showPortage ? 1 : 0) + (showStatut ? 1 : 0) + (showSpecialite ? 1 : 0) + (showRole ? 1 : 0);

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

      <Accordion
        id="equipe-liste-filtres"
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
              label={searchLabel}
              allowEmptySearch
              onButtonClick={(text) => {
                setSearch(text);
                setPage(1);
              }}
            />
          </div>
          {showStatut ? (
            <div className="fr-col-12 fr-col-md-6">
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
          ) : null}
          <div className="fr-col-12 fr-col-md-6">
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
          {showPortage ? (
            <div className="fr-col-12 fr-col-md-6">
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
          ) : null}
          {showRole ? (
            <div className="fr-col-12 fr-col-md-6">
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
          ) : null}
        </div>
      </Accordion>

      {filtresActifsCount > 0 ? (
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
          ? filtresActifsCount > 0
            ? "Aucune personne ne correspond aux filtres."
            : "Aucune personne."
          : filtresActifsCount > 0
            ? `${rows.length} personne${rows.length > 1 ? "s" : ""} correspondent aux filtres.`
            : `${rows.length} personne${rows.length > 1 ? "s" : ""}.`}
      </p>

      <TableShell className="fr-mb-3w">
        <table>
          <caption className="fr-sr-only">Liste de l’équipe</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Département</th>
              {showPortage ? <th scope="col">Portage</th> : null}
              {showStatut ? <th scope="col">Statut</th> : null}
              {showSpecialite ? <th scope="col">Spécialité</th> : null}
              {showRole ? <th scope="col">Rôle</th> : null}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={colCount}>—</td>
              </tr>
            ) : (
              paginated.map((member) => (
                <tr key={member.id}>
                  <th scope="row">
                    <Link
                      className="fr-link equipe-list-name-cell"
                      to={`/equipe/${member.id}`}
                    >
                      <EquipeAvatar avatar={member.Avatar} memberId={member.id} size="sm" />
                      {equipeDisplayName(member)}
                    </Link>
                  </th>
                  <td>{tdEquipeTag(dash(member.Equipe))}</td>
                  {showPortage ? <td>{dash(member.Portage)}</td> : null}
                  {showStatut ? <td>{dash(member.Statut)}</td> : null}
                  {showSpecialite ? <td>{dash(member.Specialite)}</td> : null}
                  {showRole ? <td>{dash(member.Role_ACL)}</td> : null}
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
