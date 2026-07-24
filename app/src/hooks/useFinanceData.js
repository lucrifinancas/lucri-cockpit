import { useMemo } from "react";
import { generateFinanceData, filterByPeriod } from "../data/mockFinance";
import { useActiveClient } from "../context/ClientContext";
import { usePeriod } from "../context/PeriodContext";

// Hook único de acesso a dado financeiro — troca o corpo por chamada real
// à API própria (nunca ao Conta Azul direto) quando o backend existir.
// Mantém a mesma forma de retorno para não quebrar as telas.
export function useFinanceData() {
  const { activeClientId } = useActiveClient();
  const { range } = usePeriod();

  return useMemo(() => {
    const raw = generateFinanceData(activeClientId);
    return {
      entradas: filterByPeriod(raw.entradas, range),
      saidas: filterByPeriod(raw.saidas, range),
      despesas: filterByPeriod(raw.despesas, range),
      contasAPagar: raw.contasAPagar,
      contasAReceber: raw.contasAReceber,
      contasBancarias: raw.contasBancarias,
      raw,
      range,
    };
  }, [activeClientId, range]);
}
