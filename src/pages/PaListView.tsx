import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { FinanceRecap, TableShell } from "../components/FinanceRecap";
import { useGristPa } from "../GristPaContext";
import { formatMontantEur } from "../utils/formatMontant";
import {
  bdcPaRefId,
  financeForPlanActivite,
  financePaOnly,
  libellePlanActivite,
} from "../utils/paFinance";

const PAGE_SIZE = 10;

function montantReste(value: number) {
  const formatted = formatMontantEur(value);
  if (value < 0) {
    return <span style={{ color: "var(--text-default-error)" }}>{formatted}</span>;
  }
  return formatted;
}

export function PaListView() {
  const data = useGristPa();
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [anneeFilter, setAnneeFilter] = useState("");
  const [bureauFilter, setBureauFilter] = useState("");
  const [prioriteFilter, setPrioriteFilter] = useState("");
  const [page, setPage] = useState(1);

  const useFullFinance = data.relatedStatus === "ok";

  const anneeOptions = useMemo(() => {
    const set = new Set<number>();
    for (const pa of data.plans) {
      if (typeof pa.Annee === "number" && Number.isFinite(pa.Annee)) {
        set.add(pa.Annee);
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [data.plans]);

  const bureauOptions = useMemo(() => {
    const set = new Set<string>();
    for (const pa of data.plans) {
      const bureau = pa.Bureau?.trim();
      if (bureau) {
        set.add(bureau);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [data.plans]);

  const prioriteOptions = useMemo(() => {
    const set = new Set<string>();
    for (const pa of data.plans) {
      const priorite = pa.Priorite?.trim();
      if (priorite) {
        set.add(priorite);
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
    );
  }, [data.plans]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const annee = anneeFilter ? Number.parseInt(anneeFilter, 10) : undefined;
    return data.plans
      .filter((pa) => {
        const okAnnee = annee == null || pa.Annee === annee;
        const okBureau = !bureauFilter || pa.Bureau === bureauFilter;
        const okPriorite = !prioriteFilter || pa.Priorite?.trim() === prioriteFilter;
        const hay = [
          libellePlanActivite(pa),
          pa.Domaine,
          pa.Sous_domaine,
          pa.Responsable_activite,
          pa.Priorite,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const okSearch = !q || hay.includes(q);
        return okAnnee && okBureau && okPriorite && okSearch;
      })
      .map((pa) => {
        const finance = useFullFinance
          ? financeForPlanActivite(pa, data.bdcList, data.constatations, data.commandes)
          : financePaOnly(pa);
        const nbBdc = useFullFinance
          ? data.bdcList.filter((bdc) => bdcPaRefId(bdc) === pa.id).length
          : 0;
        return { pa, finance, nbBdc };
      });
  }, [
    anneeFilter,
    bureauFilter,
    data.bdcList,
    data.commandes,
    data.constatations,
    data.plans,
    prioriteFilter,
    search,
    useFullFinance,
  ]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const recap = useMemo(() => {
    let enveloppe = 0;
    let engage = 0;
    let payeSofiane = 0;
    let consommeCra = 0;
    for (const row of rows) {
      enveloppe += row.finance.enveloppe;
      engage += row.finance.engage;
      payeSofiane += row.finance.payeSofiane;
      consommeCra += row.finance.consommeCra;
    }
    return {
      enveloppe,
      engage,
      payeSofiane,
      resteAConsommer: enveloppe - consommeCra,
    };
  }, [rows]);

  const filtersActive = Boolean(search.trim() || anneeFilter || bureauFilter || prioriteFilter);

  const resetFilters = () => {
    setSearch("");
    setSearchDraft("");
    setAnneeFilter("");
    setBureauFilter("");
    setPrioriteFilter("");
    setPage(1);
  };

  if (data.untrustedEmbed) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Plans d’activité</h1>
        <Alert
          severity="error"
          title="Embed non autorisé"
          description={
            data.error ??
            "Ce widget ne s’active que dans une page Grist (grist.numerique.gouv.fr). L’URL publique seule ne donne accès à aucune donnée."
          }
        />
      </div>
    );
  }

  if (data.outsideGrist) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Plans d’activité</h1>
        <Alert
          severity="info"
          title="Hors Grist"
          description="Ce widget attend l’API Custom Widget. Lancez-le via un widget Custom dans Grist (URL http://localhost:5175) avec Select Data = Plan_activite."
        />
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="fr-py-1w">
        <h1 className="fr-h3">Plans d’activité</h1>
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
        <h1 className="fr-h3">Plans d’activité</h1>
        <Alert severity="error" title="Erreur" description={data.error} />
      </div>
    );
  }

  return (
    <div className="fr-py-1w">
      <h1 className="fr-h3">Plans d’activité</h1>

      {data.relatedStatus === "denied" || data.relatedStatus === "error" ? (
        <Alert
          severity="warning"
          small
          title="Finance partielle"
          description="Accès multi-tables non disponible (accorder « full » au widget). Affichage des enveloppes PA uniquement."
          className="fr-mb-2w"
        />
      ) : null}

      <FinanceRecap
        enveloppe={recap.enveloppe}
        engage={recap.engage}
        payeSofiane={recap.payeSofiane}
        resteAConsommer={recap.resteAConsommer}
      />

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-1w">
        <div className="fr-col-12">
          <div className="fr-search-bar" role="search">
            <label className="fr-label" htmlFor="pa-widget-search">
              Rechercher un PA (id, activité, domaine…)
            </label>
            <input
              className="fr-input"
              type="search"
              id="pa-widget-search"
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
        <div className="fr-col-12 fr-col-md-4">
          <Select
            label="Année"
            nativeSelectProps={{
              value: anneeFilter,
              onChange: (e) => {
                setAnneeFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Toutes les années</option>
            {anneeOptions.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Select
            label="Bureau"
            nativeSelectProps={{
              value: bureauFilter,
              onChange: (e) => {
                setBureauFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Tous les bureaux</option>
            {bureauOptions.map((bureau) => (
              <option key={bureau} value={bureau}>
                {bureau}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Select
            label="Priorité"
            nativeSelectProps={{
              value: prioriteFilter,
              onChange: (e) => {
                setPrioriteFilter(e.currentTarget.value);
                setPage(1);
              },
            }}
          >
            <option value="">Toutes les priorités</option>
            {prioriteOptions.map((priorite) => (
              <option key={priorite} value={priorite}>
                {priorite}
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
            ? "Aucun plan d’activité ne correspond aux filtres."
            : "Aucun plan d’activité."
          : `${rows.length} plan${rows.length > 1 ? "s" : ""} d’activité.`}
      </p>

      <TableShell className="fr-mb-3w">
        <table>
          <caption className="fr-sr-only">Liste des plans d’activité</caption>
          <thead>
            <tr>
              <th scope="col">Activité</th>
              <th scope="col">Année</th>
              <th scope="col">Bureau</th>
              <th scope="col">Priorité</th>
              <th scope="col" className="fr-cell--right">
                Enveloppe
              </th>
              <th scope="col" className="fr-cell--right">
                Engagé
              </th>
              <th scope="col" className="fr-cell--right">
                Reste à engager
              </th>
              <th scope="col" className="fr-cell--right">
                Reste à consommer
              </th>
              <th scope="col" className="fr-cell--right">
                BDC
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9}>—</td>
              </tr>
            ) : (
              paginated.map(({ pa, finance, nbBdc }) => (
                <tr key={pa.id}>
                  <th scope="row">
                    <Link className="fr-link" to={`/pa/${pa.id}`}>
                      {libellePlanActivite(pa)}
                    </Link>
                  </th>
                  <td>{pa.Annee ?? "—"}</td>
                  <td>{pa.Bureau?.trim() || "—"}</td>
                  <td>{pa.Priorite?.trim() || "—"}</td>
                  <td className="fr-cell--right">{formatMontantEur(finance.enveloppe)}</td>
                  <td className="fr-cell--right">{formatMontantEur(finance.engage)}</td>
                  <td className="fr-cell--right">{montantReste(finance.resteAEngager)}</td>
                  <td className="fr-cell--right">{montantReste(finance.resteAConsommer)}</td>
                  <td className="fr-cell--right">{useFullFinance ? nbBdc : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {pageCount > 1 ? (
        <Pagination
          id="widget-pa-list-pagination"
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
