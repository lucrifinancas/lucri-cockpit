import { useState } from "react";
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

  const d = new Date();
  const hoje = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const lancamentos = (saidas?.lancamentos ?? []).map((l) => ({ ...l, situacao: situacaoDe(l, hoje) }));
  const somaAberto = (s) => lancamentos.filter((l) => l.situacao === s).reduce((t, l) => t + l.valor_em_aberto, 0);
  const cards = [
    { id: "vencido", label: "Vencidos", valor: somaAberto("vencido"), tone: "danger" },
    { id: "hoje", label: "Vencem hoje", valor: somaAberto("hoje"), tone: "danger" },
    { id: "avencer", label: "A vencer", valor: somaAberto("avencer"), tone: "info" },
    { id: "pago", label: "Pagos", valor: lancamentos.reduce((t, l) => t + l.valor_pago, 0), tone: "ok" },
    { id: "todos", label: "Total do período", valor: lancamentos.reduce((t, l) => t + l.valor, 0), tone: "neutral" },
  ];

  const filtrados = filterLancamentos(lancamentos, busca)
    .filter((l) => filtro === "todos" || l.situacao === filtro)
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function escolherFiltro(id) {
    setFiltro(id);
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

      <input
        className="table-search"
        type="text"
        placeholder="Buscar por descrição, fornecedor ou categoria..."
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value);
          setPagina(1);
        }}
      />

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
