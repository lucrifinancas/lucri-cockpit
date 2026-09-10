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
import DespesasPage from "./pages/DespesasPage";
import CaixaPage from "./pages/CaixaPage";
import BalancoPage from "./pages/BalancoPage";
import DrePage from "./pages/DrePage";

// Beta 1.2: as 8 abas do escopo todas roteadas. Home/Ajustes/Entradas/
// Saídas/Despesas/Caixa com dado real; Balanço/DRE ainda são só o aviso
// "em aberto" — faltam decisão de estrutura (Balanço) e front da tabela
// contábil (DRE, que já tem endpoint pronto no backend).

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
            <Route path="/despesas" element={<DespesasPage />} />
            <Route path="/caixa" element={<CaixaPage />} />
            <Route path="/balanco" element={<BalancoPage />} />
            <Route path="/dre" element={<DrePage />} />
            <Route path="/ajustes" element={<AjustesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </PeriodProvider>
    </ClientProvider>
  );
}
