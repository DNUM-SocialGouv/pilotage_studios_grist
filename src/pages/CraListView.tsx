import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { DsfrSelectRichMulti } from "../components/dsfr/DsfrSelectRichMulti";
import { tdEquipeTag } from "../components/EquipeTags";
import { TableShell } from "../components/FinanceRecap";
import { useGristPa } from "../GristPaContext";
import { useMissionsData } from "../hooks/useMissionsData";
import { NothingHerePage } from "../security/NothingHerePage";
import {
  craEquipeOptions,
  craPeriodeOptions,
  craTotauxFiltres,
  defaultCraOrder,
  filterCraRows,
  formatGristPeriodeMoisAnnee,
  labelBdcCra,
  labelIntervenantSuivi,
  labelMissionCra,
  labelProduitSuivi,
  missionsByIdFromRows,
  extractSuiviBdcRowRef,
  resolveSuiviMasterMissionId,
} from "../utils/craList";
import { formatMontantEur } from "../utils/formatMontant";
import { extractGristReferenceId, extractProduitRefFromSuivi } from "../utils/gristReferences";
import { libelleProduitGrist } from "../utils/pilotageProduits";
import { produitsByIdFromRows } from "../utils/missionsList";
import { montantTtcSuiviMensuel } from "../utils/suiviMensuel";

const PAGE_SIZE = 10;

export function CraListView() {
  const pa = useGristPa();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useMissionsData(enabled);

  const [periode, setPeriode] = useState("");
  const [equipe, setEquipe] = useState("");
  const [intervenantId, setIntervenantId] = useState("");
  const [produitId, setProduitId] = useState("");
  const [bdcId, setBdcId] = useState("");
  const [page, setPage] = useState(1);

  const intervenantsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const i of data.intervenants) {
      map.set(i.id, i.Prenom_Nom?.trim() || `Intervenant #${i.id}`);
    }
    return map;
  }, [data.intervenants]);

  const produitsById = useMemo(
    () => produitsByIdFromRows(data.produits),
    [data.produits],
  );

  const missionsById = useMemo(
    () => missionsByIdFromRows(data.missions),
    [data.missions],
  );

  const enfantsById = useMemo(() => {
    const map = new Map<number, (typeof data.missionEnfants)[number]>();
    for (const e of data.missionEnfants) {
      map.set(e.id, e);
    }
    return map;
  }, [data.missionEnfants]);

  const bdcById = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of pa.bdcList) {
      map.set(b.id, b.Nom_BdC?.trim() || `BDC #${b.id}`);
    }
    return map;
  }, [pa.bdcList]);

  const sortedSuivi = useMemo(
    () => data.suivi.slice().sort(defaultCraOrder),
    [data.suivi],
  );

  const periodeOptions = useMemo(() => craPeriodeOptions(sortedSuivi), [sortedSuivi]);
  const equipeOptions = useMemo(() => craEquipeOptions(sortedSuivi), [sortedSuivi]);

  const intervenantOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const s of sortedSuivi) {
      const id = extractGristReferenceId(s.Intervenants);
      if (id != null && id !== 0) {
        ids.add(id);
      }
    }
    return Array.from(ids)
      .map((id) => ({
        value: String(id),
        label: intervenantsById.get(id) ?? `Intervenant #${id}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
  }, [sortedSuivi, intervenantsById]);

  const produitOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const s of sortedSuivi) {
      const id = extractProduitRefFromSuivi(s as unknown as Record<string, unknown>);
      if (id != null) {
        ids.add(id);
      }
    }
    return Array.from(ids)
      .map((id) => ({
        value: String(id),
        label: produitsById.get(id) ?? libelleProduitGrist({}, id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
  }, [sortedSuivi, produitsById]);

  const bdcOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const s of sortedSuivi) {
      const id = extractSuiviBdcRowRef(s as unknown as Record<string, unknown>);
      if (id != null) {
        ids.add(id);
      }
    }
    return Array.from(ids)
      .map((id) => ({
        value: String(id),
        label: bdcById.get(id) ?? `BDC #${id}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
  }, [sortedSuivi, bdcById]);

  const filtered = useMemo(
    () =>
      filterCraRows(sortedSuivi, {
        periode,
        equipe,
        intervenantId,
        produitId,
        bdcId,
      }),
    [sortedSuivi, periode, equipe, intervenantId, produitId, bdcId],
  );

  const totaux = useMemo(() => craTotauxFiltres(filtered), [filtered]);

  const filtresActifsCount = useMemo(() => {
    let n = 0;
    if (periode) n += 1;
    if (equipe) n += 1;
    if (intervenantId) n += 1;
    if (produitId) n += 1;
    if (bdcId) n += 1;
    return n;
  }, [periode, equipe, intervenantId, produitId, bdcId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setPeriode("");
    setEquipe("");
    setIntervenantId("");
    setProduitId("");
    setBdcId("");
    setPage(1);
  };

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  if (pa.loading) {
    return (
      <>
        <h1>Prestation / CRA</h1>
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Connexion à Grist…"
          role="status"
        />
      </>
    );
  }

  if (pa.error) {
    return (
      <>
        <h1>Prestation / CRA</h1>
        <Alert severity="error" title="Erreur" description={pa.error} />
      </>
    );
  }

  if (data.status === "idle" || data.status === "loading") {
    return (
      <>
        <h1>Prestation / CRA</h1>
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Chargement des réalisations…"
          role="status"
        />
      </>
    );
  }

  if (data.status === "error") {
    return (
      <>
        <h1>Prestation / CRA</h1>
        <Alert
          severity="error"
          title="Erreur"
          description={data.error ?? "Les réalisations n’ont pas pu être chargées."}
        />
      </>
    );
  }

  const rangeFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  return (
    <>
      <h1>Prestation / CRA</h1>

      {data.refsError ? (
        <Alert
          severity="warning"
          title="Référentiels partiels"
          description={data.refsError}
          className="fr-mb-2w"
        />
      ) : null}

      <Accordion
        id="cra-liste-filtres"
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
            <Select
              label="Période"
              nativeSelectProps={{
                value: periode,
                onChange: (e) => {
                  setPeriode(e.currentTarget.value);
                  setPage(1);
                },
              }}
            >
              <option value="">Toutes les périodes</option>
              {periodeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
            <Select
              label="Équipe"
              nativeSelectProps={{
                value: equipe,
                onChange: (e) => {
                  setEquipe(e.currentTarget.value);
                  setPage(1);
                },
              }}
            >
              <option value="">Toutes les équipes</option>
              {equipeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
            <DsfrSelectRichMulti
              label="Intervenant"
              placeholderWhenEmpty="Tous les intervenants"
              pluralEntityLabel="intervenants"
              maxInlineSize="100%"
              options={intervenantOptions}
              selectedValues={intervenantId ? [intervenantId] : []}
              onSelectedValuesChange={(values) => {
                setIntervenantId(values[0] ?? "");
                setPage(1);
              }}
              searchable
              searchLabel="Rechercher"
              searchPlaceholder="Nom…"
              showBulkActions={false}
              maxSelections={1}
            />
          </div>
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
            <DsfrSelectRichMulti
              label="Produit"
              placeholderWhenEmpty="Tous les produits"
              pluralEntityLabel="produits"
              maxInlineSize="100%"
              options={produitOptions}
              selectedValues={produitId ? [produitId] : []}
              onSelectedValuesChange={(values) => {
                setProduitId(values[0] ?? "");
                setPage(1);
              }}
              searchable
              searchLabel="Rechercher"
              searchPlaceholder="Nom…"
              showBulkActions={false}
              maxSelections={1}
            />
          </div>
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-3">
            <DsfrSelectRichMulti
              label="Bon de commande"
              placeholderWhenEmpty="Tous les bons de commande"
              pluralEntityLabel="bons de commande"
              maxInlineSize="100%"
              options={bdcOptions}
              selectedValues={bdcId ? [bdcId] : []}
              onSelectedValuesChange={(values) => {
                setBdcId(values[0] ?? "");
                setPage(1);
              }}
              searchable
              searchLabel="Rechercher"
              searchPlaceholder="Nom…"
              showBulkActions={false}
              maxSelections={1}
            />
          </div>
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

      {sortedSuivi.length === 0 ? (
        <p className="fr-mb-2w">Aucune réalisation dans la table « Réalisé ».</p>
      ) : filtered.length === 0 ? (
        <p className="fr-mb-2w">Aucune réalisation ne correspond aux filtres.</p>
      ) : (
        <p className="fr-mb-2w">
          <span className="fr-text--bold">{filtered.length}</span>{" "}
          {filtered.length <= 1
            ? "réalisation correspond aux filtres"
            : "réalisations correspondent aux filtres"}
          {pageCount > 1 ? (
            <>
              {" "}
              (affichage {rangeFrom}–{rangeTo})
            </>
          ) : null}
        </p>
      )}

      <TableShell className="fr-mb-2w" multiline>
        <table>
          <caption className="fr-sr-only">Réalisations (CRA)</caption>
          <thead>
            <tr>
              <th scope="col">Intervenant</th>
              <th scope="col">Période</th>
              <th scope="col">Équipe</th>
              <th scope="col" className="fr-cell--right">
                Jours
              </th>
              <th scope="col">Tâches</th>
              <th scope="col">Produit</th>
              <th scope="col">Mission</th>
              <th scope="col">BDC</th>
              <th scope="col" className="fr-cell--right">
                TTC
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9}>Aucune réalisation pour ces filtres.</td>
              </tr>
            ) : (
              paginated.map((s) => {
                const masterId = resolveSuiviMasterMissionId(s, enfantsById);
                const bdcRef = extractSuiviBdcRowRef(s as unknown as Record<string, unknown>);
                const ttc = montantTtcSuiviMensuel(s);
                return (
                  <tr key={s.id}>
                    <td>{labelIntervenantSuivi(s, intervenantsById)}</td>
                    <td>{formatGristPeriodeMoisAnnee(s.Periode, s)}</td>
                    <td>{tdEquipeTag(s.Equipe?.trim() || "—")}</td>
                    <td className="fr-cell--right">
                      {typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours)
                        ? s.Nb_jours
                        : "—"}
                    </td>
                    <td>{s.Taches_realisees?.trim() || "—"}</td>
                    <td>{labelProduitSuivi(s, produitsById)}</td>
                    <td>
                      {masterId != null ? (
                        <Link className="fr-link" to={`/missions/${masterId}`}>
                          {labelMissionCra(s, missionsById, enfantsById, intervenantsById)}
                        </Link>
                      ) : (
                        labelMissionCra(s, missionsById, enfantsById, intervenantsById)
                      )}
                    </td>
                    <td>
                      {bdcRef != null ? (
                        <Link className="fr-link" to={`/bdc/${bdcRef}`}>
                          {labelBdcCra(s, bdcById)}
                        </Link>
                      ) : (
                        labelBdcCra(s, bdcById)
                      )}
                    </td>
                    <td className="fr-cell--right">
                      {ttc === undefined ? "—" : formatMontantEur(ttc)}
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
          count={pageCount}
          defaultPage={safePage}
          getPageLinkProps={(p) => ({
            href: `#cra-page-${p}`,
            onClick: (e) => {
              e.preventDefault();
              setPage(p);
            },
          })}
          className="fr-mt-2w"
        />
      ) : null}

      {filtered.length > 0 ? (
        <p className="fr-text--sm fr-mt-2w" role="status">
          Totaux (filtre) : {totaux.jours} j · {formatMontantEur(totaux.ttc)} · {totaux.count}{" "}
          ligne{totaux.count > 1 ? "s" : ""}
        </p>
      ) : null}
    </>
  );
}
