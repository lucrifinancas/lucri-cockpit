import { useDre } from "../hooks/useDre";
import StatCard from "../components/StatCard";
import AccountingTable from "../components/AccountingTable";
import "../styles/page.css";

export default function DrePage() {
  const { dre, loading, error } = useDre();

  return (
    <div className="page">
      <h1 className="page-title">DRE</h1>

      {loading && <p className="section-empty">Carregando...</p>}
      {error && <p className="section-empty">{error}</p>}

      {!loading && !error && dre && (
        <>
          <div className="stat-row">
            <StatCard
              label="Resultado no período"
              value={dre.resultado_final}
              tone={dre.resultado_final >= 0 ? "positive" : "negative"}
            />
          </div>
          <AccountingTable linhas={dre.linhas} />
        </>
      )}
    </div>
  );
}
