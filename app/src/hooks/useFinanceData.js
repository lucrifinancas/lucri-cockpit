import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";
import { usePeriod } from "../context/PeriodContext";

function buildQuery(range) {
  const params = new URLSearchParams();
  if (range.start) params.set("de", range.start);
  if (range.end) params.set("ate", range.end);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// Hook único de acesso a dado financeiro da Home.
// `home`/`entradas`/`saidas`/`despesas` vêm da API real (ver API-CONTRACT.md).
// `despesas` depende de categorias marcadas manualmente em Ajustes — sem
// nenhuma marcada ainda, volta lista vazia (não é erro, ver contrato).
export function useFinanceData() {
  const { activeClientId } = useActiveClient();
  const { range } = usePeriod();
  const [state, setState] = useState({ home: null, entradas: null, saidas: null, despesas: [], loading: true, error: null });

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const qs = buildQuery(range);
    Promise.all([
      apiFetch(`/api/clientes/${activeClientId}/home${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/entradas${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/saidas${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/despesas${qs}`),
    ])
      .then(([home, entradas, saidas, despesas]) => {
        // Regime de caixa (ver "⚠️ Regime de caixa" no API-CONTRACT.md):
        // `valor` vira `valor_pago`, pra sumValores/groupByCategoria (que
        // somam `.valor`) já saírem certos sem reescrever esses utilitários.
        const despesasLancamentos = (despesas?.lancamentos ?? []).map((l) => ({ ...l, valor: l.valor_pago }));
        if (!cancelled) setState({ home, entradas, saidas, despesas: despesasLancamentos, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ home: null, entradas: null, saidas: null, despesas: [], loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId, range.start, range.end]);

  return { ...state, range };
}
