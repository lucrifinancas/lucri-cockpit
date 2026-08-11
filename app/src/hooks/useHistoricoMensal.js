import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useActiveClient } from "../context/ClientContext";

// Últimos N meses de receitas, despesas, resultado (lucro/prejuízo) e
// contas a receber vencidas — dado real (ver GET /historico-mensal),
// independente do seletor de período. Um hook só (não um por gráfico) pra
// não disparar a mesma chamada 3x na Home.
export function useHistoricoMensal(meses = 12) {
  const { activeClientId } = useActiveClient();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;

    apiFetch(`/api/clientes/${activeClientId}/historico-mensal?meses=${meses}`)
      .then((resp) => {
        if (!cancelled) setData(resp.meses);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId, meses]);

  return data;
}
