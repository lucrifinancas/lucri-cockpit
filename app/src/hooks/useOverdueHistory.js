import { useMemo } from "react";
import { generateOverdueByMonth } from "../data/mockFinance";
import { useActiveClient } from "../context/ClientContext";

// Contas a receber vencidas, somadas por mês (últimos 12 meses) —
// independente do seletor de período, mesmo padrão de useMonthlyHistory.
export function useOverdueHistory(months = 12) {
  const { activeClientId } = useActiveClient();
  return useMemo(() => generateOverdueByMonth(activeClientId, months), [activeClientId, months]);
}
