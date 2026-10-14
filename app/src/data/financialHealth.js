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

const pctFmt = (v) => `${Math.round(v)}%`;

// Resumo em 1–2 frases, sempre tirado dos números (nunca texto solto).
function resumir({ receitas, despesas, resultado, saldo, inadimplenciaPct, vencidas }) {
  const frases = [];
  if (!receitas && !despesas) return "Sem receitas nem despesas no período selecionado.";
  if (resultado < 0) frases.push("As despesas superaram as receitas no período");
  else frases.push("As receitas cobriram as despesas no período");
  if (despesas > 0) frases.push(`o saldo em conta cobre ${pctFmt(Math.max(0, (saldo / despesas) * 100))} das despesas`);
  let texto = frases.join(" e ") + ".";
  if (inadimplenciaPct > 0) texto += ` Inadimplência de ${inadimplenciaPct.toFixed(1).replace(".", ",")}%.`;
  else if (vencidas <= 0) texto += " Nenhuma conta a receber vencida.";
  return texto;
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
  return { score, status: faixa.status, tone: faixa.tone, partes, summary: resumir({ receitas, despesas, resultado, saldo, inadimplenciaPct, vencidas }) };
}
