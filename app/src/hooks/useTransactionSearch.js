import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";
import { usePeriod } from "../context/PeriodContext";

const empty = { entradas: null, saidas: null, loading: true, error: null };

export function useTransactionSearch(enabled) {
  const { activeClientId } = useActiveClient();
  const { range } = usePeriod();
  const { start, end } = range;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(empty);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const requestKey = JSON.stringify([activeClientId, start, end, attempt, enabled]);

  useEffect(() => {
    if (!enabled || !activeClientId) return;
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (start) params.set("de", start);
    if (end) params.set("ate", end);
    const query = params.size ? `?${params}` : "";
    Promise.all(["entradas", "saidas"].map((source) =>
      apiFetch(`/api/clientes/${activeClientId}/${source}${query}`, { signal: controller.signal })
    ))
      .then(([entradas, saidas]) => {
        if (!controller.signal.aborted) setState({ entradas, saidas, loading: false, error: null, requestKey });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ ...empty, loading: false, error: true, requestKey });
      });
    return () => controller.abort();
  }, [activeClientId, start, end, enabled, requestKey]);

  // Nunca mostrar resultados da empresa ou do intervalo anterior.
  const current = state.requestKey === requestKey ? state : empty;
  return { ...current, retry, range, awaitingClient: !activeClientId };
}
