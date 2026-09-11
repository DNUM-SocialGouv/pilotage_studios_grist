import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { DsfrSelectRichMulti } from "../components/dsfr/DsfrSelectRichMulti";
import { useExpandableRowIds } from "../components/expandable";
import { MissionsListeDetailTable } from "../components/missions/MissionsListeDetailTable";
import { MissionsListeParLot } from "../components/missions/MissionsListeParLot";
import {
  aggregateCraByEnfantId,
  groupSuiviRowsByEnfantId,
  sumSuiviTtcHorsPrestationForMission,
} from "../utils/craByMission";
import {
  enfantsByMasterId,
  missionDepartementOptions,
  missionEquipeOptions,
  missionIntervenantOptions,
  missionMatchesFilters,
  missionProduitOptions,
  missionStatutOptions,
  produitsByIdFromRows,
  type MissionsStaffingFilter,
} from "../utils/missionsList";
import {
  loadMissionsListeVue,
  saveMissionsListeVue,
  type MissionsListeVue,
} from "../utils/missionsListeVue";
import type { CraCellState } from "../utils/missionsListeTotaux";
import { useMissionsOutlet } from "./MissionsLayout";

const PAGE_SIZE = 10;
const NOUVELLES_DEMANDES_STATUTS = ["A instruire", "En investigation"] as const;

export function MissionsListView() {
  const { data } = useMissionsOutlet();
  const [searchParams] = useSearchParams();
  const vueNouvellesDemandes = searchParams.get("vue") === "nouvelles-demandes";
  const statutUrl = searchParams.get("statut")?.trim() ?? "";

  const [search, setSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [equipeFilter, setEquipeFilter] = useState("");
  const [departementFilter, setDepartementFilter] = useState("");
  const [produitFilter, setProduitFilter] = useState<string[]>([]);
  const [statutsSelectionnes, setStatutsSelectionnes] = useState<string[]>(() =>
    statutUrl && !vueNouvellesDemandes ? [statutUrl] : [],
  );
  const [statutsFiltreManuel, setStatutsFiltreManuel] = useState(
    () => Boolean(statutUrl && !vueNouvellesDemandes),
  );
  const [intervenantFilter, setIntervenantFilter] = useState<string[]>([]);
  const [staffingFilter, setStaffingFilter] = useState<MissionsStaffingFilter>("");
  const [listeVue, setListeVue] = useState<MissionsListeVue>(loadMissionsListeVue);
  const [page, setPage] = useState(1);

  const statutFilter = useMemo(() => {
    if (!statutsFiltreManuel && vueNouvellesDemandes) {
      return [...NOUVELLES_DEMANDES_STATUTS];
    }
    return statutsSelectionnes;
  }, [statutsFiltreManuel, vueNouvellesDemandes, statutsSelectionnes]);

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
      const eq = i.Equipe?.trim();
      if (eq) {
        map.set(i.id, eq);
      }
    }
    return map;
  }, [data.intervenants]);

  const enfantsByMaster = useMemo(
    () => enfantsByMasterId(data.missionEnfants),
    [data.missionEnfants],
  );

  const craState: CraCellState =
    data.status === "error"
      ? "error"
      : data.status === "loading" || data.status === "idle"
        ? "loading"
        : "ready";

  const craParEnfantId = useMemo(() => {
    if (craState !== "ready") {
      return undefined;
    }
    return aggregateCraByEnfantId(data.suivi);
  }, [craState, data.suivi]);

  const suiviByEnfantId = useMemo(
    () => groupSuiviRowsByEnfantId(data.suivi),
    [data.suivi],
  );

  /** Realise en échec partiel : ne pas appliquer le filtre « CRA hors prestation ». */
  const suiviLoadFailed =
    typeof data.refsError === "string" && data.refsError.includes("Realise");

  const staffingCraUnavailable =
    staffingFilter === "cra-hors-prestation" &&
    (craState === "loading" || suiviLoadFailed);

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

  const sortedMissions = useMemo(() => {
    return data.missions
      .slice()
      .sort((a, b) =>
        (a.Nom_de_la_mission ?? "").localeCompare(b.Nom_de_la_mission ?? "", "fr", {
          sensitivity: "base",
        }),
      );
  }, [data.missions]);

  const rows = useMemo(() => {
    return sortedMissions.filter((m) =>
      missionMatchesFilters(
        m,
        {
          search,
          equipe: equipeFilter,
          statut: statutFilter,
          departement: departementFilter,
          produitIds: produitFilter,
          intervenantIds: intervenantFilter,
          staffing: staffingFilter,
        },
        produitsById,
        data.missionEnfants,
        {
          enfantsByMaster,
          suiviRows: data.suivi,
          staffingCraPending: staffingCraUnavailable,
          sumHorsPrestationTtc: sumSuiviTtcHorsPrestationForMission,
        },
      ),
    );
  }, [
    data.missionEnfants,
    data.suivi,
    departementFilter,
    enfantsByMaster,
    equipeFilter,
    intervenantFilter,
    produitsById,
    produitFilter,
    search,
    sortedMissions,
    staffingCraUnavailable,
    staffingFilter,
    statutFilter,
  ]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  const expandResetKey = [
    listeVue,
    safePage,
    search,
    equipeFilter,
    departementFilter,
    statutFilter.join(","),
    produitFilter.join(","),
    intervenantFilter.join(","),
    staffingFilter,
  ].join("|");

  const { isExpanded: isMasterExpanded, toggle: toggleMaster } = useExpandableRowIds<number>(
    undefined,
    expandResetKey,
  );
  const { isExpanded: isEnfantExpanded, toggle: toggleEnfant } = useExpandableRowIds<string>(
    undefined,
    expandResetKey,
  );

  const persistListeVue = useCallback((vue: MissionsListeVue) => {
    setListeVue(vue);
    saveMissionsListeVue(vue);
  }, []);

  const filtresActifsCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n += 1;
    if (equipeFilter) n += 1;
    if (departementFilter) n += 1;
    if (produitFilter.length > 0) n += 1;
    if (statutFilter.length > 0) n += 1;
    if (intervenantFilter.length > 0) n += 1;
    if (staffingFilter) n += 1;
    return n;
  }, [
    search,
    equipeFilter,
    departementFilter,
    produitFilter,
    statutFilter,
    intervenantFilter,
    staffingFilter,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSearchKey((k) => k + 1);
    setEquipeFilter("");
    setDepartementFilter("");
    setProduitFilter([]);
    setStatutsSelectionnes([]);
    setStatutsFiltreManuel(true);
    setIntervenantFilter([]);
    setStaffingFilter("");
    setPage(1);
  };

  const rangeFrom = rows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(safePage * PAGE_SIZE, rows.length);

  return (
    <>
      <h1>Missions</h1>

      {data.refsError ? (
        <Alert
          severity="warning"
          title="Référentiels partiels"
          description={data.refsError}
          className="fr-mb-2w"
        />
      ) : null}

      {staffingFilter === "cra-hors-prestation" && suiviLoadFailed ? (
        <Alert
          severity="warning"
          title="Filtre Staffing incomplet"
          description="Le suivi CRA n’a pas pu être chargé : le filtre « CRA hors prestation » ne peut pas s’appliquer."
          className="fr-mb-2w"
        />
      ) : null}

      <Accordion
        id="missions-liste-filtres"
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
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
            <SearchBar
              key={searchKey}
              label="Rechercher par mission ou produit"
              allowEmptySearch
              onButtonClick={(text) => {
                setSearch(text);
                setPage(1);
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
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
              {equipeOptions.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </div>
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
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
              {departementOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          {produitOptions.length > 0 ? (
            <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
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
          ) : null}
          {statutOptions.length > 0 ? (
            <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
              <DsfrSelectRichMulti
                label="Statut"
                placeholderWhenEmpty="Tous les statuts"
                pluralEntityLabel="statuts"
                maxInlineSize="100%"
                options={statutOptions.map((s) => ({ value: s, label: s }))}
                selectedValues={statutFilter}
                onSelectedValuesChange={(values) => {
                  setStatutsFiltreManuel(true);
                  setStatutsSelectionnes(values);
                  setPage(1);
                }}
              />
            </div>
          ) : null}
          {intervenantOptions.length > 0 ? (
            <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
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
          ) : null}
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
            <Select
              label="Staffing"
              nativeSelectProps={{
                value: staffingFilter,
                onChange: (e) => {
                  setStaffingFilter(e.currentTarget.value as MissionsStaffingFilter);
                  setPage(1);
                },
              }}
            >
              <option value="">Tous les lots</option>
              <option value="avec-prestation">Avec prestation</option>
              <option value="sans-prestation">Sans prestation</option>
              <option value="cra-hors-prestation">CRA hors prestation</option>
            </Select>
          </div>
        </div>
      </Accordion>

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

      {data.missions.length === 0 ? (
        <p className="fr-mb-2w">Aucune mission dans la table « Missions ».</p>
      ) : rows.length === 0 ? (
        <p className="fr-mb-2w">Aucune mission ne correspond aux filtres.</p>
      ) : (
        <p className="fr-mb-2w">
          <span className="fr-text--bold">{rows.length}</span>{" "}
          {rows.length <= 1
            ? "mission correspond aux filtres"
            : "missions correspondent aux filtres"}
          {pageCount > 1 ? (
            <>
              {" "}
              (affichage de {rangeFrom} à {rangeTo}, {PAGE_SIZE} par page).
            </>
          ) : (
            "."
          )}
        </p>
      )}

      {rows.length > 0 ? (
        <>
          <div className="fr-mb-2w">
            <SegmentedControl
              legend="Affichage de la liste"
              name="missions-liste-vue"
              inlineLegend
              small
              segments={[
                {
                  label: "Liste détaillée",
                  nativeInputProps: {
                    value: "detail",
                    checked: listeVue === "detail",
                    onChange: () => persistListeVue("detail"),
                  },
                },
                {
                  label: "Par lot",
                  nativeInputProps: {
                    value: "lot",
                    checked: listeVue === "lot",
                    onChange: () => persistListeVue("lot"),
                  },
                },
              ]}
            />
          </div>
          {listeVue === "detail" ? (
            <MissionsListeDetailTable
              missions={paginated}
              enfantsByMasterId={enfantsByMaster}
              intervenantsById={intervenantsById}
              equipesByIntervenantId={equipesByIntervenantId}
              produitsById={produitsById}
              craByEnfantId={craParEnfantId}
              suiviByEnfantId={suiviByEnfantId}
              craState={craState}
              isMasterExpanded={isMasterExpanded}
              toggleMaster={toggleMaster}
              isEnfantExpanded={isEnfantExpanded}
              toggleEnfant={toggleEnfant}
            />
          ) : (
            <MissionsListeParLot
              missions={paginated}
              enfantsByMasterId={enfantsByMaster}
              intervenantsById={intervenantsById}
              equipesByIntervenantId={equipesByIntervenantId}
              produitsById={produitsById}
              craByEnfantId={craParEnfantId}
              suiviByEnfantId={suiviByEnfantId}
              craState={craState}
              isMasterExpanded={isMasterExpanded}
              toggleMaster={toggleMaster}
              isEnfantExpanded={isEnfantExpanded}
              toggleEnfant={toggleEnfant}
            />
          )}
        </>
      ) : null}

      {pageCount > 1 ? (
        <div className="fr-mt-2w fr-mb-4w">
          <Pagination
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
        </div>
      ) : null}
    </>
  );
}
