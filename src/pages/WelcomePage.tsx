import { useCallback, useEffect, useRef, useState } from "react";
import { useAclProfil } from "../AclProfilContext";
import { TicketDrawer } from "../components/welcome/TicketDrawer";
import { WelcomeRoleHome } from "../components/welcome/WelcomeRoleHome";
import { useVosRetours } from "../hooks/useVosRetours";
import { subscribeKanbanReload } from "../utils/feedbackOpen";
import type { KanbanTicket } from "../utils/kanbanTickets";
import {
  buildWelcomeHome,
  welcomeAccessFromSession,
} from "../utils/welcomeHomeByRole";

export function WelcomePage() {
  const {
    status: aclStatus,
    role,
    flags,
    equipeLabel,
    displayName,
    email,
  } = useAclProfil();

  const homeLoading = aclStatus === "loading";
  const homeContent = homeLoading
    ? null
    : buildWelcomeHome({
        role,
        status: aclStatus,
        equipeLabel,
        displayName,
        access: welcomeAccessFromSession({
          role,
          status: aclStatus,
          flags,
          equipeLabel,
          includeFeuilleDeRoute: true,
        }),
      });

  const profilKind = homeContent?.kind ?? "unknown";
  const vosRetours = useVosRetours({
    sessionEmail: email,
    profilKind,
  });

  const {
    markSeen,
    reload,
    visible,
    status,
    actifs,
    archives,
    mineCount,
    error,
  } = vosRetours;

  const [ticket, setTicket] = useState<KanbanTicket | null>(null);
  const [focusReturnId, setFocusReturnId] = useState<number | null>(null);
  const itemButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const vosRetoursTitleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => subscribeKanbanReload(reload), [reload]);

  const openTicket = useCallback(
    (next: KanbanTicket) => {
      markSeen(next);
      setFocusReturnId(next.id);
      setTicket(next);
    },
    [markSeen],
  );

  const closeTicket = useCallback(() => {
    setTicket(null);
  }, []);

  useEffect(() => {
    if (ticket != null || focusReturnId == null) return;
    const btn = itemButtonRefs.current.get(focusReturnId);
    if (btn) {
      btn.focus();
    } else {
      /* Carte passée en Archivés après lecture → focus titre de section. */
      vosRetoursTitleRef.current?.focus();
    }
    setFocusReturnId(null);
  }, [ticket, focusReturnId]);

  return (
    <div className="welcome-page">
      <div className="welcome-page__panel welcome-page__panel--wide">
        {homeLoading || !homeContent ? (
          <WelcomeRoleHome
            content={{
              kind: "unknown",
              title: "Bonjour",
              roleLabel: null,
              lead: null,
              hint: null,
              ctas: [],
            }}
            loading
          />
        ) : (
          <WelcomeRoleHome
            content={homeContent}
            searchTargets={{
              produits: flags.Page_produits,
              missions: flags.Page_missions,
              equipe: flags.Page_equipe,
            }}
            vosRetours={
              visible
                ? {
                    visible: true,
                    status,
                    actifs,
                    archives,
                    mineCount,
                    error,
                    onOpenTicket: openTicket,
                    itemButtonRefs,
                    sectionTitleRef: vosRetoursTitleRef,
                  }
                : undefined
            }
          />
        )}
      </div>

      <TicketDrawer
        ticket={ticket}
        onClose={closeTicket}
        onColumnChanged={() => {
          reload();
        }}
        onBodyChanged={(ticketId, body) => {
          setTicket((prev) =>
            prev && prev.id === ticketId
              ? { ...prev, resume: body.resume, message: body.message }
              : prev,
          );
          reload();
        }}
      />
    </div>
  );
}
