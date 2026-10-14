import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CaretDown, CheckCircle, ListBullets, Plus, Tag, Warning, X } from "@phosphor-icons/react";
import { apiFetch } from "../../api/client";
import { useActiveClient } from "../../context/ClientContext";
import { ClienteAlvo, SecaoHeader } from "./comum";
import { rotuloSalvar } from "./util";

// Categorias = mapeamento "categoria do Conta Azul → categoria master Lucri".
// A master é escolhida categoria por categoria (não pelo agrupamento do Conta
// Azul, que mistura coisas sem relação). Sem master = "Sem mãe" na Home.
// Despesas e receitas têm listas de master próprias (ver API-CONTRACT.md:
// /categorias, /maes, /maes-receita, PUT /categorias/despesas|receitas).
const TIPOS = {
  despesa: {
    rotulo: "Despesas",
    tipoContaAzul: "DESPESA",
    campoMae: "mae_id",
    rotaMaes: "maes",
    rotaSalvar: "categorias/despesas",
    item: "despesa",
    exemploMae: "Despesas Administrativas",
  },
  receita: {
    rotulo: "Receitas",
    tipoContaAzul: "RECEITA",
    campoMae: "mae_receita_id",
    rotaMaes: "maes-receita",
    rotaSalvar: "categorias/receitas",
    item: "receita",
    exemploMae: "Serviços",
  },
};

const SEM = "sem";
const TODAS = "todas";
const porNome = (a, b) => a.nome.localeCompare(b.nome, "pt-BR");

function Mapeamento({ clienteId, tipo }) {
  const config = TIPOS[tipo];
  const [categorias, setCategorias] = useState([]);
  const [original, setOriginal] = useState(new Map());
  const [maes, setMaes] = useState([]);
  const [filtro, setFiltro] = useState(TODAS);
  const [busca, setBusca] = useState("");
  const [novaMae, setNovaMae] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!clienteId) return;
    let cancelado = false;
    setLoading(true);
    setErro(null);
    Promise.all([apiFetch(`/api/clientes/${clienteId}/categorias`), apiFetch(`/api/clientes/${clienteId}/${config.rotaMaes}`)])
      .then(([cats, listaMaes]) => {
        if (cancelado) return;
        const doTipo = cats
          .filter((c) => c.tipo === config.tipoContaAzul)
          .map((c) => ({ id: c.id, nome: c.nome, mae_id: c[config.campoMae] ?? null, is_despesa: c.is_despesa, overridden: c.overridden }))
          .sort(porNome);
        setCategorias(doTipo);
        setOriginal(new Map(doTipo.map((c) => [c.id, c.mae_id])));
        setMaes([...listaMaes].sort(porNome));
        // Abre direto no que falta classificar, se houver.
        setFiltro(doTipo.some((c) => c.mae_id == null) ? SEM : TODAS);
      })
      .catch((e) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setLoading(false));
    return () => { cancelado = true; };
  }, [clienteId, config]);

  const contagem = useMemo(() => {
    const m = new Map();
    for (const c of categorias) m.set(c.mae_id ?? SEM, (m.get(c.mae_id ?? SEM) ?? 0) + 1);
    return m;
  }, [categorias]);
  const semMae = contagem.get(SEM) ?? 0;
  const alteradas = categorias.filter((c) => (original.get(c.id) ?? null) !== c.mae_id).length;

  const termo = busca.trim().toLowerCase();
  const visiveis = categorias.filter(
    (c) => (filtro === TODAS || (filtro === SEM ? c.mae_id == null : c.mae_id === filtro)) && (!termo || c.nome.toLowerCase().includes(termo)),
  );

  function definirMae(catId, valor) {
    const maeId = valor === "" ? null : Number(valor);
    setCategorias((prev) => prev.map((c) => (c.id === catId ? { ...c, mae_id: maeId } : c)));
  }

  async function adicionarMae(e) {
    e.preventDefault();
    const nome = novaMae.trim();
    if (!nome) return;
    setErro(null);
    try {
      const criada = await apiFetch(`/api/clientes/${clienteId}/${config.rotaMaes}`, { method: "POST", body: JSON.stringify({ nome }) });
      setMaes((prev) => [...prev, criada].sort(porNome));
      setNovaMae("");
    } catch (err) {
      setErro(err.message);
    }
  }

  async function removerMae(mae) {
    const qtd = contagem.get(mae.id) ?? 0;
    if (!window.confirm(`Remover a categoria master "${mae.nome}"?${qtd ? ` ${qtd} categoria(s) voltam pra "Sem categoria".` : ""}`)) return;
    setErro(null);
    try {
      await apiFetch(`/api/clientes/${clienteId}/${config.rotaMaes}/${mae.id}`, { method: "DELETE" });
      setMaes((prev) => prev.filter((m) => m.id !== mae.id));
      setCategorias((prev) => prev.map((c) => (c.mae_id === mae.id ? { ...c, mae_id: null } : c)));
      setOriginal((prev) => new Map([...prev].map(([k, v]) => [k, v === mae.id ? null : v])));
      if (filtro === mae.id) setFiltro(TODAS);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const atribuidas =
        tipo === "despesa"
          ? categorias
              .filter((c) => c.mae_id != null || c.overridden)
              .map((c) => ({ categoria_id: c.id, categoria_nome: c.nome, mae_id: c.mae_id ?? null, is_despesa: c.overridden ? c.is_despesa : true }))
          : categorias.filter((c) => c.mae_id != null).map((c) => ({ categoria_id: c.id, categoria_nome: c.nome, mae_id: c.mae_id }));
      await apiFetch(`/api/clientes/${clienteId}/${config.rotaSalvar}`, { method: "PUT", body: JSON.stringify({ categorias: atribuidas }) });
      setOriginal(new Map(categorias.map((c) => [c.id, c.mae_id])));
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <p className="aj-hint">Carregando categorias...</p>;
  if (erro && !categorias.length) return <p className="aj-hint aj-erro">{erro}</p>;
  if (!categorias.length) return <p className="aj-hint">Nenhuma categoria de {config.item} encontrada no Conta Azul.</p>;

  return (
    <>
      {semMae > 0 && (
        <div className="aj-pendencia" role="status">
          <Warning size={20} weight="fill" aria-hidden="true" />
          <p>
            <strong>{semMae} categoria{semMae > 1 ? "s" : ""} de {config.item} precisa{semMae > 1 ? "m" : ""} ser classificada{semMae > 1 ? "s" : ""}.</strong>{" "}
            Enquanto isso, o valor delas aparece como "Sem mãe" na Home.
          </p>
          {filtro !== SEM && (
            <button type="button" className="aj-btn-util" onClick={() => setFiltro(SEM)}>Resolver agora →</button>
          )}
        </div>
      )}

      <div className="aj-mapa">
        <aside className="aj-mapa-lado" aria-label="Categorias master">
          <h3 className="aj-mapa-titulo">Categorias master</h3>
          <ul>
            <li>
              <button type="button" className={filtro === TODAS ? "ativo" : ""} onClick={() => setFiltro(TODAS)}>
                <span><ListBullets size={14} aria-hidden="true" /> Todas</span><em>{categorias.length}</em>
              </button>
            </li>
            <li>
              <button type="button" className={`aj-mapa-sem ${filtro === SEM ? "ativo" : ""}`} onClick={() => setFiltro(SEM)}>
                <span>{semMae > 0 ? <Warning size={14} weight="fill" className="aj-ic-alerta" aria-hidden="true" /> : <CheckCircle size={14} weight="fill" className="aj-ic-ok" aria-hidden="true" />} Sem categoria</span><em>{semMae}</em>
              </button>
            </li>
            {maes.map((m) => (
              <li key={m.id} className="aj-mapa-mae">
                <button type="button" className={filtro === m.id ? "ativo" : ""} onClick={() => setFiltro(m.id)}>
                  <span><Tag size={14} aria-hidden="true" /> {m.nome}</span><em>{contagem.get(m.id) ?? 0}</em>
                </button>
                <button type="button" className="aj-btn-icone" onClick={() => removerMae(m)} aria-label={`Remover ${m.nome}`} title="Remover categoria master">
                  <X size={12} weight="bold" />
                </button>
              </li>
            ))}
          </ul>
          <form className="aj-mapa-nova" onSubmit={adicionarMae}>
            <input value={novaMae} onChange={(e) => setNovaMae(e.target.value)} placeholder={`Nova (ex: ${config.exemploMae})`} aria-label="Nome da nova categoria master" />
            <button type="submit" className="aj-btn-icone" disabled={!novaMae.trim()} aria-label="Adicionar categoria master" title="Adicionar">
              <Plus size={14} weight="bold" />
            </button>
          </form>
        </aside>

        <div className="aj-mapa-conteudo">
          <input className="aj-busca" type="search" placeholder={`Buscar categoria de ${config.item}...`} value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="aj-mapa-cab" aria-hidden="true">
            <span>Categoria no Conta Azul</span>
            <span />
            <span>Categoria master Lucri</span>
          </div>
          {visiveis.length === 0 && <p className="aj-hint">{filtro === SEM && !termo ? "Tudo classificado." : "Nada encontrado."}</p>}
          <ul className="aj-mapa-linhas">
            {visiveis.map((c) => {
              const mudou = (original.get(c.id) ?? null) !== c.mae_id;
              return (
                <li key={c.id} className={mudou ? "mudou" : ""}>
                  <span className="aj-mapa-ca">{c.nome}</span>
                  <ArrowRight size={14} aria-hidden="true" className="aj-mapa-seta" />
                  <span className={`aj-select aj-select-cheio ${c.mae_id == null ? "vazio" : ""}`}>
                    <select aria-label={`Categoria master de ${c.nome}`} value={c.mae_id ?? ""} onChange={(e) => definirMae(c.id, e.target.value)}>
                      <option value="">— Sem categoria —</option>
                      {maes.map((m) => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                    <CaretDown size={12} weight="bold" aria-hidden="true" />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="aj-barra-salvar">
        <span className="aj-hint">
          {alteradas > 0 ? `${alteradas} alteração${alteradas > 1 ? "ões" : ""} não salva${alteradas > 1 ? "s" : ""}.` : "Tudo salvo."}
        </span>
        {erro && <span className="aj-hint aj-erro">{erro}</span>}
        <button type="button" className="aj-btn-primario" onClick={salvar} disabled={salvando || alteradas === 0}>{rotuloSalvar(salvando, salvo)}</button>
      </div>
    </>
  );
}

// Cockpit → Categorias: abas Despesas | Receitas.
export default function CategoriasSecao({ icone }) {
  const { activeClientId } = useActiveClient();
  const [tipo, setTipo] = useState("despesa");
  return (
    <>
      <SecaoHeader icone={icone} titulo="Categorias" descricao="Ligue cada categoria do Conta Azul a uma categoria master da Lucri. É assim que a Home agrupa receitas e despesas.">
        <ClienteAlvo />
      </SecaoHeader>
      <div className="aj-abas" role="tablist" aria-label="Tipo de categoria">
        {Object.entries(TIPOS).map(([id, t]) => (
          <button key={id} type="button" role="tab" aria-selected={tipo === id} className={tipo === id ? "ativo" : ""} onClick={() => setTipo(id)}>
            {t.rotulo}
          </button>
        ))}
      </div>
      <section className="aj-card">
        <Mapeamento key={`${activeClientId}-${tipo}`} clienteId={activeClientId} tipo={tipo} />
      </section>
    </>
  );
}
