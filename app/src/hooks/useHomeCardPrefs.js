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
  { id: "resultado", label: "Resultado do mês" },
  { id: "entradas", label: "Receitas" },
  { id: "despesas", label: "Despesas" },
  { id: "contasVencidas", label: "Contas vencidas" },
  { id: "inadimplencia", label: "Inadimplência do mês" },
];

function readOverrides(clientId) {
  const raw = localStorage.getItem(STORAGE_PREFIX + clientId);
  return raw ? JSON.parse(raw) : {};
}

export function useHomeCardPrefs(clientId) {
  const [overrides, setOverrides] = useState(() => readOverrides(clientId));

  useEffect(() => {
    setOverrides(readOverrides(clientId));
  }, [clientId]);

  function setOverride(cardId, visible) {
    setOverrides((prev) => {
      const next = { ...prev, [cardId]: visible };
      localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(next));
      return next;
    });
  }

  // Volta esse card pro padrão automático (remove o override manual).
  function clearOverride(cardId) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[cardId];
      localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(next));
      return next;
    });
  }

  function isVisible(cardId) {
    return overrides[cardId] ?? true;
  }

  return { overrides, isVisible, setOverride, clearOverride };
}
