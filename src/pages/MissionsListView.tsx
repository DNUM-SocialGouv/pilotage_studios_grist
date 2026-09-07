import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { EquipeBadges } from "../components/EquipeBadges";
import {
  ExpandToggle,
  ExpandableChildCell,
  ExpandableChildRow,
  useExpandableRowIds,
} from "../components/expandable";
import { TableShell } from "../components/FinanceRecap";
import { aggregateCraByMissionId } from "../utils/craByMission";
import { formatGristDate } from "../utils/formatGristDate";
import { formatMontantEur } from "../utils/formatMontant";
import { extractGristReferenceId, extractGristReferenceIds } from "../utils/gristReferences";
import { intervenantIdsForMaster, missionEnfantLibelle } from "../utils/missionEnfants";
import {
  enfantsByMasterId,
  libelleParRefsIds,
  libelleProduitMission,
  missionDepartementOptions,
  missionEquipeOptions,
  missionIntervenantOptions,
  missionLibelle,
  missionMatchesFilters,
  missionProduitOptions,
  missionStatutOptions,
  produitsByIdFromRows,
} from "../utils/missionsList";
import { useMissionsOutlet } from "./MissionsLayout";

const PAGE_SIZE = 10;

export function MissionsListView() {
  const { data } = useMissionsOutlet();
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [equipeFilter, setEquipeFilter] = useState("");
  const [departementFilter, setDepartementFilter] = useState("");
  const [produitFilter, setProduitFilter] = useState("");
  const [intervenantFilter, setIntervenantFilter] = useState("");
  const [page, setPage] = useState(1);

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

  const enfantsByMaster = useMemo(
    () => enfantsByMasterId(data.missionEnfants),
    [data.missionEnfants],
  );

  const craParMissionId = useMemo(
    () => aggregateCraByMissionId(data.suivi, data.missionEnfants),
    [data.suivi, data.missionEnfants],
  );

  const statutOptions = useMemo(() => missionStatutOptions(data.missions), [data.missions]);
  const equipeOptions = useMemo(() => missionEquipeOptions(data.missions), [data.missions]);
  const departementOptions = useMemo(
    () => missionDepartementOptions(data.missions),
    [data.missions],
  );
  const produitOptions = useMemo(
    () => missionProduitOptions(data.missions, produitsById),
    [data.missions, produitsById],
  );
  const intervenantOptions = useMemo(
    () => missionIntervenantOptions(data.missions, data.missionEnfants, intervenantsById),
    [data.missions, data.missionEnfants, intervenantsById],
  );

  const rows = useMemo(() => {
    return data.missions.filter((m) =>
      missionMatchesFilters(
        m,
        {
          search,
          equipe: equipeFilter,
          statut: statutFilter,
          departement: departementFilter,
          produitId: produitFilter,
          intervenantId: intervenantFilter,
        },
        produitsById,
        data.missionEnfants,
      ),
    );
  }, [
    data.missionEnfants,
    data.missions,
    departementFilter,
    equipeFilter,
    intervenantFilter,
    produitsById,
    produitFilter,
    search,
    statutFilter,
  ]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const {
    isExpanded: isMasterExpanded,
    toggle: toggleMasterExpanded,
  } = useExpandableRowIds<number>(
    undefined,
    `${search}|${equipeFilter}|${statutFilter}|${departementFilter}|${produitFilter}|${intervenantFilter}|${safePage}`,
  );

  const filtersActive = Boolean(
    search.trim() ||
      statutFilter ||
      equipeFilter ||
      departementFilter ||
      produitFilter ||
      intervenantFilter,
  );

  const resetFilters = () => {
    setSearch("");
    setSearchDraft("");
    setStatutFilter("");
    setEquipeFilter("");
    setDepartementFilter("");
    setProduitFilter("");
    setIntervenantFilter("");
    setPage(1);
  };

  return (
    <div className="fr-py-1w">
      <h1 className="fr-h3">Missions</h1>

      {data.refsError ? (
        <Alert
          severity="warning"
          small
          title="Référentiels partiels"
          description={data.refsError}
          className="fr-mb-2w"
        />
      ) : null}

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-1w">
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
          <div className="fr-search-bar" role="search">
            <label className="fr-label" htmlFor="missions-widget-search">
              Rechercher une mission
            </label>
            <input
              className="fr-input"
              type="search"
              id="missions-widget-search"
              placeholder="Nom, produit…"
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
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
          <Select
            label="Équipe"
            nativeSelectProps={{
              value: equipeFilter,
              onChange: (e) => {
                setEquipeFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Toutes les équipes</option>
            {equipeOptions.map((equipe) => (
              <option key={equipe} value={equipe}>
                {equipe}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
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
            {departementOptions.map((departement) => (
              <option key={departement} value={departement}>
                {departement}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top fr-mb-1w">
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
          <Select
            label="Produit"
            nativeSelectProps={{
              value: produitFilter,
              onChange: (e) => {
                setProduitFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Tous les produits</option>
            {produitOptions.map((produit) => (
              <option key={produit.id} value={String(produit.id)}>
                {produit.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
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
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
          <Select
            label="Intervenant"
            nativeSelectProps={{
              value: intervenantFilter,
              onChange: (e) => {
                setIntervenantFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Tous les intervenants</option>
            {intervenantOptions.map((intervenant) => (
              <option key={intervenant.id} value={String(intervenant.id)}>
                {intervenant.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="fr-mb-2w">
        <button type="button" className="fr-link" onClick={resetFilters}>
          Réinitialiser les filtres
        </button>
      </p>

      <p className="fr-text--sm fr-mb-2w">
        {data.missions.length === 0
          ? "Aucune mission dans la table « Missions »."
          : rows.length === 0
            ? filtersActive
              ? "Aucune mission ne correspond aux filtres."
              : "Aucune mission."
            : `${rows.length} mission${rows.length > 1 ? "s" : ""}${
                pageCount > 1
                  ? ` (affichage de ${(safePage - 1) * PAGE_SIZE + 1} à ${Math.min(safePage * PAGE_SIZE, rows.length)}, ${PAGE_SIZE} par page)`
                  : ""
              }.`}
      </p>

      {rows.length > 0 ? (
        <TableShell className="fr-mb-3w">
          <table>
            <caption className="fr-sr-only">Liste des missions</caption>
            <thead>
              <tr>
                <th scope="col">Mission</th>
                <th scope="col">Produit</th>
                <th scope="col">Équipe</th>
                <th scope="col">Statut</th>
                <th scope="col">Intervenant</th>
                <th scope="col">Resp</th>
                <th scope="col">Début</th>
                <th scope="col" className="fr-cell--right">
                  Jours
                </th>
                <th scope="col" className="fr-cell--right">
                  Montant TTC
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => {
                const enfants = enfantsByMaster.get(m.id) ?? [];
                const intervenantIds = intervenantIdsForMaster(
                  data.missionEnfants,
                  m.id,
                  m.Intervenants,
                );
                const expanded = isMasterExpanded(m.id);
                const expandControlsId = `mission-expand-${m.id}`;
                const cra = craParMissionId.get(m.id);
                return (
                  <Fragment key={m.id}>
                    <tr
                      className={
                        expanded
                          ? "pilotage-expandable-parent-row pilotage-expandable-parent-row--open"
                          : enfants.length > 0
                            ? "pilotage-expandable-parent-row"
                            : undefined
                      }
                    >
                      <th scope="row">
                        <div className="pilotage-expandable-parent-label">
                          {enfants.length > 0 ? (
                            <ExpandToggle
                              expanded={expanded}
                              childCount={enfants.length}
                              controlsId={expandControlsId}
                              titleExpand="Afficher les prestations"
                              titleCollapse="Masquer les prestations"
                              onClick={() => toggleMasterExpanded(m.id)}
                            />
                          ) : null}
                          <Link className="fr-link" to={`/missions/${m.id}`}>
                            {missionLibelle(m)}
                          </Link>
                        </div>
                      </th>
                      <td>{libelleProduitMission(m, produitsById)}</td>
                      <td>
                        <EquipeBadges value={m.Equipe2} />
                      </td>
                      <td>{m.Statut?.trim() || "—"}</td>
                      <td>{libelleParRefsIds(intervenantIds, intervenantsById)}</td>
                      <td>
                        {libelleParRefsIds(extractGristReferenceIds(m.Resp_), intervenantsById)}
                      </td>
                      <td>{formatGristDate(m.Date_de_debut)}</td>
                      <td className="fr-cell--right">
                        {(cra?.jours ?? 0).toLocaleString("fr-FR", {
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td className="fr-cell--right">{formatMontantEur(cra?.ttc ?? 0)}</td>
                    </tr>
                    {expanded
                      ? enfants.map((e, idx) => {
                          const iid = extractGristReferenceId(e.Intervenant);
                          const ivLabel =
                            iid != null ? intervenantsById.get(iid) : undefined;
                          return (
                            <ExpandableChildRow
                              key={`enfant-${e.id}`}
                              id={idx === 0 ? expandControlsId : undefined}
                            >
                              <ExpandableChildCell colSpan={2} indent>
                                {missionEnfantLibelle(e, ivLabel)}
                              </ExpandableChildCell>
                              <ExpandableChildCell colSpan={2}>
                                {e.Type_prestation?.trim() || "Freelance_jours"}
                                {e.Statut?.trim() ? ` · ${e.Statut.trim()}` : ""}
                              </ExpandableChildCell>
                              <ExpandableChildCell colSpan={5}>
                                {ivLabel ?? (iid != null ? `#${iid}` : "—")}
                              </ExpandableChildCell>
                            </ExpandableChildRow>
                          );
                        })
                      : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      ) : null}

      {pageCount > 1 ? (
        <Pagination
          id="widget-missions-list-pagination"
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
