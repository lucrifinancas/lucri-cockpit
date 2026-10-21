import { situacaoDe, correspondeSituacao, valorDaSituacao } from "../data/contasPagar";
import { todayISO } from "../data/period";
import FinanceDataState from "../components/FinanceDataState";
import { useEffect, useState } from "react";
import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useActiveClient } from "../context/ClientContext";
import { usePeriod } from "../context/PeriodContext";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { filterLancamentos } from "../data/mockFinance";
import DateRangePicker from "../components/DateRangePicker";
import "../styles/page.css";
import "./ContasAPagarPage.css";

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const POR_PAGINA = 10;

const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Visão por mês (pedido do usuário, 07/10): o mês escolhido no meio, 2 antes
// e 2 depois — total a pagar de cada mês (por vencimento) e quanto já foi
// pago. O mês do meio segue o período do topo ("Mês específico"/"Este mês";
// outros presets usam o mês de hoje). Busca a própria janela de 5 meses;
// clicar num mês troca o período da página pra ele (setMonth), e a janela
// recentra nele.
// `maes`: Set com os nomes das mães escolhidas em Ajustes → Contas a pagar —
// os meses somam só elas, igual o resto da página.
function MesesCards({ maes }) {
  const { activeClientId } = useActiveClient();
  const { preset, month, setMonth } = usePeriod();
  const [porMes, setPorMes] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const hoje = new Date(`${todayISO()}T12:00:00`);
  const mesHoje = iso(hoje).slice(0, 7);
  const mesAtivo =
    preset === "mes-especifico" ? month : preset === "mes" ? mesHoje : null;
  const [anoCentro, mesCentro] = (mesAtivo ?? mesHoje).split("-").map(Number);
  const meses = [-2, -1, 0, 1, 2].map((desloc) => {
    const d = new Date(anoCentro, mesCentro - 1 + desloc, 1);
    const chave = iso(d).slice(0, 7);
    const nome =
      NOMES_MES[d.getMonth()] +
      (d.getFullYear() !== hoje.getFullYear() ? ` ${d.getFullYear()}` : "");
    return { chave, nome, atual: chave === mesHoje };
  });
  const de = `${meses[0].chave}-01`;
  const ate = iso(new Date(anoCentro, mesCentro + 2, 0));

  useEffect(() => {
    if (!activeClientId) return;
    let cancelado = false;
    setPorMes(null);
    setError(null);
    apiFetch(`/api/clientes/${activeClientId}/saidas?de=${de}&ate=${ate}`)
      .then((dados) => {
        if (cancelado) return;
        const soma = new Map();
        for (const l of dados.lancamentos ?? []) {
          if (!maes.has(l.mae)) continue;
          const chave = l.data_vencimento?.slice(0, 7);
          const atual = soma.get(chave) ?? { total: 0, pago: 0 };
          atual.total += l.valor;
          atual.pago += l.valor_pago;
          soma.set(chave, atual);
        }
        setPorMes(soma);
      })
      .catch((err) => !cancelado && setError(err.message));
    return () => {
      cancelado = true;
    };
  }, [activeClientId, de, ate, maes, attempt]);

  if (error) return <div className="pending-notice" role="alert">Não foi possível carregar o resumo mensal. <button type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div>;

  return (
    <div className="cap-meses" role="group" aria-label="Escolher mês">
      {meses.map((m) => {
        const { total = 0, pago = 0 } = porMes?.get(m.chave) ?? {};
        const pct =
          total > 0 ? Math.min(100, Math.round((pago / total) * 100)) : 0;
        return (
          <button
            key={m.chave}
            type="button"
            aria-pressed={mesAtivo === m.chave}
            className={`cap-card cap-mes ${mesAtivo === m.chave ? "active" : ""}`}
            onClick={() => setMonth(m.chave)}
          >
            <span className="cap-card-label">
              {m.nome}
              {m.atual && <span className="cap-mes-atual">atual</span>}
            </span>
            <span className="cap-card-value">
              {porMes ? fmt.format(total) : "…"}
            </span>
            <span className="cap-mes-barra" aria-hidden="true">
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="cap-mes-pago">
              {porMes ? `${pct}% pago · ${fmt.format(pago)}` : "carregando"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const SITUACOES = {
  vencido: { label: "Vencido", tone: "danger" },
  hoje: { label: "Vence hoje", tone: "danger" },
  avencer: { label: "A vencer", tone: "info" },
  pago: { label: "Pago", tone: "ok" },
};

// Situação calculada aqui (não pelo status_traduzido do Conta Azul) pra
// bater com os mesmos 4 baldes dos cards: pago = nada em aberto; senão,
// decide pela data de vencimento vs. hoje.
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
  const { activeClientId } = useActiveClient();
  return <ContasAPagar key={activeClientId ?? "sem-empresa"} />;
}

function ContasAPagar() {
  const { saidas, loading, error, retry, awaitingClient, range } = useFinanceData();
  const { activeClientId } = useActiveClient();
  const { user } = useAuth();
  // Mães que entram nesta página (Ajustes → Contas a pagar, só master
  // escolhe). null = carregando; vazio = nada escolhido, página fica vazia.
  const [maesPermitidas, setMaesPermitidas] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [configAttempt, setConfigAttempt] = useState(0);
  useEffect(() => {
    if (!activeClientId) return;
    let cancelado = false;
    setMaesPermitidas(null);
    setConfigError(null);
    apiFetch(`/api/clientes/${activeClientId}/contas-pagar-maes`)
      .then(
        (lista) =>
          !cancelado && setMaesPermitidas(new Set(lista.map((m) => m.nome))),
      )
      .catch((err) => !cancelado && setConfigError(err.message));
    return () => {
      cancelado = true;
    };
  }, [activeClientId, configAttempt]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [categoria, setCategoria] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [venceDe, setVenceDe] = useState("");
  const [venceAte, setVenceAte] = useState("");

  const hoje = todayISO();

  const todos = (saidas?.lancamentos ?? [])
    .filter((l) => maesPermitidas?.has(l.mae))
    .map((l) => ({ ...l, situacao: situacaoDe(l, hoje) }));
  const opcoes = (campo) =>
    [...new Set(todos.map((l) => l[campo]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
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
      (!venceAte || l.data_vencimento <= venceAte),
  );
  const temFiltro = busca || categoria || fornecedor || venceDe || venceAte;
  const somaAberto = (s) =>
    lancamentos
      .filter((l) => l.situacao === s)
      .reduce((t, l) => t + l.valor_em_aberto, 0);
  const cards = [
    {
      id: "vencido",
      label: "Vencidos",
      valor: somaAberto("vencido"),
      tone: "danger",
    },
    {
      id: "hoje",
      label: "Vencem hoje",
      valor: somaAberto("hoje"),
      tone: "danger",
    },
    {
      id: "avencer",
      label: "A vencer",
      valor: somaAberto("avencer"),
      tone: "info",
    },
    {
      id: "pago",
      label: "Total pago (inclui parciais)",
      valor: lancamentos.reduce((t, l) => t + l.valor_pago, 0),
      tone: "ok",
    },
    {
      id: "todos",
      label: "Total do período",
      valor: lancamentos.reduce((t, l) => t + l.valor, 0),
      tone: "neutral",
    },
  ];

  const filtrados = lancamentos
    .filter((l) => correspondeSituacao(l, filtro))
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
  );

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

  if (loading || error || awaitingClient) return <FinanceDataState title="Contas a pagar" loading={loading} error={error} retry={retry} awaitingClient={awaitingClient} />;
  if (configError) return <FinanceDataState title="Contas a pagar" error={configError} retry={() => setConfigAttempt((value) => value + 1)} />;
  if (!maesPermitidas) return <FinanceDataState title="Contas a pagar" loading />;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Contas a pagar</h1>
          <p className="page-description">
            Organize a leitura dos vencimentos e acompanhe cada situação.
          </p>
        </div>
      </header>

      {maesPermitidas?.size === 0 && (
        <p className="pending-notice">
          Nenhuma categoria principal foi selecionada. Esta página cobre apenas as categorias configuradas.
          {user?.papel === "master" && (
            <span className="pending-notice-actions">
              <Link to="/ajustes?secao=contas-pagar" className="pending-notice-link">
                Escolher em Ajustes →
              </Link>
            </span>
          )}
          {user?.papel !== "master" && <span> Solicite à equipe Lucri a seleção das categorias.</span>}
        </p>
      )}
      {maesPermitidas.size > 0 && <p className="pending-notice">Contas das categorias selecionadas: {[...maesPermitidas].join(", ")}. Os totais não incluem outras categorias.</p>}

      {maesPermitidas.size > 0 && <MesesCards key={`${range.start}-${range.end}`} maes={maesPermitidas} />}

      <div
        className="cap-cards"
        role="group"
        aria-label="Filtrar por situação"
      >
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filtro === c.id}
            className={`cap-card ${filtro === c.id ? "active" : ""}`}
            onClick={() => escolherFiltro(c.id)}
          >
            <span className="cap-card-label">{c.label}</span>
            <span className={`cap-card-value tone-${c.tone}`}>
              {fmt.format(c.valor)}
            </span>
          </button>
        ))}
      </div>

      <div className="cap-filtros">
        <label className="cap-filtro cap-filtro-busca">
          <span className="cap-filtro-label">Buscar</span>
          <span className="cap-campo">
            <MagnifyingGlass
              size={16}
              className="cap-campo-icone"
              aria-hidden="true"
            />
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
          <span
            className={`cap-campo cap-campo-select ${categoria ? "is-set" : ""}`}
          >
            <select
              aria-label="Categoria"
              value={categoria}
              onChange={mudar(setCategoria)}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <CaretDown
              size={14}
              weight="bold"
              className="cap-campo-caret"
              aria-hidden="true"
            />
          </span>
        </label>
        <label className="cap-filtro">
          <span className="cap-filtro-label">Fornecedor</span>
          <span
            className={`cap-campo cap-campo-select ${fornecedor ? "is-set" : ""}`}
          >
            <select
              aria-label="Fornecedor"
              value={fornecedor}
              onChange={mudar(setFornecedor)}
            >
              <option value="">Todos</option>
              {fornecedores.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <CaretDown
              size={14}
              weight="bold"
              className="cap-campo-caret"
              aria-hidden="true"
            />
          </span>
        </label>
        <div className="cap-filtro">
          <span className="cap-filtro-label">Vencimento</span>
          <DateRangePicker
            ariaLabel="Faixa de vencimento"
            de={venceDe}
            ate={venceAte}
            mesInicial={todos[0]?.data_vencimento}
            onChange={({ de, ate }) => {
              setVenceDe(de);
              setVenceAte(ate);
              setPagina(1);
            }}
          />
        </div>
        {temFiltro && (
          <button type="button" className="cap-limpar" onClick={limparFiltros}>
            <X size={14} weight="bold" aria-hidden="true" />
            Limpar filtros
          </button>
        )}
      </div>

      <p role="status">{filtrados.length} título(s) · {filtro === "pago" ? "Total pago filtrado" : filtro === "todos" ? "Total filtrado" : "Em aberto filtrado"}: {fmt.format(filtrados.reduce((sum, item) => sum + valorDaSituacao(item, filtro), 0))}</p>
      <div className="data-table-wrap">
        <table className="data-table cap-table">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Resumo do lançamento</th>
              <th className="num">Total</th>
              <th className="num">Pago</th>
              <th className="num">A pagar</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={6} className="data-table-empty">
                  {loading
                    ? "Carregando..."
                    : busca
                      ? "Nenhum resultado pra essa busca."
                      : "Nenhuma conta nessa situação no período selecionado."}
                </td>
              </tr>
            )}
            {visiveis.map((l) => (
              <tr key={l.id}>
                <td className="cap-date">{fmtData(l.data_vencimento)}</td>
                <td>
                  <div className="cap-desc" title={l.descricao}>
                    {l.descricao || "—"}
                  </div>
                  <div className="cap-meta">
                    {l.categoria && (
                      <span className="cap-chip">{l.categoria}</span>
                    )}
                    {l.contraparte && (
                      <span className="cap-fornecedor">{l.contraparte}</span>
                    )}
                  </div>
                </td>
                <td className="num">{fmt.format(l.valor)}</td>
                <td className="num">{fmt.format(l.valor_pago)}</td>
                <td className="num">{fmt.format(l.valor_em_aberto)}</td>
                <td>
                  <span
                    className={`cap-badge tone-${SITUACOES[l.situacao].tone}`}
                  >
                    {SITUACOES[l.situacao].label}{l.valor_pago > 0 && l.valor_em_aberto > 0 ? " · Parcialmente pago" : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtrados.length > POR_PAGINA && (
        <nav className="cap-pager" aria-label="Paginação">
          <button
            type="button"
            disabled={paginaAtual === 1}
            onClick={() => setPagina(paginaAtual - 1)}
          >
            ‹ Anterior
          </button>
          <span>
            {(paginaAtual - 1) * POR_PAGINA + 1}–
            {Math.min(paginaAtual * POR_PAGINA, filtrados.length)} de{" "}
            {filtrados.length}
          </span>
          <button
            type="button"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPagina(paginaAtual + 1)}
          >
            Próximo ›
          </button>
        </nav>
      )}
    </div>
  );
}
