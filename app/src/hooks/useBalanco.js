import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";

// GET /api/clientes/:id/balanco — sem período (foto de agora), diferente
// dos outros hooks financeiros. Ver API-CONTRACT.md.
export function useBalanco() {
  const { activeClientId } = useActiveClient();
  const [balanco, setBalanco] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(`/api/clientes/${activeClientId}/balanco`)
      .then((resp) => {
        if (!cancelled) setBalanco(resp);
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
  }, [activeClientId]);

  return { balanco, loading, error };
}
