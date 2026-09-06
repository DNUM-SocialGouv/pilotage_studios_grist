import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { extractGristAttachmentIds } from "../utils/gristAttachments";
import { getGristAccessToken, gristAuthedUrl } from "../utils/gristAccessToken";

type GristAttachmentDownloadLinkProps = {
  value: unknown;
  /** Libellé générique (ex. « Télécharger le devis »). */
  label?: string;
  className?: string;
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

function formatFileSizeFr(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    const ko = bytes / 1024;
    return `${ko.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ko`;
  }
  const mo = bytes / (1024 * 1024);
  return `${mo.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Mo`;
}

function fileExtensionLabel(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0 || i === fileName.length - 1) {
    return "Fichier";
  }
  return fileName.slice(i + 1).toUpperCase();
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
): Promise<{ fileName: string; fileSize: number }> {
  const { token, baseUrl } = await getGristAccessToken(true);
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
  const { token, baseUrl } = await getGristAccessToken(true);
  const [meta, response] = await Promise.all([
    fetchAttachmentMeta(attachmentId).catch(() => ({
      fileName: `piece-jointe-${attachmentId}`,
      fileSize: 0,
    })),
    fetch(gristAuthedUrl(baseUrl, `/attachments/${attachmentId}/download`, token)),
  ]);
  if (!response.ok) {
    throw new Error(`Téléchargement impossible (${response.status}).`);
  }
  const blob = await response.blob();
  const fromHeader = parseContentDispositionFileName(response.headers.get("Content-Disposition"));
  return { blob, fileName: fromHeader ?? meta.fileName };
}

function SingleAttachmentDownloadLink({
  attachmentId,
  label,
}: {
  attachmentId: number;
  label?: string;
}) {
  const [fileName, setFileName] = useState<string>();
  const [fileSize, setFileSize] = useState<number>();
  const [metaLoading, setMetaLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    setError(undefined);
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

  const displayLabel = label ?? (fileName || "Télécharger");
  const detail =
    fileName != null && fileSize != null
      ? `${fileExtensionLabel(fileName)} – ${formatFileSizeFr(fileSize)}`
      : metaLoading
        ? "…"
        : undefined;
  const hoverTitle = fileName
    ? label
      ? `${label} — ${fileName}`
      : fileName
    : displayLabel;

  const onDownload = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (downloading) {
      return;
    }
    setError(undefined);
    setDownloading(true);
    try {
      const { blob, fileName: downloadedName } = await downloadAttachment(attachmentId);
      triggerBrowserDownload(blob, downloadedName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Téléchargement impossible");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <a
        className="fr-link fr-link--download"
        href="#"
        download={fileName ?? true}
        onClick={(e) => {
          void onDownload(e);
        }}
        aria-busy={downloading || undefined}
        aria-disabled={downloading || undefined}
        title={hoverTitle}
      >
        {downloading ? "Téléchargement…" : displayLabel}
        {detail ? <span className="fr-link__detail">{detail}</span> : null}
      </a>
      {error ? (
        <span className="fr-error-text fr-mt-1v fr-mb-0" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Lien(s) DSFR de téléchargement pour une colonne Attachments.
 * Auth via `getAccessToken` (pas de clé API dans le bundle).
 */
export function GristAttachmentDownloadLink({
  value,
  label,
  className,
}: GristAttachmentDownloadLinkProps) {
  const attachmentIds = extractGristAttachmentIds(value);

  if (attachmentIds.length === 0) {
    return <>—</>;
  }

  if (attachmentIds.length === 1) {
    return (
      <div className={className}>
        <SingleAttachmentDownloadLink attachmentId={attachmentIds[0]!} label={label} />
      </div>
    );
  }

  return (
    <ul className={["fr-mb-0 fr-pl-0", className].filter(Boolean).join(" ")}>
      {attachmentIds.map((id, index) => (
        <li key={id} className={index > 0 ? "fr-mt-2w" : undefined}>
          <SingleAttachmentDownloadLink
            attachmentId={id}
            label={label ? `${label} (${index + 1})` : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

/** Lien externe Sofiane si URL HTTP(S), sinon texte. */
export function sofianeBdcCell(value: unknown): ReactNode {
  const url =
    typeof value === "string"
      ? value.trim()
      : typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : "";
  if (!url) {
    return "—";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return (
      <a
        className="fr-link fr-icon-external-link-line fr-link--icon-right"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Ouvrir dans Sofiane
      </a>
    );
  }
  return url;
}
