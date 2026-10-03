/**
 * Menu compte (slot user) — pattern « En-tête connectée » DSFR (bêta, pas encore
 * dans `@codegouvfr/react-dsfr`) : disclosure identité + liens internes.
 * Déclencheur = avatar Équipe (`EquipeAvatar`), pas l’icône générique seule.
 * Pas de `role="menu"` incomplet — `aria-expanded` / Escape / clic extérieur.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useAclProfil } from "../AclProfilContext";
import { EquipeAvatar } from "../components/equipe/EquipeAvatar";

const FEUILLE_DE_ROUTE_HREF = "/feuille-de-route";

function identityLines(params: {
  displayName: string | null;
  email: string | null;
  role: string | null;
  equipeLabel: string | null;
  status: string;
}): { primary: string; secondary: string[] } {
  const secondary: string[] = [];
  const name = params.displayName?.trim() || null;
  const email = params.email?.trim() || null;

  if (email && email !== name) {
    secondary.push(email);
  }
  if (params.role?.trim()) {
    secondary.push(`Rôle : ${params.role.trim()}`);
  }
  if (params.equipeLabel?.trim()) {
    secondary.push(`Département : ${params.equipeLabel.trim()}`);
  }

  if (name) {
    return { primary: name, secondary };
  }
  if (email) {
    return { primary: email, secondary: secondary.filter((l) => l !== email) };
  }
  if (params.status === "standalone") {
    return { primary: "Session locale (hors Grist)", secondary: [] };
  }
  if (params.status === "loading") {
    return { primary: "Profil en cours de chargement…", secondary: [] };
  }
  return { primary: "Identité indisponible", secondary: [] };
}

export function WidgetUserMenu() {
  const { email, role, equipeLabel, equipeId, avatar, displayName, status } =
    useAclProfil();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const reactId = useId();
  const panelId = `${reactId}-user-panel`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
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
    const onPointer = (e: globalThis.MouseEvent) => {
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
    // Focus le premier lien (pattern panneau compte) après ouverture.
    window.requestAnimationFrame(() => {
      firstLinkRef.current?.focus();
    });
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [close, open]);

  const { primary, secondary } = identityLines({
    displayName,
    email,
    role,
    equipeLabel,
    status,
  });
  const hasAvatar = equipeId != null && equipeId > 0;
  const feuilleActive =
    pathname === FEUILLE_DE_ROUTE_HREF ||
    pathname.startsWith(`${FEUILLE_DE_ROUTE_HREF}/`);

  const onFeuilleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    close();
    navigate(FEUILLE_DE_ROUTE_HREF);
  };

  return (
    <div
      ref={rootRef}
      className={cx("widget-user-menu", open && "widget-user-menu--open")}
    >
      <Button
        type="button"
        priority="tertiary no outline"
        title="Mon compte"
        className="widget-user-menu__trigger"
        nativeButtonProps={{
          ref: triggerRef,
          "aria-expanded": open,
          "aria-controls": panelId,
          "aria-haspopup": "true",
          "aria-label": "Mon compte",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {hasAvatar ? (
          <EquipeAvatar
            avatar={avatar ?? undefined}
            memberId={equipeId}
            size="md"
          />
        ) : (
          <span
            className="fr-icon-account-circle-line widget-user-menu__fallback-icon"
            aria-hidden="true"
          />
        )}
      </Button>
      {open ? (
        <div
          id={panelId}
          className="widget-user-menu__panel"
          role="region"
          aria-label="Mon compte"
        >
          <div className="widget-user-menu__identity">
            <p className="widget-user-menu__identity-primary">{primary}</p>
            {secondary.map((line) => (
              <p key={line} className="widget-user-menu__identity-line">
                {line}
              </p>
            ))}
          </div>
          <ul className="widget-user-menu__list">
            <li>
              <a
                ref={firstLinkRef}
                href={FEUILLE_DE_ROUTE_HREF}
                className={cx(
                  "fr-btn",
                  "fr-btn--tertiary-no-outline",
                  "fr-btn--sm",
                  "widget-user-menu__item",
                  feuilleActive && "widget-user-menu__item--active",
                )}
                aria-current={feuilleActive ? "page" : undefined}
                onClick={onFeuilleClick}
              >
                Feuille de route
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
