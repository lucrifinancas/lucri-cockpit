import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import { ClientProvider } from "./context/ClientContext";
import { PeriodProvider } from "./context/PeriodContext";
import AppLayout from "./layout/AppLayout";
import HomePage from "./pages/HomePage";
import AjustesPage from "./pages/AjustesPage";
import UnderConstructionPage from "./pages/UnderConstructionPage";

// Beta 1.1: Home e Ajustes preenchidos — Ajustes voltou a ser roteado pra
// abrigar o checklist de "cards visíveis na Home" por cliente. As demais
// abas (EntradasPage, SaidasPage, DespesasPage, CaixaPage) continuam em
// src/pages/ com dado mockado, só não estão roteadas ainda.

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
            <Route path="/entradas" element={<UnderConstructionPage title="Entradas" />} />
            <Route path="/saidas" element={<UnderConstructionPage title="Saídas" />} />
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
