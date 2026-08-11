import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { generateFinanceData } from "../data/mockFinance";
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
// `home`/`entradas`/`saidas` vêm da API real (ver API-CONTRACT.md).
// `despesas` segue mockado — não existe endpoint ainda (bloqueado por
// categorização fixo/variável, ver GUIA-INTEGRACAO-DADOS-REAIS.md item 3).
export function useFinanceData() {
  const { activeClientId } = useActiveClient();
  const { range } = usePeriod();
  const [state, setState] = useState({ home: null, entradas: null, saidas: null, loading: true, error: null });

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const qs = buildQuery(range);
    Promise.all([
      apiFetch(`/api/clientes/${activeClientId}/home${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/entradas${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/saidas${qs}`),
    ])
      .then(([home, entradas, saidas]) => {
        if (!cancelled) setState({ home, entradas, saidas, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ home: null, entradas: null, saidas: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId, range.start, range.end]);

  const despesas = activeClientId ? generateFinanceData(String(activeClientId)).despesas : [];

  return { ...state, despesas, range };
}
