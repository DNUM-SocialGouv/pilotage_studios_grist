/**
 * Confirmation accessible avant delete d’un sujet `Weekly_agenda` (irréversible).
 * Native `<dialog>` + boutons DSFR — hors drawer pour éviter l’imbrication.
 */

import { useEffect, useId, useRef } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";

export type WeeklySujetDeleteConfirmDialogProps = {
  open: boolean;
  sujetTitre: string;
  /** Nombre d’actions Ops dont le lien `Sujet` sera détaché (pas détruites). */
  linkedActionsCount?: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function WeeklySujetDeleteConfirmDialog({
  open,
  sujetTitre,
  linkedActionsCount = 0,
  busy,
  onCancel,
  onConfirm,
}: WeeklySujetDeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const cancelBtnId = useId();
  const title = (sujetTitre ?? "").trim() || "ce sujet";
  const linked =
    Number.isFinite(linkedActionsCount) && linkedActionsCount > 0
      ? Math.floor(linkedActionsCount)
      : 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        document.getElementById(cancelBtnId)?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, cancelBtnId]);

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-confirm-dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClose={() => {
        if (open) onCancel();
      }}
    >
      <div className="pilotage-confirm-dialog__panel fr-p-3w">
        <h2 id={titleId} className="fr-h5 fr-mb-2w">
          Supprimer ce sujet ?
        </h2>
        <p className="fr-mb-1w">
          «&nbsp;{title}&nbsp;» sera définitivement retiré de la liste Weekly.
        </p>
        {linked > 0 ? (
          <p className="fr-text--sm fr-mb-1w">
            {linked === 1
              ? "1 action liée restera dans le kanban Actions, sans lien vers ce sujet."
              : `${linked} actions liées resteront dans le kanban Actions, sans lien vers ce sujet.`}
          </p>
        ) : null}
        <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
          Cette suppression est irréversible. Pour archiver sans effacer, cochez
          plutôt « Traité » (historique).
        </p>
        <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
          <li>
            <Button
              type="button"
              iconId="fr-icon-delete-line"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "Suppression…" : "Supprimer"}
            </Button>
          </li>
          <li>
            <Button
              type="button"
              priority="secondary"
              onClick={onCancel}
              disabled={busy}
              nativeButtonProps={{ id: cancelBtnId }}
            >
              Annuler
            </Button>
          </li>
        </ul>
      </div>
    </dialog>
  );
}
