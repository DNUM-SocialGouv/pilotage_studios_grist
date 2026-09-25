import { useEffect, useId, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { updateMissionRecord } from "../../utils/missionGristWrite.ts";
import { parseMissionLiensLinks } from "../../utils/missionLiensLinks.ts";

const LIENS_HINT =
  "Une URL par ligne (https://…), ou un lien Markdown [libellé](https://…).";

type MissionLiensFigmaNotionPanelProps = {
  missionId: number;
  value: string | undefined;
  onSaved: () => Promise<void>;
};

function isFilled(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Liens FIGMA / Notion — panneau latéral Contexte (au-dessus des PJ) :
 * liens cliquables + édition sur place.
 */
export function MissionLiensFigmaNotionPanel({
  missionId,
  value,
  onSaved,
}: MissionLiensFigmaNotionPanelProps) {
  const titleId = useId();
  const fieldId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? "");
    }
  }, [value, editing]);

  function startEdit() {
    setDraft(value ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (saving) {
      return;
    }
    setDraft(value ?? "");
    setError(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMissionRecord(missionId, {
        Liens_FIGMA_Notion: draft,
      });
      await onSaved();
      setEditing(false);
    } catch {
      setError(
        "Les liens n’ont pas pu être enregistrés. Vérifiez vos droits Grist ou réessayez.",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasContent = isFilled(value);
  const links = parseMissionLiensLinks(value);

  return (
    <section
      className="mission-contexte-liens fr-mb-3w"
      aria-labelledby={titleId}
    >
      <div className="mission-contexte-liens__header">
        <h2 id={titleId} className="fr-h6 fr-mb-0">
          Liens FIGMA / Notion
        </h2>
        {!editing ? (
          <button
            type="button"
            className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
            onClick={startEdit}
          >
            {hasContent ? "Modifier" : "Ajouter"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="fr-mt-2w">
          <Input
            label="Liens FIGMA / Notion"
            hintText={LIENS_HINT}
            textArea
            nativeTextAreaProps={{
              id: fieldId,
              value: draft,
              rows: 4,
              disabled: saving,
              onChange: (e) => setDraft(e.target.value),
            }}
          />
          {error ? (
            <Alert
              severity="error"
              small
              title="Enregistrement impossible"
              description={error}
              className="fr-mb-2w"
            />
          ) : null}
          <div className="mission-contexte-liens__actions">
            <button
              type="button"
              className="fr-btn fr-btn--sm fr-icon-check-line"
              onClick={() => void saveEdit()}
              disabled={saving}
              title={saving ? "Enregistrement…" : "Enregistrer"}
              aria-label={saving ? "Enregistrement…" : "Enregistrer"}
            />
            <button
              type="button"
              className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-close-line"
              onClick={cancelEdit}
              disabled={saving}
              title="Annuler"
              aria-label="Annuler"
            />
          </div>
        </div>
      ) : links.length > 0 ? (
        <ul className="fr-mt-2w fr-mb-0 mission-contexte-liens__list">
          {links.map((link) => (
            <li key={link.href}>
              <a
                className="fr-link"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : hasContent ? (
        <p className="fr-text--sm fr-mb-0 fr-mt-2w mission-contexte-liens__raw">
          {value}
        </p>
      ) : (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-2w">
          Aucun lien — utilisez « Ajouter » pour renseigner une URL Figma ou Notion.
        </p>
      )}
    </section>
  );
}
