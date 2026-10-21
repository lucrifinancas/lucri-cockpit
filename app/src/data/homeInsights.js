import { categoryLabel } from "./labels.js";
// Alertas e insights da Home — cada um sai de uma regra fixa sobre os
// números do período (nunca texto aleatório, nunca sem dado que sustente).
// Máximo 3 na Home, do mais grave pro menos grave: crítico → atenção →
// oportunidade/organização → positivo. `rotulo` = nome curto da linha.

const ORDEM = { bad: 0, warning: 1, info: 2, good: 3 };
const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) => `${v.toFixed(1).replace(".", ",")}%`;

// `despesasPorCategoria`: [{ categoria, valor }] ordenado do maior pro menor.
export function gerarInsights({ receitas, despesas, saldo, vencidas, inadimplenciaPct, despesasPorCategoria = [], semMae = 0, papel }, max = 3) {
  const itens = [];

  if (vencidas > 0) {
    itens.push({ id: "recebimentos-vencidos", tone: "bad", rotulo: "Recebimentos vencidos", text: `${fmtBRL.format(vencidas)} em aberto após o vencimento no período.${inadimplenciaPct > 10 ? ` Inadimplência de ${pct(inadimplenciaPct)}.` : ""}`, link: { to: "/entradas?situacao=vencido", label: "Ver títulos vencidos" } });
  }

  if (despesas > 0 && receitas > 0 && despesas > receitas) {
    itens.push({ id: "despesas-acima", tone: "bad", rotulo: "Crítico", text: `Despesas estão ${pct((despesas / receitas - 1) * 100)} acima das receitas no período (${fmtBRL.format(despesas)} em despesas).`, link: { to: "/saidas?visao=despesas", label: "Investigar despesas" } });
  } else if (despesas > 0 && !receitas) {
    itens.push({ id: "sem-receitas", tone: "bad", rotulo: "Crítico", text: `Nenhuma receita no período, com ${fmtBRL.format(despesas)} em despesas.`, link: { to: "/saidas?visao=despesas", label: "Investigar despesas" } });
  }

  if (despesas > 0 && saldo / despesas < 0.2) {
    itens.push({ id: "cobertura", tone: "warning", rotulo: "Atenção", text: `Saldo atual cobre apenas ${pct(Math.max(0, (saldo / despesas) * 100))} das despesas do período (${fmtBRL.format(saldo)} disponíveis hoje).`, link: { to: "/caixa", label: "Consultar movimentações" } });
  }

  const maior = despesasPorCategoria[0];
  if (maior && despesas > 0 && maior.valor / despesas > 0.35) {
    itens.push({ id: "concentracao", tone: "info", rotulo: "Concentração", text: `A categoria ${categoryLabel(maior.categoria)} concentra ${pct((maior.valor / despesas) * 100)} das despesas (${fmtBRL.format(maior.valor)}).`, link: { to: "/saidas?visao=despesas", label: "Investigar despesas" } });
  }

  if (semMae > 0) {
    itens.push({ id: "sem-mae", tone: "info", rotulo: "Organização", text: `${fmtBRL.format(semMae)} ainda estão sem categoria principal.${papel === "master" ? "" : " Solicite a classificação à equipe Lucri."}`, ...(papel === "master" ? { link: { to: "/ajustes?secao=categorias", label: "Classificar em Ajustes" } } : {}) });
  }

  if (vencidas <= 0 && (receitas > 0 || despesas > 0)) {
    itens.push({ id: "sem-vencidas", tone: "good", rotulo: "Positivo", text: "Nenhuma conta a receber está vencida no período." });
  }

  return itens.sort((a, b) => ORDEM[a.tone] - ORDEM[b.tone]).slice(0, max);
}
