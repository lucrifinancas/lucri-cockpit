import { Info } from "@phosphor-icons/react";

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const AJUDA = "Indicador gerencial calculado a partir dos dados financeiros do período.";

// Componente "assinatura" da Home: nota 0–100 + diagnóstico (frase curta e
// o porquê) + os 4 números que formam a nota numa linha só. Score, status e
// textos chegam prontos (src/data/financialHealth.js) — aqui só exibe.
export default function FinancialHealthCard({ score, status, tone, headline, summary, metrics, periodLabel }) {
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
            <em className="home-saude-status">{status}</em>
          </div>
        </div>
        <div className="home-saude-texto">
          <p className="home-saude-headline">{headline}</p>
          <p className="home-saude-resumo">{summary}</p>
          <ul className="home-saude-fatores" aria-label="Números do período">
            {metrics.map((m) => (
              <li key={m.label}>
                <span>{m.label}</span> <strong className={m.value < 0 ? "tone-negative" : undefined}>{compacto.format(m.value)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
