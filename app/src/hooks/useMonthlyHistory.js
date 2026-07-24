import { useMemo } from "react";
import { generateMonthlyHistory } from "../data/mockFinance";
import { useActiveClient } from "../context/ClientContext";

// Histórico mensal fixo (últimos 12 meses) — independente do seletor de
// período, igual aos slides "Histórico" dos relatórios.
export function useMonthlyHistory(months = 12) {
  const { activeClientId } = useActiveClient();
  return useMemo(() => generateMonthlyHistory(activeClientId, months), [activeClientId, months]);
}
