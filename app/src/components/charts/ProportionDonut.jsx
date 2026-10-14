import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { currencyFmt } from "./chartUtils";
import "./charts.css";

const OUTER_RADIUS = 64;
const INNER_RADIUS = 46;
const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const pctFmt = (v) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

// Rosca de apoio (pequena) + lista que é o foco: categoria → % → valor.
// A Home manda no máximo 4 categorias + "Outros".
export default function ProportionDonut({ data }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="chart-block chart-block-donut">
      <div className="chart-donut-wrap">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={INNER_RADIUS} outerRadius={OUTER_RADIUS} paddingAngle={2} stroke="var(--bg-panel)">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip allowEscapeViewBox={{ x: true, y: true }} content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-donut-center">
          <span className="chart-donut-center-label">Total</span>
          <span className="chart-donut-center-value" title={currencyFmt.format(total)}>{compacto.format(total)}</span>
        </div>
      </div>
      <ul className="donut-lista">
        {data.map((d) => (
          <li key={d.name}>
            <span className="chart-legend-dot" style={{ background: d.color }} />
            <span className="donut-lista-nome">{d.name}</span>
            <span className="donut-lista-pct">{pctFmt(total ? (d.value / total) * 100 : 0)}</span>
            <span className="donut-lista-valor">{currencyFmt.format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
