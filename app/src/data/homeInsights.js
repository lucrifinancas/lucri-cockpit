// Alertas e insights da Home — cada um sai de uma regra fixa sobre os
// números do período (nunca texto aleatório, nunca sem dado que sustente).
// Máximo 4 na Home, do mais grave pro menos grave: crítico → atenção →
// oportunidade/organização → positivo. `rotulo` = nome curto da linha.

const ORDEM = { bad: 0, warning: 1, info: 2, good: 3 };
const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) => `${v.toFixed(1).replace(".", ",")}%`;

// `despesasPorCategoria`: [{ categoria, valor }] ordenado do maior pro menor.
export function gerarInsights({ receitas, despesas, saldo, vencidas, inadimplenciaPct, despesasPorCategoria = [], semMae = 0 }, max = 4) {
  const itens = [];

  if (despesas > 0 && receitas > 0 && despesas > receitas) {
    itens.push({ id: "despesas-acima", tone: "bad", rotulo: "Crítico", text: `Despesas estão ${pct((despesas / receitas - 1) * 100)} acima das receitas no período.` });
  } else if (despesas > 0 && !receitas) {
    itens.push({ id: "sem-receitas", tone: "bad", rotulo: "Crítico", text: `Nenhuma receita no período, com ${fmtBRL.format(despesas)} em despesas.` });
  }

  if (inadimplenciaPct > 10) {
    itens.push({ id: "inadimplencia", tone: "warning", rotulo: "Atenção", text: `Inadimplência de ${pct(inadimplenciaPct)} — acima de 10%, merece atenção.` });
  }

  if (despesas > 0 && saldo / despesas < 0.2) {
    itens.push({ id: "cobertura", tone: "warning", rotulo: "Atenção", text: `Saldo atual cobre apenas ${pct(Math.max(0, (saldo / despesas) * 100))} das despesas do período.` });
  }

  const maior = despesasPorCategoria[0];
  if (maior && despesas > 0 && maior.valor / despesas > 0.35) {
    itens.push({ id: "concentracao", tone: "info", rotulo: "Concentração", text: `A categoria ${maior.categoria} concentra ${pct((maior.valor / despesas) * 100)} das despesas.` });
  }

  if (semMae > 0) {
    itens.push({ id: "sem-mae", tone: "info", rotulo: "Organização", text: `${fmtBRL.format(semMae)} ainda estão sem categoria-mãe.`, link: { to: "/ajustes", label: "Classificar em Ajustes" } });
  }

  if (vencidas <= 0 && (receitas > 0 || despesas > 0)) {
    itens.push({ id: "sem-vencidas", tone: "good", rotulo: "Positivo", text: "Nenhuma conta a receber está vencida." });
  }

  return itens.sort((a, b) => ORDEM[a.tone] - ORDEM[b.tone]).slice(0, max);
}
