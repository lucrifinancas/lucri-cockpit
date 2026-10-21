import { Navigate, useLocation } from "react-router-dom";
import { legacyExpensesLocation } from "../data/saidasView";

// Preserva favoritos e links antigos, abrindo a visão de despesas em Saídas.
export default function DespesasPage() {
  const { search } = useLocation();
  return <Navigate to={legacyExpensesLocation(search)} replace />;
}
