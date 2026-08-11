import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { isInternalRole } from "../auth/roles";
import { apiFetch } from "../api/client";

// Cliente "ativo" na tela: master/analista escolhem qual cliente ver (seletor
// no header, lista vem de `GET /api/clientes`); cliente final está sempre
// travado no próprio tenant (`user.cliente_id`, sem lista pra buscar).

const ClientContext = createContext(null);

export function ClientProvider({ children }) {
  const { user } = useAuth();
  const isEquipe = isInternalRole(user?.papel);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(isEquipe);
  const [selectedClientId, setSelectedClientId] = useState(null);

  useEffect(() => {
    if (!isEquipe) {
      setClients([]);
      return;
    }
    let cancelled = false;
    setLoadingClients(true);
    apiFetch("/api/clientes")
      .then((lista) => {
        if (cancelled) return;
        const normalizados = lista.map((c) => ({ id: c.id, name: c.nome, logoUrl: null }));
        setClients(normalizados);
        setSelectedClientId((prev) => prev ?? normalizados[0]?.id ?? null);
      })
      .finally(() => !cancelled && setLoadingClients(false));
    return () => {
      cancelled = true;
    };
  }, [isEquipe]);

  const activeClientId = user?.papel === "cliente" ? user.cliente_id : selectedClientId;
  const activeClient = clients.find((c) => c.id === activeClientId) ?? null;

  const value = useMemo(
    () => ({
      clients,
      loadingClients,
      activeClientId,
      activeClient,
      canSwitchClient: isEquipe,
      setSelectedClientId,
      addClient: (cliente) => setClients((prev) => [...prev, cliente]),
    }),
    [clients, loadingClients, activeClientId, activeClient, isEquipe]
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useActiveClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useActiveClient precisa estar dentro de ClientProvider");
  return ctx;
}
