import { useFinanceData } from "../hooks/useFinanceData";
import { sumValores } from "../data/mockFinance";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição" },
  { key: "direcao", label: "Tipo" },
  { key: "valor", label: "Valor" },
];

export default function CaixaPage() {
  const { entradas, saidas } = useFinanceData();

  const totalEntradas = sumValores(entradas);
  const totalSaidas = sumValores(saidas);
  const saldo = totalEntradas - totalSaidas;

  const movimentacoes = [
    ...entradas.map((e) => ({ ...e, direcao: "Entrada" })),
    ...saidas.map((s) => ({ ...s, direcao: "Saída" })),
  ].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="page">
      <h1 className="page-title">Caixa</h1>
      <div className="stat-row">
        <StatCard label="Entradas" value={totalEntradas} tone="positive" />
        <StatCard label="Saídas" value={totalSaidas} tone="negative" />
        <StatCard label="Saldo" value={saldo} tone={saldo >= 0 ? "accent" : "negative"} />
      </div>
      <DataTable columns={COLUMNS} rows={movimentacoes} />
    </div>
  );
}
