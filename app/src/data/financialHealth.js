// Saúde Financeira da Home — indicador GERENCIAL v1, não contábil.
// Fórmula proposta em lucri-home-redesign-vscode-v2/10_HEALTH_SCORE_PROPOSAL.md.
// Ajustar pesos/faixas aqui, nunca no JSX (FinancialHealthCard só exibe).

export const PESOS = { resultado: 0.35, cobertura: 0.25, inadimplencia: 0.2, vencidas: 0.2 };

// Faixa → rótulo e tom (o tom escolhe a cor do anel no card).
export const FAIXAS = [
  { min: 80, status: "Boa", tone: "good" },
  { min: 60, status: "Atenção", tone: "warning" },
  { min: 0, status: "Crítica", tone: "bad" },
];

// Resultado: >= 0 é 100; negativo perde pontos proporcional à receita.
function notaResultado(resultado, receitas) {
  if (resultado >= 0) return 100;
  if (!receitas) return 0;
  return Math.max(0, 100 - Math.min((Math.abs(resultado) / receitas) * 200, 100));
}

// Quanto do gasto do período o saldo de hoje cobre.
function notaCobertura(saldo, despesas) {
  if (!despesas) return saldo > 0 ? 100 : 0;
  const r = saldo / despesas;
  if (r >= 1) return 100;
  if (r >= 0.5) return 75;
  if (r >= 0.25) return 50;
  if (r > 0) return 25;
  return 0;
}

function notaInadimplencia(pct) {
  if (pct <= 0) return 100;
  if (pct <= 5) return 80;
  if (pct <= 10) return 60;
  if (pct <= 20) return 30;
  return 0;
}

// Vencidas: parte do que AINDA falta receber que já está vencida (a
// inadimplência acima compara com o total do período, recebido ou não —
// assim os dois componentes não medem exatamente a mesma coisa).
function notaVencidas(vencidas, aReceberEmAberto) {
  if (vencidas <= 0) return 100;
  if (!aReceberEmAberto) return 0;
  const pct = (vencidas / aReceberEmAberto) * 100;
  if (pct <= 10) return 70;
  if (pct <= 25) return 40;
  return 0;
}

const pct1 = (v) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const pct0 = (v) => `${Math.round(v)}%`;

// Diagnóstico em 2 partes, sempre tirado dos números (nunca texto solto):
// `headline` = a conclusão em 1 frase curta; `summary` = o porquê.
function diagnosticar({ receitas, despesas, resultado, saldo, inadimplenciaPct, vencidas }) {
  if (!receitas && !despesas) return { headline: "Sem movimento no período.", summary: "Nenhuma receita ou despesa registrada no período selecionado." };
  const headline = resultado < 0 ? "Sua empresa fechou o período no vermelho." : "Sua empresa fechou o período no azul.";
  const partes = [];
  if (receitas > 0 && despesas > 0) {
    partes.push(resultado < 0
      ? `As despesas ficaram ${pct1((despesas / receitas - 1) * 100)} acima das receitas`
      : `As receitas ficaram ${pct1((receitas / despesas - 1) * 100)} acima das despesas`);
  } else if (!receitas) partes.push("Não houve receita no período");
  if (despesas > 0) partes.push(`o saldo disponível cobre ${pct0(Math.max(0, (saldo / despesas) * 100))} das despesas`);
  let summary = partes.join(", enquanto ") + ".";
  if (inadimplenciaPct > 0) summary += ` A inadimplência está em ${pct1(inadimplenciaPct)}.`;
  else if (vencidas <= 0) summary += " A inadimplência permanece zerada.";
  return { headline, summary };
}

// Entrada: números já calculados pela Home (mesmas definições dos KPIs).
export function calcularSaude({ receitas, despesas, saldo, inadimplenciaPct, vencidas, aReceberEmAberto }) {
  const resultado = receitas - despesas;
  const partes = {
    resultado: notaResultado(resultado, receitas),
    cobertura: notaCobertura(saldo, despesas),
    inadimplencia: notaInadimplencia(inadimplenciaPct),
    vencidas: notaVencidas(vencidas, aReceberEmAberto),
  };
  const score = Math.round(Object.entries(PESOS).reduce((acc, [k, peso]) => acc + partes[k] * peso, 0));
  const faixa = FAIXAS.find((f) => score >= f.min);
  return { score, status: faixa.status, tone: faixa.tone, partes, ...diagnosticar({ receitas, despesas, resultado, saldo, inadimplenciaPct, vencidas }) };
}
