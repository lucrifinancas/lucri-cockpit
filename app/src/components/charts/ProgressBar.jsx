import { currencyFmt } from "./chartUtils";
import "./charts.css";

const pctFmt = (v) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;

// Andamento de contas do período (Home): "59% pago" em destaque, barra em 3
// segmentos (pago · vencido · a vencer) e a legenda com os MESMOS 3 itens,
// mesma cor e mesma ordem — cada pedaço da barra tem a sua linha.
export default function ProgressBar({ pago, vencido = 0, total, color, pagoLabel = "Pago" }) {
  if (!total) return <p className="section-empty">Nada vence no período selecionado.</p>;

  const pct = (v) => Math.min(100, Math.max(0, (v / total) * 100));
  const vencidoReal = Math.min(vencido, Math.max(total - pago, 0));
  const aVencer = Math.max(total - pago - vencidoReal, 0);
  const segmentos = [
    { label: pagoLabel, valor: pago, cor: color, classe: "" },
    { label: "Vencido", valor: vencidoReal, cor: "var(--chart-despesa)", classe: "" },
    { label: "A vencer", valor: aVencer, cor: null, classe: "progress-seg-rest" },
  ];

  return (
    <div className="chart-block progress-v2">
      <p className="progress-headline">
        <strong>{pctFmt(pct(pago))}</strong> {pagoLabel.toLowerCase()}
      </p>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(pct(pago))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pagoLabel}: ${Math.round(pct(pago))}%`}
      >
        {segmentos.map((s) =>
          s.valor > 0 ? (
            <div key={s.label} className={`progress-seg ${s.classe}`} style={{ width: `${pct(s.valor)}%`, background: s.cor ?? undefined }} />
          ) : null,
        )}
      </div>
      <ul className="progress-linhas">
        {segmentos.map((s) => (
          <li key={s.label}>
            <span className={`chart-legend-dot ${s.classe ? "progress-dot-rest" : ""}`} style={s.cor ? { background: s.cor } : undefined} />
            <span className="progress-linha-nome">{s.label}</span>
            <strong>{currencyFmt.format(s.valor)}</strong>
            <span className="progress-linha-pct">{pctFmt(pct(s.valor))}</span>
          </li>
        ))}
        <li className="progress-linha-total">
          <span />
          <span className="progress-linha-nome">Total</span>
          <strong>{currencyFmt.format(total)}</strong>
          <span className="progress-linha-pct">100%</span>
        </li>
      </ul>
    </div>
  );
}
