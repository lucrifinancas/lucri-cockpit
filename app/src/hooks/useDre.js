import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";
import { usePeriod } from "../context/PeriodContext";
import { dreComparisonRange, parseDre } from "../data/dreComparison";

const empty = { dre: null, previousDre: null, loading: true, error: null, comparisonLoading: false, comparisonError: null };
function query(range) {
  const params = new URLSearchParams();
  if (range.start) params.set("de", range.start);
  if (range.end) params.set("ate", range.end);
  return params.size ? `?${params}` : "";
}
export function useDre() {
  const { activeClientId } = useActiveClient();
  const { range, preset } = usePeriod();
  const { start, end } = range;
  const comparisonRange = dreComparisonRange(range, preset);
  const beforeStart = comparisonRange?.start, beforeEnd = comparisonRange?.end;
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const key = JSON.stringify([activeClientId, start, end, beforeStart, beforeEnd, attempt]);
  const [state, setState] = useState(empty);
  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setState({ ...empty, key, comparisonLoading: Boolean(beforeStart && beforeEnd) });
    const base = `/api/clientes/${activeClientId}/dre`;
    apiFetch(`${base}${query({ start, end })}`).then(parseDre)
      .then((dre) => { if (!cancelled) setState((previous) => ({ ...previous, dre, loading: false })); })
      .catch((error) => { if (!cancelled) setState((previous) => ({ ...previous, loading: false, error: error.message })); });
    if (beforeStart && beforeEnd) {
      apiFetch(`${base}${query({ start: beforeStart, end: beforeEnd })}`).then(parseDre)
        .then((previousDre) => { if (!cancelled) setState((previous) => ({ ...previous, previousDre, comparisonLoading: false })); })
        .catch((error) => { if (!cancelled) setState((previous) => ({ ...previous, comparisonError: error.message, comparisonLoading: false })); });
    }
    return () => { cancelled = true; };
  }, [activeClientId, start, end, beforeStart, beforeEnd, key]);
  return { ...(state.key === key ? state : empty), range, comparisonRange, retry, awaitingClient: !activeClientId };
}
