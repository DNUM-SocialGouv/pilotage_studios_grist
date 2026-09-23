import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import {
  extractGristAttachmentIds,
  fileExtensionLabel,
  formatFileSizeFr,
  MISSION_DOC_ACCEPT,
  MISSION_DOC_HINT,
} from "../../utils/gristAttachments.ts";
import {
  getGristAccessToken,
  gristAuthedUrl,
  type GristAccessToken,
} from "../../utils/gristAccessToken.ts";
import { addMissionDoc, removeMissionDoc } from "../../utils/missionDocsWrite.ts";

type MissionContexteDocsPanelProps = {
  missionId: number;
  docs: unknown;
  onChanged: () => Promise<void>;
};

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseContentDispositionFileName(header: string | null): string | undefined {
  if (!header) {
    return undefined;
  }
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      /* ignore */
    }
  }
  const plain = /filename="([^"]+)"/i.exec(header) ?? /filename=([^;]+)/i.exec(header);
  return plain?.[1]?.trim() || undefined;
}

async function fetchAttachmentMeta(
  attachmentId: number,
  access?: GristAccessToken,
): Promise<{ fileName: string; fileSize: number }> {
  const { token, baseUrl } = access ?? (await getGristAccessToken(true));
  const response = await fetch(gristAuthedUrl(baseUrl, `/attachments/${attachmentId}`, token));
  if (!response.ok) {
    throw new Error(`Métadonnées indisponibles (${response.status}).`);
  }
  const data = (await response.json()) as { fileName?: unknown; fileSize?: unknown };
  const fileName =
    typeof data.fileName === "string" && data.fileName.trim()
      ? data.fileName.trim()
      : `piece-jointe-${attachmentId}`;
  const fileSize =
    typeof data.fileSize === "number" && Number.isFinite(data.fileSize) ? data.fileSize : 0;
  return { fileName, fileSize };
}

async function downloadAttachment(
  attachmentId: number,
): Promise<{ blob: Blob; fileName: string }> {
  const access = await getGristAccessToken(true);
  const [meta, response] = await Promise.all([
    fetchAttachmentMeta(attachmentId, access).catch(() => ({
      fileName: `piece-jointe-${attachmentId}`,
      fileSize: 0,
    })),
    fetch(gristAuthedUrl(access.baseUrl, `/attachments/${attachmentId}/download`, access.token)),
  ]);
  if (!response.ok) {
    throw new Error(`Téléchargement impossible (${response.status}).`);
  }
  const blob = await response.blob();
  const fromHeader = parseContentDispositionFileName(response.headers.get("Content-Disposition"));
  return { blob, fileName: fromHeader ?? meta.fileName };
}

function MissionDocRow({
  attachmentId,
  busy,
  onRemove,
}: {
  attachmentId: number;
  busy: boolean;
  onRemove: (id: number) => void;
}) {
  const [fileName, setFileName] = useState<string>();
  const [fileSize, setFileSize] = useState<number>();
  const [metaLoading, setMetaLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    void fetchAttachmentMeta(attachmentId)
      .then((meta) => {
        if (cancelled) {
          return;
        }
        setFileName(meta.fileName);
        setFileSize(meta.fileSize);
      })
      .catch(() => {
        if (!cancelled) {
          setFileName(undefined);
          setFileSize(undefined);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMetaLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attachmentId]);

  const displayLabel = metaLoading ? "…" : fileName || "Télécharger";
  const detail =
    fileName != null && fileSize != null
      ? `${fileExtensionLabel(fileName)} – ${formatFileSizeFr(fileSize)}`
      : metaLoading
        ? "…"
        : undefined;

  return (
    <li className="mission-contexte-docs__row">
      <div className="mission-contexte-docs__link">
        <button
          type="button"
          className="fr-link fr-link--download"
          onClick={() => {
            if (downloading || busy) {
              return;
            }
            setDownloadError(undefined);
            setDownloading(true);
            void downloadAttachment(attachmentId)
              .then(({ blob, fileName: downloadedName }) => {
                triggerBrowserDownload(blob, downloadedName);
              })
              .catch((err) => {
                setDownloadError(
                  err instanceof Error ? err.message : "Téléchargement impossible",
                );
              })
              .finally(() => {
                setDownloading(false);
              });
          }}
          disabled={downloading || busy}
          aria-busy={downloading || undefined}
          title={fileName ?? displayLabel}
        >
          {downloading ? "Téléchargement…" : displayLabel}
          {detail ? <span className="fr-link__detail">{detail}</span> : null}
        </button>
        {downloadError ? (
          <span className="fr-error-text fr-mt-1v fr-mb-0" role="alert">
            {downloadError}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-delete-bin-line fr-btn--icon-left mission-contexte-docs__delete"
        disabled={busy}
        onClick={() => onRemove(attachmentId)}
      >
        Supprimer
      </button>
    </li>
  );
}

/**
 * Panneau PJ fiche mission (colonne Contexte) — usages app sœur :
 * télécharger · supprimer · ajouter (validation type/taille).
 */
export function MissionContexteDocsPanel({
  missionId,
  docs,
  onChanged,
}: MissionContexteDocsPanelProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentIds = extractGristAttachmentIds(docs);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || busy) {
      return;
    }
    setBusy("upload");
    setError(null);
    try {
      await addMissionDoc(missionId, file);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout du document impossible.");
    } finally {
      setBusy(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemove(attachmentId: number) {
    if (busy) {
      return;
    }
    const label = `Retirer cette pièce jointe de la mission ?`;
    if (!window.confirm(label)) {
      return;
    }
    setBusy("remove");
    setError(null);
    try {
      await removeMissionDoc(missionId, attachmentId);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mission-contexte-docs" aria-labelledby={titleId}>
      <h2 id={titleId} className="fr-h6 fr-mb-1w">
        Pièces jointes
        {attachmentIds.length > 0 ? (
          <span className="fr-text--sm fr-text-mention--grey mission-contexte-docs__count">
            {" "}
            ({attachmentIds.length})
          </span>
        ) : null}
      </h2>
      <p className="fr-text--sm fr-mb-2w">Documents rattachés à cette mission.</p>

      {attachmentIds.length > 0 ? (
        <ul className="fr-links-group fr-links-group--download mission-contexte-docs__list">
          {attachmentIds.map((id) => (
            <MissionDocRow
              key={id}
              attachmentId={id}
              busy={busy != null}
              onRemove={(aid) => {
                void handleRemove(aid);
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
          Aucune pièce jointe pour le moment.
        </p>
      )}

      {error ? (
        <Alert
          severity="error"
          small
          title="Action impossible"
          description={error}
          className="fr-mb-2w"
        />
      ) : null}

      <input
        ref={inputRef}
        type="file"
        className="fr-sr-only"
        accept={MISSION_DOC_ACCEPT}
        disabled={busy != null}
        onChange={(e) => {
          void handleAdd(e.target.files);
        }}
      />
      <button
        type="button"
        className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-upload-line fr-btn--icon-left"
        disabled={busy != null}
        onClick={() => inputRef.current?.click()}
      >
        {busy === "upload" ? "Envoi…" : busy === "remove" ? "Mise à jour…" : "Ajouter un document"}
      </button>
      <p className="fr-hint-text fr-mt-1w fr-mb-0">{MISSION_DOC_HINT}</p>
    </section>
  );
}
