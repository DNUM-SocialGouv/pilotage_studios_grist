import { useMemo, type ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import {
  formatOpteamisDevisHtml,
  formatOpteamisDevisMarkdown,
  type DevisCopyFormat,
} from "../../utils/devisPorteurs/opteamis";
import type { OpteamisDevisFields } from "../../utils/devisPorteurs/types";

const PREVIEW_PLACEHOLDERS: Readonly<
  Partial<Record<keyof OpteamisDevisFields, string>>
> = {
  nomProjet: "Nom du projet à renseigner",
  financeur: "Financeur à renseigner",
  equipes: "Équipe(s) à renseigner",
  demandeContexte: "Demande (contexte) à renseigner",
  livrablesAttendus: "Livrables à renseigner",
  uoConcernees: "Aucune unité d’œuvre sélectionnée",
  informationsChiffrage: "Chiffrage à compléter (quantités UO)",
};

const PERIODE_PLACEHOLDER = "Période à renseigner";

const ALL_PREVIEW_PLACEHOLDER_TEXTS: readonly string[] = [
  ...Object.values(PREVIEW_PLACEHOLDERS),
  PERIODE_PLACEHOLDER,
];

function escapeHtmlLite(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Remplit les champs vides pour l’affichage UI uniquement.
 * La copie presse-papier doit toujours utiliser les champs export bruts.
 */
function buildDisplayFields(fields: OpteamisDevisFields): OpteamisDevisFields {
  const out = { ...fields };
  for (const [key, placeholder] of Object.entries(PREVIEW_PLACEHOLDERS) as [
    keyof OpteamisDevisFields,
    string,
  ][]) {
    if (!out[key].trim()) {
      out[key] = placeholder;
    }
  }
  return out;
}

/** Période vide → libellé placeholder dans le HTML/MD d’affichage seulement. */
function applyPeriodePlaceholder(
  rendered: string,
  fields: OpteamisDevisFields,
  format: DevisCopyFormat,
): string {
  if (fields.periodeDebut.trim() || fields.periodeFin.trim()) {
    return rendered;
  }
  if (format === "md") {
    return rendered.replace(
      /\*\*Période couverte par le devis :\*\* —/,
      `**Période couverte par le devis :** ${PERIODE_PLACEHOLDER}`,
    );
  }
  return rendered.replace(
    /(<strong>Période couverte par le devis :<\/strong> )—/,
    `$1${PERIODE_PLACEHOLDER}`,
  );
}

/** Enrobe les textes placeholder pour un style distinct (aperçu uniquement). */
function highlightPreviewPlaceholders(htmlOrEscapedText: string): string {
  let out = htmlOrEscapedText;
  for (const text of ALL_PREVIEW_PLACEHOLDER_TEXTS) {
    const needle = escapeHtmlLite(text);
    if (!needle || !out.includes(needle)) {
      continue;
    }
    out = out
      .split(needle)
      .join(`<span class="pilotage-devis-placeholder">${needle}</span>`);
  }
  return out;
}

export type DevisOpteamisPreviewProps = {
  /** Champs tels qu’exportés (copie) — sans placeholders. */
  fields: OpteamisDevisFields;
  copyFormat: DevisCopyFormat;
  onCopyFormatChange: (format: DevisCopyFormat) => void;
  onCopy: () => void;
  copyOk?: boolean;
  copyError?: string;
  onDismissCopyOk?: () => void;
  /**
   * `stack` : aperçu pleine largeur (étape dédiée / mobile).
   * `split` : colonne droite live (page formulaire LG+).
   */
  layout?: "stack" | "split";
  showActions?: boolean;
  footerActions?: ReactNode;
};

/**
 * Aperçu Opteamis : même HTML/Markdown que l’export, avec placeholders UI
 * pour les champs encore vides (la copie utilise `fields` bruts via `onCopy`).
 */
export function DevisOpteamisPreview({
  fields,
  copyFormat,
  onCopyFormatChange,
  onCopy,
  copyOk = false,
  copyError,
  onDismissCopyOk,
  layout = "stack",
  showActions = true,
  footerActions,
}: DevisOpteamisPreviewProps) {
  const displayHtml = useMemo(() => {
    const raw = formatOpteamisDevisHtml(buildDisplayFields(fields));
    return highlightPreviewPlaceholders(
      applyPeriodePlaceholder(raw, fields, "html"),
    );
  }, [fields]);

  const displayMarkdownHtml = useMemo(() => {
    const raw = formatOpteamisDevisMarkdown(buildDisplayFields(fields));
    const withPeriode = applyPeriodePlaceholder(raw, fields, "md");
    return highlightPreviewPlaceholders(escapeHtmlLite(withPeriode));
  }, [fields]);

  const rootClass =
    layout === "split"
      ? "pilotage-devis-preview pilotage-devis-preview--split"
      : "pilotage-devis-preview pilotage-devis-preview--stack";

  return (
    <div className={rootClass} aria-label="Aperçu du devis">
      <div className="pilotage-devis-preview__toolbar">
        <h2 className="fr-h6 fr-mb-1w">Aperçu du devis</h2>
        <p className="fr-hint-text fr-mb-2w">
          Les mentions « à renseigner » n’apparaissent pas dans la copie.
        </p>
        {showActions ? (
          <div className="pilotage-devis-preview__copy-bar fr-mb-2w">
            <SegmentedControl
              legend="Format de copie"
              hintText="HTML : Outlook / mail. Markdown : Mattermost, JIRA…"
              small
              segments={[
                {
                  label: "HTML",
                  nativeInputProps: {
                    checked: copyFormat === "html",
                    onChange: () => onCopyFormatChange("html"),
                  },
                },
                {
                  label: "Markdown",
                  nativeInputProps: {
                    checked: copyFormat === "md",
                    onChange: () => onCopyFormatChange("md"),
                  },
                },
              ]}
            />
            <Button
              type="button"
              priority="primary"
              size="small"
              iconId="fr-icon-clipboard-line"
              onClick={onCopy}
            >
              Copier tout
            </Button>
          </div>
        ) : null}
        {copyOk ? (
          <Alert
            severity="success"
            small
            title="Copié"
            description={`Devis copié (${copyFormat === "html" ? "HTML" : "Markdown"}).`}
            closable={Boolean(onDismissCopyOk)}
            onClose={onDismissCopyOk}
            className="fr-mb-2w"
          />
        ) : null}
        {copyError ? (
          <Alert
            severity="error"
            small
            title="Erreur"
            description={copyError}
            className="fr-mb-2w"
          />
        ) : null}
      </div>

      <div className="pilotage-devis-preview__document">
        {copyFormat === "html" ? (
          <div
            className="pilotage-devis-preview__html"
            // Contenu généré localement, entièrement échappé (formatOpteamisDevisHtml).
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        ) : (
          <pre
            className="pilotage-devis-preview__md"
            // Markdown échappé + spans placeholder (aperçu uniquement).
            dangerouslySetInnerHTML={{ __html: displayMarkdownHtml }}
          />
        )}
      </div>

      {footerActions ? (
        <div className="pilotage-devis-preview__footer fr-mt-2w">{footerActions}</div>
      ) : null}
    </div>
  );
}
