import { useEffect, useId, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import type { Mission } from "../../types.ts";
import {
  MISSION_CONTEXTE_FIELD_LABELS,
  MISSION_CONTEXTE_SECTIONS,
  buildContextePatch,
  hasAnyContexteNarrative,
  isContexteTextFilled,
  missionToContexteDraft,
  type MissionContexteDraft,
  type MissionContexteKey,
} from "../../utils/missionContexteFields.ts";
import { updateMissionRecord } from "../../utils/missionGristWrite.ts";
import { MissionProse } from "./MissionProse";

const MARKDOWN_HINT =
  "Markdown Grist : titres (#), listes (- ou *), liens [libellé](url), gras **texte**";

type MissionContexteNarrativeEditorProps = {
  mission: Mission;
  onSaved: () => Promise<void>;
};

/**
 * Champs narratifs de l’onglet Contexte : lecture MissionProse + édition sur place
 * (même pattern que la note studio — textarea Markdown, pas de WYSIWYG).
 */
export function MissionContexteNarrativeEditor({
  mission,
  onSaved,
}: MissionContexteNarrativeEditorProps) {
  const titleId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MissionContexteDraft>(() =>
    missionToContexteDraft(mission),
  );
  const [initial, setInitial] = useState<MissionContexteDraft>(() =>
    missionToContexteDraft(mission),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      const next = missionToContexteDraft(mission);
      setDraft(next);
      setInitial(next);
    }
  }, [mission, editing]);

  function startEdit() {
    const next = missionToContexteDraft(mission);
    setDraft(next);
    setInitial(next);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (saving) {
      return;
    }
    setDraft(initial);
    setError(null);
    setEditing(false);
  }

  function setField(key: MissionContexteKey, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function saveEdit() {
    if (saving) {
      return;
    }
    const patch = buildContextePatch(draft, initial);
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMissionRecord(mission.id, patch);
      await onSaved();
      setEditing(false);
    } catch {
      setError(
        "Le contexte n’a pas pu être enregistré. Vérifiez vos droits Grist ou réessayez.",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasContent = hasAnyContexteNarrative(mission);
  const firstFilledSectionTitle = hasContent
    ? MISSION_CONTEXTE_SECTIONS.find((section) =>
        section.keys.some((key) => isContexteTextFilled(mission[key])),
      )?.title
    : undefined;

  const editButton = (
    <button
      type="button"
      className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
      onClick={startEdit}
    >
      {hasContent ? "Modifier le contexte" : "Ajouter"}
    </button>
  );

  return (
    <section
      className="mission-contexte-narrative"
      aria-label="Textes de contexte de la mission"
    >
      {editing ? (
        <div className="mission-contexte-narrative__edit">
          <p className="fr-hint-text fr-mb-3w">{MARKDOWN_HINT}</p>
          {MISSION_CONTEXTE_SECTIONS.map((section) => (
            <fieldset
              key={section.title}
              className="fr-fieldset fr-mb-3w mission-contexte-narrative__fieldset"
            >
              <legend className="fr-fieldset__legend fr-h6 fr-mb-2w">
                {section.title}
              </legend>
              {section.keys.map((key) => (
                <Input
                  key={key}
                  label={MISSION_CONTEXTE_FIELD_LABELS[key]}
                  textArea
                  className="fr-mb-2w mission-contexte-narrative__field"
                  nativeTextAreaProps={{
                    id: `${titleId}-${key}`,
                    value: draft[key],
                    rows: 5,
                    disabled: saving,
                    onChange: (e) => setField(key, e.target.value),
                  }}
                />
              ))}
            </fieldset>
          ))}
          {error ? (
            <Alert
              severity="error"
              small
              title="Enregistrement impossible"
              description={error}
              className="fr-mb-2w"
            />
          ) : null}
          <div className="mission-contexte-narrative__actions">
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
      ) : hasContent ? (
        <>
          {MISSION_CONTEXTE_SECTIONS.map((section) => {
            const fields = section.keys
              .map((key) => ({ key, value: mission[key] }))
              .filter((f) => isContexteTextFilled(f.value));
            if (fields.length === 0) {
              return null;
            }
            const showEdit = section.title === firstFilledSectionTitle;
            return (
              <section
                key={section.title}
                className="mission-contexte-narrative__section fr-mb-4w"
              >
                <div className="mission-contexte-narrative__header">
                  <h2 className="fr-h6 fr-mb-0">{section.title}</h2>
                  {showEdit ? editButton : null}
                </div>
                {fields.map(({ key, value }) => (
                  <div key={key} className="fr-mt-3w fr-mb-0">
                    <h3 className="fr-text--md fr-mb-1w fr-text--bold">
                      {MISSION_CONTEXTE_FIELD_LABELS[key]}
                    </h3>
                    <MissionProse value={String(value)} />
                  </div>
                ))}
              </section>
            );
          })}
        </>
      ) : (
        <>
          <div className="mission-contexte-narrative__header mission-contexte-narrative__header--end">
            {editButton}
          </div>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-2w">
            Aucun texte de contexte (demande, enjeux, historique…) pour cette
            mission. Les liens et pièces jointes restent disponibles dans la
            colonne dédiée. Utilisez « Ajouter » pour renseigner ces champs.
          </p>
        </>
      )}
    </section>
  );
}
