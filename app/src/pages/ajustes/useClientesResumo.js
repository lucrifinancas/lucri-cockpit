import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../api/client";

// GET /api/clientes com o resumo (Conta Azul conectada, usuários, convites —
// ver API-CONTRACT.md). Usado em Clientes e Integrações.
export function useClientesResumo() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(() => {
    setLoading(true);
    return apiFetch("/api/clientes")
      .then((r) => { setLista(r); setErro(null); })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);
  return { lista, loading, erro, recarregar };
}

// Abre o login do Conta Azul pra autorizar o cliente (volta em /ajustes?contaazul=...).
export async function conectarContaAzul(clienteId) {
  const { url } = await apiFetch(`/api/contaazul/autorizar/${clienteId}`);
  window.location.href = url;
}
