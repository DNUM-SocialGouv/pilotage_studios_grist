import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { DsfrSelectRichMulti } from "../components/dsfr/DsfrSelectRichMulti";
import { EquipeTags } from "../components/EquipeTags";
import { StatutBadge } from "../components/StatutBadge";
import {
  ExpandToggle,
  ExpandableChildCell,
  ExpandableChildRow,
  useExpandableRowIds,
} from "../components/expandable";
import { TableShell } from "../components/FinanceRecap";
import { aggregateCraByEnfantId, aggregateCraByMissionId } from "../utils/craByMission";
import { formatGristDate } from "../utils/formatGristDate";
import { formatMontantEur } from "../utils/formatMontant";
import { extractGristReferenceId, extractGristReferenceIds } from "../utils/gristReferences";
import { enfantExpandPrimary, typePrestationLabel } from "../utils/missionEnfants";
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
  const [statutFilter, setStatutFilter] = useState<string[]>([]);
  const [equipeFilter, setEquipeFilter] = useState("");
  const [departementFilter, setDepartementFilter] = useState("");
  const [produitFilter, setProduitFilter] = useState<string[]>([]);
  const [intervenantFilter, setIntervenantFilter] = useState<string[]>([]);
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

  const craParEnfantId = useMemo(
    () => aggregateCraByEnfantId(data.suivi),
    [data.suivi],
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
          produitIds: produitFilter,
          intervenantIds: intervenantFilter,
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
    `${search}|${equipeFilter}|${statutFilter.join(",")}|${departementFilter}|${produitFilter.join(",")}|${intervenantFilter.join(",")}|${safePage}`,
  );

  const filtersActive = Boolean(
    search.trim() ||
      statutFilter.length > 0 ||
      equipeFilter ||
      departementFilter ||
      produitFilter.length > 0 ||
      intervenantFilter.length > 0,
  );

  const resetFilters = () => {
    setSearch("");
    setSearchDraft("");
    setStatutFilter([]);
    setEquipeFilter("");
    setDepartementFilter("");
    setProduitFilter([]);
    setIntervenantFilter([]);
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
          <DsfrSelectRichMulti
            label="Produits"
            placeholderWhenEmpty="Tous les produits"
            pluralEntityLabel="produits"
            maxInlineSize="100%"
            options={produitOptions.map((p) => ({
              value: String(p.id),
              label: p.label,
            }))}
            selectedValues={produitFilter}
            onSelectedValuesChange={(values) => {
              setProduitFilter(values);
              setPage(1);
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
          <DsfrSelectRichMulti
            label="Statut"
            placeholderWhenEmpty="Tous les statuts"
            pluralEntityLabel="statuts"
            maxInlineSize="100%"
            options={statutOptions.map((s) => ({ value: s, label: s }))}
            selectedValues={statutFilter}
            onSelectedValuesChange={(values) => {
              setStatutFilter(values);
              setPage(1);
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
          <DsfrSelectRichMulti
            label="Intervenant"
            placeholderWhenEmpty="Tous les intervenants"
            pluralEntityLabel="intervenants"
            maxInlineSize="100%"
            options={intervenantOptions.map((i) => ({
              value: String(i.id),
              label: i.label,
            }))}
            selectedValues={intervenantFilter}
            onSelectedValuesChange={(values) => {
              setIntervenantFilter(values);
              setPage(1);
            }}
          />
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
        <TableShell className="fr-mb-3w" multiline>
          <table>
            <caption className="fr-sr-only">Liste des missions</caption>
            <thead>
              <tr>
                <th scope="col" className="pilotage-col-mission-libelle">
                  Mission
                </th>
                <th scope="col">Produit</th>
                <th scope="col" className="pilotage-col-equipe-nowrap">
                  Équipe
                </th>
                <th scope="col" className="pilotage-col-statut-nowrap">
                  Statut
                </th>
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
                      <td className="pilotage-col-mission-libelle">
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
                      </td>
                      <td>{libelleProduitMission(m, produitsById)}</td>
                      <td className="pilotage-col-equipe-nowrap">
                        <EquipeTags value={m.Equipe2} />
                      </td>
                      <td className="pilotage-col-statut-nowrap">
                        <StatutBadge statut={m.Statut} />
                      </td>
                      <td className="pilotage-col-resp-nowrap">
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
                            iid != null && iid !== 0
                              ? (intervenantsById.get(iid) ?? `#${iid}`)
                              : undefined;
                          const { primary, hint } = enfantExpandPrimary(e, ivLabel);
                          const craEnfant = craParEnfantId.get(e.id);
                          const joursCell =
                            craEnfant == null || craEnfant.count === 0
                              ? "—"
                              : craEnfant.jours.toLocaleString("fr-FR", {
                                  maximumFractionDigits: 4,
                                });
                          const ttcCell =
                            craEnfant == null || craEnfant.count === 0
                              ? "—"
                              : formatMontantEur(craEnfant.ttc);
                          return (
                            <ExpandableChildRow
                              key={`enfant-${e.id}`}
                              id={idx === 0 ? expandControlsId : undefined}
                            >
                              <ExpandableChildCell indent className="pilotage-col-mission-libelle">
                                <p className="fr-mb-0 fr-text--bold pilotage-expandable-child-libelle">
                                  {primary}
                                </p>
                                {hint ? (
                                  <p className="fr-text--xs fr-hint-text fr-mb-0">{hint}</p>
                                ) : null}
                              </ExpandableChildCell>
                              <ExpandableChildCell>
                                {typePrestationLabel(e.Type_prestation)}
                              </ExpandableChildCell>
                              <ExpandableChildCell>—</ExpandableChildCell>
                              <ExpandableChildCell className="pilotage-col-statut-nowrap">
                                <StatutBadge statut={e.Statut} />
                              </ExpandableChildCell>
                              <ExpandableChildCell>—</ExpandableChildCell>
                              <ExpandableChildCell>—</ExpandableChildCell>
                              <ExpandableChildCell className="fr-cell--right">
                                {joursCell}
                              </ExpandableChildCell>
                              <ExpandableChildCell className="fr-cell--right">
                                {ttcCell}
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
