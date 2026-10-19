import { Link } from "react-router-dom";
import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";

// Tom → ícone (a cor vai só no ícone; o texto fica na cor normal — regra do
// Design System: laranja nunca em texto corrido). Os itens já chegam em ordem
// (crítico → atenção → organização → positivo, ver src/data/homeInsights.js).
const ICONE = {
  bad: WarningCircle,
  warning: Warning,
  info: Info,
  good: CheckCircle,
};

export default function InsightsCard({ items, periodLabel }) {
  return (
    <section className="home-card" aria-labelledby="home-insights-titulo">
      <header className="home-card-head">
        <h2 className="section-title" id="home-insights-titulo">
          Precisa da sua atenção
        </h2>
        {periodLabel && <span className="home-card-period">{periodLabel}</span>}
      </header>
      {items.length ? (
        <ul className="home-insights">
          {items.map((it) => {
            const Icone = ICONE[it.tone];
            return (
              <li key={it.id} className={`home-insight tone-${it.tone}`}>
                <Icone
                  size={20}
                  weight="fill"
                  className={`home-insight-icon tone-${it.tone}`}
                  aria-hidden="true"
                />
                <div>
                  <span className="home-insight-rotulo">{it.rotulo}</span>
                  <p className="home-insight-texto">{it.text}</p>
                  {it.link && (
                    <Link to={it.link.to} className="pending-notice-link">
                      {it.link.label} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="section-empty">
          Sem dados suficientes no período pra gerar alertas.
        </p>
      )}
    </section>
  );
}
