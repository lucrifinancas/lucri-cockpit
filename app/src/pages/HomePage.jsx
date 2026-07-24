import { Wallet, ArrowCircleDown, ArrowCircleUp, Receipt, Ticket, WarningCircle, HandCoins } from "@phosphor-icons/react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useMonthlyHistory } from "../hooks/useMonthlyHistory";
import { useOverdueHistory } from "../hooks/useOverdueHistory";
import { sumValores, sumSaldoContas, filterByPeriod, periodDelta, groupByCategoria, CATEGORY_PALETTE } from "../data/mockFinance";
import { getClientById } from "../data/mockClients";
import { useActiveClient } from "../context/ClientContext";
import { useHomeCardPrefs } from "../hooks/useHomeCardPrefs";
import StatCard from "../components/StatCard";
import EntradasSummaryTable from "../components/EntradasSummaryTable";
import HistoryBarChart from "../components/charts/HistoryBarChart";
import ComparisonBarChart from "../components/charts/ComparisonBarChart";
import ProportionDonut from "../components/charts/ProportionDonut";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import "../styles/page.css";

// "YYYY-MM-DD" -> {start, end} do mês em que a data cai.
function monthBoundsOf(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

export default function HomePage() {
  const { entradas, saidas, despesas, contasAReceber, contasBancarias, raw, range } = useFinanceData();
  const monthlyHistory = useMonthlyHistory();
  const overdueHistory = useOverdueHistory();
  const { activeClientId } = useActiveClient();
  const clientTipo = getClientById(activeClientId)?.tipo;
  // Quais stat cards aparecem — editável em Ajustes por cliente; sem
  // override manual, cai no padrão automático por tipo (servico/produto).
  const { isVisible } = useHomeCardPrefs(activeClientId, clientTipo);

  const totalEntradas = sumValores(entradas);
  const totalSaidas = sumValores(saidas);
  const totalDespesas = sumValores(despesas);
  // "Saldo em conta" = soma das contas bancárias reais (`GET /conta-
  // financeira`), não entradas-saídas do período — é o saldo de agora, não
  // depende do seletor de período. Beta 1.1: por enquanto é só a soma; uma
  // visão por conta individual fica pra depois.
  const saldo = sumSaldoContas(contasBancarias);

  const entradasRecorrentes = entradas.filter((e) => e.tipo === "recorrente");
  const entradasPontuais = entradas.filter((e) => e.tipo === "pontual");
  const entradasOutros = entradas.filter((e) => e.tipo === "outro");
  const recorrentes = sumValores(entradasRecorrentes);
  const pontuais = sumValores(entradasPontuais);
  const outros = sumValores(entradasOutros);
  const ticketRecorrente = entradasRecorrentes.length ? recorrentes / entradasRecorrentes.length : 0;
  const ticketPontual = entradasPontuais.length ? pontuais / entradasPontuais.length : 0;

  // Inadimplência do mês: deriva o mês do início do período selecionado
  // (funciona igual pra "Este mês" ou "Mês específico"); sem período
  // definido (ex: "Todos os dados"), cai no mês corrente.
  const mesReferencia = range.start ? monthBoundsOf(range.start) : monthBoundsOf(new Date().toISOString().slice(0, 10));
  const contasReceberNoMes = filterByPeriod(contasAReceber, mesReferencia);
  const contasReceberVencidasNoMes = contasReceberNoMes.filter((c) => c.status === "VENCIDO");
  const totalNoMes = sumValores(contasReceberNoMes);
  const inadimplenciaPct = totalNoMes > 0 ? (sumValores(contasReceberVencidasNoMes) / totalNoMes) * 100 : 0;
  // "Contas a receber do mês" — o que ainda falta entrar (exclui o que já
  // foi PAGO, mas inclui pendente/vence hoje/vencido: ainda é dinheiro que
  // falta receber, só que parte já passou do prazo).
  const totalAReceberNoMes = sumValores(contasReceberNoMes.filter((c) => c.status !== "PAGO"));

  const despesasPorCategoria = groupByCategoria(despesas);
  const despesasDonut = despesasPorCategoria.map((d, i) => ({
    name: d.categoria,
    value: d.valor,
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
  }));
  const despesasTabela = despesasPorCategoria.map((d, i) => ({
    label: d.categoria,
    value: d.valor,
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
  }));

  const top10 = despesasPorCategoria.slice(0, 10);
  const restoTop10 = despesasPorCategoria.slice(10);
  const restoTop10Valor = sumValores(restoTop10.map((d) => ({ valor: d.valor })));
  const top10Chart = [
    ...top10.map((d, i) => ({ categoria: d.categoria, valor: d.valor, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] })),
    ...(restoTop10.length ? [{ categoria: "Outros", valor: restoTop10Valor, color: "var(--text-secondary)" }] : []),
  ];

  const resultadoHistorico = monthlyHistory.map((m) => ({ month: m.month, resultado: m.receitas - m.despesas }));

  const entradasDelta = periodDelta((r) => sumValores(filterByPeriod(raw.entradas, r)), range);
  const saidasDelta = periodDelta((r) => sumValores(filterByPeriod(raw.saidas, r)), range);
  // Sem delta pro saldo: agora é saldo bancário (foto de agora), não soma de
  // fluxo do período — não tem "período anterior" pra comparar.

  return (
    <div className="page">
      <h1 className="page-title">Home</h1>

      <div className="stat-row stat-row-grid">
        {isVisible("entradas") && (
          <StatCard label="Entradas" value={totalEntradas} icon={ArrowCircleDown} delta={entradasDelta} />
        )}
        {isVisible("saidas") && (
          <StatCard label="Saídas" value={totalSaidas} icon={ArrowCircleUp} delta={saidasDelta} invertDeltaColor />
        )}
        {isVisible("saldo") && (
          <StatCard
            label="Saldo em conta"
            value={saldo}
            tone={saldo >= 0 ? "positive" : "negative"}
            icon={Wallet}
            breakdown={contasBancarias.map((c) => ({ label: c.nome, value: c.saldo }))}
          />
        )}
        {isVisible("contasAReceberMes") && (
          <StatCard label="Contas a receber do mês" value={totalAReceberNoMes} icon={HandCoins} />
        )}
        {isVisible("qtdRecorrentes") && (
          <StatCard label="Qtd. recebimentos recorrentes" value={entradasRecorrentes.length} format="count" icon={Receipt} />
        )}
        {isVisible("qtdPontuais") && (
          <StatCard label="Qtd. recebimentos pontuais" value={entradasPontuais.length} format="count" icon={Receipt} />
        )}
        {isVisible("ticketRecorrente") && (
          <StatCard label="Ticket médio recorrentes" value={ticketRecorrente} icon={Ticket} />
        )}
        {isVisible("ticketPontual") && <StatCard label="Ticket médio pontuais" value={ticketPontual} icon={Ticket} />}
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

      <section className="page-section" style={{ marginTop: "15px" }}>
        <div className="chart-row chart-row-2">
          <div>
            <h2 className="section-title" style={{ marginBottom: "15px" }}>Receitas totais</h2>
            <EntradasSummaryTable
              rows={[
                { label: "Receitas Recorrentes", value: recorrentes, color: "var(--chart-caixa)" },
                { label: "Receitas Pontuais", value: pontuais, color: "var(--chart-receita)" },
                { label: "Outros", value: outros, color: "var(--chart-saldo)" },
              ]}
              total={totalEntradas}
            />
          </div>

          <div>
            <h2 className="section-title" style={{ marginBottom: "16px" }}>Despesas totais</h2>
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
            <ProportionDonut
              data={[
                { name: "Recorrentes", value: recorrentes, color: "var(--chart-caixa)" },
                { name: "Pontuais", value: pontuais, color: "var(--chart-receita)" },
                { name: "Outros", value: outros, color: "var(--chart-saldo)" },
              ]}
            />
          </div>

          <div className="chart-row-item">
            <h3 className="subsection-title">Despesas por categoria</h3>
            <ProportionDonut data={despesasDonut} />
          </div>
        </div>
      </section>

      <section className="page-section">
        <h2 className="section-title">Top 10 gastos por categoria</h2>
        <HorizontalBarChart data={top10Chart} />
      </section>

      <p className="pending-notice">
        Conteúdo definitivo da Home ainda não fechado com o usuário — este é um
        primeiro recorte no padrão visual dos relatórios mensais da Lucri
        (pílulas, barras, donuts). Ver README.md da pasta{" "}
        <code>10.DASH LUCRI</code> para o que falta decidir.
      </p>
    </div>
  );
}
