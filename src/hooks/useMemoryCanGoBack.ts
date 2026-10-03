import { useContext } from "react";
import {
  UNSAFE_NavigationContext,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  canGoBackFromHistoryIndex,
  readMemoryHistoryIndex,
} from "../utils/memoryHistoryIndex";

/**
 * Indique s’il existe une page précédente dans le MemoryRouter du widget
 * (pas l’historique Grist / navigateur).
 */
export function useMemoryCanGoBack(): boolean {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  // Relecture à chaque navigation (key / pathname).
  useLocation();
  return canGoBackFromHistoryIndex(readMemoryHistoryIndex(navigator));
}

/** Retour interne widget : `navigate(-1)` seulement si la pile le permet. */
export function useWidgetGoBack(): { canGoBack: boolean; goBack: () => void } {
  const canGoBack = useMemoryCanGoBack();
  const navigate = useNavigate();
  return {
    canGoBack,
    goBack: () => {
      if (canGoBack) {
        navigate(-1);
      }
    },
  };
}
