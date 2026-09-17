import { useEffect, useMemo, useState } from "react";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { TableShell } from "../components/FinanceRecap";
import { useGristPa } from "../GristPaContext";
import { useMissionsData } from "../hooks/useMissionsData";
import { NothingHerePage } from "../security/NothingHerePage";
import {
  buildCraExportRows,
  buildPortageByIntervenantId,
  copyCraExportTable,
  CRA_EXPORT_COLUMNS,
  craExportCellDisplay,
  craExportCsvFilename,
  defaultCraExportColumnVisibility,
  downloadCraExportCsv,
  downloadCraExportCsvByPortage,
  groupCraExportByPortage,
  selectedCraExportColumns,
  type CraExportColumnId,
  type CraExportCopyFormat,
  type CraExportLabelMaps,
  type CraExportPortageGroup,
} from "../utils/craExport";
import {
  craEquipeOptions,
  craPeriodeOptions,
  defaultCraOrder,
  missionsByIdFromRows,
} from "../utils/craList";
import { formatMontantEur } from "../utils/formatMontant";
import {
  extractGristReferenceId,
  extractSuiviBdcRowRef,
} from "../utils/gristReferences";
import { gristPeriodeFilterKey } from "../utils/gristPeriode";
import { produitsByIdFromRows } from "../utils/missionsList";
import { labelProduitSuivi } from "../utils/suiviLabels";

function sanitizeId(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "sans-portage"
  );
}

function bdcRefId(s: { BDC_cible?: unknown; Bdc_Chorus2?: unknown }): number | undefined {
  const ref = extractSuiviBdcRowRef(s as Record<string, unknown>);
  return ref !== undefined && ref !== 0 ? ref : undefined;
}

export function CraRecapPorteursPage() {
  const pa = useGristPa();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useMissionsData(enabled);

  const [periode, setPeriode] = useState("");
  const [equipeFilter, setEquipeFilter] = useState("");
  const [portageFilter, setPortageFilter] = useState("");
  const [bdcFiltre, setBdcFiltre] = useState("");
  const [intervenantFiltre, setIntervenantFiltre] = useState("");
  const [produitFiltre, setProduitFiltre] = useState("");
  const [copyFormat, setCopyFormat] = useState<CraExportCopyFormat>("html");
  const [columnVisibility, setColumnVisibility] = useState(defaultCraExportColumnVisibility);
  const [actionMessage, setActionMessage] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

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

  const bdcChorusById = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of pa.bdcList) {
      const chorus = b.BdC_Chorus?.trim();
      if (chorus) {
        map.set(b.id, chorus);
      }
    }
    return map;
  }, [pa.bdcList]);

  const sortedSuivi = useMemo(
    () => data.suivi.slice().sort(defaultCraOrder),
    [data.suivi],
  );

  const periodeOptions = useMemo(() => craPeriodeOptions(sortedSuivi), [sortedSuivi]);

  /** Resynchronise le mois si vide ou hors options (évite le flash « période requise »). */
  useEffect(() => {
    if (periodeOptions.length === 0) {
      if (periode) {
        setPeriode("");
      }
      return;
    }
    if (!periode || !periodeOptions.some((o) => o.value === periode)) {
      setPeriode(periodeOptions[0].value);
    }
  }, [periodeOptions, periode]);

  const resetFiltersAfterPeriodeChange = () => {
    setEquipeFilter("");
    setPortageFilter("");
    setBdcFiltre("");
    setIntervenantFiltre("");
    setProduitFiltre("");
  };

  const resetFiltersAfterEquipeChange = () => {
    setPortageFilter("");
    setBdcFiltre("");
    setIntervenantFiltre("");
    setProduitFiltre("");
  };

  const portageDataUnavailable = useMemo(() => {
    const equipeFailed = Boolean(data.refsError?.includes("Equipe"));
    if (equipeFailed) {
      return true;
    }
    if (data.intervenants.length > 0) {
      return false;
    }
    return sortedSuivi.some((s) => {
      const id = extractGristReferenceId(s.Intervenants);
      return id != null && id !== 0;
    });
  }, [data.refsError, data.intervenants.length, sortedSuivi]);

  const labelMaps: CraExportLabelMaps = useMemo(
    () => ({
      intervenantsById,
      portageByIntervenantId: buildPortageByIntervenantId(data.intervenants),
      bdcById,
      bdcChorusById,
      produitsById,
      missionsById,
      enfantsById,
    }),
    [
      data.intervenants,
      intervenantsById,
      bdcById,
      bdcChorusById,
      produitsById,
      missionsById,
      enfantsById,
    ],
  );

  const rowsForPeriode = useMemo(() => {
    return sortedSuivi.filter((s) => {
      if (periode && gristPeriodeFilterKey(s.Periode, s) !== periode) {
        return false;
      }
      if (equipeFilter && (s.Equipe ?? "").trim() !== equipeFilter) {
        return false;
      }
      if (bdcFiltre) {
        const bid = bdcRefId(s);
        if (bid === undefined || String(bid) !== bdcFiltre) {
          return false;
        }
      }
      if (intervenantFiltre) {
        const iid = extractGristReferenceId(s.Intervenants);
        if (iid == null || iid === 0 || String(iid) !== intervenantFiltre) {
          return false;
        }
      }
      if (produitFiltre && labelProduitSuivi(s, produitsById) !== produitFiltre) {
        return false;
      }
      return true;
    });
  }, [
    sortedSuivi,
    periode,
    equipeFilter,
    bdcFiltre,
    intervenantFiltre,
    produitFiltre,
    produitsById,
  ]);

  const equipeOptions = useMemo(() => {
    if (!periode) {
      return craEquipeOptions(sortedSuivi);
    }
    return craEquipeOptions(
      sortedSuivi.filter((s) => gristPeriodeFilterKey(s.Periode, s) === periode),
    );
  }, [sortedSuivi, periode]);

  const intervenantOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const s of rowsForPeriode) {
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
  }, [rowsForPeriode, intervenantsById]);

  const produitOptions = useMemo(() => {
    const labels = new Set<string>();
    for (const s of rowsForPeriode) {
      const label = labelProduitSuivi(s, produitsById);
      if (label && label !== "—") {
        labels.add(label);
      }
    }
    return Array.from(labels).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" }),
    );
  }, [rowsForPeriode, produitsById]);

  const bdcOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const s of rowsForPeriode) {
      const id = bdcRefId(s);
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
  }, [rowsForPeriode, bdcById]);

  const exportRows = useMemo(
    () => buildCraExportRows(rowsForPeriode, labelMaps),
    [rowsForPeriode, labelMaps],
  );

  const groups = useMemo(() => groupCraExportByPortage(exportRows), [exportRows]);

  const portageOptions = useMemo(() => groups.map((g) => g.portage), [groups]);

  const visibleGroups = useMemo(() => {
    if (!portageFilter) {
      return groups;
    }
    return groups.filter((g) => g.portage === portageFilter);
  }, [groups, portageFilter]);

  const visibleRows = useMemo(
    () => visibleGroups.flatMap((g) => g.rows),
    [visibleGroups],
  );

  const periodeLabel =
    periodeOptions.find((o) => o.value === periode)?.label || periode || "période";

  const activeColumns = useMemo(
    () => selectedCraExportColumns(columnVisibility),
    [columnVisibility],
  );

  const clearFeedback = () => {
    setActionMessage(undefined);
    setActionError(undefined);
  };

  const toggleColumn = (id: CraExportColumnId, checked: boolean) => {
    clearFeedback();
    setColumnVisibility((prev) => {
      const next = { ...prev, [id]: checked };
      const stillOne = CRA_EXPORT_COLUMNS.some((col) => next[col.id] !== false);
      if (!stillOne) {
        return prev;
      }
      return next;
    });
  };

  const runCopy = async (rows: typeof exportRows, label: string) => {
    clearFeedback();
    if (portageDataUnavailable) {
      setActionError(
        "Le référentiel Equipe (portage) est indisponible — export et copie bloqués.",
      );
      return;
    }
    if (activeColumns.length === 0) {
      setActionError("Activez au moins une colonne.");
      return;
    }
    setBusy(true);
    try {
      await copyCraExportTable(rows, activeColumns, copyFormat);
      const formatLabel = copyFormat === "html" ? "HTML" : "Markdown";
      setActionMessage(
        `${label} copié (tableau ${formatLabel}). Collez dans votre mail ou éditeur.`,
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Copie impossible");
    } finally {
      setBusy(false);
    }
  };

  const runDownloadAllCsv = () => {
    clearFeedback();
    if (portageDataUnavailable) {
      setActionError(
        "Le référentiel Equipe (portage) est indisponible — export et copie bloqués.",
      );
      return;
    }
    if (activeColumns.length === 0) {
      setActionError("Activez au moins une colonne.");
      return;
    }
    if (visibleRows.length === 0) {
      setActionError("Aucune ligne à exporter.");
      return;
    }
    const filename = portageFilter
      ? craExportCsvFilename(periodeLabel, portageFilter)
      : craExportCsvFilename(periodeLabel);
    downloadCraExportCsv(filename, visibleRows, activeColumns);
    setActionMessage(
      portageFilter
        ? `CSV « ${portageFilter} » téléchargé.`
        : "CSV consolidé (tous les porteurs) téléchargé.",
    );
  };

  const runDownloadByPortage = async () => {
    clearFeedback();
    if (portageDataUnavailable) {
      setActionError(
        "Le référentiel Equipe (portage) est indisponible — export et copie bloqués.",
      );
      return;
    }
    if (activeColumns.length === 0) {
      setActionError("Activez au moins une colonne.");
      return;
    }
    if (visibleGroups.length === 0) {
      setActionError("Aucune ligne à exporter.");
      return;
    }
    setBusy(true);
    try {
      await downloadCraExportCsvByPortage(visibleGroups, periodeLabel, activeColumns);
      setActionMessage(
        visibleGroups.length === 1
          ? `CSV « ${visibleGroups[0].portage} » téléchargé.`
          : `${visibleGroups.length} CSV téléchargés (un par porteur).`,
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Téléchargement impossible");
    } finally {
      setBusy(false);
    }
  };

  const runDownloadOne = (group: CraExportPortageGroup) => {
    clearFeedback();
    if (portageDataUnavailable) {
      setActionError(
        "Le référentiel Equipe (portage) est indisponible — export et copie bloqués.",
      );
      return;
    }
    if (activeColumns.length === 0) {
      setActionError("Activez au moins une colonne.");
      return;
    }
    downloadCraExportCsv(
      craExportCsvFilename(periodeLabel, group.portage),
      group.rows,
      activeColumns,
    );
    setActionMessage(`CSV « ${group.portage} » téléchargé.`);
  };

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  if (pa.loading) {
    return (
      <>
        <h1>Récap porteurs</h1>
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
        <h1>Récap porteurs</h1>
        <Alert severity="error" title="Erreur" description={pa.error} />
      </>
    );
  }

  if (data.status === "idle" || data.status === "loading") {
    return (
      <>
        <h1>Récap porteurs</h1>
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
        <h1>Récap porteurs</h1>
        <Alert
          severity="error"
          title="Erreur"
          description={data.error ?? "Les réalisations n’ont pas pu être chargées."}
        />
      </>
    );
  }

  return (
    <>
      <h1>Récap CRA pour les porteurs</h1>
      {portageDataUnavailable ? (
        <Alert
          severity="error"
          title="Portage indisponible"
          description="La table Equipe n’a pas pu être chargée : le groupement par porteur serait incorrect. Rechargez la page ou vérifiez vos droits Grist — export et copie sont bloqués."
          className="fr-mb-2w"
        />
      ) : data.refsError ? (
        <Alert
          severity="warning"
          title="Référentiels partiels"
          description={data.refsError}
          className="fr-mb-2w"
        />
      ) : null}
      <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
        Préparez un tableau par portage (MALT, OCTO…) pour validation des jours et bons de
        commande en fin de mois. Export CSV ou copie pour envoi manuel — pas d’e-mail
        automatique.
      </p>

      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-12 fr-col-md-4">
          <Select
            label="Mois du récap"
            nativeSelectProps={{
              value: periode,
              onChange: (e) => {
                clearFeedback();
                setPeriode(e.currentTarget.value);
                resetFiltersAfterPeriodeChange();
              },
            }}
          >
            {periodeOptions.length === 0 ? (
              <option value="">Aucune période</option>
            ) : null}
            {periodeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Select
            label="Équipe"
            nativeSelectProps={{
              value: equipeFilter,
              onChange: (e) => {
                clearFeedback();
                setEquipeFilter(e.currentTarget.value);
                resetFiltersAfterEquipeChange();
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
        <div className="fr-col-12 fr-col-md-4">
          <Select
            label="Portage (aperçu)"
            nativeSelectProps={{
              value: portageFilter,
              onChange: (e) => {
                clearFeedback();
                setPortageFilter(e.currentTarget.value);
              },
            }}
          >
            <option value="">Tous les porteurs</option>
            {portageOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Accordion
        id="cra-recap-filtres-avances"
        titleAs="h2"
        label="Filtres avancés (BDC, intervenant, produit)"
      >
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
          <div className="fr-col-12 fr-col-md-4">
            <Select
              label="Bon de commande"
              nativeSelectProps={{
                value: bdcFiltre,
                onChange: (e) => {
                  clearFeedback();
                  setBdcFiltre(e.currentTarget.value);
                  setPortageFilter("");
                },
              }}
            >
              <option value="">Tous</option>
              {bdcOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <Select
              label="Intervenant"
              nativeSelectProps={{
                value: intervenantFiltre,
                onChange: (e) => {
                  clearFeedback();
                  setIntervenantFiltre(e.currentTarget.value);
                  setPortageFilter("");
                },
              }}
            >
              <option value="">Tous</option>
              {intervenantOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <Select
              label="Produit"
              nativeSelectProps={{
                value: produitFiltre,
                onChange: (e) => {
                  clearFeedback();
                  setProduitFiltre(e.currentTarget.value);
                  setPortageFilter("");
                },
              }}
            >
              <option value="">Tous</option>
              {produitOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Accordion>

      <div className="fr-mb-3w">
        <Accordion
          id="cra-recap-columns"
          titleAs="h2"
          label={`Colonnes affichées et exportées (${activeColumns.length}/${CRA_EXPORT_COLUMNS.length})`}
          defaultExpanded={false}
        >
          <p className="fr-hint-text fr-mb-2w">
            Par défaut : colonnes utiles à l’envoi porteur. Activez Produit / Mission / Équipe /
            Période pour un contrôle interne. L’aperçu, le CSV et la copie respectent la
            sélection.
          </p>
          <Checkbox
            small
            options={CRA_EXPORT_COLUMNS.map((col) => ({
              label: col.internalByDefault ? `${col.label} (interne)` : col.label,
              nativeInputProps: {
                checked: columnVisibility[col.id] !== false,
                onChange: (e) => toggleColumn(col.id, e.currentTarget.checked),
              },
            }))}
          />
        </Accordion>
      </div>

      {actionError ? (
        <Alert
          severity="error"
          small
          title="Action impossible"
          description={actionError}
          className="fr-mb-2w"
        />
      ) : null}
      {actionMessage ? (
        <Alert
          severity="success"
          small
          title="OK"
          description={actionMessage}
          className="fr-mb-2w"
        />
      ) : null}

      {!periode && periodeOptions.length === 0 ? (
        <Alert
          severity="info"
          small
          title="Aucune période"
          description="Aucune réalisation avec période exploitable."
          className="fr-mb-2w"
        />
      ) : !periode ? (
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Sélection du mois…"
          className="fr-mb-2w"
          role="status"
        />
      ) : exportRows.length === 0 ? (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
          Aucune réalisation pour {periodeLabel}.
        </p>
      ) : (
        <>
          <p className="fr-mb-2w">
            <span className="fr-text--bold">{visibleRows.length}</span>{" "}
            {visibleRows.length <= 1 ? "ligne" : "lignes"} ·{" "}
            <span className="fr-text--bold">{visibleGroups.length}</span>{" "}
            {visibleGroups.length <= 1 ? "porteur" : "porteurs"}
            {equipeFilter || portageFilter ? (
              <>
                {" "}
                (
                {[
                  equipeFilter ? `équipe ${equipeFilter}` : null,
                  portageFilter ? `portage ${portageFilter}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                )
              </>
            ) : null}
          </p>

          <div className="fr-mb-2w">
            <SegmentedControl
              legend="Format de copie"
              hintText="HTML : collage tableau dans Outlook / mail. Markdown : Notion, Slack, GitHub…"
              name="cra-recap-copy-format"
              small
              segments={[
                {
                  label: "HTML",
                  nativeInputProps: {
                    checked: copyFormat === "html",
                    onChange: () => {
                      clearFeedback();
                      setCopyFormat("html");
                    },
                  },
                },
                {
                  label: "Markdown",
                  nativeInputProps: {
                    checked: copyFormat === "md",
                    onChange: () => {
                      clearFeedback();
                      setCopyFormat("md");
                    },
                  },
                },
              ]}
            />
          </div>

          <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-mb-3w">
            <Button
              type="button"
              priority="primary"
              iconId="fr-icon-download-line"
              disabled={busy || portageDataUnavailable || visibleGroups.length === 0}
              onClick={() => {
                void runDownloadByPortage();
              }}
            >
              Télécharger CSV par porteur
            </Button>
            <Button
              type="button"
              priority="secondary"
              iconId="fr-icon-file-download-line"
              disabled={busy || portageDataUnavailable || visibleRows.length === 0}
              onClick={runDownloadAllCsv}
            >
              CSV consolidé
            </Button>
            <Button
              type="button"
              priority="tertiary"
              iconId="fr-icon-clipboard-line"
              disabled={busy || portageDataUnavailable || visibleRows.length === 0}
              onClick={() => {
                void runCopy(
                  visibleRows,
                  portageFilter ? `Récap ${portageFilter}` : "Récap consolidé",
                );
              }}
            >
              Copier tout
            </Button>
          </div>

          <div className="fr-accordions-group">
            {visibleGroups.map((group, groupIndex) => (
              <Accordion
                key={`${groupIndex}-${group.portage}`}
                id={`cra-recap-portage-${groupIndex}-${sanitizeId(group.portage)}`}
                titleAs="h3"
                label={`${group.portage} — ${group.rows.length} ligne${
                  group.rows.length > 1 ? "s" : ""
                } · ${group.totalJours.toLocaleString("fr-FR")} j · ${formatMontantEur(
                  group.totalTtc,
                )}`}
                defaultExpanded={visibleGroups.length === 1}
              >
                <div className="fr-pt-1w">
                  <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-mb-2w">
                    <Button
                      type="button"
                      size="small"
                      priority="secondary"
                      iconId="fr-icon-download-line"
                      disabled={busy || portageDataUnavailable}
                      onClick={() => runDownloadOne(group)}
                    >
                      CSV
                    </Button>
                    <Button
                      type="button"
                      size="small"
                      priority="tertiary"
                      iconId="fr-icon-clipboard-line"
                      disabled={busy || portageDataUnavailable}
                      onClick={() => {
                        void runCopy(group.rows, `Récap ${group.portage}`);
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                  <TableShell className="fr-mb-0">
                    <table>
                      <caption className="fr-sr-only">
                        Réalisations {group.portage} — {periodeLabel}
                      </caption>
                      <thead>
                        <tr>
                          {activeColumns.map((col) => (
                            <th
                              key={col.id}
                              scope="col"
                              className={col.numeric ? "fr-cell--right" : undefined}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((r) => (
                          <tr key={r.suiviId}>
                            {activeColumns.map((col) => (
                              <td
                                key={col.id}
                                className={col.numeric ? "fr-cell--right" : undefined}
                              >
                                {craExportCellDisplay(r, col.id)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableShell>
                </div>
              </Accordion>
            ))}
          </div>
        </>
      )}
    </>
  );
}
