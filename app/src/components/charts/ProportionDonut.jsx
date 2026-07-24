import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { currencyFmt } from "./chartUtils";
import "./charts.css";

const OUTER_RADIUS = 82;
const INNER_RADIUS = 56;

// Donut de proporção com total centralizado + legenda (nome, valor, %) —
// mesmo padrão dos slides "Receitas no Caixa / análise".
export default function ProportionDonut({ data }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="chart-block chart-block-donut">
      <div className="chart-donut-wrap">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={INNER_RADIUS} outerRadius={OUTER_RADIUS} paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => currencyFmt.format(v)} contentStyle={{ borderRadius: 8, borderColor: "var(--border-subtle)", background: "var(--bg-panel)", color: "var(--text-primary)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-donut-center">
          <span className="chart-donut-center-label">Total</span>
          <span className="chart-donut-center-value">{currencyFmt.format(total)}</span>
          <span className="chart-donut-center-pct">100%</span>
        </div>
      </div>
      <div className="chart-legend">
        {data.map((d) => (
          <span className="chart-legend-item" key={d.name}>
            <span className="chart-legend-dot" style={{ background: d.color }} />
            <span className="chart-legend-text">
              <span className="chart-legend-name">{d.name}</span>
              <span className="chart-legend-detail">
                {((d.value / total) * 100).toFixed(0)}% ({currencyFmt.format(d.value)})
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
