import { useMemo, useRef, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { TableShell } from "../components/FinanceRecap";
import {
  PortageProjetFormDrawer,
  type PortageProjetFormDrawerHandle,
} from "../components/portage/PortageProjetFormDrawer";
import { PortageProjetDeleteConfirmDialog } from "../components/portage/PortageProjetDeleteConfirmDialog";
import { useGristPa } from "../GristPaContext";
import { usePortageProjetAdminData } from "../hooks/usePortageProjetAdminData";
import type { BDC, Intervenant } from "../types";
import { uniqueSortedLabels } from "../utils/equipeList";
import { bdcDisplayLabel } from "../utils/portageProjet";
import {
  countPrestationsLinkedToPortage,
  displayPortageField,
  filterPortageProjetAdminRows,
  type PortageProjetAdminRow,
  type PortageProjetSearchLabels,
} from "../utils/portageProjetFormFields";
import { deletePortageProjetRecord } from "../utils/portageProjetGristWrite";

const PAGE_SIZE = 10;

function personName(member: Intervenant | undefined, id: string): string {
  const name = member?.Prenom_Nom?.trim();
  if (name) {
    return name;
  }
  return id ? `Personne #${id}` : "—";
}

export function PortageProjetAdminPage() {
  const data = usePortageProjetAdminData();
  const pa = useGristPa();
  const drawerRef = useRef<PortageProjetFormDrawerHandle>(null);
  const [search, setSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<PortageProjetAdminRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [listNotice, setListNotice] = useState<string>();

  const memberById = useMemo(() => {
    const map = new Map<number, Intervenant>();
    for (const member of data.members) {
      map.set(member.id, member);
    }
    return map;
  }, [data.members]);

  const bdcById = useMemo(() => {
    const map = new Map<number, BDC>();
    for (const bdc of pa.bdcList) {
      map.set(bdc.id, bdc);
    }
    return map;
  }, [pa.bdcList]);

  const labels = useMemo<PortageProjetSearchLabels>(
    () => ({
      personLabel: (id) => personName(memberById.get(Number(id)), id),
      bdcLabel: (id) => {
        const n = Number(id);
        return bdcDisplayLabel(bdcById.get(n), n) ?? `BDC #${id}`;
      },
    }),
    [bdcById, memberById],
  );

  const personOptions = useMemo(
    () =>
      data.members
        .map((member) => ({
          value: String(member.id),
          label: personName(member, String(member.id)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })),
    [data.members],
  );

  const bdcOptions = useMemo(
    () =>
      pa.bdcList
        .map((bdc) => ({
          value: String(bdc.id),
          label: bdcDisplayLabel(bdc, bdc.id) ?? `BDC #${bdc.id}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })),
    [pa.bdcList],
  );

  const rows = useMemo(() => {
    const filtered = filterPortageProjetAdminRows(data.rows, search, labels);
    return filtered.sort((a, b) =>
      a.values.Nom_du_projet.localeCompare(b.values.Nom_du_projet, "fr", {
        sensitivity: "base",
      }),
    );
  }, [data.rows, labels, search]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const suggestion = (field: "Statut" | "Porteur" | "Financeur" | "Equipe") =>
    uniqueSortedLabels(
      data.rows.map((row) => (row.invalid.has(field) ? undefined : row.values[field])),
    );

  const linkedCount = deleteTarget
    ? countPrestationsLinkedToPortage(data.prestations, deleteTarget.id)
    : 0;

  const refresh = async () => {
    try {
      await data.reload();
      setListNotice(undefined);
    } catch {
      setListNotice("L’enregistrement a réussi, mais la liste n’a pas pu être rafraîchie.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !data.prestationsReady || linkedCount > 0) {
      return;
    }
    setDeleteBusy(true);
    setDeleteError(undefined);
    try {
      await deletePortageProjetRecord(deleteTarget.id, linkedCount);
      await refresh();
      drawerRef.current?.close();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="fr-mt-2w fr-mb-4w">
      <h1 className="fr-h3">Projets de portage</h1>
      <p className="fr-text--sm">
        Un projet de portage relie une personne à un projet chez un porteur (souvent Malt)
        et, si besoin, à un bon de commande. Le porteur « Malt » le propose ensuite sur une
        prestation.
      </p>

      {data.status === "loading" || data.status === "idle" ? (
        <p className="fr-text--sm" role="status">
          Chargement des projets de portage…
        </p>
      ) : null}

      {data.status === "error" ? (
        <Alert
          className="fr-mb-3w"
          severity="error"
          title="Lecture impossible"
          description={
            data.error ??
            "Les projets de portage n’ont pas pu être lus. Ouvrez le widget dans Grist, puis réessayez."
          }
        />
      ) : null}

      {data.status === "ok" ? (
        <>
          {data.refsWarning ? (
            <Alert
              className="fr-mb-2w"
              severity="warning"
              title="Données incomplètes"
              description={data.refsWarning}
            />
          ) : null}
          {listNotice ? (
            <Alert
              className="fr-mb-2w"
              severity="info"
              title="Liste à jour incomplète"
              description={listNotice}
            />
          ) : null}
          {data.isReloading ? (
            <p className="fr-text--sm" role="status">
              Mise à jour de la liste…
            </p>
          ) : null}

          <div className="fr-mb-3w">
            <button
              type="button"
              className="fr-btn fr-btn--primary fr-icon-add-line fr-btn--icon-left"
              onClick={() => drawerRef.current?.openCreate()}
            >
              Nouveau projet
            </button>
          </div>

          <div className="fr-mb-2w">
            <SearchBar
              key={searchKey}
              label="Rechercher un projet de portage"
              allowEmptySearch
              onButtonClick={(text) => {
                setSearch(text);
                setPage(1);
              }}
            />
            {search.trim() ? (
              <p className="fr-mt-1w fr-mb-0">
                <a
                  href="#reinitialiser-recherche"
                  className="fr-link"
                  onClick={(event) => {
                    event.preventDefault();
                    setSearch("");
                    setSearchKey((n) => n + 1);
                    setPage(1);
                  }}
                >
                  Réinitialiser la recherche
                </a>
              </p>
            ) : null}
          </div>

          <p className="fr-text--sm fr-mb-2w">
            {rows.length === 0
              ? search.trim()
                ? "Aucun projet ne correspond à la recherche."
                : "Aucun projet de portage."
              : search.trim()
                ? `${rows.length} projet${rows.length > 1 ? "s" : ""} ${rows.length > 1 ? "correspondent" : "correspond"} à la recherche.`
                : `${rows.length} projet${rows.length > 1 ? "s" : ""}.`}
          </p>

          <TableShell className="fr-mb-3w" multiline>
            <table>
              <caption className="fr-sr-only">Liste des projets de portage</caption>
              <thead>
                <tr>
                  <th scope="col">Nom du projet</th>
                  <th scope="col">Personne</th>
                  <th scope="col">Porteur</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Bon de commande</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6}>—</td>
                  </tr>
                ) : (
                  paginated.map((row) => {
                    const nom = displayPortageField(row, "Nom_du_projet");
                    return (
                      <tr key={row.id}>
                        <th scope="row">{nom}</th>
                        <td>
                          {displayPortageField(
                            row,
                            "Freelance",
                            row.values.Freelance
                              ? labels.personLabel(row.values.Freelance)
                              : undefined,
                          )}
                        </td>
                        <td>{displayPortageField(row, "Porteur")}</td>
                        <td>{displayPortageField(row, "Statut")}</td>
                        <td>
                          {displayPortageField(
                            row,
                            "Bon_de_commande",
                            row.values.Bon_de_commande
                              ? labels.bdcLabel(row.values.Bon_de_commande)
                              : undefined,
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="fr-btn fr-btn--tertiary fr-btn--sm"
                            onClick={() => drawerRef.current?.openEdit(row)}
                          >
                            Modifier
                            <span className="fr-sr-only"> {nom}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableShell>

          {pageCount > 1 ? (
            <Pagination
              id="widget-portage-projet-pagination"
              count={pageCount}
              defaultPage={safePage}
              getPageLinkProps={(p) => ({
                href: `#page-${p}`,
                onClick: (event) => {
                  event.preventDefault();
                  setPage(p);
                },
              })}
            />
          ) : null}

          <PortageProjetFormDrawer
            ref={drawerRef}
            personOptions={personOptions}
            bdcOptions={bdcOptions}
            statutSuggestions={suggestion("Statut")}
            porteurSuggestions={suggestion("Porteur")}
            financeurSuggestions={suggestion("Financeur")}
            equipeSuggestions={suggestion("Equipe")}
            onRecordsChanged={refresh}
            onRequestDelete={(row) => {
              setDeleteError(undefined);
              setDeleteTarget(row);
            }}
          />
          <PortageProjetDeleteConfirmDialog
            open={deleteTarget != null}
            projectName={deleteTarget?.values.Nom_du_projet ?? ""}
            linkedCount={linkedCount}
            prestationsReady={data.prestationsReady}
            busy={deleteBusy}
            error={deleteError}
            onCancel={() => {
              if (!deleteBusy) {
                setDeleteTarget(null);
                setDeleteError(undefined);
              }
            }}
            onConfirm={() => {
              void confirmDelete();
            }}
          />
        </>
      ) : null}
    </div>
  );
}
