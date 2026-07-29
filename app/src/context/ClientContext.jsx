import { createContext, useContext, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { isInternalRole } from "../auth/roles";
import { MOCK_CLIENTS } from "../data/mockClients";

// Cliente "ativo" na tela: master/analista escolhem qual cliente ver (seletor
// no header); cliente final está sempre travado no próprio tenant.

const ClientContext = createContext(null);

export function ClientProvider({ children }) {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id);

  const activeClientId = user?.role === "cliente" ? user.clientId : selectedClientId;

  const value = useMemo(
    () => ({
      activeClientId,
      canSwitchClient: isInternalRole(user?.role),
      setSelectedClientId,
    }),
    [activeClientId, user?.role]
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useActiveClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useActiveClient precisa estar dentro de ClientProvider");
  return ctx;
}
