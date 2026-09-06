import { Outlet } from "react-router-dom";
import { WidgetNav } from "./WidgetNav";

/** Coquille iframe : navigation seule (pas de Header Marianne / Footer). */
export function WidgetLayout() {
  return (
    <div className="widget-shell">
      <WidgetNav />
      <main id="main-content" className="fr-container fr-pb-4w" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
