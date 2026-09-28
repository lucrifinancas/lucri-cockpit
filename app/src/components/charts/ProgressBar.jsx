import { currencyFmt } from "./chartUtils";
import "./charts.css";

// Barra de progresso em pílula (ex: quanto das contas do mês já foi pago)
// — % dentro da parte preenchida, trilho claro pro que falta. `vencido`
// entra como um trecho vermelho logo depois do pago, pra atraso não se
// esconder no "falta".
export default function ProgressBar({ pago, vencido = 0, total, color, pagoLabel = "Pago" }) {
  if (!total) return <p className="section-empty">Nada vence no período selecionado.</p>;

  const pct = (v) => Math.min(100, Math.max(0, (v / total) * 100));
  const pagoPct = pct(pago);
  const vencidoPct = Math.min(pct(vencido), 100 - pagoPct);
  const aVencer = Math.max(total - pago - vencido, 0);

  return (
    <div className="chart-block">
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(pagoPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pagoLabel}: ${Math.round(pagoPct)}%`}
      >
        <div className="progress-fill" style={{ width: `${pagoPct}%`, background: color }}>
          {pagoPct >= 12 && <span className="progress-fill-pct">{Math.round(pagoPct)}%</span>}
        </div>
        {vencidoPct > 0 && <div className="progress-fill progress-fill-late" style={{ width: `${vencidoPct}%` }} />}
      </div>
      {pagoPct < 12 && <p className="progress-pct-outside">{Math.round(pagoPct)}% {pagoLabel.toLowerCase()}</p>}

      <div className="progress-legend">
        <span className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: color }} />
          {pagoLabel} <strong>{currencyFmt.format(pago)}</strong>
        </span>
        {vencido > 0 && (
          <span className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: "var(--chart-despesa)" }} />
            Vencido <strong>{currencyFmt.format(vencido)}</strong>
          </span>
        )}
        <span className="chart-legend-item">
          <span className="chart-legend-dot progress-dot-rest" />
          A vencer <strong>{currencyFmt.format(aVencer)}</strong>
        </span>
      </div>
      <p className="progress-total">Total do período: {currencyFmt.format(total)}</p>
    </div>
  );
}
