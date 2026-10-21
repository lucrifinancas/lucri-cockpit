import { useCallback, useEffect, useState } from "react";
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

const emptyState = { home: null, entradas: null, saidas: null, despesas: [], previousHome: null, previousEntradas: null, previousSaidas: null, previousDespesas: [], loading: true, error: null };

// Hook único de acesso a dado financeiro da Home.
// `home`/`entradas`/`saidas`/`despesas` vêm da API real (ver API-CONTRACT.md).
// `despesas` depende de categorias marcadas manualmente em Ajustes — sem
// nenhuma marcada ainda, volta lista vazia (não é erro, ver contrato).
// `previousHome`/`previousEntradas`/`previousSaidas`/`previousDespesas` são o
// mesmo formato pro período imediatamente anterior (mesma duração, ver
// `previousRange`) — só pra alimentar o delta "vs. período anterior" dos
// StatCards. `previousHome`/`previousEntradas`/`previousSaidas` ficam `null`
// quando não há período anterior comparável (preset "Todos os dados"), e
// também enquanto ainda carregam em segundo plano (chegam depois do resto);
// `previousDespesas` já nasce lista vazia (mesmo padrão de `despesas`).
export function useFinanceData() {
  const { activeClientId } = useActiveClient();
  const { range } = usePeriod();
  const { start, end } = range;
  const [state, setState] = useState(emptyState);

  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const requestKey = JSON.stringify([activeClientId, start, end, attempt]);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setState({ ...emptyState, requestKey });

    const requestedRange = { start, end };
    const qs = buildQuery(requestedRange);
    const prevRange = start && end ? previousRange(requestedRange) : null;
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
          apiFetch(`/api/clientes/${activeClientId}/despesas${prevQs}`).catch(() => null),
        ]).then(([previousHome, previousEntradas, previousSaidas, previousDespesasResp]) => {
          if (cancelled) return;
          const previousDespesas = (previousDespesasResp?.lancamentos ?? []).map((l) => ({ ...l, valor: l.valor_pago }));
          setState((prev) => ({ ...prev, previousHome, previousEntradas, previousSaidas, previousDespesas }));
        });
      })
      .catch((err) => {
        if (!cancelled) setState({ ...emptyState, loading: false, error: err.message, requestKey });
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId, start, end, requestKey]);

  // Invalida os dados já no render da troca, antes de o efeito iniciar.
  const current = state.requestKey === requestKey ? state : emptyState;
  return { ...current, range, retry, awaitingClient: !activeClientId };
}
