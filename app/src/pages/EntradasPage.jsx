import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { filterLancamentos } from "../data/mockFinance";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição" },
  { key: "contraparte", label: "Contraparte" },
  { key: "valor", label: "Valor" },
];

// Regime de caixa (ver "⚠️ Regime de caixa" no topo do API-CONTRACT.md):
// soma valor_pago, não valor (total do título, pago ou não).
export default function EntradasPage() {
  const { entradas } = useFinanceData();
  const [busca, setBusca] = useState("");
  const lancamentos = entradas?.lancamentos ?? [];
  const filtrados = filterLancamentos(lancamentos, busca);
  const rows = [...filtrados]
    .sort((a, b) => b.data_vencimento.localeCompare(a.data_vencimento))
    .map((l) => ({ id: l.id, data: l.data_vencimento, descricao: l.descricao, contraparte: l.contraparte ?? "—", valor: l.valor_pago }));
  const total = entradas?.totais?.pago?.valor ?? 0;

  return (
    <div className="page">
      <h1 className="page-title">Entradas</h1>
      <div className="stat-row">
        <StatCard label="Total no período" value={total} tone="positive" />
        <StatCard label="Nº de recebimentos" value={lancamentos.length} format="count" />
      </div>
      <input
        className="table-search"
        type="text"
        placeholder="Buscar por descrição, contraparte ou categoria..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        emptyMessage={busca ? "Nenhum resultado pra essa busca." : undefined}
      />
    </div>
  );
}
