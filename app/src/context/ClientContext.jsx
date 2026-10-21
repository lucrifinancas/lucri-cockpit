import { useConfirmLeave } from "../hooks/usePendingChanges";
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
  const confirmLeave = useConfirmLeave();
  const isEquipe = isInternalRole(user?.papel);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(isEquipe);
  const [selectedClientId, updateSelectedClientId] = useState(null);
  const [clientsError, setClientsError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingClients(true);
    setClientsError(null);
    setClients([]);
    apiFetch(isEquipe ? "/api/clientes" : `/api/clientes/${user.cliente_id}`)
      .then((lista) => {
        if (cancelled) return;
        const normalizados = (isEquipe ? lista : [lista]).map((c) => ({ id: c.id, name: c.nome, logoUrl: null }));
        setClients(normalizados);
        updateSelectedClientId((prev) => normalizados.some((c) => c.id === prev) ? prev : normalizados[0]?.id ?? null);
      })
      .catch((error) => !cancelled && setClientsError(error.message))
      .finally(() => !cancelled && setLoadingClients(false));
    return () => {
      cancelled = true;
    };
  }, [isEquipe, user]);

  const activeClientId = user?.papel === "cliente" ? user.cliente_id : selectedClientId;
  const activeClient = clients.find((c) => c.id === activeClientId) ?? null;

  const value = useMemo(
    () => ({
      clients,
      loadingClients,
      clientsError,
      activeClientId,
      activeClient,
      canSwitchClient: isEquipe,
      setSelectedClientId: (id) => {
        if (id === activeClientId) return true;
        if (!isEquipe || !clients.some((client) => client.id === id) || !confirmLeave()) return false;
        updateSelectedClientId(id);
        return true;
      },
      addClient: (cliente, select = false) => {
        setClients((prev) => [...prev, cliente]);
        if (select) updateSelectedClientId(cliente.id);
      },
    }),
    [clients, loadingClients, clientsError, activeClientId, activeClient, isEquipe, confirmLeave]
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useActiveClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useActiveClient precisa estar dentro de ClientProvider");
  return ctx;
}
