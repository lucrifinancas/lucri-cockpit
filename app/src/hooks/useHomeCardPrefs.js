import { useEffect, useState } from "react";

// Preferência de quais stat cards da Home aparecem, por cliente — editável
// em Ajustes. Sem override salvo, cai no padrão automático por tipo de
// cliente (servico/produto) que já existia antes desta tela.
const STORAGE_PREFIX = "lucri-dash.home-cards.";

export const HOME_CARDS = [
  { id: "entradas", label: "Entradas" },
  { id: "saidas", label: "Saídas" },
  { id: "saldo", label: "Saldo em conta" },
  { id: "contasAReceberMes", label: "Contas a receber do mês" },
  { id: "qtdRecorrentes", label: "Qtd. recebimentos recorrentes" },
  { id: "qtdPontuais", label: "Qtd. recebimentos pontuais" },
  { id: "ticketRecorrente", label: "Ticket médio recorrentes" },
  { id: "ticketPontual", label: "Ticket médio pontuais" },
  { id: "inadimplencia", label: "Inadimplência do mês" },
];

// Padrão quando não há override manual: cards de recorrência só pra quem é
// tipo "servico" (assinatura/contrato) — mesma regra de antes desta tela.
function defaultVisible(cardId, tipo) {
  if ((cardId === "qtdRecorrentes" || cardId === "ticketRecorrente") && tipo !== "servico") return false;
  return true;
}

function readOverrides(clientId) {
  const raw = localStorage.getItem(STORAGE_PREFIX + clientId);
  return raw ? JSON.parse(raw) : {};
}

export function useHomeCardPrefs(clientId, tipo) {
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
    return overrides[cardId] ?? defaultVisible(cardId, tipo);
  }

  return { overrides, isVisible, setOverride, clearOverride };
}
