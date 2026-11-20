/**
 * FAB + tiroir flottant Assistant — hors page d’accueil (l’accueil embarque le panneau).
 */
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AssistantChatPanel } from "./AssistantChatPanel.tsx";
import styles from "./AssistantWidget.module.css";

function SparkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

export function AssistantWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const path = location.pathname;
  const onHome = path === "/";
  const onAssistantParc =
    path === "/assistant-parc" || path.startsWith("/assistant-parc/");

  // Accueil et Assistant PARC embarquent déjà le chat — pas de FAB Pilotage doublon.
  if (onHome || onAssistantParc) {
    return null;
  }

  return (
    <>
      {open ? (
        <AssistantChatPanel layout="drawer" onClose={() => setOpen(false)} />
      ) : null}

      <button
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-label="Ouvrir l’assistant Pilotage"
        onClick={() => setOpen((v) => !v)}
      >
        <SparkIcon />
        <span>Assistant</span>
      </button>
    </>
  );
}
