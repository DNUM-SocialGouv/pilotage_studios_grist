import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { TableShell } from "../FinanceRecap";
import { StatutBadge } from "../StatutBadge";
import { useEquipeMemberMissionsData } from "../../hooks/useEquipeMemberMissionsData";
import {
  buildEquipePrestationRows,
  filterEquipePrestationRows,
  groupEquipePrestationRowsByMission,
  type EquipePrestationsFilter,
} from "../../utils/equipeMemberPrestations";

/** Pagination par mission (groupe), pas par ligne prestation. */
const PAGE_SIZE = 10;

type EquipeFicheMissionsSectionProps = {
  memberId: number;
  /** True quand la fiche Equipe est déjà chargée (évite un fetch inutile). */
  enabled: boolean;
};

export function EquipeFicheMissionsSection({
  memberId,
  enabled,
}: EquipeFicheMissionsSectionProps) {
  const data = useEquipeMemberMissionsData(enabled);
  const [filter, setFilter] = useState<EquipePrestationsFilter>("en-cours");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setFilter("en-cours");
    setPage(1);
  }, [memberId]);

  const allRows = useMemo(
    () => buildEquipePrestationRows(memberId, data.missionEnfants, data.missions),
    [memberId, data.missionEnfants, data.missions],
  );

  const filtered = useMemo(
    () => filterEquipePrestationRows(allRows, filter),
    [allRows, filter],
  );

  const groups = useMemo(
    () => groupEquipePrestationRowsByMission(filtered),
    [filtered],
  );

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginatedGroups = groups.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const setFilterAndResetPage = (next: EquipePrestationsFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <section className="fr-mb-3w" aria-labelledby="equipe-fiche-missions">
      <div className="fr-mb-2w">
        <h2 id="equipe-fiche-missions" className="fr-h6 fr-mb-0">
          Missions & prestations
        </h2>
      </div>

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
          <div className="fr-mb-2w">
            <SegmentedControl
              legend="Filtrer les prestations"
              name={`equipe-fiche-missions-filtre-${memberId}`}
              inlineLegend
              small
              segments={[
                {
                  label: "En cours",
                  nativeInputProps: {
                    value: "en-cours",
                    checked: filter === "en-cours",
                    onChange: () => setFilterAndResetPage("en-cours"),
                  },
                },
                {
                  label: "Toutes",
                  nativeInputProps: {
                    value: "toutes",
                    checked: filter === "toutes",
                    onChange: () => setFilterAndResetPage("toutes"),
                  },
                },
              ]}
            />
          </div>

          <TableShell multiline>
            <table>
              <caption className="fr-sr-only">
                Prestations rattachées à la personne, regroupées par mission
              </caption>
              <thead>
                <tr>
                  <th scope="col">Mission</th>
                  <th scope="col">Prestation</th>
                  <th scope="col" className="pilotage-col-statut-nowrap">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      {allRows.length === 0
                        ? "Aucune prestation rattachée à cette personne."
                        : "Aucune prestation « en cours » — basculez sur « Toutes » pour voir l’historique."}
                    </td>
                  </tr>
                ) : (
                  paginatedGroups.flatMap((group) =>
                    group.prestations.map((row, index) => (
                      <tr key={row.enfantId}>
                        {index === 0 ? (
                          <th
                            scope="rowgroup"
                            rowSpan={group.prestations.length}
                            className="equipe-fiche-missions__mission-cell"
                          >
                            <Link
                              className="fr-link"
                              to={`/missions/${group.missionId}`}
                            >
                              {group.missionLibelle}
                            </Link>
                          </th>
                        ) : null}
                        <td>{row.prestationLibelle}</td>
                        <td className="pilotage-col-statut-nowrap">
                          <StatutBadge statut={row.statut} />
                        </td>
                      </tr>
                    )),
                  )
                )}
              </tbody>
            </table>
          </TableShell>

          {pageCount > 1 ? (
            <Pagination
              key={`equipe-fiche-missions-page-${memberId}-${filter}-${safePage}`}
              id={`widget-equipe-fiche-missions-pagination-${memberId}`}
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
