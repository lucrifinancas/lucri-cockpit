import { currencyFmt } from "./chartUtils";

// Balão do tooltip: título (mês/categoria) + uma linha por série com a cor.
// `corDe(item)` opcional: cor da bolinha quando ela depende do valor (ex.: lucro/prejuízo).
export default function ChartTooltip({ active, payload, label, formatter = (v) => currencyFmt.format(v), corDe }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label != null && <p className="chart-tooltip-title">{label}</p>}
      {payload.map((p) => (
        <p className="chart-tooltip-row" key={p.dataKey ?? p.name}>
          <span className="chart-legend-dot" style={{ background: corDe ? corDe(p) : p.payload?.color ?? p.color ?? p.fill }} />
          <span>{p.name}</span>
          <strong>{formatter(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}
