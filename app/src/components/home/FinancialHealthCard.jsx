import { Info } from "@phosphor-icons/react";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const AJUDA = "Indicador gerencial calculado a partir dos dados financeiros do período.";

// Anel de 0 a 100 + resumo + 4 números de apoio. Score, status e resumo
// chegam prontos (src/data/financialHealth.js) — aqui só exibe.
export default function FinancialHealthCard({ score, status, tone, summary, metrics, periodLabel }) {
  const r = 52;
  const volta = 2 * Math.PI * r;
  return (
    <section className="home-card home-saude" aria-labelledby="home-saude-titulo">
      <header className="home-card-head">
        <h2 className="section-title" id="home-saude-titulo">
          Saúde Financeira
          <span className="home-info" title={AJUDA} aria-label={AJUDA} tabIndex={0}>
            <Info size={15} weight="regular" />
          </span>
        </h2>
        {periodLabel && <span className="home-card-period">{periodLabel}</span>}
      </header>
      <div className="home-saude-corpo">
        <div className="home-saude-anel" role="img" aria-label={`Saúde financeira: ${score} de 100, ${status}`}>
          <svg viewBox="0 0 120 120" width="132" height="132" aria-hidden="true">
            <circle cx="60" cy="60" r={r} className="home-saude-trilho" />
            <circle
              cx="60"
              cy="60"
              r={r}
              className={`home-saude-arco tone-${tone}`}
              strokeDasharray={volta}
              strokeDashoffset={volta * (1 - score / 100)}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="home-saude-nota">
            <strong>{score}</strong>
            <span>/100</span>
            <em className={`home-saude-status tone-${tone}`}>{status}</em>
          </div>
        </div>
        <div className="home-saude-texto">
          <p className="home-saude-resumo">{summary}</p>
          <dl className="home-saude-metricas">
            {metrics.map((m) => (
              <div key={m.label}>
                <dt>{m.label}</dt>
                <dd className={m.value < 0 ? "tone-negative" : undefined}>{fmt.format(m.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="home-saude-nota-rodape">{AJUDA}</p>
        </div>
      </div>
    </section>
  );
}
