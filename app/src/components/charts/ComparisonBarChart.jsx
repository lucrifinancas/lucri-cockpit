import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { numberFmt } from "./chartUtils";
import "./charts.css";

// Comparativo pareado (ex: Receitas x Despesas), duas séries por mês —
// mesmo padrão do slide "Receitas x Despesas".
export default function ComparisonBarChart({ data, series }) {
  return (
    <div className="chart-block">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="16%" barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border-subtle)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => numberFmt.format(v)}
          />
          <Tooltip formatter={(v) => numberFmt.format(v)} contentStyle={{ borderRadius: 8, borderColor: "var(--border-subtle)", background: "var(--bg-panel)", color: "var(--text-primary)" }} />
          <Legend wrapperStyle={{ fontSize: 13, color: "var(--text-secondary)" }} />
          {series.map((s) => (
            <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
