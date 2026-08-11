import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";

// Contas a receber vencidas, somadas por mês (últimos N meses) — dado real
// (ver GET /api/clientes/:id/historico-mensal), independente do seletor de
// período, mesmo espírito de useMonthlyHistory (que segue mockado —
// depende de Despesas, ver DEMANDAS-PARA-FINALIZAR.md item 4).
export function useOverdueHistory(months = 12) {
  const { activeClientId } = useActiveClient();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;

    apiFetch(`/api/clientes/${activeClientId}/historico-mensal?meses=${months}`)
      .then((resp) => {
        if (cancelled) return;
        setData(resp.meses.map((m) => ({ month: m.label, valor: m.vencidas })));
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId, months]);

  return data;
}
