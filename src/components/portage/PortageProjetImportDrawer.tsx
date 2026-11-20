/**
 * Panneau d’import : le fichier est vérifié avant toute création.
 * Seules les lignes « prêtes » sont enregistrées, une par une.
 */

import { forwardRef, useCallback, useId, useImperativeHandle, useRef, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { TableShell } from "../FinanceRecap";
import { createPortageProjetRecord } from "../../utils/portageProjetGristWrite.ts";
import { buildPortageProjetCreateFields } from "../../utils/portageProjetFormFields.ts";
import {
  portageImportReadyKey,
  portageImportTemplateCsv,
  previewPortageImport,
  type PortageImportCatalog,
  type PortageImportPreview,
} from "../../utils/portageProjetImport.ts";

export type PortageProjetImportDrawerHandle = {
  open: () => void;
  close: () => void;
};

export type PortageProjetImportDrawerProps = {
  catalog: PortageImportCatalog;
  reloadCatalog: () => Promise<PortageImportCatalog>;
  onImported: (created: number) => Promise<void>;
};

export const PortageProjetImportDrawer = forwardRef<
  PortageProjetImportDrawerHandle,
  PortageProjetImportDrawerProps
>(function PortageProjetImportDrawer({ catalog, reloadCatalog, onImported }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const runTicket = useRef(0);
  const titleId = useId();
  const fileId = useId();
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PortageImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const stopRun = useCallback(() => {
    runTicket.current += 1;
  }, []);

  const close = useCallback(() => {
    stopRun();
    dialogRef.current?.close();
    setBusy(false);
    setError(undefined);
  }, [stopRun]);

  const open = useCallback(() => {
    stopRun();
    setCsvText("");
    setFileName("");
    setPreview(null);
    setError(undefined);
    setBusy(false);
    dialogRef.current?.showModal();
  }, [stopRun]);

  useImperativeHandle(ref, () => ({ open, close }), [open, close]);

  const readFile = async (file: File | undefined) => {
    setError(undefined);
    setPreview(null);
    setCsvText("");
    setFileName(file?.name ?? "");
    if (!file) {
      return;
    }
    const text = await file.text();
    setCsvText(text);
    setPreview(previewPortageImport(text, catalog));
  };

  const downloadTemplate = () => {
    const blob = new Blob([portageImportTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele-portage.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importReady = async () => {
    if (!preview || preview.readyCount === 0 || preview.fileError) {
      return;
    }
    const ticket = runTicket.current;
    setBusy(true);
    setError(undefined);
    let created = 0;
    let refreshed = false;
    const refreshCreated = async () => {
      if (refreshed || created <= 0) {
        return;
      }
      refreshed = true;
      await onImported(created);
    };
    try {
      const fresh = await reloadCatalog();
      if (runTicket.current !== ticket) {
        return;
      }
      const again = previewPortageImport(csvText, fresh);
      if (again.fileError || portageImportReadyKey(again) !== portageImportReadyKey(preview)) {
        setPreview(again);
        setError("La vérification a changé. Relisez les lignes, puis importez de nouveau.");
        return;
      }
      const failures: string[] = [];
      for (const line of again.lines) {
        if (runTicket.current !== ticket) {
          return;
        }
        if (line.status !== "ready" || !line.values) {
          continue;
        }
        try {
          await createPortageProjetRecord(buildPortageProjetCreateFields(line.values));
          created += 1;
        } catch (err) {
          failures.push(
            `Ligne ${line.line} : ${err instanceof Error ? err.message : "création impossible"}.`,
          );
        }
      }
      if (runTicket.current !== ticket) {
        return;
      }
      await refreshCreated();
      if (runTicket.current !== ticket) {
        return;
      }
      if (failures.length > 0) {
        const createdLabel =
          created <= 0
            ? "Aucun portage créé."
            : created === 1
              ? "1 portage créé."
              : `${created} portages créés.`;
        setError(`${createdLabel} ${failures.join(" ")}`);
        return;
      }
      close();
    } catch (err) {
      if (runTicket.current === ticket) {
        setError(err instanceof Error ? err.message : "Import impossible.");
      }
    } finally {
      if (runTicket.current !== ticket) {
        await refreshCreated();
      }
      if (runTicket.current === ticket) {
        setBusy(false);
      }
    }
  };

  const readyLabel =
    preview && preview.readyCount > 0
      ? `Importer ${preview.readyCount} ligne${preview.readyCount > 1 ? "s" : ""} prête${preview.readyCount > 1 ? "s" : ""}`
      : "Importer les lignes prêtes";

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-drawer-dialog pilotage-drawer-dialog--sm"
      aria-labelledby={titleId}
      onClose={() => {
        stopRun();
        setBusy(false);
        setError(undefined);
      }}
    >
      <div className="pilotage-drawer-dialog__shell">
        <div className="pilotage-drawer-dialog__scrim" aria-hidden="true" onClick={close} />
        <div className="pilotage-drawer-dialog__panel">
          <div className="pilotage-drawer-dialog__inner">
            <header className="fr-p-3w fr-pb-2w">
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                <div className="fr-col">
                  <h2 id={titleId} className="fr-h5 fr-mb-0">
                    Importer des portages
                  </h2>
                  <p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-1w">
                    Déposez un tableau. Rien n’est enregistré tant que vous n’avez pas
                    confirmé les lignes prêtes. Un portage déjà présent n’est pas réécrit.
                  </p>
                </div>
                <div className="fr-col-auto">
                  <button type="button" className="fr-btn--close fr-btn" title="Fermer" onClick={close}>
                    Fermer
                  </button>
                </div>
              </div>
            </header>

            <div className="pilotage-drawer-dialog__body fr-px-3w fr-pb-3w fr-pt-0">
              {error ? (
                <Alert
                  className="fr-mb-2w"
                  severity="warning"
                  title="Import à relire"
                  description={error}
                />
              ) : null}

              <div className="fr-upload-group fr-mb-2w">
                <label className="fr-label" htmlFor={fileId}>
                  Tableau CSV
                  <span className="fr-hint-text">
                    Séparateur point-virgule. La personne se reconnaît par son nom complet.
                    Le bon de commande se reconnaît par son nom, ou par « Chorus » suivi du numéro.
                  </span>
                </label>
                <input
                  className="fr-upload"
                  type="file"
                  id={fileId}
                  accept=".csv,text/csv"
                  disabled={busy}
                  onChange={(event) => {
                    void readFile(event.target.files?.[0]);
                  }}
                />
              </div>

              <button
                type="button"
                className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-download-line fr-btn--icon-left fr-mb-3w"
                onClick={downloadTemplate}
              >
                Télécharger le modèle
              </button>

              {fileName ? (
                <p className="fr-text--sm" role="status">
                  Fichier : {fileName}
                  {preview && !preview.fileError
                    ? ` — ${preview.readyCount} prête${preview.readyCount > 1 ? "s" : ""}, ${preview.blockedCount} à corriger.`
                    : ""}
                </p>
              ) : null}

              {preview?.fileError ? (
                <Alert severity="error" title="Fichier inutilisable" description={preview.fileError} />
              ) : null}

              {preview && !preview.fileError && preview.lines.length > 0 ? (
                <TableShell className="fr-mb-3w" multiline>
                  <table>
                    <caption className="fr-sr-only">Vérification des lignes à importer</caption>
                    <thead>
                      <tr>
                        <th scope="col">Ligne</th>
                        <th scope="col">Nom du projet</th>
                        <th scope="col">Contrôle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.lines.map((line) => (
                        <tr key={line.line}>
                          <td>{line.line}</td>
                          <th scope="row">{line.nom}</th>
                          <td>
                            {line.status === "ready" ? "Prête" : line.messages.join(" ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableShell>
              ) : null}

              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--right">
                <div className="fr-col-auto">
                  <button type="button" className="fr-btn fr-btn--secondary" onClick={close}>
                    Annuler
                  </button>
                </div>
                <div className="fr-col-auto">
                  <button
                    type="button"
                    className="fr-btn"
                    disabled={busy || !preview || preview.readyCount === 0 || Boolean(preview.fileError)}
                    onClick={() => {
                      void importReady();
                    }}
                  >
                    {busy ? "Import…" : readyLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
});
