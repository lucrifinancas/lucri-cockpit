import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { GRID_PROPS, TICK, currencyFmt, numberFmt } from "./chartUtils";
import "./charts.css";

const LARGURA_NOMES = 220;
const CHARS_POR_LINHA = 28;

// Nome da categoria em até 2 linhas, quebrando por palavra ("Despesas com
// Vendas e Serviços" cabe inteiro); passou disso, reticências na 2ª.
function quebrar(texto) {
  const linhas = [""];
  for (const palavra of String(texto).split(" ")) {
    const atual = linhas[linhas.length - 1];
    if ((atual + " " + palavra).trim().length <= CHARS_POR_LINHA)
      linhas[linhas.length - 1] = (atual + " " + palavra).trim();
    else linhas.push(palavra);
  }
  if (linhas.length <= 2) return linhas;
  return [
    linhas[0],
    `${linhas
      .slice(1)
      .join(" ")
      .slice(0, CHARS_POR_LINHA - 1)}…`,
  ];
}

function NomeTick({ x, y, payload }) {
  const linhas = quebrar(payload.value);
  return (
    <text
      x={x - 8}
      y={y}
      textAnchor="end"
      fill="var(--text-secondary)"
      fontSize={12}
    >
      <title>{payload.value}</title>
      {linhas.map((l, i) => (
        <tspan
          key={i}
          x={x - 8}
          dy={i === 0 ? (linhas.length > 1 ? -4 : 4) : 14}
        >
          {l}
        </tspan>
      ))}
    </text>
  );
}

// Ranking horizontal (ex: Top gastos por categoria), uma barra por
// categoria, cor por item via `data[].color` (opcional — usa `color`
// default se não vier por item). Valor no fim da barra.
export default function HorizontalBarChart({
  data,
  dataKey = "valor",
  nameKey = "categoria",
  color = "var(--chart-despesa)",
  height,
}) {
  const maiorValor = Math.max(
    1,
    ...data.map((item) => Math.abs(item[dataKey])),
  );
  return (
    <div className="chart-block horizontal-ranking">
      <div className="horizontal-ranking-chart">
        <ResponsiveContainer
          width="100%"
          height={height ?? Math.max(240, data.length * 40)}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 96, left: 0, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} {...GRID_PROPS} />
            <XAxis
              type="number"
              tick={TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => numberFmt.format(v)}
            />
            <YAxis
              type="category"
              dataKey={nameKey}
              tick={<NomeTick />}
              axisLine={false}
              tickLine={false}
              width={LARGURA_NOMES}
            />
            <Tooltip
              cursor={{ fill: "var(--bg-subtle)" }}
              allowEscapeViewBox={{ x: true, y: true }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey={dataKey}
              name="Valor"
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
            >
              {data.map((d, i) => (
                <Cell key={d[nameKey] ?? i} fill={d.color ?? color} />
              ))}
              <LabelList
                dataKey={dataKey}
                position="right"
                formatter={(v) => currencyFmt.format(v)}
                style={{
                  fill: "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="horizontal-ranking-mobile" aria-label="Ranking por valor">
        {data.map((d, i) => (
          <li key={d[nameKey] ?? i}>
            <div>
              <span>{d[nameKey]}</span>
              <strong>{currencyFmt.format(d[dataKey])}</strong>
            </div>
            <span className="ranking-track" aria-hidden="true">
              <span
                style={{
                  width: `${(Math.abs(d[dataKey]) / maiorValor) * 100}%`,
                  background: d.color ?? color,
                }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
