import { useState } from "react";
import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useFinanceData } from "../hooks/useFinanceData";
import { filterLancamentos } from "../data/mockFinance";
import "../styles/page.css";
import "./ContasAPagarPage.css";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 10;

const SITUACOES = {
  vencido: { label: "Vencido", tone: "danger" },
  hoje: { label: "Vence hoje", tone: "danger" },
  avencer: { label: "A vencer", tone: "info" },
  pago: { label: "Pago", tone: "ok" },
};

// Situação calculada aqui (não pelo status_traduzido do Conta Azul) pra
// bater com os mesmos 4 baldes dos cards: pago = nada em aberto; senão,
// decide pela data de vencimento vs. hoje.
function situacaoDe(l, hoje) {
  if (l.valor_em_aberto <= 0) return "pago";
  if (l.data_vencimento < hoje) return "vencido";
  if (l.data_vencimento === hoje) return "hoje";
  return "avencer";
}

function fmtData(iso) {
  const [a, m, d] = (iso ?? "").split("-");
  return d ? `${d}/${m}/${a}` : "—";
}

// Espelha a tela "Contas a pagar" do próprio Conta Azul (pedido do
// usuário): cards por situação que filtram a tabela + lista de TODAS as
// contas do período (pagas também). Mesmo dado da aba Saídas (/saidas).
// Sem coluna de data de pagamento: a API de listagem do Conta Azul não
// devolve esse campo (ver DADOS-CONTA-AZUL-API.md, "Quitação de parcela").
export default function ContasAPagarPage() {
  const { saidas, loading } = useFinanceData();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [categoria, setCategoria] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [venceDe, setVenceDe] = useState("");
  const [venceAte, setVenceAte] = useState("");

  const d = new Date();
  const hoje = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const todos = (saidas?.lancamentos ?? []).map((l) => ({ ...l, situacao: situacaoDe(l, hoje) }));
  const opcoes = (campo) => [...new Set(todos.map((l) => l[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const categorias = opcoes("categoria");
  const fornecedores = opcoes("contraparte");

  // Filtros (busca, categoria, fornecedor, faixa de vencimento) valem pros
  // cards também — igual o Conta Azul; o card escolhido só recorta a tabela
  // por situação em cima disso.
  const lancamentos = filterLancamentos(todos, busca).filter(
    (l) =>
      (!categoria || l.categoria === categoria) &&
      (!fornecedor || l.contraparte === fornecedor) &&
      (!venceDe || l.data_vencimento >= venceDe) &&
      (!venceAte || l.data_vencimento <= venceAte)
  );
  const temFiltro = busca || categoria || fornecedor || venceDe || venceAte;
  const somaAberto = (s) => lancamentos.filter((l) => l.situacao === s).reduce((t, l) => t + l.valor_em_aberto, 0);
  const cards = [
    { id: "vencido", label: "Vencidos", valor: somaAberto("vencido"), tone: "danger" },
    { id: "hoje", label: "Vencem hoje", valor: somaAberto("hoje"), tone: "danger" },
    { id: "avencer", label: "A vencer", valor: somaAberto("avencer"), tone: "info" },
    { id: "pago", label: "Pagos", valor: lancamentos.reduce((t, l) => t + l.valor_pago, 0), tone: "ok" },
    { id: "todos", label: "Total do período", valor: lancamentos.reduce((t, l) => t + l.valor, 0), tone: "neutral" },
  ];

  const filtrados = lancamentos
    .filter((l) => filtro === "todos" || l.situacao === filtro)
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function escolherFiltro(id) {
    setFiltro(id);
    setPagina(1);
  }

  // Todo filtro volta pra página 1 — senão a página atual pode ficar além
  // do fim da lista recortada.
  const mudar = (setter) => (e) => {
    setter(e.target.value);
    setPagina(1);
  };

  function limparFiltros() {
    setBusca("");
    setCategoria("");
    setFornecedor("");
    setVenceDe("");
    setVenceAte("");
    setPagina(1);
  }

  return (
    <div className="page">
      <h1 className="page-title">Contas a pagar</h1>

      <div className="cap-cards" role="tablist" aria-label="Filtrar por situação">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={filtro === c.id}
            className={`cap-card ${filtro === c.id ? "active" : ""}`}
            onClick={() => escolherFiltro(c.id)}
          >
            <span className="cap-card-label">{c.label}</span>
            <span className={`cap-card-value tone-${c.tone}`}>{fmt.format(c.valor)}</span>
          </button>
        ))}
      </div>

      <div className="cap-filtros">
        <label className="cap-filtro cap-filtro-busca">
          <span className="cap-filtro-label">Buscar</span>
          <span className="cap-campo">
            <MagnifyingGlass size={16} className="cap-campo-icone" aria-hidden="true" />
            <input
              type="text"
              aria-label="Buscar"
              placeholder="Descrição, fornecedor ou categoria"
              value={busca}
              onChange={mudar(setBusca)}
            />
          </span>
        </label>
        <label className="cap-filtro">
          <span className="cap-filtro-label">Categoria</span>
          <span className={`cap-campo cap-campo-select ${categoria ? "is-set" : ""}`}>
            <select aria-label="Categoria" value={categoria} onChange={mudar(setCategoria)}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <CaretDown size={14} weight="bold" className="cap-campo-caret" aria-hidden="true" />
          </span>
        </label>
        <label className="cap-filtro">
          <span className="cap-filtro-label">Fornecedor</span>
          <span className={`cap-campo cap-campo-select ${fornecedor ? "is-set" : ""}`}>
            <select aria-label="Fornecedor" value={fornecedor} onChange={mudar(setFornecedor)}>
              <option value="">Todos</option>
              {fornecedores.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <CaretDown size={14} weight="bold" className="cap-campo-caret" aria-hidden="true" />
          </span>
        </label>
        <div className="cap-filtro">
          <span className="cap-filtro-label">Vencimento</span>
          <span className="cap-faixa">
            <span className={`cap-campo ${venceDe ? "is-set" : ""}`}>
              <input type="date" aria-label="Vence de" value={venceDe} max={venceAte || undefined} onChange={mudar(setVenceDe)} />
            </span>
            <span className="cap-faixa-sep">até</span>
            <span className={`cap-campo ${venceAte ? "is-set" : ""}`}>
              <input type="date" aria-label="Vence até" value={venceAte} min={venceDe || undefined} onChange={mudar(setVenceAte)} />
            </span>
          </span>
        </div>
        {temFiltro && (
          <button type="button" className="cap-limpar" onClick={limparFiltros}>
            <X size={14} weight="bold" aria-hidden="true" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="data-table-wrap">
        <table className="data-table cap-table">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Resumo do lançamento</th>
              <th className="num">Total</th>
              <th className="num">A pagar</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={5} className="data-table-empty">
                  {loading ? "Carregando..." : busca ? "Nenhum resultado pra essa busca." : "Nenhuma conta nessa situação no período selecionado."}
                </td>
              </tr>
            )}
            {visiveis.map((l) => (
              <tr key={l.id}>
                <td className="cap-date">{fmtData(l.data_vencimento)}</td>
                <td>
                  <div className="cap-desc" title={l.descricao}>{l.descricao || "—"}</div>
                  <div className="cap-meta">
                    {l.categoria && <span className="cap-chip">{l.categoria}</span>}
                    {l.contraparte && <span className="cap-fornecedor">{l.contraparte}</span>}
                  </div>
                </td>
                <td className="num">{fmt.format(l.valor)}</td>
                <td className="num">{fmt.format(l.valor_em_aberto)}</td>
                <td>
                  <span className={`cap-badge tone-${SITUACOES[l.situacao].tone}`}>{SITUACOES[l.situacao].label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtrados.length > POR_PAGINA && (
        <nav className="cap-pager" aria-label="Paginação">
          <button type="button" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>
            ‹ Anterior
          </button>
          <span>
            {(paginaAtual - 1) * POR_PAGINA + 1}–{Math.min(paginaAtual * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </span>
          <button type="button" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>
            Próximo ›
          </button>
        </nav>
      )}
    </div>
  );
}
