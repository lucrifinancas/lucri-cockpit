import "./StatCard.css";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Minimalista de propósito: número sempre em tinta neutra (navy), cor só
// como um pingo de status — evita o efeito "salada de frutas" de pílula
// colorida em todo card. Ver skill de dataviz: texto usa token de texto,
// nunca a cor da série.
// `highlight`: fundo de superfície alternada (Design System: destaque por
// troca de superfície, nunca sombra) — usado no "Resultado do mês" da Home.
// `context`: texto da 3ª linha quando não há variação pra mostrar (ex.: "Saldo de hoje"),
// pra todos os cards terem a mesma estrutura rótulo → valor → contexto.
// `delta.unit` = "p.p." pra métricas que já são % (ex.: Inadimplência).
export default function StatCard({ label, value, tone = "neutral", format = "currency", icon: Icon, delta, invertDeltaColor = false, breakdown, highlight = false, context, hideDot = false }) {
  const display = format === "currency" && typeof value === "number" ? fmt.format(value) : value;
  // Sentimento da cor: por padrão "subiu" é bom (verde). Em métricas onde
  // subir é ruim (ex: Saídas), invertDeltaColor inverte só a cor — a seta
  // continua mostrando a direção real do número.
  const sentiment = delta && (invertDeltaColor ? (delta.direction === "up" ? "down" : "up") : delta.direction);
  return (
    <div
      className={`stat-card ${breakdown ? "stat-card-hoverable" : ""} ${highlight ? "stat-card-highlight" : ""}`}
      tabIndex={breakdown ? 0 : undefined}
      aria-describedby={breakdown ? `${label}-breakdown` : undefined}
    >
      <span className="stat-card-label">
        {Icon && <Icon size={16} weight="regular" className="stat-card-icon" />}
        {label}
        {tone !== "neutral" && !hideDot && <span className={`stat-card-dot tone-${tone}`} />}
      </span>
      <span className={`stat-card-value ${tone !== "neutral" ? `tone-${tone}` : ""}`}>{display}</span>
      {delta && Math.abs(delta.pct) < 0.05 && <span className="stat-card-delta delta-flat">▬ Sem variação vs. período anterior</span>}
      {delta && Math.abs(delta.pct) >= 0.05 && (
        <span className={`stat-card-delta delta-${sentiment}`}>
          {delta.direction === "up" ? "▲" : "▼"} {Math.abs(delta.pct).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          {delta.unit ? ` ${delta.unit}` : "%"} vs. período anterior
        </span>
      )}
      {!delta && context && <span className="stat-card-delta delta-flat">{context}</span>}

      {breakdown && (
        <div className="stat-card-tooltip" id={`${label}-breakdown`} role="tooltip">
          {breakdown.map((item) => (
            <div className="stat-card-tooltip-row" key={item.label}>
              <span>{item.label}</span>
              <strong>{fmt.format(item.value)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
