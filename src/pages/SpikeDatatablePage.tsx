import { useMemo, useState } from "react";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type GroupingState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { TableShell } from "../components/FinanceRecap";
import { useGristPa } from "../GristPaContext";
import { useMissionsData } from "../hooks/useMissionsData";
import { NothingHerePage } from "../security/NothingHerePage";
import { formatMontantEur } from "../utils/formatMontant";
import { mapSuiviToSpikeCraRows } from "./spikeDatatable/mapSuiviToSpikeCraRows";
import type { SpikeCraRow } from "./spikeDatatable/spikeCraRow";

const PAGE_SIZE = 10;

type GroupByMode = "" | "equipe" | "periode" | "intervenant" | "mission";

function ariaSortValue(
  sorted: false | "asc" | "desc",
): "none" | "ascending" | "descending" {
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  return "none";
}

function numericCell(getValue: () => unknown): string {
  const n = getValue();
  return typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("fr-FR") : "—";
}

export function SpikeDatatablePage() {
  const pa = useGristPa();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const missionsData = useMissionsData(enabled);

  const data = useMemo(
    () =>
      mapSuiviToSpikeCraRows({
        suivi: missionsData.suivi,
        intervenants: missionsData.intervenants,
        produits: missionsData.produits,
        missions: missionsData.missions,
        missionEnfants: missionsData.missionEnfants,
        bdcList: pa.bdcList,
      }),
    [
      missionsData.suivi,
      missionsData.intervenants,
      missionsData.produits,
      missionsData.missions,
      missionsData.missionEnfants,
      pa.bdcList,
    ],
  );

  const columns = useMemo<ColumnDef<SpikeCraRow>[]>(
    () => [
      {
        accessorKey: "periode",
        header: "Période",
        aggregationFn: "count",
        aggregatedCell: ({ getValue }) => `${getValue<number>()} ligne(s)`,
      },
      {
        accessorKey: "intervenant",
        header: "Intervenant",
        aggregationFn: "count",
        aggregatedCell: () => "—",
      },
      {
        accessorKey: "equipe",
        header: "Équipe",
        aggregationFn: "count",
        aggregatedCell: () => "—",
      },
      {
        accessorKey: "produit",
        header: "Produit",
        aggregationFn: "count",
        aggregatedCell: () => "—",
      },
      {
        accessorKey: "mission",
        header: "Mission",
        aggregationFn: "count",
        aggregatedCell: () => "—",
      },
      {
        accessorKey: "bdc",
        header: "BDC",
        aggregationFn: "count",
        aggregatedCell: () => "—",
      },
      {
        accessorKey: "jours",
        header: "Jours",
        aggregationFn: "sum",
        aggregatedCell: ({ getValue }) => numericCell(getValue),
        cell: ({ getValue }) => numericCell(getValue),
        meta: { align: "right" as const },
      },
      {
        accessorKey: "ttc",
        header: "TTC",
        aggregationFn: "sum",
        aggregatedCell: ({ getValue }) => formatMontantEur(getValue<number>()),
        cell: ({ getValue }) => formatMontantEur(getValue<number>()),
        meta: { align: "right" as const },
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    mission: false,
    bdc: false,
  });
  const [dense, setDense] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByMode>("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      grouping,
      expanded,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const safePage = Math.min(pagination.pageIndex + 1, pageCount);
  const visibleColCount = table.getVisibleLeafColumns().length;
  const totalColCount = table.getAllLeafColumns().length;

  let totauxJours = 0;
  let totauxTtc = 0;
  let totauxCount = 0;
  for (const r of table.getFilteredRowModel().flatRows) {
    if (r.getIsGrouped()) continue;
    totauxJours += r.original.jours;
    totauxTtc += r.original.ttc;
    totauxCount += 1;
  }

  const columnToggleOptions = table
    .getAllLeafColumns()
    .filter((c) => c.getCanHide())
    .map((col) => ({
      label: String(col.columnDef.header ?? col.id),
      nativeInputProps: {
        checked: col.getIsVisible(),
        onChange: col.getToggleVisibilityHandler(),
      },
    }));

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  if (pa.loading) {
    return (
      <p className="fr-text--sm fr-mt-2w" role="status">
        Chargement…
      </p>
    );
  }

  if (pa.error) {
    return (
      <Alert
        severity="error"
        title="Données indisponibles"
        description={pa.error}
        className="fr-mt-2w"
      />
    );
  }

  if (missionsData.status === "idle" || missionsData.status === "loading") {
    return (
      <p className="fr-text--sm fr-mt-2w" role="status">
        Chargement des réalisations…
      </p>
    );
  }

  if (missionsData.status === "error") {
    return (
      <Alert
        severity="error"
        title="Réalisations indisponibles"
        description={missionsData.error ?? "Lecture Realise / Missions impossible."}
        className="fr-mt-2w"
      />
    );
  }

  return (
    <>
      <h1>Spike datatable</h1>

      <Alert
        severity="info"
        title="Page labo"
        description="Lecture des réalisations Grist (table Réalisé) — non destinée aux utilisateurs métier. Moteur @tanstack/react-table + TableShell DSFR."
        className="fr-mb-2w"
      />

      {missionsData.refsError ? (
        <Alert
          severity="warning"
          title="Référentiels partiels"
          description={missionsData.refsError}
          className="fr-mb-2w"
        />
      ) : null}

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-2w">
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="Recherche"
            hintText="Filtre sur toutes les colonnes"
            nativeInputProps={{
              value: globalFilter,
              onChange: (e) => setGlobalFilter(e.currentTarget.value),
              placeholder: "Nom, équipe, produit…",
              "aria-label": "Recherche globale dans le tableau",
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Groupement"
            nativeSelectProps={{
              value: groupBy,
              onChange: (e) => {
                const next = e.currentTarget.value as GroupByMode;
                setGroupBy(next);
                setGrouping(next ? [next] : []);
                setExpanded(true);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              },
            }}
          >
            <option value="">Aucun</option>
            <option value="equipe">Par équipe</option>
            <option value="periode">Par période</option>
            <option value="intervenant">Par intervenant</option>
            <option value="mission">Par mission</option>
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <ToggleSwitch
            label="Densité compacte"
            checked={dense}
            onChange={(checked) => setDense(checked)}
            showCheckedHint={false}
          />
        </div>
      </div>

      <div className="fr-mb-2w">
        <Accordion
          id="spike-datatable-colonnes"
          titleAs="h2"
          label={`Colonnes visibles (${visibleColCount}/${totalColCount})`}
          defaultExpanded={false}
        >
          <Checkbox small options={columnToggleOptions} />
        </Accordion>
      </div>

      <p className="fr-mb-2w" role="status">
        <span className="fr-text--bold">{filteredCount}</span>{" "}
        {filteredCount <= 1 ? "ligne après filtre" : "lignes après filtre"}
        {grouping.length > 0 ? " (groupées)" : ""}
        {data.length > 0 ? (
          <>
            {" "}
            · <span className="fr-text--sm">{data.length} au total</span>
          </>
        ) : null}
      </p>

      {data.length === 0 ? (
        <p className="fr-mb-2w">Aucune réalisation dans la table « Réalisé ».</p>
      ) : (
        <>
          <TableShell className="fr-mb-2w" multiline size={dense ? "sm" : "md"}>
            <table>
              <caption className="fr-sr-only">
                Réalisations (CRA) — POC TanStack Table
              </caption>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      const alignRight =
                        (header.column.columnDef.meta as { align?: "right" } | undefined)
                          ?.align === "right";
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          colSpan={header.colSpan}
                          className={alignRight ? "fr-cell--right" : undefined}
                          aria-sort={canSort ? ariaSortValue(sorted) : undefined}
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {sorted === "asc" ? " ↑" : sorted === "desc" ? " ↓" : ""}
                            </button>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(1, visibleColCount)}>
                      Aucune ligne pour ces filtres.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    if (row.getIsGrouped()) {
                      const groupCol = row.groupingColumnId;
                      const label =
                        groupCol != null
                          ? String(row.getValue(groupCol) ?? "—")
                          : "Groupe";
                      const leafs = row.getLeafRows().filter((r) => r.original);
                      const gJours = leafs.reduce((s, r) => s + r.original.jours, 0);
                      const gTtc = leafs.reduce((s, r) => s + r.original.ttc, 0);
                      return (
                        <tr key={row.id}>
                          <td colSpan={Math.max(1, visibleColCount)}>
                            <button
                              type="button"
                              className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
                              onClick={row.getToggleExpandedHandler()}
                              aria-expanded={row.getIsExpanded()}
                            >
                              {row.getIsExpanded() ? "▼" : "▶"} {label} — {leafs.length}{" "}
                              ligne{leafs.length > 1 ? "s" : ""} ·{" "}
                              {gJours.toLocaleString("fr-FR")} j ·{" "}
                              {formatMontantEur(gTtc)}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => {
                          const alignRight =
                            (
                              cell.column.columnDef.meta as
                                | { align?: "right" }
                                | undefined
                            )?.align === "right";
                          return (
                            <td
                              key={cell.id}
                              className={alignRight ? "fr-cell--right" : undefined}
                            >
                              {cell.getIsAggregated()
                                ? flexRender(
                                    cell.column.columnDef.aggregatedCell ??
                                      cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )
                                : cell.getIsPlaceholder()
                                  ? null
                                  : flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext(),
                                    )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableShell>

          {pageCount > 1 ? (
            <Pagination
              count={pageCount}
              defaultPage={safePage}
              getPageLinkProps={(p) => ({
                href: `#spike-page-${p}`,
                onClick: (e) => {
                  e.preventDefault();
                  table.setPageIndex(p - 1);
                },
              })}
              className="fr-mt-2w"
            />
          ) : null}

          {totauxCount > 0 ? (
            <p className="fr-text--sm fr-mt-2w" role="status">
              Totaux (filtre) : {totauxJours.toLocaleString("fr-FR")} j ·{" "}
              {formatMontantEur(totauxTtc)} · {totauxCount} ligne
              {totauxCount > 1 ? "s" : ""}
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
