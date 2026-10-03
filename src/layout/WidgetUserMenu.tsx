/**
 * Coquille menu utilisateur (PR0) — identité lecture + entrée Feuille de route
 * désactivée tant que la route `/feuille-de-route` n’existe pas (PR-B).
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useAclProfil } from "../AclProfilContext";

function identityLines(params: {
  email: string | null;
  role: string | null;
  equipeLabel: string | null;
  status: string;
}): string[] {
  const lines: string[] = [];
  if (params.email?.trim()) {
    lines.push(params.email.trim());
  }
  if (params.role?.trim()) {
    lines.push(`Rôle : ${params.role.trim()}`);
  }
  if (params.equipeLabel?.trim()) {
    lines.push(`Département : ${params.equipeLabel.trim()}`);
  }
  if (lines.length === 0) {
    if (params.status === "standalone") {
      lines.push("Session locale (hors Grist)");
    } else if (params.status === "loading") {
      lines.push("Profil en cours de chargement…");
    } else {
      lines.push("Identité indisponible");
    }
  }
  return lines;
}

export function WidgetUserMenu() {
  const { email, role, equipeLabel, status } = useAclProfil();
  const reactId = useId();
  const menuId = `${reactId}-user-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [close, open]);

  const lines = identityLines({ email, role, equipeLabel, status });

  return (
    <div
      ref={rootRef}
      className={cx("widget-user-menu", open && "widget-user-menu--open")}
    >
      <Button
        type="button"
        priority="tertiary no outline"
        iconId="fr-icon-account-circle-line"
        title="Menu utilisateur"
        className="widget-user-menu__trigger"
        nativeButtonProps={{
          ref: triggerRef,
          "aria-expanded": open,
          "aria-haspopup": "menu",
          "aria-controls": menuId,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="fr-sr-only">Menu utilisateur</span>
      </Button>
      {open ? (
        <div
          id={menuId}
          className="widget-user-menu__panel"
          role="menu"
          aria-label="Menu utilisateur"
        >
          <div className="widget-user-menu__identity" role="presentation">
            {lines.map((line) => (
              <p key={line} className="widget-user-menu__identity-line">
                {line}
              </p>
            ))}
          </div>
          <ul className="widget-user-menu__list">
            <li role="none">
              <button
                type="button"
                className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm widget-user-menu__item"
                role="menuitem"
                disabled
                title="Bientôt : feuille de route sur une page dédiée"
                aria-disabled="true"
              >
                Feuille de route
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
