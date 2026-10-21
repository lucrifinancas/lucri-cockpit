import { useContext, useLayoutEffect, useRef } from "react";
import { PendingChangesContext } from "../context/pendingChangesStore";

export function useConfirmLeave() {
  return useContext(PendingChangesContext).confirmLeave;
}

export function usePendingChanges(dirty, saving = false) {
  const { registry } = useContext(PendingChangesContext);
  const key = useRef(Symbol("form"));
  useLayoutEffect(() => registry.register(key.current, { dirty, saving }), [registry, dirty, saving]);
}
