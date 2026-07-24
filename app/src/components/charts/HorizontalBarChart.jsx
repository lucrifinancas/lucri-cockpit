import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currencyFmt, numberFmt } from "./chartUtils";
import "./charts.css";

// Ranking horizontal (ex: Top 10 gastos por categoria), uma barra por
// categoria, cor por item via `data[].color` (opcional — usa `color`
// default se não vier por item).
export default function HorizontalBarChart({ data, dataKey = "valor", nameKey = "categoria", color = "var(--chart-despesa)", height }) {
  return (
    <div className="chart-block">
      <ResponsiveContainer width="100%" height={height ?? Math.max(240, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--border-subtle)" />
          <XAxis
            type="number"
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => numberFmt.format(v)}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border-subtle)" }}
            tickLine={false}
            width={130}
          />
          <Tooltip formatter={(v) => currencyFmt.format(v)} contentStyle={{ borderRadius: 8, borderColor: "var(--border-subtle)", background: "var(--bg-panel)", color: "var(--text-primary)" }} />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d, i) => (
              <Cell key={d[nameKey] ?? i} fill={d.color ?? color} />
            ))}
            <LabelList
              dataKey={dataKey}
              position="right"
              formatter={(v) => currencyFmt.format(v)}
              style={{ fill: "var(--text-primary)", fontSize: 11, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
