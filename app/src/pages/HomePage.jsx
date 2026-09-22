import { Link } from "react-router-dom";
import { ArrowCircleDown, ArrowCircleUp, HandCoins, Receipt, Wallet, WarningCircle } from "@phosphor-icons/react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useHistoricoMensal } from "../hooks/useHistoricoMensal";
import { sumValores, groupByCategoria, CATEGORY_PALETTE, computeDelta } from "../data/mockFinance";
import { useActiveClient } from "../context/ClientContext";
import { useHomeCardPrefs } from "../hooks/useHomeCardPrefs";
import StatCard from "../components/StatCard";
import EntradasSummaryTable from "../components/EntradasSummaryTable";
import HistoryBarChart from "../components/charts/HistoryBarChart";
import ComparisonBarChart from "../components/charts/ComparisonBarChart";
import ProportionDonut from "../components/charts/ProportionDonut";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import "../styles/page.css";

const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Reconcilia a soma por categoria com o total oficial (`totais.pago.valor`
// do Conta Azul). Às vezes o campo `pago` de um lançamento individual não
// bate com o agregado que o próprio Conta Azul reporta pro mesmo período
// (confirmado comparando com o relatório nativo deles — provável taxa de
// liquidação que um endpoint reflete e o outro não). Sem isso, a soma das
// categorias podia passar de 100% do total. Ajuste proporcional, não muda
// a ordem nem esconde nenhuma categoria.
function reconciliarComTotal(porCategoria, totalOficial) {
  const somaBruta = sumValores(porCategoria.map((d) => ({ valor: d.valor })));
  if (somaBruta === 0 || somaBruta === totalOficial) return porCategoria;
  const fator = totalOficial / somaBruta;
  return porCategoria.map((d) => ({ ...d, valor: d.valor * fator }));
}

// Top N categorias de uma lista `{categoria, valor}[]` já ordenada, com o
// resto agrupado em "Outros" — usado tanto pra receitas quanto despesas
// (as duas já são dado real, ver API-CONTRACT.md).
function topCategorias(porCategoria, n = 10) {
  const top = porCategoria.slice(0, n);
  const resto = porCategoria.slice(n);
  const restoValor = sumValores(resto.map((d) => ({ valor: d.valor })));
  return [
    ...top.map((d, i) => ({ categoria: d.categoria, valor: d.valor, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] })),
    ...(resto.length ? [{ categoria: "Outros", valor: restoValor, color: "var(--text-secondary)" }] : []),
  ];
}

// Faixas de atraso (Ageing) pra contas a receber vencidas — padrão de
// dashboards financeiros (ex: Apex Finance Receivables), ver
// [[referencias-ui-dashboard-lucri]]. Referência é "hoje", não o período
// selecionado: é sobre o quão atrasado está CADA título agora, não quando
// ele venceu dentro da janela escolhida.
const AGEING_BUCKETS = [
  { label: "0-30 dias", max: 30 },
  { label: "31-60 dias", max: 60 },
  { label: "61-90 dias", max: 90 },
  { label: "90+ dias", max: Infinity },
];

function buildAgeing(lancamentos) {
  const hoje = new Date();
  const buckets = AGEING_BUCKETS.map((b) => ({ ...b, valor: 0 }));
  for (const l of lancamentos) {
    if (l.status !== "ATRASADO" || !l.valor_em_aberto) continue;
    const diasAtraso = Math.max(0, Math.floor((hoje - new Date(l.data_vencimento)) / 86400000));
    const bucket = buckets.find((b) => diasAtraso <= b.max) ?? buckets[buckets.length - 1];
    bucket.valor += l.valor_em_aberto;
  }
  return buckets
    .filter((b) => b.valor > 0)
    .map((b, i) => ({ categoria: b.label, valor: b.valor, color: CATEGORY_PALETTE[i] }));
}

export default function HomePage() {
  const { home, entradas, saidas, despesas, previousHome, previousEntradas, previousSaidas, previousDespesas, loading, error } = useFinanceData();
  const historico = useHistoricoMensal();
  const { activeClientId } = useActiveClient();
  const { isVisible } = useHomeCardPrefs(activeClientId);

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">Home</h1>
        <div className="skeleton-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !home) {
    const nuncaConectou = error === "Cliente ainda não conectou o Conta Azul.";
    const desconectou = error === "conta_azul_desconectada";
    const precisaReconectar = nuncaConectou || desconectou;
    return (
      <div className="page">
        <h1 className="page-title">Home</h1>
        <p className="pending-notice">
          {nuncaConectou && "Esse cliente ainda não conectou o Conta Azul."}
          {desconectou && "A conexão desse cliente com o Conta Azul caiu — precisa reconectar."}
          {!precisaReconectar && `Não deu pra carregar os dados: ${error ?? "erro desconhecido"}.`}
          {precisaReconectar && (
            <span className="pending-notice-actions">
              <Link to="/ajustes" className="pending-notice-link">Conectar em Ajustes →</Link>
            </span>
          )}
        </p>
      </div>
    );
  }

  // Regime de caixa (ver "⚠️ Regime de caixa" no topo do API-CONTRACT.md):
  // totais.pago.valor (o que realmente entrou/saiu), não totais.todos
  // (inclui vencimento futuro/em aberto que ainda não aconteceu de verdade).
  const totalEntradas = entradas?.totais?.pago?.valor ?? 0;
  const totalSaidas = saidas?.totais?.pago?.valor ?? 0;
  const totalDespesas = sumValores(despesas);

  // "Contas vencidas (Valores a receber)" e "Inadimplência" vêm direto dos totais
  // agregados de `contas_a_receber` da HOME (mesma janela do seletor de
  // período) — mais confiável que reclassificar lançamento por lançamento.
  const contasAReceber = home.contas_a_receber;
  const totalAReceberNoMes = Math.max(contasAReceber.todos - contasAReceber.pago.valor, 0);
  const inadimplenciaPct = contasAReceber.todos > 0 ? (contasAReceber.vencido.valor / contasAReceber.todos) * 100 : 0;

  // Delta "vs. período anterior" — só quando o hook trouxe o período
  // anterior comparável (ver useFinanceData; null no preset "Todos os
  // dados"). Saldo em conta e Inadimplência (%) ficam fora de propósito:
  // saldo é foto de agora (não período), e delta de uma métrica que já é
  // % vira "variação percentual de percentual", confuso pro usuário.
  const deltaEntradas = previousEntradas ? computeDelta(totalEntradas, previousEntradas.totais.pago.valor) : null;
  const deltaSaidas = previousSaidas ? computeDelta(totalSaidas, previousSaidas.totais.pago.valor) : null;
  const prevAReceberNoMes = previousHome ? Math.max(previousHome.contas_a_receber.todos - previousHome.contas_a_receber.pago.valor, 0) : null;
  const deltaAReceber = previousHome ? computeDelta(totalAReceberNoMes, prevAReceberNoMes) : null;
  // `previousDespesas` nasce lista vazia (não null, ver useFinanceData),
  // então usa `previousEntradas` como sinal de "tem período anterior
  // comparável" — os dois chegam juntos na mesma leva de fetch.
  const deltaDespesas = previousEntradas ? computeDelta(totalDespesas, sumValores(previousDespesas)) : null;

  const ageingChart = buildAgeing(entradas?.lancamentos ?? []);

  // Saldo em conta: foto de agora (não depende do período selecionado),
  // soma de todas as contas bancárias ativas do cliente no Conta Azul.
  const saldoTotal = home.saldo_total ?? 0;
  const saldoPorConta = (home.contas_bancarias ?? []).map((conta) => ({ label: conta.banco, value: conta.saldo }));

  // Receitas por categoria: dado real (`categoria` do lançamento, ver
  // API-CONTRACT.md /entradas) — substitui a antiga divisão recorrente/
  // pontual/outro, que era inventada no mock e não existe na API real.
  // Regime de caixa: soma valor_pago por lançamento, não valor (total do
  // título, pago ou não) — ver "⚠️ Regime de caixa" no API-CONTRACT.md.
  const receitasPorCategoriaBruto = groupByCategoria(
    (entradas?.lancamentos ?? []).map((l) => ({ ...l, valor: l.valor_pago }))
  );
  const receitasPorCategoria = reconciliarComTotal(receitasPorCategoriaBruto, totalEntradas);
  const receitasChart = topCategorias(receitasPorCategoria);
  const receitasTabela = receitasChart.map((d) => ({ label: d.categoria, value: d.valor, color: d.color }));

  // Despesas por categoria: dado real, filtrado pelas categorias marcadas
  // em Ajustes → Categorias de Despesa (ver API-CONTRACT.md /despesas).
  const despesasPorCategoria = groupByCategoria(despesas);
  const despesasChart = topCategorias(despesasPorCategoria);
  // Cada linha é uma categoria-mãe; ao abrir, as despesas dela (subcategoria).
  // "Sem mãe" reúne as despesas ainda não classificadas em Ajustes.
  const despesasPorMae = new Map();
  for (const l of despesas) {
    const filhas = despesasPorMae.get(l.categoria) ?? new Map();
    filhas.set(l.subcategoria ?? l.categoria, (filhas.get(l.subcategoria ?? l.categoria) ?? 0) + l.valor);
    despesasPorMae.set(l.categoria, filhas);
  }
  const totalSemMae = sumValores(despesas.filter((l) => !l.mae));
  const despesasTabela = despesasChart.map((d) => ({
    label: d.categoria,
    value: d.valor,
    color: d.color,
    children: [...(despesasPorMae.get(d.categoria) ?? [])]
      .map(([label, value]) => ({ label, value }))
      .filter((filho, _, todos) => !(todos.length === 1 && filho.label === d.categoria)) // sem mãe: abrir só repetiria a linha
      .sort((a, b) => b.value - a.value),
  }));

  // Histórico mensal (Receitas x Despesas, Resultado, Vencidas): 1 fetch só
  // (useHistoricoMensal), reaproveitado nos 3 gráficos abaixo.
  const monthlyHistory = historico.map((m) => ({ month: m.label, receitas: m.receitas, despesas: m.despesas }));
  const resultadoHistorico = historico.map((m) => ({ month: m.label, resultado: m.resultado }));
  const overdueHistory = historico.map((m) => ({ month: m.label, valor: m.vencidas }));

  return (
    <div className="page">
      <h1 className="page-title">Home</h1>

      <div className="stat-row stat-row-grid">
        {isVisible("saldoConta") && (
          <StatCard
            label="Saldo em conta"
            value={saldoTotal}
            icon={Wallet}
            breakdown={saldoPorConta}
            tone={saldoTotal < 0 ? "negative" : "neutral"}
          />
        )}
        {isVisible("entradas") && (
          <StatCard label="Entradas" value={totalEntradas} icon={ArrowCircleDown} delta={deltaEntradas} />
        )}
        {isVisible("saidas") && (
          <StatCard label="Saídas" value={totalSaidas} icon={ArrowCircleUp} delta={deltaSaidas} invertDeltaColor />
        )}
        {isVisible("despesas") && (
          <StatCard label="Despesas" value={totalDespesas} icon={Receipt} delta={deltaDespesas} invertDeltaColor />
        )}
        {isVisible("contasAReceberMes") && (
          <StatCard
            label="Contas vencidas (Valores a receber)"
            value={totalAReceberNoMes}
            icon={HandCoins}
            delta={deltaAReceber}
            invertDeltaColor
          />
        )}
        {isVisible("inadimplencia") && (
          <StatCard
            label="Inadimplência do mês"
            value={`${inadimplenciaPct.toFixed(1)}%`}
            format="count"
            tone={inadimplenciaPct > 0 ? "negative" : "neutral"}
            icon={WarningCircle}
          />
        )}
      </div>

      <section className="page-section">
        <div className="chart-row chart-row-2">
          <div>
            <h2 className="section-title">Receitas por categoria</h2>
            <EntradasSummaryTable rows={receitasTabela} total={totalEntradas} />
          </div>

          <div>
            <h2 className="section-title">Despesas totais</h2>
            {totalSemMae > 0 && (
              <p className="pending-notice">
                {fmtBRL.format(totalSemMae)} em despesas ainda sem mãe.
                <span className="pending-notice-actions">
                  <Link to="/ajustes" className="pending-notice-link">Classificar em Ajustes →</Link>
                </span>
              </p>
            )}
            <EntradasSummaryTable rows={despesasTabela} total={totalDespesas} />
          </div>
        </div>
      </section>

      <section className="page-section">
        <h2 className="section-title">Receitas x Despesas — Histórico mensal</h2>
        <ComparisonBarChart
          data={monthlyHistory}
          series={[
            { dataKey: "receitas", name: "Receitas", color: "var(--chart-receita)" },
            { dataKey: "despesas", name: "Despesas", color: "var(--chart-despesa)" },
          ]}
        />
      </section>

      <section className="page-section">
        <h2 className="section-title">Resultado histórico (lucro/prejuízo)</h2>
        <HistoryBarChart data={resultadoHistorico} dataKey="resultado" color="var(--chart-caixa)" label="Resultado" colorBySign />
      </section>

      <section className="page-section">
        <h2 className="section-title">Contas a receber vencidas por mês</h2>
        <HistoryBarChart data={overdueHistory} dataKey="valor" color="var(--chart-despesa)" label="Vencidas" />
      </section>

      <section className="page-section">
        <h2 className="section-title">Inadimplência por faixa de atraso (Ageing)</h2>
        {ageingChart.length > 0 ? (
          <HorizontalBarChart data={ageingChart} height={Math.max(160, ageingChart.length * 48)} />
        ) : (
          <p className="section-empty">Nenhuma conta vencida no período selecionado.</p>
        )}
      </section>

      <section className="page-section">
        <h2 className="section-title">Análise</h2>
        <div className="chart-row chart-row-2">
          <div className="chart-row-item">
            <h3 className="subsection-title">Receitas por categoria</h3>
            <ProportionDonut data={receitasChart.map((d) => ({ name: d.categoria, value: d.valor, color: d.color }))} />
          </div>

          <div className="chart-row-item">
            <h3 className="subsection-title">Despesas por categoria</h3>
            <ProportionDonut data={despesasChart.map((d) => ({ name: d.categoria, value: d.valor, color: d.color }))} />
          </div>
        </div>
      </section>

      <section className="page-section">
        <h2 className="section-title">Top 10 gastos por categoria</h2>
        <HorizontalBarChart data={despesasChart} />
      </section>
    </div>
  );
}
