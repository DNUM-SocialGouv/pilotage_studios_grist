/**
 * Drawer SM create / édition d’une action Weekly Ops (`Weekly_action`).
 * Done (Fait) reste aussi accessible via drag / menu kanban ; case Fait optionnelle en édition.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { WeeklyActionRow } from "../../types";
import { extractGristReferenceId } from "../../utils/gristReferences";
import {
  WEEKLY_ACTION_STATUT,
  defaultWeeklyActionDateFin,
  matchWeeklyActionPorteurId,
  normalizeWeeklyActionStatut,
  parseLocalDateInputValue,
  parseWeeklyActionDate,
  toLocalDateInputValue,
  type WeeklyActionStatut,
} from "../../utils/weeklyAction";
import {
  WEEKLY_ACTION_SUJET_COLUMN_READY,
  createWeeklyActionRecord,
  updateWeeklyActionFait,
  updateWeeklyActionRecord,
} from "../../utils/weeklyGristWrite";

export type WeeklyActionDrawerMode = "create" | "edit";

export type WeeklyActionFormDrawerProps = {
  open: boolean;
  mode: WeeklyActionDrawerMode;
  action: WeeklyActionRow | null;
  missionOptions: readonly { id: number; label: string }[];
  /** Options sujet agenda (`Weekly_agenda`) — affichées si colonne `Sujet` prête. */
  sujetOptions?: readonly { id: number; label: string }[];
  equipeOptions: readonly { id: number; label: string }[];
  intervenants: readonly {
    id: number;
    E_mail?: string | null;
  }[];
  sessionEmail: string | null | undefined;
  busy: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  /** Demande de suppression (édition) — confirmation gérée par le parent. */
  onRequestDelete?: (action: WeeklyActionRow) => void;
  /** Préremplissage Mission en create (ex. depuis carte Kanban / sujet). */
  defaultMissionId?: number | null;
  /**
   * Préremplissage Sujet en create — écrit seulement si colonne Owner prête
   * (passé via createWeeklyActionRecord / flag).
   */
  defaultSujetId?: number | null;
  /** Empêche de changer la mission préremplie (contexte carte). */
  lockMission?: boolean;
};

export function WeeklyActionFormDrawer({
  open,
  mode,
  action,
  missionOptions,
  sujetOptions = [],
  equipeOptions,
  intervenants,
  sessionEmail,
  busy,
  onClose,
  onSaved,
  onRequestDelete,
  defaultMissionId = null,
  defaultSujetId = null,
  lockMission = false,
}: WeeklyActionFormDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const titreFieldId = useId();
  const porteurFieldId = useId();
  const missionFieldId = useId();
  const sujetFieldId = useId();
  const statutFieldId = useId();
  const dateFinFieldId = useId();
  const weeklyDuFieldId = useId();
  const notesFieldId = useId();
  const faitFieldId = useId();

  const showSujetField = WEEKLY_ACTION_SUJET_COLUMN_READY;

  const [draftTitre, setDraftTitre] = useState("");
  const [draftPorteurId, setDraftPorteurId] = useState("");
  const [draftMissionId, setDraftMissionId] = useState("");
  const [draftSujetId, setDraftSujetId] = useState("");
  const [draftStatut, setDraftStatut] = useState<WeeklyActionStatut>(
    WEEKLY_ACTION_STATUT.A_FAIRE,
  );
  const [draftDateFin, setDraftDateFin] = useState("");
  const [draftWeeklyDu, setDraftWeeklyDu] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftFait, setDraftFait] = useState(false);
  const [initialFait, setInitialFait] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    if (mode === "create") {
      const defaultPorteur = matchWeeklyActionPorteurId(
        intervenants,
        sessionEmail,
      );
      setDraftTitre("");
      setDraftPorteurId(defaultPorteur != null ? String(defaultPorteur) : "");
      setDraftMissionId(
        defaultMissionId != null && defaultMissionId > 0
          ? String(defaultMissionId)
          : "",
      );
      setDraftSujetId(
        showSujetField && defaultSujetId != null && defaultSujetId > 0
          ? String(defaultSujetId)
          : "",
      );
      setDraftStatut(WEEKLY_ACTION_STATUT.A_FAIRE);
      setDraftDateFin(toLocalDateInputValue(defaultWeeklyActionDateFin(now)));
      setDraftWeeklyDu(toLocalDateInputValue(now));
      setDraftNotes("");
      setDraftFait(false);
      setInitialFait(false);
    } else if (action) {
      setDraftTitre((action.Titre ?? "").trim());
      const pid = extractGristReferenceId(action.Porteur);
      setDraftPorteurId(pid != null && pid > 0 ? String(pid) : "");
      const mid = extractGristReferenceId(action.Mission);
      setDraftMissionId(mid != null && mid > 0 ? String(mid) : "");
      const sid = extractGristReferenceId(action.Sujet);
      setDraftSujetId(
        showSujetField && sid != null && sid > 0 ? String(sid) : "",
      );
      setDraftStatut(normalizeWeeklyActionStatut(action.Statut));
      const dateFin = parseWeeklyActionDate(action.Date_fin);
      setDraftDateFin(dateFin ? toLocalDateInputValue(dateFin) : "");
      const weeklyDu = parseWeeklyActionDate(action.Weekly_du);
      setDraftWeeklyDu(
        weeklyDu ? toLocalDateInputValue(weeklyDu) : toLocalDateInputValue(now),
      );
      setDraftNotes((action.Notes ?? "").trim());
      const fait = action.Fait === true;
      setDraftFait(fait);
      setInitialFait(fait);
    }
    setLocalError(null);
    setWriteError(null);
  }, [
    open,
    mode,
    action?.id,
    action?.Titre,
    action?.Porteur,
    action?.Mission,
    action?.Sujet,
    action?.Statut,
    action?.Date_fin,
    action?.Weekly_du,
    action?.Notes,
    action?.Fait,
    intervenants,
    sessionEmail,
    defaultMissionId,
    defaultSujetId,
    showSujetField,
  ]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        document.getElementById(titreFieldId)?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, titreFieldId]);

  const close = () => {
    dialogRef.current?.close();
  };

  const parseOptionalId = (raw: string): number | null => {
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    const titre = draftTitre.trim();
    if (!titre) {
      setLocalError("Saisissez un titre.");
      setWriteError(null);
      document.getElementById(titreFieldId)?.focus();
      return;
    }
    const weeklyDu = draftWeeklyDu
      ? parseLocalDateInputValue(draftWeeklyDu)
      : null;
    if (!weeklyDu) {
      setLocalError("Indiquez la date du weekly.");
      setWriteError(null);
      document.getElementById(weeklyDuFieldId)?.focus();
      return;
    }

    setLocalError(null);
    setWriteError(null);
    setSubmitting(true);
    try {
      const porteurId = parseOptionalId(draftPorteurId);
      const missionId = parseOptionalId(draftMissionId);
      const sujetId = showSujetField ? parseOptionalId(draftSujetId) : null;
      const dateFin = draftDateFin
        ? parseLocalDateInputValue(draftDateFin)
        : null;
      const notes = draftNotes;

      if (mode === "create") {
        await createWeeklyActionRecord({
          titre,
          porteurId,
          missionId,
          sujetId,
          dateFin,
          weeklyDu,
          notes,
          statut: draftStatut,
          email: sessionEmail ?? "",
        });
      } else {
        if (action == null) return;
        await updateWeeklyActionRecord(action.id, {
          titre,
          statut: draftStatut,
          porteurId,
          missionId,
          sujetId: showSujetField ? sujetId : undefined,
          dateFin,
          weeklyDu,
          notes,
        });
        if (draftFait !== initialFait) {
          await updateWeeklyActionFait(action.id, draftFait);
        }
      }
      await onSaved();
      close();
    } catch (err) {
      setWriteError(
        err instanceof Error
          ? err.message
          : mode === "create"
            ? "Impossible d’ajouter l’action."
            : "Impossible d’enregistrer l’action.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formBusy = busy || submitting;
  const dialogTitle =
    mode === "create" ? "Nouvelle action" : "Modifier l’action";

  // Options porteur : liste coachs + orphelin déjà assigné
  const porteurSelectOptions = (() => {
    const rows = [...equipeOptions];
    if (mode === "edit" && action) {
      const pid = extractGristReferenceId(action.Porteur);
      if (pid != null && pid > 0 && !rows.some((r) => r.id === pid)) {
        rows.push({ id: pid, label: `Personne #${pid}` });
      }
    }
    return rows;
  })();

  const missionSelectOptions = (() => {
    const rows = [...missionOptions];
    if (mode === "edit" && action) {
      const mid = extractGristReferenceId(action.Mission);
      if (mid != null && mid > 0 && !rows.some((r) => r.id === mid)) {
        rows.push({ id: mid, label: `Mission #${mid}` });
      }
    }
    return rows;
  })();

  const sujetSelectOptions = (() => {
    const rows = [...sujetOptions];
    if (mode === "edit" && action) {
      const sid = extractGristReferenceId(action.Sujet);
      if (sid != null && sid > 0 && !rows.some((r) => r.id === sid)) {
        rows.push({ id: sid, label: `Sujet #${sid}` });
      }
    } else if (
      mode === "create" &&
      defaultSujetId != null &&
      defaultSujetId > 0 &&
      !rows.some((r) => r.id === defaultSujetId)
    ) {
      rows.push({ id: defaultSujetId, label: `Sujet #${defaultSujetId}` });
    }
    return rows;
  })();

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-drawer-dialog pilotage-drawer-dialog--sm"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="pilotage-drawer-dialog__shell">
        <div
          className="pilotage-drawer-dialog__scrim"
          aria-hidden="true"
          onClick={close}
        />
        <div className="pilotage-drawer-dialog__panel">
          <div className="pilotage-drawer-dialog__inner">
            <header className="fr-p-3w fr-pb-2w">
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                <div className="fr-col">
                  <h2 id={titleId} className="fr-h5 fr-mb-0">
                    {dialogTitle}
                  </h2>
                  <p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-1w">
                    Qui fait quoi, pour quand.
                  </p>
                </div>
                <div className="fr-col-auto">
                  <button
                    type="button"
                    className="fr-btn--close fr-btn"
                    title="Fermer"
                    onClick={close}
                    disabled={formBusy}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </header>

            <div className="pilotage-drawer-dialog__body fr-px-3w fr-pb-3w fr-pt-0">
              <form ref={formRef} onSubmit={(ev) => void submitForm(ev)}>
                {/*
                  Demi-colonnes via `.pilotage-drawer-form-col-half` (pas fr-col-md-6) :
                  l’iframe Grist est souvent < breakpoint md → md-6 restait full-width.
                */}
                <div className="fr-grid-row fr-grid-row--gutters pilotage-drawer-form-row">
                  <div className="fr-col-12">
                    <Input
                      label="Titre"
                      state={
                        localError && !draftTitre.trim() ? "error" : "default"
                      }
                      stateRelatedMessage={
                        localError && !draftTitre.trim()
                          ? localError
                          : undefined
                      }
                      nativeInputProps={{
                        id: titreFieldId,
                        value: draftTitre,
                        onChange: (e) => setDraftTitre(e.currentTarget.value),
                        disabled: formBusy,
                        "aria-required": true,
                        autoComplete: "off",
                      }}
                    />
                  </div>
                  <div className="fr-col-12 pilotage-drawer-form-col-half">
                    <Select
                      label="Porteur"
                      nativeSelectProps={{
                        id: porteurFieldId,
                        value: draftPorteurId,
                        onChange: (e) =>
                          setDraftPorteurId(e.currentTarget.value),
                        disabled: formBusy,
                      }}
                    >
                      <option value="">Sans porteur</option>
                      {porteurSelectOptions.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="fr-col-12 pilotage-drawer-form-col-half">
                    <Select
                      label="Statut"
                      nativeSelectProps={{
                        id: statutFieldId,
                        value: draftStatut,
                        onChange: (e) =>
                          setDraftStatut(
                            normalizeWeeklyActionStatut(e.currentTarget.value),
                          ),
                        disabled: formBusy,
                      }}
                    >
                      <option value={WEEKLY_ACTION_STATUT.A_FAIRE}>
                        À faire
                      </option>
                      <option value={WEEKLY_ACTION_STATUT.EN_COURS}>
                        En cours
                      </option>
                    </Select>
                  </div>
                  {/*
                    Mission | Sujet : rangée dédiée (CSS grid), toujours visible
                    si colonne Owner prête — même liste vide (« Sans sujet lié »).
                    Ne pas mélanger dans le flex half-cols (risque de manquer
                    le 2ᵉ champ dans l’iframe / scroll).
                  */}
                  {showSujetField ? (
                    <div className="fr-col-12">
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-1w">
                        Rattachements (optionnels)
                      </p>
                      <div
                        className="pilotage-drawer-form-links"
                        data-testid="weekly-action-links"
                      >
                        <Select
                          label="Mission liée"
                          nativeSelectProps={{
                            id: missionFieldId,
                            value: draftMissionId,
                            onChange: (e) =>
                              setDraftMissionId(e.currentTarget.value),
                            disabled:
                              formBusy || (mode === "create" && lockMission),
                          }}
                        >
                          <option value="">Sans mission liée</option>
                          {missionSelectOptions.map((o) => (
                            <option key={o.id} value={String(o.id)}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                        <div>
                          <Select
                            label="Sujet associé"
                            nativeSelectProps={{
                              id: sujetFieldId,
                              value: draftSujetId,
                              onChange: (e) =>
                                setDraftSujetId(e.currentTarget.value),
                              disabled: formBusy,
                              "aria-label": "Sujet associé",
                            }}
                          >
                            <option value="">Sans sujet lié</option>
                            {sujetSelectOptions.map((o) => (
                              <option key={o.id} value={String(o.id)}>
                                {o.label}
                              </option>
                            ))}
                          </Select>
                          <p className="fr-hint-text fr-mt-1v">
                            {sujetSelectOptions.length === 0
                              ? "Aucun sujet dans l’agenda pour l’instant."
                              : "Sujet de l’onglet Sujets (agenda Weekly)."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="fr-col-12 pilotage-drawer-form-col-half">
                      <Select
                        label="Mission liée"
                        nativeSelectProps={{
                          id: missionFieldId,
                          value: draftMissionId,
                          onChange: (e) =>
                            setDraftMissionId(e.currentTarget.value),
                          disabled:
                            formBusy || (mode === "create" && lockMission),
                        }}
                      >
                        <option value="">Sans mission liée</option>
                        {missionSelectOptions.map((o) => (
                          <option key={o.id} value={String(o.id)}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <div className="fr-col-12 pilotage-drawer-form-col-half">
                    <Input
                      label="Date de fin"
                      nativeInputProps={{
                        id: dateFinFieldId,
                        type: "date",
                        value: draftDateFin,
                        onChange: (e) => setDraftDateFin(e.currentTarget.value),
                        disabled: formBusy,
                      }}
                    />
                  </div>
                  <div className="fr-col-12 pilotage-drawer-form-col-half">
                    <Input
                      label="Weekly du"
                      state={
                        localError && !parseLocalDateInputValue(draftWeeklyDu)
                          ? "error"
                          : "default"
                      }
                      stateRelatedMessage={
                        localError && !parseLocalDateInputValue(draftWeeklyDu)
                          ? localError
                          : undefined
                      }
                      nativeInputProps={{
                        id: weeklyDuFieldId,
                        type: "date",
                        value: draftWeeklyDu,
                        onChange: (e) =>
                          setDraftWeeklyDu(e.currentTarget.value),
                        disabled: formBusy,
                        "aria-required": true,
                      }}
                    />
                  </div>
                  {mode === "edit" ? (
                    <div className="fr-col-12 pilotage-drawer-form-col-half">
                      <div
                        className="fr-checkbox-group fr-checkbox-group--sm"
                        style={{ marginTop: "2rem" }}
                      >
                        <input
                          type="checkbox"
                          id={faitFieldId}
                          name="fait"
                          checked={draftFait}
                          disabled={formBusy}
                          onChange={(e) =>
                            setDraftFait(e.currentTarget.checked)
                          }
                        />
                        <label className="fr-label" htmlFor={faitFieldId}>
                          Fait
                        </label>
                      </div>
                    </div>
                  ) : null}
                  <div className="fr-col-12">
                    <Input
                      label="Notes"
                      textArea
                      nativeTextAreaProps={{
                        id: notesFieldId,
                        value: draftNotes,
                        onChange: (e) => setDraftNotes(e.currentTarget.value),
                        disabled: formBusy,
                        rows: 3,
                      }}
                    />
                  </div>
                </div>

                {writeError ? (
                  <Alert
                    className="fr-mt-2w"
                    severity="error"
                    small
                    title="Enregistrement impossible"
                    description={writeError}
                  />
                ) : null}
              </form>

              <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-mt-3w">
                <li>
                  <Button
                    type="button"
                    disabled={formBusy}
                    onClick={() => formRef.current?.requestSubmit()}
                  >
                    {mode === "create"
                      ? submitting
                        ? "Ajout…"
                        : "Ajouter"
                      : submitting
                        ? "Enregistrement…"
                        : "Enregistrer"}
                  </Button>
                </li>
                <li>
                  <Button
                    type="button"
                    priority="secondary"
                    onClick={close}
                    disabled={formBusy}
                  >
                    Annuler
                  </Button>
                </li>
                {mode === "edit" && action && onRequestDelete ? (
                  <li>
                    <Button
                      type="button"
                      priority="tertiary"
                      iconId="fr-icon-delete-line"
                      onClick={() => onRequestDelete(action)}
                      disabled={formBusy}
                    >
                      Supprimer
                    </Button>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
