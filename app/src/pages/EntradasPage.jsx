import { useSearchParams } from "react-router-dom";
import { recebimentosVencidos } from "../data/recebimentos";
import FinanceDataState from "../components/FinanceDataState";
import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { filterLancamentos } from "../data/mockFinance";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Vencimento" },
  { key: "descricao", label: "Descrição" },
  { key: "mae", label: "Categoria" },
  { key: "categoria", label: "Subcategoria" },
  { key: "contraparte", label: "Cliente" },
  { key: "valor", label: "Valor recebido" },
];

// Regime de caixa (ver "⚠️ Regime de caixa" no topo do API-CONTRACT.md):
// soma valor_pago, não valor (total do título, pago ou não).
export default function EntradasPage() {
  const { entradas, loading, error, retry, awaitingClient } = useFinanceData();
  const [busca, setBusca] = useState("");
  const [params, setParams] = useSearchParams();
  const apenasVencidos = params.get("situacao") === "vencido";
  if (loading || error || awaitingClient) {
    return <FinanceDataState title="Entradas" loading={loading} error={error} retry={retry} awaitingClient={awaitingClient} />;
  }

  const lancamentos = entradas?.lancamentos ?? [];
  const selecionados = apenasVencidos ? recebimentosVencidos(lancamentos) : lancamentos;
  const filtrados = filterLancamentos(selecionados, busca);
  const rows = [...filtrados]
    .sort((a, b) => b.data_vencimento.localeCompare(a.data_vencimento))
    .map((l) => ({
      id: l.id,
      data: l.data_vencimento,
      descricao: l.descricao,
      // Categoria = mãe de Ajustes → Categorias de Receita; Subcategoria = a do Conta Azul.
      mae: l.mae_exibicao ?? "—",
      categoria: l.categoria ?? "—",
      contraparte: l.contraparte ?? "—",
      valor: apenasVencidos ? l.valor_em_aberto : l.valor_pago,
    }));
  const total = apenasVencidos ? selecionados.reduce((sum, item) => sum + item.valor_em_aberto, 0) : entradas?.totais?.pago?.valor ?? 0;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Entradas</h1>
          <p className="page-description">
            Acompanhe os recebimentos e consulte os lançamentos do período.
          </p>
        </div>
      </header>
      <label>
        Situação{" "}
        <select value={apenasVencidos ? "vencido" : "todos"} onChange={(event) => {
          const next = new URLSearchParams(params);
          if (event.target.value === "vencido") next.set("situacao", "vencido");
          else next.delete("situacao");
          setParams(next);
        }}>
          <option value="todos">Todos os recebimentos</option>
          <option value="vencido">Vencidos em aberto</option>
        </select>
      </label>
      <div className="stat-row">
        <StatCard label={apenasVencidos ? "Vencido em aberto no período" : "Total recebido no período"} value={total} tone="positive" />
        <StatCard
          label={apenasVencidos ? "Nº de títulos vencidos" : "Nº de recebimentos"}
          value={selecionados.length}
          format="count"
        />
      </div>
      <DataTable
        title={apenasVencidos ? "Títulos vencidos em aberto" : "Recebimentos"}
        search={{
          value: busca,
          onChange: (e) => setBusca(e.target.value),
          placeholder: "Buscar descrição, contraparte ou categoria",
        }}
        columns={apenasVencidos ? COLUMNS.map((col) => col.key === "valor" ? { ...col, label: "Valor em aberto" } : col) : COLUMNS}
        rows={rows}
        emptyMessage={busca ? "Nenhum resultado pra essa busca." : apenasVencidos ? "Nenhum recebimento vencido em aberto no período." : undefined}
      />
    </div>
  );
}
