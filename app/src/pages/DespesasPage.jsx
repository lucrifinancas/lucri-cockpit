import { useFinanceData } from "../hooks/useFinanceData";
import { sumValores } from "../data/mockFinance";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import "../styles/page.css";

const COLUMNS = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição" },
  { key: "tipo", label: "Tipo" },
  { key: "valor", label: "Valor" },
];

export default function DespesasPage() {
  const { despesas } = useFinanceData();
  const fixas = despesas.filter((d) => d.tipo === "fixa");
  const variaveis = despesas.filter((d) => d.tipo === "variavel");
  const rows = [...despesas].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="page">
      <h1 className="page-title">Despesas</h1>
      <p className="pending-notice">
        <strong>Em aberto:</strong> ainda não sabemos se o Conta Azul já traz a
        categorização fixo/variável pronta ou se essa página vai precisar de uma
        tela própria de mapeamento por cliente. A separação abaixo é só ilustrativa
        com dado mockado — não fechar esse schema antes de confirmar a origem.
      </p>
      <div className="stat-row">
        <StatCard label="Despesas fixas" value={sumValores(fixas)} />
        <StatCard label="Despesas variáveis" value={sumValores(variaveis)} />
        <StatCard label="Total" value={sumValores(despesas)} tone="negative" />
      </div>
      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
