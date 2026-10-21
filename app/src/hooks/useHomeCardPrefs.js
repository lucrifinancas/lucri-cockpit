import { useEffect, useState } from "react";

// Preferência de quais stat cards da Home aparecem, por cliente — editável
// em Ajustes. Sem override salvo, todos os cards aparecem (não existe mais
// distinção por "tipo" de cliente — esse campo não existe no backend real).
const STORAGE_PREFIX = "lucri-dash.home-cards.";

// Cards de recorrente/pontual/outro e ticket médio foram removidos: a API
// real do Conta Azul não classifica lançamentos dessa forma (só `categoria`,
// ver GUIA-INTEGRACAO-DADOS-REAIS.md), então esses cards eram baseados em
// dado inventado no mock.
// 14/10/2026: KPIs da Home Financeira (redesenho). Saídas e Contas a pagar
// saíram da linha de KPIs (o andamento de contas a pagar tem card próprio);
// "Contas vencidas" agora é só o que já venceu — id novo pra não herdar a
// preferência do card antigo, que mostrava outra conta.
export const HOME_CARDS = [
  { id: "saldoConta", label: "Saldo em conta" },
  { id: "resultado", label: "Resultado do período" },
  { id: "entradas", label: "Receitas" },
  { id: "despesas", label: "Despesas" },
  { id: "contasVencidas", label: "Contas vencidas" },
  { id: "inadimplencia", label: "Inadimplência do período" },
];

function readOverrides(clientId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_PREFIX + clientId) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

export function useHomeCardPrefs(clientId) {
  const [state, setState] = useState(() => ({ clientId, overrides: readOverrides(clientId) }));
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setState({ clientId, overrides: readOverrides(clientId) });
    setError(null);
    setSaved(false);
  }, [clientId]);
  const overrides = state.clientId === clientId ? state.overrides : readOverrides(clientId);
  function persist(next) {
    setError(null);
    setSaved(false);
    try {
      localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(next));
      setState({ clientId, overrides: next });
      setSaved(true);
    } catch {
      setError("Não foi possível salvar a preferência neste navegador. Verifique as permissões de armazenamento e tente novamente.");
    }
  }
  function setOverride(cardId, visible) { persist({ ...overrides, [cardId]: visible }); }
  function clearOverride(cardId) {
    const next = { ...overrides };
    delete next[cardId];
    persist(next);
  }
  function isVisible(cardId) { return overrides[cardId] ?? true; }
  return { overrides, isVisible, setOverride, clearOverride, error, saved };
}
