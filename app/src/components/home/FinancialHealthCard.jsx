import { FATORES, FAIXAS, PESOS } from "../../data/financialHealth";

export default function FinancialHealthCard({ score, status, tone, headline, summary, partes, periodLabel }) {
  const r = 52;
  const volta = 2 * Math.PI * r;
  const temNota = Number.isFinite(score);
  return (
    <section className="home-card home-saude" aria-labelledby="home-saude-titulo">
      <header className="home-card-head">
        <h2 className="section-title" id="home-saude-titulo">Saúde financeira</h2>
        {periodLabel && <span className="home-card-period">{periodLabel}</span>}
      </header>
      <p className="home-saude-resumo">Indicador gerencial Lucri</p>
      <div className="home-saude-corpo">
        {temNota && (
          <div className="home-saude-anel" role="img" aria-label={`Saúde financeira: ${score} de 100, ${status}`}>
            <svg viewBox="0 0 120 120" width="132" height="132" aria-hidden="true">
              <circle cx="60" cy="60" r={r} className="home-saude-trilho" />
              <circle cx="60" cy="60" r={r} className={`home-saude-arco tone-${tone}`} strokeDasharray={volta} strokeDashoffset={volta * (1 - score / 100)} transform="rotate(-90 60 60)" />
            </svg>
            <div className="home-saude-nota">
              <strong>{score}</strong><span>/100</span>
              <em className="home-saude-status">{status}</em>
            </div>
          </div>
        )}
        <div className="home-saude-texto">
          <p className="home-saude-headline">{headline}</p>
          <p className="home-saude-resumo">{summary}</p>
        </div>
      </div>
      <details className="home-saude-calculo">
        <summary>Como calculamos</summary>
        <p>A nota combina o desempenho no período selecionado com o saldo disponível hoje. Aumentar ou reduzir o intervalo pode mudar a nota, mesmo com o mesmo saldo. Os dois fatores de recebimentos usam bases diferentes e somam 40% do peso.</p>
        <p>É necessário haver ao menos uma receita ou despesa no período e valores válidos para todos os fatores. Sem essa base, mostramos “Sem dados suficientes”.</p>
        <ul>
          {FATORES.map((fator) => (
            <li key={fator.id}>
              <strong>{fator.label} · {Math.round(PESOS[fator.id] * 100)}%</strong>
              <p>{fator.regra}</p>
              {partes && <p>Nota do fator: {partes[fator.id].toLocaleString("pt-BR", { maximumFractionDigits: 1 })}/100.</p>}
            </li>
          ))}
        </ul>
        <p>Nota final: soma das notas dos fatores multiplicadas pelos respectivos pesos, arredondada para o inteiro mais próximo.</p>
        <p>Faixas: {FAIXAS.map((faixa, index) => `${faixa.status}: ${faixa.min}–${index === 0 ? 100 : FAIXAS[index - 1].min - 1}`).join("; ")}.</p>
      </details>
    </section>
  );
}
