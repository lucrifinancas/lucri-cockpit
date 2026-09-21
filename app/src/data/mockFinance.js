// Utilitários genéricos usados tanto com dado real (Entradas/Saídas/Despesas,
// ver API-CONTRACT.md) quanto pelo que ainda for mock nas telas não
// conectadas (Caixa/Balanço/DRE, ver DEMANDAS-PARA-FINALIZAR.md item 5).

// Paleta categórica (N cores distintas) pros gráficos "por categoria" — os
// tokens --chart-* são semânticos (receita/despesa/caixa/saldo), não servem
// pra distinguir N categorias, então esta paleta cicla variações da marca.
export const CATEGORY_PALETTE = [
  "#00d0f5",
  "#00eb85",
  "#8a8ba0",
  "#ff6b4a",
  "#7c6bff",
  "#ffb84a",
  "#4ad9ff",
  "#5ce8a8",
];

// Agrupa itens com campo `categoria` somando `valor` por categoria, ordenado
// do maior pro menor. `categoria` pode ser string (forma real do Conta Azul
// em /entradas, /saidas e /despesas) ou objeto `{nome,...}`.
export function groupByCategoria(items) {
  const totals = new Map();
  for (const item of items) {
    const key = typeof item.categoria === "string" ? item.categoria : (item.categoria?.nome ?? "Outros");
    totals.set(key, (totals.get(key) ?? 0) + item.valor);
  }
  return Array.from(totals, ([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
}

export function sumValores(items) {
  return items.reduce((acc, item) => acc + item.valor, 0);
}

// Busca por texto livre em lançamentos (descrição, contraparte, categoria) —
// usado em Entradas/Saídas/Despesas. Case-insensitive; termo vazio devolve
// tudo (não filtra).
export function filterLancamentos(lancamentos, termo) {
  const t = termo.trim().toLowerCase();
  if (!t) return lancamentos;
  return lancamentos.filter((l) => {
    const categoria = typeof l.categoria === "string" ? l.categoria : (l.categoria?.nome ?? "");
    return [l.descricao, l.contraparte, categoria].some((v) => v?.toLowerCase().includes(t));
  });
}

export function filterByPeriod(items, { start, end }) {
  if (!start || !end) return items;
  return items.filter((item) => {
    const dataRef = item.data ?? item.vencimento;
    return dataRef >= start && dataRef <= end;
  });
}

// Intervalo imediatamente anterior a `range`, com a mesma duração — usado
// pra comparar "período atual vs. período anterior". Exportada porque quem
// busca dado real (useFinanceData) precisa desse range pra fazer o 2º
// fetch da API com `de`/`ate` do período anterior.
export function previousRange({ start, end }) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationDays = Math.round((endDate - startDate) / 86400000) + 1;

  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (durationDays - 1));

  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
  };
}

// Variação % entre um valor do período atual e o mesmo valor no período
// anterior (ver `previousRange`). Sem baseline comparável (período anterior
// null/zero) retorna null — não inventa número sem base, ex: preset "Todos
// os dados" (sem período anterior) ou cliente novo sem histórico.
export function computeDelta(current, previous) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  return { pct, direction: pct >= 0 ? "up" : "down" };
}
