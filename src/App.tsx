import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { GristPaProvider } from "./GristPaContext";
import { WidgetLayout } from "./layout/WidgetLayout";
import { PaDetailView } from "./pages/PaDetailView";
import { PaListView } from "./pages/PaListView";
import { StubPage } from "./pages/StubPage";

export default function App() {
  return (
    <GristPaProvider>
      <MemoryRouter initialEntries={["/pa"]}>
        <Routes>
          <Route element={<WidgetLayout />}>
            <Route index element={<Navigate to="/pa" replace />} />
            <Route path="pa" element={<PaListView />} />
            <Route path="pa/:id" element={<PaDetailView />} />
            <Route path="bdc" element={<StubPage slug="bdc" />} />
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
