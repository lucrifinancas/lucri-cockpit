import { useFinanceData } from "../hooks/useFinanceData";
import { sumValores } from "../data/mockFinance";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição" },
  { key: "categoria", label: "Categoria" },
  { key: "valor", label: "Valor" },
];

// A categorização "fixa/variável" que essa página tinha antes nunca existiu
// de verdade — o Conta Azul não classifica assim, só por `categoria` (ver
// GUIA-INTEGRACAO-DADOS-REAIS.md). `despesas` já vem filtrado pelas
// categorias marcadas em Ajustes → Categorias de Despesa.
export default function DespesasPage() {
  const { despesas } = useFinanceData();
  const rows = [...despesas]
    .sort((a, b) => b.data_vencimento.localeCompare(a.data_vencimento))
    .map((d) => ({ id: d.id, data: d.data_vencimento, descricao: d.descricao, categoria: d.categoria, valor: d.valor }));

  return (
    <div className="page">
      <h1 className="page-title">Despesas</h1>
      <div className="stat-row">
        <StatCard label="Total no período" value={sumValores(despesas)} tone="negative" />
        <StatCard label="Nº de lançamentos" value={despesas.length} format="count" />
      </div>
      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
