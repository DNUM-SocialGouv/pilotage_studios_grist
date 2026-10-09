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
  equipeOptions: readonly { id: number; label: string }[];
  intervenants: readonly {
    id: number;
    E_mail?: string | null;
  }[];
  sessionEmail: string | null | undefined;
  busy: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function WeeklyActionFormDrawer({
  open,
  mode,
  action,
  missionOptions,
  equipeOptions,
  intervenants,
  sessionEmail,
  busy,
  onClose,
  onSaved,
}: WeeklyActionFormDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const titreFieldId = useId();
  const porteurFieldId = useId();
  const missionFieldId = useId();
  const statutFieldId = useId();
  const dateFinFieldId = useId();
  const weeklyDuFieldId = useId();
  const notesFieldId = useId();
  const faitFieldId = useId();

  const [draftTitre, setDraftTitre] = useState("");
  const [draftPorteurId, setDraftPorteurId] = useState("");
  const [draftMissionId, setDraftMissionId] = useState("");
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
      setDraftMissionId("");
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
    action?.Statut,
    action?.Date_fin,
    action?.Weekly_du,
    action?.Notes,
    action?.Fait,
    intervenants,
    sessionEmail,
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
      const dateFin = draftDateFin
        ? parseLocalDateInputValue(draftDateFin)
        : null;
      const notes = draftNotes;

      if (mode === "create") {
        await createWeeklyActionRecord({
          titre,
          porteurId,
          missionId,
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
  const dialogHint =
    mode === "create"
      ? "Engagement Ops : qui fait quoi, pour quand. Le passage en Done se fait aussi par glisser-déposer sur le kanban."
      : "Modifiez les champs puis Enregistrer. Done = case Fait ou glisser la carte vers Done.";

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
                    {dialogHint}
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
                <Input
                  label="Titre"
                  state={localError && !draftTitre.trim() ? "error" : "default"}
                  stateRelatedMessage={
                    localError && !draftTitre.trim() ? localError : undefined
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
                <Select
                  className="fr-mt-2w"
                  label="Porteur"
                  hint="Prérempli avec votre fiche si l’e-mail de session correspond."
                  nativeSelectProps={{
                    id: porteurFieldId,
                    value: draftPorteurId,
                    onChange: (e) => setDraftPorteurId(e.currentTarget.value),
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
                <Select
                  className="fr-mt-2w"
                  label="Mission liée"
                  hint="Optionnel — rattache l’action à une mission du kanban."
                  nativeSelectProps={{
                    id: missionFieldId,
                    value: draftMissionId,
                    onChange: (e) => setDraftMissionId(e.currentTarget.value),
                    disabled: formBusy,
                  }}
                >
                  <option value="">Sans mission liée</option>
                  {missionSelectOptions.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Select
                  className="fr-mt-2w"
                  label="Statut"
                  hint="À faire ou En cours. Done = case Fait ou glisser vers Done."
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
                  <option value={WEEKLY_ACTION_STATUT.A_FAIRE}>À faire</option>
                  <option value={WEEKLY_ACTION_STATUT.EN_COURS}>En cours</option>
                </Select>
                <Input
                  className="fr-mt-2w"
                  label="Date de fin"
                  hintText="Optionnel — échéance souhaitée."
                  nativeInputProps={{
                    id: dateFinFieldId,
                    type: "date",
                    value: draftDateFin,
                    onChange: (e) => setDraftDateFin(e.currentTarget.value),
                    disabled: formBusy,
                  }}
                />
                <Input
                  className="fr-mt-2w"
                  label="Weekly du"
                  hintText="Date de la synchro d’origine (défaut = jour de création)."
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
                    onChange: (e) => setDraftWeeklyDu(e.currentTarget.value),
                    disabled: formBusy,
                    "aria-required": true,
                  }}
                />
                <Input
                  className="fr-mt-2w"
                  label="Notes"
                  hintText="Optionnel — mémo de réunion (texte libre)."
                  textArea
                  nativeTextAreaProps={{
                    id: notesFieldId,
                    value: draftNotes,
                    onChange: (e) => setDraftNotes(e.currentTarget.value),
                    disabled: formBusy,
                    rows: 4,
                  }}
                />
                {mode === "edit" ? (
                  <div
                    className="fr-checkbox-group fr-checkbox-group--sm fr-mt-2w"
                    style={{ margin: 0 }}
                  >
                    <input
                      type="checkbox"
                      id={faitFieldId}
                      name="fait"
                      checked={draftFait}
                      disabled={formBusy}
                      onChange={(e) => setDraftFait(e.currentTarget.checked)}
                    />
                    <label className="fr-label" htmlFor={faitFieldId}>
                      Fait
                      <span className="fr-hint-text">
                        Coche = Done (même effet que glisser vers Done).
                      </span>
                    </label>
                  </div>
                ) : null}

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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
