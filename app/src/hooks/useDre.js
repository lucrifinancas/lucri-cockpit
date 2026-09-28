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

// GET /api/clientes/:id/dre — árvore oficial de DRE do Conta Azul (ver
// API-CONTRACT.md), respeita o período selecionado igual o resto do app.
export function useDre() {
  const { activeClientId } = useActiveClient();
  const { range } = usePeriod();
  const [dre, setDre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(`/api/clientes/${activeClientId}/dre${buildQuery(range)}`)
      .then((resp) => {
        if (!cancelled) setDre(resp);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId, range.start, range.end]);

  return { dre, loading, error };
}
