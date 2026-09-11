/**
 * Menu d’actions contextuel calqué sur l’anatomie DSFR « menu déroulant »
 * (composant bêta, pas encore de markup officiel).
 *
 * @see https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/menu-deroulant
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import styles from "./DsfrDropdownMenu.module.css";

export type DsfrDropdownMenuItem = {
  id: string;
  label: string;
  iconClassName: string;
} & (
  | { to: string; onClick?: undefined }
  | { to?: undefined; onClick: () => void }
);

export type DsfrDropdownMenuProps = {
  label: string;
  /** Accessible name if `label` is generic (ex. « Actions »). */
  title?: string;
  items: DsfrDropdownMenuItem[];
  align?: "left" | "right";
};

function menuItemsOf(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) {
    return [];
  }
  return Array.from(panel.querySelectorAll<HTMLElement>("[role='menuitem']"));
}

export function DsfrDropdownMenu({
  label,
  title,
  items,
  align = "right",
}: DsfrDropdownMenuProps) {
  const reactId = useId();
  const menuId = `${reactId}-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusOnOpenRef = useRef<"first" | "last" | null>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  const focusItemAt = useCallback((index: number) => {
    const list = menuItemsOf(panelRef.current);
    if (list.length === 0) {
      return;
    }
    const i = ((index % list.length) + list.length) % list.length;
    list[i]?.focus();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const target = focusOnOpenRef.current;
    focusOnOpenRef.current = null;
    if (target === "first") {
      queueMicrotask(() => focusItemAt(0));
    } else if (target === "last") {
      queueMicrotask(() => {
        const list = menuItemsOf(panelRef.current);
        focusItemAt(list.length - 1);
      });
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
        return;
      }
      const list = menuItemsOf(panelRef.current);
      if (list.length === 0) {
        return;
      }
      const idx = list.indexOf(document.activeElement as HTMLElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusItemAt(idx < 0 ? 0 : idx + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusItemAt(idx < 0 ? list.length - 1 : idx - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusItemAt(0);
      } else if (e.key === "End") {
        e.preventDefault();
        focusItemAt(list.length - 1);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && rootRef.current?.contains(next)) {
        return;
      }
      close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    const root = rootRef.current;
    root?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [close, focusItemAt, open]);

  const itemClassName = (iconClassName: string) =>
    cx(
      "fr-btn",
      "fr-btn--tertiary-no-outline",
      "fr-btn--sm",
      "fr-btn--icon-left",
      iconClassName,
      styles.item,
    );

  return (
    <div ref={rootRef} className={cx(styles.root, open && styles.rootOpen)}>
      <Button
        type="button"
        priority="tertiary"
        size="small"
        iconId="fr-icon-arrow-down-s-line"
        iconPosition="right"
        title={title}
        className={styles.trigger}
        nativeButtonProps={{
          ref: triggerRef,
          "aria-expanded": open,
          "aria-haspopup": "menu",
          "aria-controls": menuId,
          onKeyDown: (e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              e.stopPropagation();
              if (open) {
                focusItemAt(0);
                return;
              }
              focusOnOpenRef.current = "first";
              setOpen(true);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              e.stopPropagation();
              if (open) {
                const list = menuItemsOf(panelRef.current);
                focusItemAt(list.length - 1);
                return;
              }
              focusOnOpenRef.current = "last";
              setOpen(true);
            }
          },
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </Button>
      {open ? (
        <div
          id={menuId}
          ref={panelRef}
          className={cx(
            styles.panel,
            align === "right" ? styles.panelAlignRight : styles.panelAlignLeft,
          )}
          role="menu"
          aria-label={title ?? label}
        >
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} role="none">
                {item.to != null ? (
                  <Link
                    className={itemClassName(item.iconClassName)}
                    to={item.to}
                    role="menuitem"
                    onClick={() => close()}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={itemClassName(item.iconClassName)}
                    role="menuitem"
                    onClick={() => {
                      close();
                      item.onClick();
                    }}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
