import { Link } from "react-router-dom";
import { ArrowCircleDown, ArrowCircleUp, HandCoins, WarningCircle } from "@phosphor-icons/react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useMonthlyHistory } from "../hooks/useMonthlyHistory";
import { useOverdueHistory } from "../hooks/useOverdueHistory";
import { sumValores, groupByCategoria, CATEGORY_PALETTE } from "../data/mockFinance";
import { useActiveClient } from "../context/ClientContext";
import { useHomeCardPrefs } from "../hooks/useHomeCardPrefs";
import StatCard from "../components/StatCard";
import EntradasSummaryTable from "../components/EntradasSummaryTable";
import HistoryBarChart from "../components/charts/HistoryBarChart";
import ComparisonBarChart from "../components/charts/ComparisonBarChart";
import ProportionDonut from "../components/charts/ProportionDonut";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import "../styles/page.css";

// Top N categorias de uma lista `{categoria, valor}[]` já ordenada, com o
// resto agrupado em "Outros" — usado tanto pra receitas (real) quanto
// despesas (mock).
function topCategorias(porCategoria, n = 10) {
  const top = porCategoria.slice(0, n);
  const resto = porCategoria.slice(n);
  const restoValor = sumValores(resto.map((d) => ({ valor: d.valor })));
  return [
    ...top.map((d, i) => ({ categoria: d.categoria, valor: d.valor, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] })),
    ...(resto.length ? [{ categoria: "Outros", valor: restoValor, color: "var(--text-secondary)" }] : []),
  ];
}

export default function HomePage() {
  const { home, entradas, saidas, despesas, loading, error } = useFinanceData();
  const monthlyHistory = useMonthlyHistory();
  const overdueHistory = useOverdueHistory();
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

  // "Contas a receber do mês" e "Inadimplência" vêm direto dos totais
  // agregados de `contas_a_receber` da HOME (mesma janela do seletor de
  // período) — mais confiável que reclassificar lançamento por lançamento.
  const contasAReceber = home.contas_a_receber;
  const totalAReceberNoMes = Math.max(contasAReceber.todos - contasAReceber.pago.valor, 0);
  const inadimplenciaPct = contasAReceber.todos > 0 ? (contasAReceber.vencido.valor / contasAReceber.todos) * 100 : 0;

  // Receitas por categoria: dado real (`categoria` do lançamento, ver
  // API-CONTRACT.md /entradas) — substitui a antiga divisão recorrente/
  // pontual/outro, que era inventada no mock e não existe na API real.
  // Regime de caixa: soma valor_pago por lançamento, não valor (total do
  // título, pago ou não) — ver "⚠️ Regime de caixa" no API-CONTRACT.md.
  const receitasPorCategoria = groupByCategoria(
    (entradas?.lancamentos ?? []).map((l) => ({ ...l, valor: l.valor_pago }))
  );
  const receitasChart = topCategorias(receitasPorCategoria);
  const receitasTabela = receitasChart.map((d) => ({ label: d.categoria, value: d.valor, color: d.color }));

  // Despesas por categoria: segue mockado (sem endpoint real ainda, ver
  // GUIA-INTEGRACAO-DADOS-REAIS.md item 3).
  const despesasPorCategoria = groupByCategoria(despesas);
  const despesasChart = topCategorias(despesasPorCategoria);
  const despesasTabela = despesasChart.map((d) => ({ label: d.categoria, value: d.valor, color: d.color }));

  const resultadoHistorico = monthlyHistory.map((m) => ({ month: m.month, resultado: m.receitas - m.despesas }));

  return (
    <div className="page">
      <h1 className="page-title">Home</h1>

      <div className="stat-row stat-row-grid">
        {isVisible("entradas") && <StatCard label="Entradas" value={totalEntradas} icon={ArrowCircleDown} />}
        {isVisible("saidas") && (
          <StatCard label="Saídas" value={totalSaidas} icon={ArrowCircleUp} invertDeltaColor />
        )}
        {isVisible("contasAReceberMes") && (
          <StatCard label="Contas a receber do mês" value={totalAReceberNoMes} icon={HandCoins} />
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

      <p className="pending-notice">
        Despesas e histórico mensal ainda são dado mockado — sem endpoint real
        no backend (ver GUIA-INTEGRACAO-DADOS-REAIS.md). Saldo em conta segue
        oculto até o Conta Azul expor esse dado.
      </p>
    </div>
  );
}
