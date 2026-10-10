/**
 * Confirmation accessible avant delete d’une `Weekly_action` (irréversible).
 * Native `<dialog>` + boutons DSFR — hors drawer pour éviter l’imbrication.
 */

import { useEffect, useId, useRef } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";

export type WeeklyActionDeleteConfirmDialogProps = {
  open: boolean;
  actionTitle: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function WeeklyActionDeleteConfirmDialog({
  open,
  actionTitle,
  busy,
  onCancel,
  onConfirm,
}: WeeklyActionDeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const cancelBtnId = useId();
  const title = (actionTitle ?? "").trim() || "cette action";

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
          Supprimer cette action ?
        </h2>
        <p className="fr-mb-1w">
          «&nbsp;{title}&nbsp;» sera définitivement supprimée du kanban Weekly.
        </p>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
          Cette suppression est irréversible. Pour archiver sans effacer, passez
          plutôt la carte en Done (Fait).
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
