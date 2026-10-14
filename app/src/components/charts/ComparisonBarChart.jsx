import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { GRID_PROPS, TICK, mesCurto, numberFmt } from "./chartUtils";
import "./charts.css";

// Comparativo pareado (ex: Receitas x Despesas), duas séries por mês —
// mesmo padrão do slide "Receitas x Despesas". Legenda própria, em cima e na
// MESMA ordem das séries (a do Recharts reordenava: "Despesas · Receitas").
export default function ComparisonBarChart({ data, series }) {
  return (
    <div className="chart-block">
      <div className="chart-legend-row">
        {series.map((s) => (
          <span className="chart-legend-single" key={s.dataKey}>
            <span className="chart-legend-dot" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barCategoryGap="18%" barGap={3}>
          <CartesianGrid vertical={false} {...GRID_PROPS} />
          <XAxis dataKey="month" tick={TICK} tickFormatter={mesCurto} interval={0} axisLine={{ stroke: "var(--border-subtle)" }} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => numberFmt.format(v)} width={84} />
          <Tooltip cursor={{ fill: "var(--bg-subtle)" }} allowEscapeViewBox={{ x: true, y: true }} content={<ChartTooltip formatter={(v) => numberFmt.format(v)} />} />
          {series.map((s) => (
            <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
