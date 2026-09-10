import { useFinanceData } from "../hooks/useFinanceData";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição" },
  { key: "direcao", label: "Tipo" },
  { key: "valor", label: "Valor" },
];

// Regime de caixa (ver "⚠️ Regime de caixa" no API-CONTRACT.md): soma
// valor_pago por lançamento, não valor (total do título, pago ou não).
export default function CaixaPage() {
  const { entradas, saidas } = useFinanceData();

  const totalEntradas = entradas?.totais?.pago?.valor ?? 0;
  const totalSaidas = saidas?.totais?.pago?.valor ?? 0;
  const saldo = totalEntradas - totalSaidas;

  const movimentacoes = [
    ...(entradas?.lancamentos ?? []).map((e) => ({
      id: e.id,
      data: e.data_vencimento,
      descricao: e.descricao,
      direcao: "Entrada",
      valor: e.valor_pago,
    })),
    ...(saidas?.lancamentos ?? []).map((s) => ({
      id: s.id,
      data: s.data_vencimento,
      descricao: s.descricao,
      direcao: "Saída",
      valor: s.valor_pago,
    })),
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
