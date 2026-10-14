import { Link } from "react-router-dom";
import { ArrowCircleDown, ArrowCircleUp, ChartBar, ChartPieSlice, HandCoins, Percent, TrendDown, TrendUp, Wallet } from "@phosphor-icons/react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useHistoricoMensal } from "../hooks/useHistoricoMensal";
import { sumValores, groupByCategoria, CATEGORY_PALETTE, DESPESA_PALETTE, computeDelta } from "../data/mockFinance";
import { useActiveClient } from "../context/ClientContext";
import { useHomeCardPrefs } from "../hooks/useHomeCardPrefs";
import StatCard from "../components/StatCard";
import EntradasSummaryTable from "../components/EntradasSummaryTable";
import HistoryBarChart from "../components/charts/HistoryBarChart";
import ComparisonBarChart from "../components/charts/ComparisonBarChart";
import ProportionDonut from "../components/charts/ProportionDonut";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import ProgressBar from "../components/charts/ProgressBar";
import FinancialHealthCard from "../components/home/FinancialHealthCard";
import InsightsCard from "../components/home/InsightsCard";
import EmptyMetricState from "../components/home/EmptyMetricState";
import { calcularSaude } from "../data/financialHealth";
import { gerarInsights } from "../data/homeInsights";
import "../styles/page.css";
import "./HomePage.css";

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
// (as duas já são dado real, ver API-CONTRACT.md). N real nunca passa do
// tamanho da paleta: com mais categorias que cores, repetir cor faria duas
// categorias diferentes parecerem a mesma (ver skill de dataviz) — melhor
// dobrar o excedente em "Outros" um pouco mais cedo.
function topCategorias(porCategoria, n = 10, palette = CATEGORY_PALETTE) {
  const limite = Math.min(n, palette.length);
  const top = porCategoria.slice(0, limite);
  const resto = porCategoria.slice(limite);
  const restoValor = sumValores(resto.map((d) => ({ valor: d.valor })));
  return [
    ...top.map((d, i) => ({ categoria: d.categoria, valor: d.valor, color: palette[i % palette.length] })),
    ...(resto.length ? [{ categoria: "Outros", valor: restoValor, color: "var(--text-secondary)" }] : []),
  ];
}

// Rótulo do período escolhido no topo, pros cabeçalhos dos cards.
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function rotuloPeriodo({ start, end }) {
  if (!start || !end) return "Todos os dados";
  const [ai, mi, di] = start.split("-").map(Number);
  const [af, mf, df] = end.split("-").map(Number);
  const ultimoDia = new Date(af, mf, 0).getDate();
  if (ai === af && mi === mf && di === 1 && (df === ultimoDia || end >= new Date().toISOString().slice(0, 10))) {
    const m = MESES[mi - 1];
    return `${m[0].toUpperCase()}${m.slice(1)} de ${ai}`;
  }
  const br = (d, m, a) => `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
  return `${br(di, mi, ai)} – ${br(df, mf, af)}`;
}

// Delta do Resultado: a base pode ser negativa (prejuízo), então divide pelo
// valor absoluto — computeDelta dividiria por negativo e inverteria o sinal.
function deltaResultado(atual, anterior) {
  if (!anterior) return null;
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  return { pct, direction: pct >= 0 ? "up" : "down" };
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
    .map((b, i) => ({ categoria: b.label, valor: b.valor, color: DESPESA_PALETTE[i] }));
}

export default function HomePage() {
  const { home, entradas, despesas, previousHome, previousEntradas, previousDespesas, loading, error, range } = useFinanceData();
  const historico = useHistoricoMensal();
  const { activeClientId } = useActiveClient();
  const { isVisible } = useHomeCardPrefs(activeClientId);

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">Home Financeira</h1>
        <div className="skeleton-row">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <h1 className="page-title">Home Financeira</h1>
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
  // totais.pago.valor (o que realmente entrou), não totais.todos.
  // Receitas = Entradas pagas; Despesas = despesas das categorias marcadas em
  // Ajustes (mesma definição do /historico-mensal, que calcula o Resultado
  // histórico) — Resultado do mês = Receitas − Despesas, igual ao gráfico.
  const totalEntradas = entradas?.totais?.pago?.valor ?? 0;
  const totalDespesas = sumValores(despesas);
  const resultado = totalEntradas - totalDespesas;

  // Contas a receber/pagar do período (totais agregados da /home).
  const contasAReceber = home.contas_a_receber;
  const contasAPagar = home.contas_a_pagar;
  // "Contas vencidas" = só o que JÁ venceu e não foi recebido (decisão do
  // usuário, 14/10/2026 — antes somava todo o em aberto, inclusive a vencer).
  const contasVencidas = contasAReceber.vencido.valor;
  const aReceberEmAberto = Math.max(contasAReceber.todos - contasAReceber.pago.valor, 0);
  const inadimplenciaPct = contasAReceber.todos > 0 ? (contasVencidas / contasAReceber.todos) * 100 : 0;

  // Delta "vs. período anterior" — só quando o hook trouxe o período
  // anterior comparável (null no preset "Todos os dados"). Saldo (foto de
  // agora) e Inadimplência (já é %) ficam sem delta.
  const prevEntradas = previousEntradas ? previousEntradas.totais.pago.valor : null;
  const prevDespesas = previousEntradas ? sumValores(previousDespesas) : null;
  const deltaEntradas = previousEntradas ? computeDelta(totalEntradas, prevEntradas) : null;
  const deltaDespesas = previousEntradas ? computeDelta(totalDespesas, prevDespesas) : null;
  const deltaRes = previousEntradas ? deltaResultado(resultado, prevEntradas - prevDespesas) : null;
  const deltaVencidas = previousHome ? computeDelta(contasVencidas, previousHome.contas_a_receber.vencido.valor) : null;

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
  // Agrupa pela categoria master escolhida em Ajustes → Categorias de
  // Receita (`mae_exibicao`, "Sem mãe" se ainda não classificada); ao abrir,
  // as categorias originais do Conta Azul. Sem `mae_exibicao` (backend
  // antigo) cai na categoria original, igual era antes.
  const receitasLanc = (entradas?.lancamentos ?? []).map((l) => ({
    ...l,
    valor: l.valor_pago,
    subcategoria: l.categoria,
    categoria: l.mae_exibicao ?? l.categoria,
  }));
  const receitasPorCategoria = reconciliarComTotal(groupByCategoria(receitasLanc), totalEntradas);
  const receitasChart = topCategorias(receitasPorCategoria);
  // Mesmo fator do reconciliarComTotal, pra soma das filhas bater com a mãe.
  const somaBrutaReceitas = sumValores(receitasLanc);
  const fatorReceitas = somaBrutaReceitas ? totalEntradas / somaBrutaReceitas : 1;
  const receitasPorMae = new Map();
  for (const l of receitasLanc) {
    const filhas = receitasPorMae.get(l.categoria) ?? new Map();
    const nome = l.subcategoria ?? "Sem categoria";
    filhas.set(nome, (filhas.get(nome) ?? 0) + l.valor * fatorReceitas);
    receitasPorMae.set(l.categoria, filhas);
  }
  const totalReceitasSemMae = sumValores(receitasLanc.filter((l) => "mae" in l && !l.mae)) * fatorReceitas;
  const receitasTabela = receitasChart.map((d) => ({
    label: d.categoria,
    value: d.valor,
    color: d.color,
    children: [...(receitasPorMae.get(d.categoria) ?? [])]
      .map(([label, value]) => ({ label, value }))
      .filter((filho, _, todos) => !(todos.length === 1 && filho.label === d.categoria))
      .sort((a, b) => b.value - a.value),
  }));

  // Despesas por categoria: dado real, filtrado pelas categorias marcadas
  // em Ajustes → Categorias de Despesa (ver API-CONTRACT.md /despesas).
  const despesasPorCategoria = groupByCategoria(despesas);
  const despesasChart = topCategorias(despesasPorCategoria, 10, DESPESA_PALETTE);
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

  // Home: resumos (top 5 + "Outros"); as tabelas completas ficam em "Mais detalhes".
  const receitasDonut = topCategorias(receitasPorCategoria, 5);
  const despesasDonut = topCategorias(despesasPorCategoria, 5, DESPESA_PALETTE);
  const topGastos = despesasPorCategoria.slice(0, 5).map((d, i) => ({ ...d, color: DESPESA_PALETTE[i % DESPESA_PALETTE.length] }));

  const periodo = rotuloPeriodo(range);
  const saude = calcularSaude({ receitas: totalEntradas, despesas: totalDespesas, saldo: saldoTotal, inadimplenciaPct, vencidas: contasVencidas, aReceberEmAberto });
  const insights = gerarInsights({
    receitas: totalEntradas,
    despesas: totalDespesas,
    saldo: saldoTotal,
    vencidas: contasVencidas,
    inadimplenciaPct,
    despesasPorCategoria,
    semMae: totalSemMae + totalReceitasSemMae,
  });

  // Histórico mensal (Receitas x Despesas, Resultado, Vencidas): 1 fetch só
  // (useHistoricoMensal), reaproveitado nos 3 gráficos abaixo.
  const monthlyHistory = historico.map((m) => ({ month: m.label, receitas: m.receitas, despesas: m.despesas }));
  const resultadoHistorico = historico.map((m) => ({ month: m.label, resultado: m.resultado }));
  const overdueHistory = historico.map((m) => ({ month: m.label, valor: m.vencidas }));
  const temHistorico = historico.some((m) => m.receitas || m.despesas);
  const temVencidasHist = historico.some((m) => m.vencidas);

  return (
    <div className="page home">
      <header className="home-head">
        <h1 className="page-title">Home Financeira</h1>
        <p className="home-sub">Visão consolidada do caixa, desempenho e saúde financeira da empresa.</p>
      </header>

      {/* 1. O que está acontecendo agora? */}
      <div className="home-kpis">
        {isVisible("saldoConta") && (
          <StatCard label="Saldo em conta" value={saldoTotal} icon={Wallet} breakdown={saldoPorConta} tone={saldoTotal < 0 ? "negative" : "neutral"} />
        )}
        {isVisible("resultado") && (
          <StatCard
            label="Resultado do mês"
            value={resultado}
            icon={resultado < 0 ? TrendDown : TrendUp}
            delta={deltaRes}
            tone={resultado < 0 ? "negative" : "positive"}
            highlight
          />
        )}
        {isVisible("entradas") && <StatCard label="Receitas" value={totalEntradas} icon={ArrowCircleDown} delta={deltaEntradas} />}
        {isVisible("despesas") && <StatCard label="Despesas" value={totalDespesas} icon={ArrowCircleUp} delta={deltaDespesas} invertDeltaColor />}
        {isVisible("contasVencidas") && (
          <StatCard label="Contas vencidas" value={contasVencidas} icon={HandCoins} delta={deltaVencidas} invertDeltaColor tone={contasVencidas > 0 ? "negative" : "neutral"} />
        )}
        {isVisible("inadimplencia") && (
          <StatCard
            label="Inadimplência do mês"
            value={`${inadimplenciaPct.toFixed(1).replace(".", ",")}%`}
            format="count"
            tone={inadimplenciaPct > 0 ? "negative" : "neutral"}
            icon={Percent}
          />
        )}
      </div>

      {/* 2. Está saudável? 3. O operacional está em dia? */}
      <div className="home-faixa-saude">
        <FinancialHealthCard
          score={saude.score}
          status={saude.status}
          tone={saude.tone}
          summary={saude.summary}
          periodLabel={periodo}
          metrics={[
            { label: "Receitas", value: totalEntradas },
            { label: "Despesas", value: totalDespesas },
            { label: "Resultado", value: resultado },
            { label: "Saldo em conta", value: saldoTotal },
          ]}
        />
        <section className="home-card" aria-labelledby="home-pagar">
          <header className="home-card-head">
            <h2 className="section-title" id="home-pagar">Contas a pagar — andamento</h2>
            <span className="home-card-period">{periodo}</span>
          </header>
          <ProgressBar pago={contasAPagar.pago.valor} vencido={contasAPagar.vencido.valor} total={contasAPagar.todos} color="var(--chart-caixa)" pagoLabel="Pago" />
        </section>
        <section className="home-card" aria-labelledby="home-receber">
          <header className="home-card-head">
            <h2 className="section-title" id="home-receber">Contas a receber — andamento</h2>
            <span className="home-card-period">{periodo}</span>
          </header>
          <ProgressBar pago={contasAReceber.pago.valor} vencido={contasAReceber.vencido.valor} total={contasAReceber.todos} color="var(--chart-receita)" pagoLabel="Recebido" />
        </section>
      </div>

      {/* 4. Como vem performando? (últimos 12 meses, independe do período) */}
      <div className="home-par">
        <section className="home-card" aria-labelledby="home-hist">
          <header className="home-card-head">
            <h2 className="section-title" id="home-hist">Receitas x Despesas — Histórico mensal</h2>
            <span className="home-card-period">Últimos 12 meses</span>
          </header>
          {temHistorico ? (
            <ComparisonBarChart
              data={monthlyHistory}
              series={[
                { dataKey: "receitas", name: "Receitas", color: "var(--chart-receita)" },
                { dataKey: "despesas", name: "Despesas", color: "var(--chart-despesa)" },
              ]}
            />
          ) : (
            <EmptyMetricState icon={ChartBar} message="Ainda sem receitas ou despesas nos últimos 12 meses." />
          )}
        </section>
        <section className="home-card" aria-labelledby="home-res">
          <header className="home-card-head">
            <h2 className="section-title" id="home-res">Resultado histórico (lucro/prejuízo)</h2>
            <span className="home-card-period">Últimos 12 meses</span>
          </header>
          {temHistorico ? (
            <HistoryBarChart data={resultadoHistorico} dataKey="resultado" color="var(--chart-caixa)" label="Resultado" colorBySign />
          ) : (
            <EmptyMetricState icon={ChartBar} message="Ainda sem resultado pra mostrar nos últimos 12 meses." />
          )}
        </section>
      </div>

      {/* 5. Para onde vai o dinheiro? */}
      <div className="home-par">
        <section className="home-card" aria-labelledby="home-cat-rec">
          <header className="home-card-head">
            <h2 className="section-title" id="home-cat-rec">Principais receitas por categoria</h2>
            <span className="home-card-period">{periodo}</span>
          </header>
          {receitasDonut.length ? (
            <ProportionDonut data={receitasDonut.map((d) => ({ name: d.categoria, value: d.valor, color: d.color }))} />
          ) : (
            <EmptyMetricState icon={ChartPieSlice} message="Nenhuma receita no período selecionado." />
          )}
        </section>
        <section className="home-card" aria-labelledby="home-cat-desp">
          <header className="home-card-head">
            <h2 className="section-title" id="home-cat-desp">Principais despesas por categoria</h2>
            <span className="home-card-period">{periodo}</span>
          </header>
          {despesasDonut.length ? (
            <ProportionDonut data={despesasDonut.map((d) => ({ name: d.categoria, value: d.valor, color: d.color }))} />
          ) : (
            <EmptyMetricState
              icon={ChartPieSlice}
              message="Nenhuma despesa no período (ou nenhuma categoria de despesa marcada)."
              action={<Link to="/ajustes" className="pending-notice-link">Ver categorias em Ajustes →</Link>}
            />
          )}
        </section>
      </div>

      {/* 6. O que merece atenção? */}
      <div className="home-par">
        <section className="home-card" aria-labelledby="home-top">
          <header className="home-card-head">
            <h2 className="section-title" id="home-top">Top gastos do mês</h2>
            <span className="home-card-period">{periodo}</span>
          </header>
          {topGastos.length ? (
            <HorizontalBarChart data={topGastos} height={Math.max(180, topGastos.length * 40)} />
          ) : (
            <EmptyMetricState icon={ChartBar} message="Nenhum gasto no período selecionado." />
          )}
        </section>
        <InsightsCard items={insights} periodLabel={periodo} />
      </div>

      {/* Tudo que a Home tinha antes e não está nos blocos acima — nada se perde. */}
      <details className="home-detalhes">
        <summary>Mais detalhes</summary>
        <div className="home-detalhes-corpo">
          <div className="chart-row chart-row-2">
            <section className="page-section">
              <h2 className="section-title">Receitas por categoria</h2>
              {totalReceitasSemMae > 0 && (
                <p className="pending-notice">
                  {fmtBRL.format(totalReceitasSemMae)} em receitas ainda sem mãe.
                  <span className="pending-notice-actions">
                    <Link to="/ajustes" className="pending-notice-link">Classificar em Ajustes →</Link>
                  </span>
                </p>
              )}
              <EntradasSummaryTable rows={receitasTabela} total={totalEntradas} />
            </section>
            <section className="page-section">
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
            </section>
          </div>

          <section className="page-section">
            <h2 className="section-title">Contas a receber vencidas por mês</h2>
            {temVencidasHist ? (
              <HistoryBarChart data={overdueHistory} dataKey="valor" color="var(--chart-despesa)" label="Vencidas" />
            ) : (
              <p className="section-empty">Nenhuma conta a receber vencida nos últimos 12 meses.</p>
            )}
          </section>

          <section className="page-section">
            <h2 className="section-title">Inadimplência por faixa de atraso (Ageing)</h2>
            {ageingChart.length > 0 ? (
              <HorizontalBarChart data={ageingChart} height={Math.max(160, ageingChart.length * 48)} />
            ) : (
              <p className="section-empty">Nenhuma conta vencida no período selecionado.</p>
            )}
          </section>
        </div>
      </details>
    </div>
  );
}
