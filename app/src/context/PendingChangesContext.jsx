import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { createPendingChanges } from "../data/pendingChanges";

import { PendingChangesContext } from "./pendingChangesStore";

export function PendingChangesProvider({ children }) {
  const registryRef = useRef(null);
  if (!registryRef.current) registryRef.current = createPendingChanges();
  const registry = registryRef.current;
  const confirmLeave = useCallback(() => registry.canLeave(
    () => window.confirm("Há alterações não salvas. Descartar as alterações e continuar? Para manter a edição, escolha Cancelar."),
    () => window.alert("Aguarde a operação em andamento terminar antes de sair ou trocar de empresa."),
  ), [registry]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    registry.hasPending() && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (confirmLeave()) blocker.proceed();
    else blocker.reset();
  }, [blocker, confirmLeave]);
  useEffect(() => {
    const beforeUnload = (event) => {
      if (!registry.hasPending()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [registry]);
  return <PendingChangesContext.Provider value={{ registry, confirmLeave }}>{children}</PendingChangesContext.Provider>;
}
