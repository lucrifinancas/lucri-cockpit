import { useBalanco } from "../hooks/useBalanco";
import StatCard from "../components/StatCard";
import AccountingTable from "../components/AccountingTable";
import "../styles/page.css";

export default function BalancoPage() {
  const { balanco, loading, error } = useBalanco();

  const linhas = balanco
    ? [
        {
          codigo: null,
          descricao: "Ativo Circulante",
          totalizador: false,
          valor: balanco.ativo.total,
          subitens: [
            { codigo: null, descricao: "Disponível (saldo em conta)", valor: balanco.ativo.disponivel },
            { codigo: null, descricao: "Realizável (a receber em aberto)", valor: balanco.ativo.realizavel },
          ],
        },
        {
          codigo: null,
          descricao: "Passivo Circulante (a pagar em aberto)",
          totalizador: false,
          valor: -balanco.passivo_circulante,
        },
        { codigo: null, descricao: "Saldo", totalizador: true, valor: balanco.saldo },
      ]
    : [];

  return (
    <div className="page">
      <h1 className="page-title">Balanço</h1>

      <p className="pending-notice">
        <strong>Atenção:</strong> este é um balanço <strong>simplificado</strong>,
        não um balanço patrimonial contábil completo — mostra só o que a API
        do Conta Azul expõe (saldo bancário e contas a pagar/receber em
        aberto). Não tem Patrimônio Líquido, imobilizado nem capital social.
        Pro balanço contábil de verdade, fale com sua contadora.
      </p>

      {loading && <p className="section-empty">Carregando...</p>}
      {error && <p className="section-empty">{error}</p>}

      {!loading && !error && balanco && (
        <>
          <div className="stat-row">
            <StatCard
              label={`Saldo em ${new Date(balanco.gerado_em + "T00:00:00").toLocaleDateString("pt-BR")}`}
              value={balanco.saldo}
              tone={balanco.saldo >= 0 ? "positive" : "negative"}
            />
          </div>
          <AccountingTable linhas={linhas} />
        </>
      )}
    </div>
  );
}
