import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";
import { emptyHistory, historyForRequest, parseHistory } from "../data/history";

// Uma consulta compartilhada pelos três gráficos; independe do filtro global.
export function useHistoricoMensal(meses = 12) {
  const { activeClientId } = useActiveClient();
  const [state, setState] = useState(emptyHistory);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const key = JSON.stringify([activeClientId, meses, attempt]);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setState({ ...emptyHistory, key });
    apiFetch(`/api/clientes/${activeClientId}/historico-mensal?meses=${meses}`)
      .then(parseHistory)
      .then((data) => {
        if (!cancelled) setState({ key, data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ key, data: [], loading: false, error: error.message });
      });
    return () => { cancelled = true; };
  }, [activeClientId, meses, key]);

  return { ...historyForRequest(state, key), retry };
}
