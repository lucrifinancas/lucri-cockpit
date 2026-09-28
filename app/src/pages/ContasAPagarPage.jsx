import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { filterLancamentos } from "../data/mockFinance";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Vencimento" },
  { key: "descricao", label: "Descrição" },
  { key: "contraparte", label: "Fornecedor" },
  { key: "categoria", label: "Categoria" },
  { key: "status", label: "Status" },
  { key: "valor", label: "Valor em aberto" },
];

// Mesmo dado da aba Saídas (/saidas = contas a pagar do Conta Azul no
// período), mas o lado oposto: só o que ainda NÃO foi pago
// (valor_em_aberto > 0), do vencimento mais próximo pro mais distante.
export default function ContasAPagarPage() {
  const { saidas } = useFinanceData();
  const [busca, setBusca] = useState("");
  const emAberto = (saidas?.lancamentos ?? []).filter((l) => l.valor_em_aberto > 0);
  const filtrados = filterLancamentos(emAberto, busca);
  const rows = [...filtrados]
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
    .map((l) => ({
      id: l.id,
      data: l.data_vencimento,
      descricao: l.descricao,
      contraparte: l.contraparte ?? "—",
      categoria: l.categoria ?? "—",
      status: l.status ?? "—",
      valor: l.valor_em_aberto,
    }));
  const totais = saidas?.totais;
  const totalAPagar = totais ? Math.max(totais.todos - totais.pago.valor, 0) : 0;

  return (
    <div className="page">
      <h1 className="page-title">Contas a pagar</h1>
      <div className="stat-row">
        <StatCard label="Total a pagar" value={totalAPagar} tone={totalAPagar > 0 ? "negative" : "neutral"} />
        <StatCard label="Vencido" value={totais?.vencido?.valor ?? 0} tone={totais?.vencido?.valor > 0 ? "negative" : "neutral"} />
        <StatCard label="Vence hoje" value={totais?.vence_hoje?.valor ?? 0} />
        <StatCard label="Nº de contas em aberto" value={emAberto.length} format="count" />
      </div>
      <input
        className="table-search"
        type="text"
        placeholder="Buscar por descrição, fornecedor ou categoria..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        emptyMessage={busca ? "Nenhum resultado pra essa busca." : "Nenhuma conta em aberto no período selecionado."}
      />
    </div>
  );
}
