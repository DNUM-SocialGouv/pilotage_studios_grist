/**
 * Dialogue « Lier une action » — Créer ou Rattacher.
 * Réutilisé depuis une carte Kanban mission ou un sujet agenda.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { WeeklyActionRow } from "../../types";
import { extractGristReferenceId } from "../../utils/gristReferences";
import {
  filterWeeklyActionsLinkable,
  weeklyActionStatutLabel,
} from "../../utils/weeklyAction";
import { updateWeeklyActionLinks } from "../../utils/weeklyGristWrite";
import { firstNameFromDisplayName } from "../../utils/welcomeHomeByRole";

export type WeeklyLinkActionContext = {
  /** Préremplissage / rattachement mission. */
  missionId?: number | null;
  /** Préremplissage / rattachement sujet (écriture si colonne Owner prête). */
  sujetId?: number | null;
  /** Libellé court pour le titre du dialogue. */
  contextLabel: string;
};

export type WeeklyLinkActionDialogProps = {
  open: boolean;
  context: WeeklyLinkActionContext | null;
  actions: readonly WeeklyActionRow[];
  porteurLabelById: ReadonlyMap<number, string>;
  /** Colonne `Sujet` Owner prête — sinon rattachement sujet = message d’aide. */
  sujetColumnReady: boolean;
  busy: boolean;
  onClose: () => void;
  /** Ouvre le drawer create pré-lié (ferme ce dialogue). */
  onCreate: (context: WeeklyLinkActionContext) => void;
  onAttached: () => Promise<void>;
};

export function WeeklyLinkActionDialog({
  open,
  context,
  actions,
  porteurLabelById,
  sujetColumnReady,
  busy,
  onClose,
  onCreate,
  onAttached,
}: WeeklyLinkActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const selectId = useId();
  const createBtnId = useId();
  const [selectedId, setSelectedId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const missionId =
    context?.missionId != null && context.missionId > 0
      ? context.missionId
      : null;
  const sujetId =
    context?.sujetId != null && context.sujetId > 0 ? context.sujetId : null;
  const effectiveSujetId = sujetColumnReady ? sujetId : null;

  const linkable = context
    ? filterWeeklyActionsLinkable(actions, {
        missionId,
        sujetId: effectiveSujetId,
      })
    : [];

  /** Sujet seul sans colonne : pas de rattachement / create sujet-only. */
  const sujetPendingOnly =
    sujetId != null && missionId == null && !sujetColumnReady;

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setLocalError(null);
    setWriteError(null);
  }, [open, context?.missionId, context?.sujetId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        document.getElementById(createBtnId)?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, createBtnId]);

  const close = () => {
    dialogRef.current?.close();
  };

  const handleCreate = () => {
    if (!context) return;
    if (sujetPendingOnly) {
      setLocalError(
        "Colonne « Sujet » absente : impossible de créer une action liée uniquement au sujet. Demandez à Owner de créer la colonne, ou liez depuis une mission.",
      );
      return;
    }
    onCreate(context);
    close();
  };

  const handleAttach = async () => {
    if (!context) return;
    if (sujetPendingOnly) {
      setLocalError(
        "La colonne Grist « Sujet » n’est pas encore créée (Owner).",
      );
      return;
    }
    const id = Number(selectedId);
    if (!Number.isFinite(id) || id <= 0) {
      setLocalError("Choisissez une action à rattacher.");
      return;
    }
    setLocalError(null);
    setWriteError(null);
    setSubmitting(true);
    try {
      const fields: { missionId?: number | null; sujetId?: number | null } = {};
      if (missionId != null) fields.missionId = missionId;
      if (effectiveSujetId != null) fields.sujetId = effectiveSujetId;
      await updateWeeklyActionLinks(id, fields);
      await onAttached();
      close();
    } catch (err) {
      setWriteError(
        err instanceof Error
          ? err.message
          : "Impossible de rattacher l’action.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formBusy = busy || submitting;
  const contextLabel = context?.contextLabel ?? "contexte";

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-confirm-dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        if (!formBusy) onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <div className="pilotage-confirm-dialog__panel fr-p-3w">
        <h2 id={titleId} className="fr-h5 fr-mb-1w">
          Lier une action
        </h2>
        <p className="fr-text--sm fr-mb-2w">
          Contexte : <strong>{contextLabel}</strong>
        </p>

        {sujetPendingOnly ? (
          <Alert
            className="fr-mb-2w"
            severity="info"
            small
            title="Colonne Sujet en attente"
            description="Owner doit créer la colonne Ref « Sujet » sur Weekly_action (→ Weekly_agenda). Ensuite le rattachement au sujet sera actif."
          />
        ) : null}

        <Button
          type="button"
          iconId="fr-icon-add-line"
          className="fr-mb-3w"
          disabled={formBusy || sujetPendingOnly}
          onClick={handleCreate}
          nativeButtonProps={{ id: createBtnId }}
        >
          Créer une action
        </Button>

        <h3 className="fr-h6 fr-mb-1w">Rattacher une existante</h3>
        {sujetPendingOnly ? (
          <p className="fr-hint-text fr-mb-2w">
            Indisponible tant que la colonne n’est pas créée.
          </p>
        ) : linkable.length === 0 ? (
          <p className="fr-hint-text fr-mb-2w">
            Aucune action ouverte à rattacher.
          </p>
        ) : (
          <Select
            label="Action"
            nativeSelectProps={{
              id: selectId,
              value: selectedId,
              onChange: (e) => {
                setSelectedId(e.currentTarget.value);
                setLocalError(null);
              },
              disabled: formBusy,
            }}
          >
            <option value="">Choisir…</option>
            {linkable.map((a) => {
              const titre = (a.Titre ?? "Action").trim() || "Action";
              const pid = extractGristReferenceId(a.Porteur);
              const porteur =
                pid != null ? porteurLabelById.get(pid) : null;
              const statut = weeklyActionStatutLabel(a.Statut);
              const label = [
                titre,
                statut,
                porteur
                  ? `Porté par ${firstNameFromDisplayName(porteur) || porteur}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <option key={a.id} value={String(a.id)}>
                  {label}
                </option>
              );
            })}
          </Select>
        )}

        {localError ? (
          <Alert
            className="fr-mt-2w"
            severity="error"
            small
            title="Choix"
            description={localError}
          />
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

        <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-mt-3w">
          <li>
            <Button
              type="button"
              disabled={
                formBusy ||
                sujetPendingOnly ||
                linkable.length === 0 ||
                !selectedId
              }
              onClick={() => void handleAttach()}
            >
              {submitting ? "Rattachement…" : "Rattacher"}
            </Button>
          </li>
          <li>
            <Button
              type="button"
              priority="secondary"
              onClick={onClose}
              disabled={formBusy}
            >
              Annuler
            </Button>
          </li>
        </ul>
      </div>
    </dialog>
  );
}
