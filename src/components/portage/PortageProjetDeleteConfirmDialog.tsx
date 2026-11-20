/**
 * Confirmation avant suppression d’un projet de portage.
 * Si une prestation est encore liée, le dialogue explique le refus et ne supprime pas.
 */

import { useEffect, useId, useRef } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { portageDeleteBlockMessage } from "../../utils/portageProjetFormFields.ts";

export type PortageProjetDeleteConfirmDialogProps = {
  open: boolean;
  projectName: string;
  linkedCount: number;
  /** Vrai pendant la relecture des prestations, avant d’autoriser la suppression. */
  checking: boolean;
  /** Faux si les prestations n’ont pas pu être lues. */
  prestationsReady: boolean;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PortageProjetDeleteConfirmDialog({
  open,
  projectName,
  linkedCount,
  checking,
  prestationsReady,
  busy,
  error,
  onCancel,
  onConfirm,
}: PortageProjetDeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const cancelBtnId = useId();
  const title = projectName.trim() || "ce projet";
  const blocked = checking || !prestationsReady || linkedCount > 0;
  const blockMessage = checking
    ? "Vérification des prestations liées à ce projet…"
    : !prestationsReady
      ? "Les prestations n’ont pas pu être lues. La suppression est indisponible tant que les rattachements ne sont pas vérifiés."
      : linkedCount > 0
        ? portageDeleteBlockMessage(linkedCount)
        : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
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
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
      onClose={() => {
        if (open) {
          onCancel();
        }
      }}
    >
      <div className="pilotage-confirm-dialog__panel fr-p-3w">
        <h2 id={titleId} className="fr-h5 fr-mb-2w">
          {checking
            ? "Vérification en cours"
            : blocked
              ? "Suppression impossible"
              : "Supprimer ce projet de portage ?"}
        </h2>
        <p className="fr-mb-1w">«&nbsp;{title}&nbsp;»</p>
        {blockMessage ? (
          <p className="fr-mb-3w" role={checking ? "status" : undefined}>
            {blockMessage}
          </p>
        ) : (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
            Cette suppression est définitive. Un projet encore proposé sur une prestation
            ne peut pas être retiré.
          </p>
        )}
        {error ? (
          <p className="fr-error-text fr-mb-2w" role="alert">
            {error}
          </p>
        ) : null}
        <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
          {blocked ? null : (
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
          )}
          <li>
            <Button
              type="button"
              priority="secondary"
              onClick={onCancel}
              disabled={busy}
              nativeButtonProps={{ id: cancelBtnId }}
            >
              {blocked ? "Fermer" : "Annuler"}
            </Button>
          </li>
        </ul>
      </div>
    </dialog>
  );
}
