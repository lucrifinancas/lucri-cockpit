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

export default function SaidasPage() {
  const { saidas } = useFinanceData();
  const rows = [...saidas].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="page">
      <h1 className="page-title">Saídas</h1>
      <p className="pending-notice">
        Visão bruta de tudo que sai do caixa (inclui transferência, investimento
        etc.) — diferente de <strong>Despesas</strong>, que é só o custo
        operacional que compõe o DRE.
      </p>
      <div className="stat-row">
        <StatCard label="Total no período" value={sumValores(saidas)} tone="negative" />
        <StatCard label="Nº de lançamentos" value={saidas.length} format="count" />
      </div>
      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
