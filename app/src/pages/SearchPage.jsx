import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useActiveClient } from "../context/ClientContext";
import { useTransactionSearch } from "../hooks/useTransactionSearch";
import { filterTransactions, matchesTransaction, searchableTransactions, TRANSACTION_FILTERS } from "../data/transactions";
import { pageRows, sortRows } from "../data/table";
import { formatRange } from "../data/period";
import FinanceDataState from "../components/FinanceDataState";
import TransactionDetail from "../components/TransactionDetail";
import "../styles/page.css";
import "../components/DataTable.css";
import "../components/TransactionsPage.css";
import "./SearchPage.css";

const money = (value) => Number.isFinite(value) ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const date = (value) => value ? value.split("-").reverse().join("/") : "—";
const statusLabel = (item) => ({ pago: item.kind === "entrada" ? "Recebido" : "Pago", vencido: "Vencido", hoje: "Vence hoje", avencer: "A vencer" })[item.situacao];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const requestedKind = params.get("tipo");
  const kind = ["entrada", "saida"].includes(requestedKind) ? requestedKind : "todos";
  const requestedFilter = params.get("situacao");
  const filter = TRANSACTION_FILTERS.includes(requestedFilter) ? requestedFilter : "todos";
  const data = useTransactionSearch(query.length >= 2);
  const { activeClientId, activeClient } = useActiveClient();
  const contextKey = JSON.stringify([activeClientId, data.range, query, kind, filter]);

  function updateFilter(key, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value === "todos") next.delete(key); else next.set(key, value);
      return next;
    });
  }

  return (
    <div className="page search-page">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Busca geral</h1>
          <p className="page-description">Encontre recebimentos e pagamentos por descrição, categoria ou pessoa.</p>
        </div>
      </header>
      <p className="search-scope">
        <strong>{activeClient?.name ?? "Empresa selecionada"}</strong> · Vencimento: {formatRange(data.range)}.
        Contas a pagar estão incluídas nas saídas, sem duplicar títulos.
      </p>
      {query.length < 2 ? (
        <div className="pending-notice" role="status">Use a busca no topo para pesquisar com pelo menos dois caracteres. Para consultar outros meses, altere o período de análise.</div>
      ) : (
        <>
          <div className="search-refinements">
            <p>Resultados para <strong>“{query}”</strong></p>
            <label>Tipo<select aria-label="Tipo" value={kind} onChange={(event) => updateFilter("tipo", event.target.value)}>
              <option value="todos">Entradas e saídas</option><option value="entrada">Entradas</option><option value="saida">Saídas</option>
            </select></label>
            <label>Situação<select aria-label="Situação" value={filter} onChange={(event) => updateFilter("situacao", event.target.value)}>
              <option value="todos">Todas</option><option value="vencido">Vencidos</option><option value="hoje">Vencem hoje</option><option value="avencer">A vencer</option><option value="pago">Recebidos ou pagos (inclui parciais)</option>
            </select></label>
          </div>
          {data.loading || data.error || data.awaitingClient ? (
            <FinanceDataState title="Resultados da busca" {...data} />
          ) : (
            <Results key={contextKey} data={data} query={query} kind={kind} filter={filter} />
          )}
        </>
      )}
    </div>
  );
}

function Results({ data, query, kind, filter }) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState(null);
  const items = searchableTransactions(data);
  const matched = filterTransactions(items, { search: query });
  const results = sortRows(matched.filter((item) => (kind === "todos" || item.kind === kind) && matchesTransaction(item, filter)), "data_vencimento", "asc");
  const page = pageRows(results, pageNumber, pageSize);
  const detail = results.find((item) => item.searchKey === selected);
  return (
    <section className="transactions-panel" aria-label="Resultados da busca geral">
      <div className="transactions-table-summary" role="status">
        <span><strong>{results.length}</strong> lançamento(s) encontrado(s)</span>
        <span>Entradas: {results.filter((item) => item.kind === "entrada").length} · Saídas: {results.filter((item) => item.kind === "saida").length}</span>
      </div>
      {results.length === 0 ? (
        <div className="search-empty" role="status">
          <h2>Nenhum lançamento encontrado</h2>
          <p>Revise o termo, os filtros de tipo e situação ou o período no topo. A busca considera somente a empresa selecionada.</p>
        </div>
      ) : (
        <>
          <div className="data-table-scroll" role="region" aria-label="Lançamentos encontrados" tabIndex={0}>
            <table className="data-table search-results-table">
              <caption className="search-table-caption">Recebimentos e pagamentos encontrados no período de vencimento selecionado</caption>
              <thead><tr><th scope="col">Tipo</th><th scope="col">Lançamento</th><th scope="col">Vencimento</th><th scope="col" className="num">Total</th><th scope="col" className="num">Recebido / pago</th><th scope="col" className="num">Em aberto</th><th scope="col">Situação</th><th scope="col">Detalhes</th></tr></thead>
              <tbody>{page.rows.map((item) => (
                <tr key={item.searchKey}>
                  <td>{item.kind === "entrada" ? "Entrada" : "Saída"}</td>
                  <td>
                    <button type="button" className="transaction-description" onClick={() => setSelected(item.searchKey)}>{item.descricao || "Sem descrição"}</button>
                    <div className="transaction-meta"><span>{item.categoria_original || "Sem categoria"}</span>{item.contraparte && <span>{item.contraparte}</span>}</div>
                  </td>
                  <td className="date">{date(item.data_vencimento)}</td>
                  <td className="num">{money(item.valor_total)}</td><td className="num">{money(item.valor_pago)}</td><td className="num">{money(item.valor_em_aberto)}</td>
                  <td><span className={`transaction-badge transaction-badge-${item.situacao}`}>{statusLabel(item)}</span>{item.valor_pago > 0 && item.valor_em_aberto > 0 && <small className="transaction-partial">{item.kind === "entrada" ? "Recebimento parcial" : "Pagamento parcial"}</small>}</td>
                  <td><button type="button" className="transaction-button" aria-label={`Ver detalhes de ${item.descricao || "lançamento"}`} onClick={() => setSelected(item.searchKey)}>Ver detalhes</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="data-table-pagination">
            <label>Por página <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1); }}>{[10, 25, 50].map((size) => <option key={size}>{size}</option>)}</select></label>
            <nav aria-label="Paginação da busca"><button type="button" disabled={page.current === 1} onClick={() => setPageNumber(page.current - 1)}>Anterior</button><span>Página {page.current} de {page.pages}</span><button type="button" disabled={page.current === page.pages} onClick={() => setPageNumber(page.current + 1)}>Próximo</button></nav>
          </div>
        </>
      )}
      {detail && <TransactionDetail item={detail} kind={detail.kind} status={statusLabel(detail)} onClose={() => setSelected(null)} />}
    </section>
  );
}
