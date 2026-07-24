import "./StatCard.css";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Minimalista de propósito: número sempre em tinta neutra (navy), cor só
// como um pingo de status — evita o efeito "salada de frutas" de pílula
// colorida em todo card. Ver skill de dataviz: texto usa token de texto,
// nunca a cor da série.
export default function StatCard({ label, value, tone = "neutral", format = "currency", icon: Icon, delta, invertDeltaColor = false, breakdown }) {
  const display = format === "currency" && typeof value === "number" ? fmt.format(value) : value;
  // Sentimento da cor: por padrão "subiu" é bom (verde). Em métricas onde
  // subir é ruim (ex: Saídas), invertDeltaColor inverte só a cor — a seta
  // continua mostrando a direção real do número.
  const sentiment = delta && (invertDeltaColor ? (delta.direction === "up" ? "down" : "up") : delta.direction);
  return (
    <div className={`stat-card ${breakdown ? "stat-card-hoverable" : ""}`}>
      <span className="stat-card-label">
        {Icon && <Icon size={16} weight="regular" className="stat-card-icon" />}
        {label}
        {tone !== "neutral" && <span className={`stat-card-dot tone-${tone}`} />}
      </span>
      <span className={`stat-card-value ${tone !== "neutral" ? `tone-${tone}` : ""}`}>{display}</span>
      {delta && (
        <span className={`stat-card-delta delta-${sentiment}`}>
          {delta.direction === "up" ? "▲" : "▼"} {Math.abs(delta.pct).toFixed(1)}% vs. período anterior
        </span>
      )}

      {breakdown && (
        <div className="stat-card-tooltip">
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
