import { Link } from "react-router-dom";
import { CheckCircle, Info, Warning, WarningCircle } from "@phosphor-icons/react";

// Tom → ícone (a cor vai só no ícone; o texto fica na cor normal, regra do
// Design System: laranja nunca em texto corrido).
const ICONE = { bad: WarningCircle, warning: Warning, info: Info, good: CheckCircle };
const ROTULO = { bad: "Crítico", warning: "Atenção", info: "Informação", good: "Tudo certo" };

export default function InsightsCard({ items, periodLabel }) {
  return (
    <section className="home-card" aria-labelledby="home-insights-titulo">
      <header className="home-card-head">
        <h2 className="section-title" id="home-insights-titulo">Alertas e insights</h2>
        {periodLabel && <span className="home-card-period">{periodLabel}</span>}
      </header>
      {items.length ? (
        <ul className="home-insights">
          {items.map((it) => {
            const Icone = ICONE[it.tone];
            return (
              <li key={it.id}>
                <Icone size={18} weight="fill" className={`home-insight-icon tone-${it.tone}`} aria-label={ROTULO[it.tone]} />
                <span>
                  {it.text}
                  {it.link && (
                    <>
                      {" "}
                      <Link to={it.link.to} className="pending-notice-link">{it.link.label} →</Link>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="section-empty">Sem dados suficientes no período pra gerar alertas.</p>
      )}
    </section>
  );
}
