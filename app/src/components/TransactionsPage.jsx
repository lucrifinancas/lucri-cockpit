import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFinanceData } from "../hooks/useFinanceData";
import { useActiveClient } from "../context/ClientContext";
import { formatRange } from "../data/period";
import { TRANSACTION_FILTERS, transactionItems, filterTransactions, matchesTransaction, transactionTotal } from "../data/transactions";
import { pageRows, sortRows } from "../data/table";
import FinanceDataState from "./FinanceDataState";
import TransactionDetail from "./TransactionDetail";
import "../styles/page.css";
import "./DataTable.css";
import "./TransactionsPage.css";

const money = (value) => Number.isFinite(value) ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const date = (value) => value ? value.split("-").reverse().join("/") : "—";
const paidLabel = (item, kind) => item.valor_pago > 0 && item.valor_em_aberto > 0 ? (kind === "entrada" ? "Parcialmente recebido" : "Parcialmente pago") : null;
const statusLabel = (item, kind) => ({ pago: kind === "entrada" ? "Recebido" : "Pago", vencido: "Vencido", hoje: "Vence hoje", avencer: "A vencer" })[item.situacao];

export default function TransactionsPage({ kind }) {
  const data = useFinanceData();
  const { activeClientId } = useActiveClient();
  const title = kind === "entrada" ? "Entradas" : "Saídas";
  if (data.loading || data.error || data.awaitingClient) return <FinanceDataState title={title} {...data} />;
  return <Workspace key={`${kind}-${activeClientId}-${data.range.start}-${data.range.end}`} data={data} kind={kind} title={title} />;
}

function Workspace({ data, kind, title }) {
  const [params, setParams] = useSearchParams();
  const expensesOnly = kind === "saida" && params.get("visao") === "despesas";
  const requested = params.get("situacao");
  const filter = TRANSACTION_FILTERS.includes(requested) ? requested : "todos";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [counterpart, setCounterpart] = useState("");
  const [sort, setSort] = useState({ key: "data_vencimento", direction: "asc" });
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const items = transactionItems(data, kind, expensesOnly);
  const options = (field) => [...new Set(items.map((item) => item[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filtered = filterTransactions(items, { search, category, counterpart });
  const visible = sortRows(filtered.filter((item) => matchesTransaction(item, filter)), sort.key, sort.direction);
  const pageKey = JSON.stringify([search, category, counterpart, filter, expensesOnly, sort, pageSize]);
  const page = pageRows(visible, pagination.key === pageKey ? pagination.page : 1, pageSize);
  const detail = items.find((item) => item.id === selected);
  const labels = { vencido: "Vencidos", hoje: "Vencem hoje", avencer: "A vencer", pago: kind === "entrada" ? "Recebidos" : "Pagos", todos: "Total do período" };
  const columns = [
    ["data_vencimento", "Vencimento"], ["descricao", "Resumo do lançamento"], ["valor_total", "Total"],
    ["valor_pago", kind === "entrada" ? "Recebido" : "Pago"], ["valor_em_aberto", kind === "entrada" ? "A receber" : "A pagar"], ["situacao", "Situação"],
  ];
  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
    setSelected(null);
  }
  function order(key) { setSort((previous) => ({ key, direction: previous.key === key && previous.direction === "asc" ? "desc" : "asc" })); }
  return (
    <div className="page">
      <header className="page-heading"><div><h1 className="page-title">{title}</h1><p className="page-description">{kind === "entrada" ? "Acompanhe os títulos a receber e os recebimentos da empresa." : "Acompanhe os pagamentos e as despesas operacionais em um só lugar."}</p></div></header>
      {kind === "saida" && <div className="page-view-options" role="group" aria-label="Visão das saídas"><button type="button" aria-pressed={!expensesOnly} onClick={() => { setCategory(""); setCounterpart(""); updateParam("visao", null); }}>Todas as saídas</button><button type="button" aria-pressed={expensesOnly} onClick={() => { setCategory(""); setCounterpart(""); updateParam("visao", "despesas"); }}>Despesas operacionais</button></div>}
      <section className="transactions-panel" aria-label={`Consulta de ${title.toLowerCase()}`}>
        <div className="transactions-filters">
          <div><span className="transactions-label">Vencimento</span><strong>{formatRange(data.range)}</strong><small>Altere o período no topo do painel</small></div>
          <label>Pesquisar no período<input type="search" value={search} placeholder="Descrição, categoria ou pessoa" onChange={(event) => setSearch(event.target.value)} /></label>
          <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{options("categoria_original").map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>{kind === "entrada" ? "Cliente" : "Fornecedor"}<select value={counterpart} onChange={(event) => setCounterpart(event.target.value)}><option value="">Todos</option>{options("contraparte").map((value) => <option key={value}>{value}</option>)}</select></label>
          {(search || category || counterpart || filter !== "todos") && <button type="button" className="transaction-button" onClick={() => { setSearch(""); setCategory(""); setCounterpart(""); updateParam("situacao", null); }}>Limpar filtros</button>}
        </div>
        <div className="transaction-status-cards" role="group" aria-label="Filtrar por situação">
          {TRANSACTION_FILTERS.map((key) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => updateParam("situacao", key === "todos" ? null : key)}><span>{labels[key]}</span><strong>{money(transactionTotal(filtered, key))}</strong>{key === "pago" && <small>Inclui parciais</small>}</button>)}
        </div>
        <div className="transactions-table-summary" role="status"><span>{visible.length} registro(s) · {filter === "todos" ? "Total dos títulos" : filter === "pago" ? labels.pago : "Em aberto"}: <strong>{money(transactionTotal(filtered, filter))}</strong></span><span>{expensesOnly ? "Somente categorias classificadas como despesas operacionais" : "Todos os títulos da visão selecionada"}</span></div>
        <div className="data-table-scroll" role="region" aria-label={`Tabela de ${title.toLowerCase()}`} tabIndex={0}>
          <table className="data-table transactions-table"><thead><tr>{columns.map(([key, label]) => <th scope="col" key={key} className={key.startsWith("valor") ? "num" : undefined} aria-sort={sort.key === key ? sort.direction === "asc" ? "ascending" : "descending" : undefined}><button type="button" className="data-table-sort" onClick={() => order(key)}>{label} {sort.key === key ? sort.direction === "asc" ? "↑" : "↓" : "↕"}</button></th>)}<th scope="col">Detalhes</th></tr></thead>
            <tbody>{page.rows.length === 0 && <tr><td colSpan={7} className="data-table-empty">{items.length === 0 ? "Nenhum título no período para esta visão." : "Nenhum título corresponde aos filtros selecionados."}</td></tr>}{page.rows.map((item) => <tr key={item.id}>
              <td className="date">{date(item.data_vencimento)}</td><td><button type="button" className="transaction-description" onClick={() => setSelected(item.id)}>{item.descricao || "Sem descrição"}</button><div className="transaction-meta"><span>{item.categoria_original || "Sem categoria"}</span>{item.contraparte && <span>{item.contraparte}</span>}</div></td>
              <td className="num">{money(item.valor_total)}</td><td className="num">{money(item.valor_pago)}</td><td className="num">{money(item.valor_em_aberto)}</td><td><span className={`transaction-badge transaction-badge-${item.situacao}`}>{statusLabel(item, kind)}</span>{paidLabel(item, kind) && <small className="transaction-partial">{paidLabel(item, kind)}</small>}</td><td><button type="button" className="transaction-button" aria-label={`Ver detalhes de ${item.descricao || "lançamento"}`} onClick={() => setSelected(item.id)}>Ver detalhes</button></td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="data-table-pagination"><label>Por página <select aria-label="Registros por página" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{[10, 25, 50].map((value) => <option key={value}>{value}</option>)}</select></label><nav aria-label="Paginação dos lançamentos"><button type="button" disabled={page.current === 1} onClick={() => setPagination({ key: pageKey, page: page.current - 1 })}>Anterior</button><span>Página {page.current} de {page.pages}</span><button type="button" disabled={page.current === page.pages} onClick={() => setPagination({ key: pageKey, page: page.current + 1 })}>Próximo</button></nav></div>
      </section>
      <p className="section-empty">Os totais acompanham os filtros de busca, categoria e pessoa. Vencidos, hoje e a vencer somam o valor em aberto; recebidos/pagos somam os valores liquidados dos títulos com vencimento no período.</p>
      {detail && <TransactionDetail item={detail} kind={kind} status={statusLabel(detail, kind)} onClose={() => setSelected(null)} />}
    </div>
  );
}
