import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";
import { usePeriod } from "../context/PeriodContext";
import { previousRange } from "../data/mockFinance";

function buildQuery(range) {
  const params = new URLSearchParams();
  if (range.start) params.set("de", range.start);
  if (range.end) params.set("ate", range.end);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const emptyState = { home: null, entradas: null, saidas: null, despesas: [], previousHome: null, previousEntradas: null, previousSaidas: null, loading: true, error: null };

// Hook único de acesso a dado financeiro da Home.
// `home`/`entradas`/`saidas`/`despesas` vêm da API real (ver API-CONTRACT.md).
// `despesas` depende de categorias marcadas manualmente em Ajustes — sem
// nenhuma marcada ainda, volta lista vazia (não é erro, ver contrato).
// `previousHome`/`previousEntradas`/`previousSaidas` são o mesmo formato pro
// período imediatamente anterior (mesma duração, ver `previousRange`) — só
// pra alimentar o delta "vs. período anterior" dos StatCards. `null` quando
// não há período anterior comparável (preset "Todos os dados"), e também
// enquanto ele ainda carrega em segundo plano (chega depois do resto).
export function useFinanceData() {
  const { activeClientId } = useActiveClient();
  const { range } = usePeriod();
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      previousHome: null,
      previousEntradas: null,
      previousSaidas: null,
    }));

    const qs = buildQuery(range);
    const prevRange = range.start && range.end ? previousRange(range) : null;
    const prevQs = prevRange ? buildQuery(prevRange) : null;

    // 1) Dados do período atual: é o que a tela precisa pra aparecer, então
    // não espera o período anterior (que só alimenta o delta dos cards).
    Promise.all([
      apiFetch(`/api/clientes/${activeClientId}/home${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/entradas${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/saidas${qs}`),
      apiFetch(`/api/clientes/${activeClientId}/despesas${qs}`),
    ])
      .then(([home, entradas, saidas, despesas]) => {
        if (cancelled) return;
        // Regime de caixa (ver "⚠️ Regime de caixa" no API-CONTRACT.md):
        // `valor` vira `valor_pago`, pra sumValores/groupByCategoria (que
        // somam `.valor`) já saírem certos sem reescrever esses utilitários.
        const despesasLancamentos = (despesas?.lancamentos ?? []).map((l) => ({ ...l, valor: l.valor_pago }));
        setState((prev) => ({ ...prev, home, entradas, saidas, despesas: despesasLancamentos, loading: false, error: null }));

        // 2) Período anterior, em segundo plano: os deltas entram quando
        // chegarem, sem segurar a tela. Falha aqui só some com o delta.
        if (!prevQs) return;
        Promise.all([
          apiFetch(`/api/clientes/${activeClientId}/home${prevQs}`).catch(() => null),
          apiFetch(`/api/clientes/${activeClientId}/entradas${prevQs}`).catch(() => null),
          apiFetch(`/api/clientes/${activeClientId}/saidas${prevQs}`).catch(() => null),
        ]).then(([previousHome, previousEntradas, previousSaidas]) => {
          if (!cancelled) setState((prev) => ({ ...prev, previousHome, previousEntradas, previousSaidas }));
        });
      })
      .catch((err) => {
        if (!cancelled) setState({ ...emptyState, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId, range.start, range.end]);

  return { ...state, range };
}
