import { useFinanceData } from "../hooks/useFinanceData";
import { sumValores } from "../data/mockFinance";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição" },
  { key: "valor", label: "Valor" },
];

export default function EntradasPage() {
  const { entradas } = useFinanceData();
  const rows = [...entradas].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="page">
      <h1 className="page-title">Entradas</h1>
      <div className="stat-row">
        <StatCard label="Total no período" value={sumValores(entradas)} tone="positive" />
        <StatCard label="Nº de recebimentos" value={entradas.length} format="count" />
      </div>
      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
