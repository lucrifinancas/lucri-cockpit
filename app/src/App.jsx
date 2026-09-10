import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import { ClientProvider } from "./context/ClientContext";
import { PeriodProvider } from "./context/PeriodContext";
import AppLayout from "./layout/AppLayout";
import HomePage from "./pages/HomePage";
import AjustesPage from "./pages/AjustesPage";
import EntradasPage from "./pages/EntradasPage";
import SaidasPage from "./pages/SaidasPage";
import UnderConstructionPage from "./pages/UnderConstructionPage";

// Beta 1.1: Home, Ajustes, Entradas e Saídas preenchidos com dado real.
// Despesas, Caixa, Balanço e DRE continuam em src/pages/ com dado
// mockado/stub, ainda não roteados.

export default function App() {
  const { user, checkingSession } = useAuth();

  if (checkingSession) {
    return null;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ClientProvider>
      <PeriodProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/entradas" element={<EntradasPage />} />
            <Route path="/saidas" element={<SaidasPage />} />
            <Route path="/despesas" element={<UnderConstructionPage title="Despesas" />} />
            <Route path="/caixa" element={<UnderConstructionPage title="Caixa" />} />
            <Route path="/balanco" element={<UnderConstructionPage title="Balanço" />} />
            <Route path="/dre" element={<UnderConstructionPage title="DRE" />} />
            <Route path="/ajustes" element={<AjustesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </PeriodProvider>
    </ClientProvider>
  );
}
