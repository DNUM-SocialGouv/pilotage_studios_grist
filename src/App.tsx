import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { GristPaProvider } from "./GristPaContext";
import { WidgetLayout } from "./layout/WidgetLayout";
import { BdcDetailView } from "./pages/BdcDetailView";
import { BdcListView } from "./pages/BdcListView";
import { PaDetailView } from "./pages/PaDetailView";
import { PaListView } from "./pages/PaListView";
import { StubPage } from "./pages/StubPage";
import { getEmbedTrust } from "./security/embedTrust";
import { NothingHerePage } from "./security/NothingHerePage";

function shouldShowDeadPage(): boolean {
  if (import.meta.env.DEV) {
    return false;
  }
  const trust = getEmbedTrust();
  return trust === "standalone" || trust === "untrusted";
}

export default function App() {
  if (shouldShowDeadPage()) {
    return <NothingHerePage />;
  }

  return (
    <GristPaProvider>
      <MemoryRouter initialEntries={["/pa"]}>
        <Routes>
          <Route element={<WidgetLayout />}>
            <Route index element={<Navigate to="/pa" replace />} />
            <Route path="pa" element={<PaListView />} />
            <Route path="pa/:id" element={<PaDetailView />} />
            <Route path="bdc" element={<BdcListView />} />
            <Route path="bdc/:id" element={<BdcDetailView />} />
            <Route path="produits" element={<StubPage slug="produits" />} />
            <Route path="missions" element={<StubPage slug="missions" />} />
            <Route path="intervenants" element={<StubPage slug="intervenants" />} />
            <Route path="cra" element={<StubPage slug="cra" />} />
            <Route path="pv" element={<StubPage slug="pv" />} />
            <Route path="evaluations" element={<StubPage slug="evaluations" />} />
            <Route path="analyse" element={<StubPage slug="analyse" />} />
            <Route path="*" element={<Navigate to="/pa" replace />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </GristPaProvider>
  );
}
