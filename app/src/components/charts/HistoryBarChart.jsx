import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { numberFmt } from "./chartUtils";
import "./charts.css";

// Rótulo fora da barra, acima quando positivo e abaixo quando negativo — pra
// gráficos que podem ter os dois lados (ex: Resultado/lucro-prejuízo) o
// rótulo nunca fica colado na linha do zero, o que ficava confuso pra
// valores pequenos perto dela. Pra gráficos só-positivos (ex: Vencidas por
// mês) o efeito é só "rótulo acima da barra" em vez de dentro dela.
function BarValueLabel({ x, y, width, height, value }) {
  const labelY = value < 0 ? y + height + 14 : y - 8;
  return (
    <text x={x + width / 2} y={labelY} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontWeight={700}>
      {numberFmt.format(value)}
    </text>
  );
}

// Canto arredondado sempre na PONTA do dado, nunca na base — pra barra
// negativa (ex: Resultado indo pro vermelho) a ponta fica embaixo, longe do
// zero, então é embaixo que precisa arredondar (o Recharts não faz isso
// sozinho: `radius` do <Bar> arredonda sempre o topo do retângulo).
function RoundedBar({ x, y, width, height, value, fill, radius = 4 }) {
  const r = Math.max(0, Math.min(radius, height, width / 2));
  const d =
    value < 0
      ? `M${x},${y} L${x + width},${y} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x + r},${y + height} Q${x},${y + height} ${x},${y + height - r} Z`
      : `M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} L${x},${y + height} Z`;
  return <path d={d} fill={fill} />;
}

// Barras históricas de um único indicador, valor sempre visível em cima da
// barra — mesmo padrão do slide "Receitas de Vendas Mensais / Histórico".
export default function HistoryBarChart({ data, dataKey, color, label, colorBySign = false }) {
  return (
    <div className="chart-block">
      {label && (
        <div className="chart-legend-single">
          <span className="chart-legend-dot" style={{ background: color }} />
          {label}
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 24, right: 8, left: 4, bottom: 8 }}>
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
          <Tooltip allowEscapeViewBox={{ x: true, y: true }} formatter={(v) => numberFmt.format(v)} contentStyle={{ borderRadius: 8, borderColor: "var(--border-subtle)", background: "var(--bg-panel)", color: "var(--text-primary)" }} />
          <Bar dataKey={dataKey} fill={color} shape={(props) => <RoundedBar {...props} radius={4} />} maxBarSize={40}>
            {colorBySign &&
              data.map((d, i) => (
                <Cell key={i} fill={d[dataKey] < 0 ? "var(--chart-despesa)" : "var(--chart-caixa)"} />
              ))}
            <LabelList dataKey={dataKey} content={BarValueLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
