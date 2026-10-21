import { useDre } from "../hooks/useDre";
import { useActiveClient } from "../context/ClientContext";
import { formatRange } from "../data/period";
import { netRevenue, dreMargin, dreReading } from "../data/dreComparison";
import FinanceDataState from "../components/FinanceDataState";
import DreComparisonTable from "../components/DreComparisonTable";
import "../styles/page.css";
import "./DrePage.css";

const money = (value) => value == null ? "—" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const percent = (value) => value == null ? "—" : `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const difference = (current, previous, unit) => current != null && previous != null ? `${current - previous >= 0 ? "+ " : "− "}${unit === "pp" ? `${Math.abs(current - previous).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} p.p.` : money(Math.abs(current - previous))} em relação ao período anterior` : null;

export default function DrePage() {
  const data = useDre();
  const { activeClientId } = useActiveClient();
  if (data.loading || data.error || data.awaitingClient) return <FinanceDataState title="DRE comparativo" loading={data.loading} error={data.error} retry={data.retry} awaitingClient={data.awaitingClient} />;
  const { dre, previousDre, range, comparisonRange, comparisonLoading, comparisonError, retry } = data;
  const revenue = netRevenue(dre), previousRevenue = netRevenue(previousDre);
  const margin = dreMargin(dre.resultado_final, revenue), previousMargin = dreMargin(previousDre?.resultado_final, previousRevenue);
  const reading = dreReading(dre, previousDre);
  const beforeLabel = comparisonRange ? formatRange(comparisonRange) : null;
  return <div className="page dre-page">
    <header className="dre-heading"><div><h1 className="page-title">DRE comparativo</h1><p className="page-description">Entenda o resultado e o que mudou entre os períodos.</p><p className="dre-periods">{formatRange(range)}{beforeLabel && ` comparado a ${beforeLabel}`}</p></div><span className="dre-source">Estrutura do Conta Azul</span></header>
    {!comparisonRange && <p className="pending-notice">Selecione um período com início e fim para comparar os resultados.</p>}
    {comparisonLoading && <p className="section-empty" role="status">Carregando comparação do período anterior…</p>}
    {comparisonError && <div className="pending-notice" role="alert">Não foi possível consultar o período anterior. Os valores atuais continuam disponíveis; a comparação está indisponível. <button type="button" className="dre-button" onClick={retry}>Tentar novamente</button></div>}
    <div className="dre-metrics">
      <Metric label="Receita líquida" value={money(revenue)} context={revenue == null ? "Subtotal não identificado na estrutura do Conta Azul" : difference(revenue, previousRevenue) || "No período selecionado"} />
      <Metric label="Resultado do período" value={money(dre.resultado_final)} context={difference(dre.resultado_final, previousDre?.resultado_final) || "Resultado final do DRE"} />
      <Metric label="Margem do resultado" value={percent(margin)} context={margin == null ? "Sem receita líquida positiva para calcular a margem" : difference(margin, previousMargin, "pp") || "Resultado final ÷ receita líquida"} />
    </div>
    <DreComparisonTable key={`${activeClientId}-${range.start}-${range.end}`} dre={dre} previousDre={previousDre} revenue={revenue} currentLabel={formatRange(range)} previousLabel={beforeLabel} />
    <section className="dre-panel dre-reading" aria-labelledby="dre-reading-title">
      <header className="dre-panel-head"><h2 id="dre-reading-title">Leitura da Lucri</h2><span className="dre-source">Resumo automático</span></header>
      <div className="dre-reading-body"><p>{reading.text}</p><p><strong>Ponto de atenção</strong> {reading.attention}</p></div>
      <footer>Leitura calculada a partir dos dados do DRE. A estrutura segue a configuração da empresa no Conta Azul. Base: valores pagos dos títulos com vencimento no período; pode diferir do resultado gerencial da visão geral.</footer>
    </section>
  </div>;
}
function Metric({ label, value, context }) {
  return <section className="dre-metric" aria-label={label}><span>{label}</span><strong>{value}</strong><p>{context}</p></section>;
}
