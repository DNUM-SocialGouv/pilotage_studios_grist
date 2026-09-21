import { MemoryRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AclProfilProvider } from "./AclProfilContext";
import { AdminRoleGuard } from "./components/AdminRoleGuard";
import { CraDeclarerRoleGuard } from "./components/CraDeclarerRoleGuard";
import { CraRevueEquipeRoleGuard } from "./components/CraRevueEquipeRoleGuard";
import { PageAccessGuard } from "./components/PageAccessGuard";
import { GristPaProvider } from "./GristPaContext";
import { WidgetLayout } from "./layout/WidgetLayout";
import { BdcDetailView } from "./pages/BdcDetailView";
import { BdcListView } from "./pages/BdcListView";
import { MissionsDetailView } from "./pages/MissionsDetailView";
import { MissionsLayout } from "./pages/MissionsLayout";
import { MissionsListView } from "./pages/MissionsListView";
import { PaDetailView } from "./pages/PaDetailView";
import { PaListView } from "./pages/PaListView";
import { CraDeclarerPage } from "./pages/CraDeclarerPage";
import { CraListView } from "./pages/CraListView";
import { CraRecapPorteursPage } from "./pages/CraRecapPorteursPage";
import { CraRevueEquipePage } from "./pages/CraRevueEquipePage";
import { DroitsPagesAdminPage } from "./pages/DroitsPagesAdminPage";
import { EquipeDetailView } from "./pages/EquipeDetailView";
import { EquipeLayout } from "./pages/EquipeLayout";
import { EquipeListView } from "./pages/EquipeListView";
import { StubPage } from "./pages/StubPage";
import { WelcomePage } from "./pages/WelcomePage";
import { getEmbedTrust } from "./security/embedTrust";
import { NothingHerePage } from "./security/NothingHerePage";

function IntervenantsToEquipeRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/equipe/${id}` : "/equipe"} replace />;
}

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
      <AclProfilProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<WidgetLayout />}>
              <Route index element={<WelcomePage />} />
              <Route
                path="pa"
                element={
                  <PageAccessGuard>
                    <PaListView />
                  </PageAccessGuard>
                }
              />
              <Route
                path="pa/:id"
                element={
                  <PageAccessGuard>
                    <PaDetailView />
                  </PageAccessGuard>
                }
              />
              <Route
                path="bdc"
                element={
                  <PageAccessGuard>
                    <BdcListView />
                  </PageAccessGuard>
                }
              />
              <Route
                path="bdc/:id"
                element={
                  <PageAccessGuard>
                    <BdcDetailView />
                  </PageAccessGuard>
                }
              />
              <Route
                path="produits"
                element={
                  <PageAccessGuard>
                    <StubPage slug="produits" />
                  </PageAccessGuard>
                }
              />
              <Route
                path="missions"
                element={
                  <PageAccessGuard>
                    <MissionsLayout />
                  </PageAccessGuard>
                }
              >
                <Route index element={<MissionsListView />} />
                <Route path=":id" element={<MissionsDetailView />} />
              </Route>
              <Route
                path="equipe"
                element={
                  <PageAccessGuard>
                    <EquipeLayout />
                  </PageAccessGuard>
                }
              >
                <Route index element={<EquipeListView />} />
                <Route path=":id" element={<EquipeDetailView />} />
              </Route>
              <Route path="intervenants" element={<Navigate to="/equipe" replace />} />
              <Route path="intervenants/:id" element={<IntervenantsToEquipeRedirect />} />
              <Route
                path="cra/declarer"
                element={
                  <CraDeclarerRoleGuard>
                    <CraDeclarerPage />
                  </CraDeclarerRoleGuard>
                }
              />
              <Route
                path="cra/revue-equipe"
                element={
                  <CraRevueEquipeRoleGuard>
                    <CraRevueEquipePage />
                  </CraRevueEquipeRoleGuard>
                }
              />
              <Route
                path="cra"
                element={
                  <PageAccessGuard>
                    <CraListView />
                  </PageAccessGuard>
                }
              />
              <Route
                path="outils/recap-porteurs"
                element={
                  <PageAccessGuard>
                    <CraRecapPorteursPage />
                  </PageAccessGuard>
                }
              />
              <Route
                path="outils/droits-pages"
                element={
                  <AdminRoleGuard>
                    <DroitsPagesAdminPage />
                  </AdminRoleGuard>
                }
              />
              <Route
                path="pv"
                element={
                  <PageAccessGuard>
                    <StubPage slug="pv" />
                  </PageAccessGuard>
                }
              />
              <Route path="evaluations" element={<StubPage slug="evaluations" />} />
              <Route path="analyse" element={<StubPage slug="analyse" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AclProfilProvider>
    </GristPaProvider>
  );
}
