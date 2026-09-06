import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { TableShell } from "../components/FinanceRecap";
import { useGristPa } from "../GristPaContext";
import { NothingHerePage } from "../security/NothingHerePage";
import { formatMontantEur } from "../utils/formatMontant";
import { extractGristStringTokens } from "../utils/gristReferences";
import { montantReste } from "../utils/montantReste";
import { bdcPaRefId, libellePlanActivite } from "../utils/paFinance";

const PAGE_SIZE = 10;

function libelleBdc(nom: string | undefined, id: number): string {
  return nom?.trim() || `BDC #${id}`;
}

export function BdcListView() {
  const data = useGristPa();
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [financeurFilter, setFinanceurFilter] = useState("");
  const [page, setPage] = useState(1);

  const paById = useMemo(() => {
    const map = new Map<number, string>();
    for (const pa of data.plans) {
      map.set(pa.id, libellePlanActivite(pa));
    }
    return map;
  }, [data.plans]);

  const statutOptions = useMemo(() => {
    const set = new Set<string>();
    for (const bdc of data.bdcList) {
      const s = bdc.Statut?.trim();
      if (s) {
        set.add(s);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [data.bdcList]);

  const financeurOptions = useMemo(() => {
    const set = new Set<string>();
    for (const bdc of data.bdcList) {
      const f = bdc.Financeur?.trim();
      if (f) {
        set.add(f);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [data.bdcList]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.bdcList.filter((bdc) => {
      const okStatut = !statutFilter || bdc.Statut?.trim() === statutFilter;
      const okFinanceur = !financeurFilter || bdc.Financeur?.trim() === financeurFilter;
      const paId = bdcPaRefId(bdc);
      const paLabel = paId != null ? (paById.get(paId) ?? `PA #${paId}`) : "";
      const hay = [
        libelleBdc(bdc.Nom_BdC, bdc.id),
        bdc.Financeur,
        bdc.BdC_Chorus,
        bdc.Statut,
        bdc.Plateforme,
        paLabel,
        extractGristStringTokens(bdc.Equipe2).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const okSearch = !q || hay.includes(q);
      return okStatut && okFinanceur && okSearch;
    });
  }, [data.bdcList, financeurFilter, paById, search, statutFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive = Boolean(search.trim() || statutFilter || financeurFilter);

  const resetFilters = () => {
    setSearch("");
    setSearchDraft("");
    setStatutFilter("");
    setFinanceurFilter("");
    setPage(1);
  };

  if (data.untrustedEmbed || data.outsideGrist) {
    return <NothingHerePage />;
  }

  if (data.loading) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Bons de commande</h1>
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

  if (data.error) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Bons de commande</h1>
        <Alert severity="error" title="Erreur" description={data.error} />
      </div>
    );
  }

  if (data.relatedStatus === "denied" || data.relatedStatus === "error") {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Bons de commande</h1>
        <Alert
          severity="warning"
          title="Accès multi-tables indisponible"
          description={
            data.relatedError ??
            "Accordez l’accès « full » au widget pour charger la table BDC."
          }
        />
      </div>
    );
  }

  if (data.relatedStatus === "loading" || data.relatedStatus === "idle") {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Bons de commande</h1>
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Chargement des BDC…"
          role="status"
        />
      </div>
    );
  }

  return (
    <div className="fr-py-1w">
      <h1 className="fr-h3">Bons de commande</h1>

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-1w">
        <div className="fr-col-12">
          <div className="fr-search-bar" role="search">
            <label className="fr-label" htmlFor="bdc-widget-search">
              Rechercher un BDC (nom, financeur, n° Chorus, PA…)
            </label>
            <input
              className="fr-input"
              type="search"
              id="bdc-widget-search"
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
        <div className="fr-col-12 fr-col-md-6">
          <Select
            label="Financeur"
            nativeSelectProps={{
              value: financeurFilter,
              onChange: (e) => {
                setFinanceurFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Tous les financeurs</option>
            {financeurOptions.map((financeur) => (
              <option key={financeur} value={financeur}>
                {financeur}
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
        {rows.length === 0
          ? filtersActive
            ? "Aucun bon de commande ne correspond aux filtres."
            : "Aucun bon de commande."
          : `${rows.length} bon${rows.length > 1 ? "s" : ""} de commande.`}
      </p>

      <TableShell className="fr-mb-3w">
        <table>
          <caption className="fr-sr-only">Liste des bons de commande</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">PA</th>
              <th scope="col">Statut</th>
              <th scope="col">Financeur</th>
              <th scope="col" className="fr-cell--right">
                Budget TTC
              </th>
              <th scope="col" className="fr-cell--right">
                Consommé CRA
              </th>
              <th scope="col" className="fr-cell--right">
                Solde CRA
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7}>—</td>
              </tr>
            ) : (
              paginated.map((bdc) => {
                const paId = bdcPaRefId(bdc);
                return (
                  <tr key={bdc.id}>
                    <th scope="row">
                      <Link className="fr-link" to={`/bdc/${bdc.id}`}>
                        {libelleBdc(bdc.Nom_BdC, bdc.id)}
                      </Link>
                    </th>
                    <td>
                      {paId != null ? (
                        <Link className="fr-link" to={`/pa/${paId}`}>
                          {paById.get(paId) ?? `PA #${paId}`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{bdc.Statut?.trim() || "—"}</td>
                    <td>{bdc.Financeur?.trim() || "—"}</td>
                    <td className="fr-cell--right">{formatMontantEur(bdc.Montant_TTC)}</td>
                    <td className="fr-cell--right">{formatMontantEur(bdc.Total_TTC_CRA)}</td>
                    <td className="fr-cell--right">{montantReste(bdc.Solde_TTC_CRA)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableShell>

      {pageCount > 1 ? (
        <Pagination
          id="widget-bdc-list-pagination"
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
