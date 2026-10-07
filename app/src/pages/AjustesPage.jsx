import { useEffect, useRef, useState } from "react";
import { EnvelopeSimple, HandCoins, MoonStars, Plus, Plugs, Receipt, SquaresFour, Sun, UserCircle, UserPlus, X } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS, isInternalRole } from "../auth/roles";
import { useActiveClient } from "../context/ClientContext";
import { useTheme } from "../context/ThemeContext";
import { useLocalProfile } from "../hooks/useLocalProfile";
import { HOME_CARDS, useHomeCardPrefs } from "../hooks/useHomeCardPrefs";
import { apiFetch } from "../api/client";
import ClientAvatar from "../components/ClientAvatar";
import "../styles/page.css";
import "./AjustesPage.css";

const contaAzulParam = new URLSearchParams(window.location.search).get("contaazul");

// A categoria master é escolhida despesa por despesa (não pelo agrupamento
// do Conta Azul, que mistura categorias sem relação — ex: exame médico
// dentro de "Confraternizações"). O master escolhe a categoria master ativa
// aqui em cima e clica nas despesas que pertencem a ela; pode marcar várias
// de uma vez. Despesa sem categoria master aparece como "Sem mãe" na Home
// (ver API-CONTRACT.md: /categorias, /maes, PUT /categorias/despesas).
// Receitas usam a mesma tela com lista de mães própria (/maes-receita, PUT
// /categorias/receitas) e sem o override "conta como despesa?".
const CATEGORIAS_TIPO = {
  despesa: {
    tipoContaAzul: "DESPESA",
    campoMae: "mae_id",
    rotaMaes: "maes",
    rotaSalvar: "categorias/despesas",
    titulo: "Categorias de Despesa",
    Icone: Receipt,
    item: "despesa",
    itens: "despesas",
    exemploMae: "Despesas Administrativas",
    explicacao:
      "O Conta Azul agrupa despesas do jeito dele, que às vezes mistura coisas sem relação (ex: exame médico junto de confraternização). Aqui você cria suas categorias master, escolhe uma como ativa e clica nas despesas que pertencem a ela — dá pra marcar várias de uma vez.",
  },
  receita: {
    tipoContaAzul: "RECEITA",
    campoMae: "mae_receita_id",
    rotaMaes: "maes-receita",
    rotaSalvar: "categorias/receitas",
    titulo: "Categorias de Receita",
    Icone: HandCoins,
    item: "receita",
    itens: "receitas",
    exemploMae: "Serviços",
    explicacao:
      "Igual às despesas, com uma lista de categorias master só das receitas. Crie as categorias master, escolha uma como ativa e clique nas receitas que pertencem a ela. A Home e a página Entradas agrupam as receitas por elas.",
  },
};

function CategoriasSection({ clienteId, clienteNome, tipo = "despesa" }) {
  const config = CATEGORIAS_TIPO[tipo];
  const [categorias, setCategorias] = useState([]);
  const [maes, setMaes] = useState([]);
  const [maeAtivaId, setMaeAtivaId] = useState(null);
  const [novaMae, setNovaMae] = useState("");
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!clienteId) return;
    let cancelled = false;
    setLoading(true);
    setErro(null);
    setMaeAtivaId(null);
    Promise.all([
      apiFetch(`/api/clientes/${clienteId}/categorias`),
      apiFetch(`/api/clientes/${clienteId}/${config.rotaMaes}`),
    ])
      .then(([cats, listaMaes]) => {
        if (cancelled) return;
        const doTipo = cats
          .filter((cat) => cat.tipo === config.tipoContaAzul)
          .map((cat) => ({
            id: cat.id,
            nome: cat.nome,
            mae_id: cat[config.campoMae],
            is_despesa: cat.is_despesa,
            overridden: cat.overridden,
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        setCategorias(doTipo);
        setMaes(listaMaes);
      })
      .catch((err) => {
        if (!cancelled) setErro(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, config]);

  async function handleAdicionarMae(e) {
    e.preventDefault();
    const nome = novaMae.trim();
    if (!nome) return;
    setErro(null);
    try {
      const criada = await apiFetch(`/api/clientes/${clienteId}/${config.rotaMaes}`, {
        method: "POST",
        body: JSON.stringify({ nome }),
      });
      setMaes((prev) => [...prev, criada].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setNovaMae("");
      setMaeAtivaId(criada.id);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleRemoverMae(id) {
    setErro(null);
    try {
      await apiFetch(`/api/clientes/${clienteId}/${config.rotaMaes}/${id}`, { method: "DELETE" });
      setMaes((prev) => prev.filter((mae) => mae.id !== id));
      setCategorias((prev) => prev.map((cat) => (cat.mae_id === id ? { ...cat, mae_id: null } : cat)));
      setMaeAtivaId((atual) => (atual === id ? null : atual));
    } catch (err) {
      setErro(err.message);
    }
  }

  function toggleCategoriaNaMaeAtiva(categoriaId) {
    if (!maeAtivaId) return;
    setCategorias((prev) =>
      prev.map((cat) =>
        cat.id === categoriaId ? { ...cat, mae_id: cat.mae_id === maeAtivaId ? null : maeAtivaId } : cat
      )
    );
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    try {
      const atribuidas =
        tipo === "despesa"
          ? categorias
              .filter((cat) => cat.mae_id != null || cat.overridden)
              .map((cat) => ({
                categoria_id: cat.id,
                categoria_nome: cat.nome,
                mae_id: cat.mae_id ?? null,
                is_despesa: cat.overridden ? cat.is_despesa : true,
              }))
          : categorias
              .filter((cat) => cat.mae_id != null)
              .map((cat) => ({ categoria_id: cat.id, categoria_nome: cat.nome, mae_id: cat.mae_id }));
      await apiFetch(`/api/clientes/${clienteId}/${config.rotaSalvar}`, {
        method: "PUT",
        body: JSON.stringify({ categorias: atribuidas }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const maePorId = new Map(maes.map((mae) => [mae.id, mae.nome]));
  const termo = busca.trim().toLowerCase();
  const visiveis = termo ? categorias.filter((cat) => cat.nome.toLowerCase().includes(termo)) : categorias;
  const semMae = categorias.filter((cat) => cat.mae_id == null).length;
  const { Icone } = config;

  return (
    <section className="settings-card">
      <h2 className="settings-card-title">
        <Icone size={18} weight="regular" />
        {config.titulo}{clienteNome ? ` — ${clienteNome}` : ""}
      </h2>
      <p className="settings-hint">{config.explicacao}</p>
      {loading && <p className="settings-hint">Carregando categorias...</p>}
      {erro && <p className="settings-hint status-error">{erro}</p>}
      {!loading && categorias.length === 0 && !erro && (
        <p className="settings-hint">Nenhuma categoria de {config.item} encontrada no Conta Azul.</p>
      )}
      {!loading && categorias.length > 0 && (
        <>
          <div className="mae-cadastro">
            <form className="mae-cadastro-form" onSubmit={handleAdicionarMae}>
              <input
                className="categoria-search"
                placeholder={`Cadastrar categoria master (ex: ${config.exemploMae})`}
                value={novaMae}
                onChange={(e) => setNovaMae(e.target.value)}
              />
              <button type="submit" className="mae-add-btn" disabled={!novaMae.trim()}>
                <Plus size={14} weight="bold" />
                Adicionar
              </button>
            </form>
            {maes.length > 0 && (
              <ul className="mae-chips">
                {maes.map((mae) => (
                  <li
                    key={mae.id}
                    className={"mae-chip mae-chip-selecionavel" + (maeAtivaId === mae.id ? " mae-chip-ativa" : "")}
                  >
                    <button
                      type="button"
                      className="mae-chip-nome"
                      onClick={() => setMaeAtivaId((atual) => (atual === mae.id ? null : mae.id))}
                    >
                      {mae.nome}
                    </button>
                    <button
                      type="button"
                      className="mae-chip-remove"
                      onClick={() => handleRemoverMae(mae.id)}
                      aria-label={`Remover ${mae.nome}`}
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="settings-hint">
            {maeAtivaId
              ? `Categoria master ativa: ${maePorId.get(maeAtivaId)}. Clica nas ${config.itens} abaixo pra marcar ou desmarcar.`
              : `Clica numa categoria master acima pra começar a marcar as ${config.itens} dela.`}
          </p>
          <input
            className="categoria-search"
            placeholder={`Buscar ${config.item}...`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <p className={"settings-hint" + (semMae > 0 ? " categoria-faltam" : "")}>
            {semMae > 0
              ? `${semMae} de ${categorias.length} ${config.itens} sem categoria master.`
              : `Todas as ${categorias.length} ${config.itens} têm categoria master.`}
          </p>
          <div className="settings-list-scroll despesa-cat-grid">
            {visiveis.length === 0 && <p className="settings-hint">Nada encontrado.</p>}
            {visiveis.map((cat) => {
              const nomeMaeAtual = cat.mae_id != null ? maePorId.get(cat.mae_id) : null;
              const selecionadaNaAtiva = maeAtivaId != null && cat.mae_id === maeAtivaId;
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={
                    "despesa-cat-chip" +
                    (selecionadaNaAtiva ? " despesa-cat-chip-selecionada" : "") +
                    (!maeAtivaId ? " despesa-cat-chip-desabilitada" : "")
                  }
                  onClick={() => toggleCategoriaNaMaeAtiva(cat.id)}
                  disabled={!maeAtivaId}
                >
                  {cat.nome}
                  {nomeMaeAtual && !selecionadaNaAtiva && (
                    <span className="despesa-cat-chip-mae">{nomeMaeAtual}</span>
                  )}
                </button>
              );
            })}
          </div>
          <button type="button" className="profile-save" onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar"}
          </button>
        </>
      )}
    </section>
  );
}

// Convite de cliente por e-mail (ver API-CONTRACT.md: "Convites de cliente
// + autocadastro via Google", 22/09) — master reserva o e-mail, a pessoa
// entra com Google e a conta "cliente" é criada na hora, sem precisar
// definir senha manualmente. Não tem tela de "aceitar convite": o fluxo
// inteiro é pelo botão "Entrar com Google" do login.
function ConvitesSection({ clienteId, clienteNome }) {
  const [convites, setConvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoEmail, setNovoEmail] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!clienteId) return;
    let cancelled = false;
    setLoading(true);
    setErro(null);
    apiFetch(`/api/clientes/${clienteId}/convites`)
      .then((lista) => {
        if (!cancelled) setConvites(lista);
      })
      .catch((err) => {
        if (!cancelled) setErro(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId]);

  async function handleConvidar(e) {
    e.preventDefault();
    const email = novoEmail.trim();
    if (!email) return;
    setErro(null);
    setCriando(true);
    try {
      const criado = await apiFetch(`/api/clientes/${clienteId}/convites`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setConvites((prev) => [...prev, criado]);
      setNovoEmail("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCriando(false);
    }
  }

  async function handleCancelar(conviteId) {
    setErro(null);
    try {
      await apiFetch(`/api/clientes/${clienteId}/convites/${conviteId}`, { method: "DELETE" });
      setConvites((prev) => prev.filter((c) => c.id !== conviteId));
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <section className="settings-card">
      <h2 className="settings-card-title">
        <EnvelopeSimple size={18} weight="regular" />
        Convites de acesso{clienteNome ? ` — ${clienteNome}` : ""}
      </h2>
      <p className="settings-hint">
        Reserva o e-mail de quem vai acessar como cliente — na primeira vez que a pessoa entrar com
        o Google usando esse e-mail, a conta é criada sozinha, sem você precisar definir senha.
      </p>
      <form className="onboarding-form" onSubmit={handleConvidar}>
        <input
          type="email"
          placeholder="email@empresa.com"
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
        />
        <button type="submit" disabled={criando || !novoEmail.trim()}>
          {criando ? "Convidando..." : "Convidar"}
        </button>
      </form>
      {erro && <p className="settings-hint status-error">{erro}</p>}
      {loading && <p className="settings-hint">Carregando convites...</p>}
      {!loading && convites.length === 0 && !erro && (
        <p className="settings-hint">Nenhum convite pendente.</p>
      )}
      {!loading && convites.length > 0 && (
        <div className="settings-list">
          {convites.map((convite) => (
            <div key={convite.id} className="settings-row">
              <span>{convite.email}</span>
              <button
                type="button"
                className="mae-chip-remove"
                onClick={() => handleCancelar(convite.id)}
                aria-label={`Cancelar convite de ${convite.email}`}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AjustesPage() {
  const { user, alterarSenha } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isEquipe = isInternalRole(user?.papel);
  const isMaster = user?.papel === "master";
  const { clients, addClient, activeClientId, activeClient } = useActiveClient();
  const profile = useLocalProfile(user?.email);

  const [profileName, setProfileName] = useState(profile.name);
  const [profileSaved, setProfileSaved] = useState(false);
  const avatarInputRef = useRef(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaMsg, setSenhaMsg] = useState(null);
  const [senhaErro, setSenhaErro] = useState(null);

  const [newName, setNewName] = useState("");
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [erroCliente, setErroCliente] = useState(null);

  const [conectando, setConectando] = useState(null);

  const { isVisible, setOverride } = useHomeCardPrefs(activeClientId);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => profile.save({ name: profileName, avatarUrl: reader.result });
    reader.readAsDataURL(file);
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    if (!profileName.trim()) return;
    profile.save({ name: profileName.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function handleAlterarSenha(e) {
    e.preventDefault();
    setSenhaMsg(null);
    setSenhaErro(null);
    try {
      await alterarSenha({ senhaAtual, senhaNova });
      setSenhaMsg("Senha alterada com sucesso.");
      setSenhaAtual("");
      setSenhaNova("");
    } catch (err) {
      setSenhaErro(err.message);
    }
  }

  async function handleAddClient(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setErroCliente(null);
    setCriandoCliente(true);
    try {
      const criado = await apiFetch("/api/clientes", {
        method: "POST",
        body: JSON.stringify({ nome: newName.trim() }),
      });
      addClient({ id: criado.id, name: criado.nome, logoUrl: null });
      setNewName("");
    } catch (err) {
      setErroCliente(err.message);
    } finally {
      setCriandoCliente(false);
    }
  }

  async function handleConectarContaAzul(clienteId) {
    setConectando(clienteId);
    try {
      const { url } = await apiFetch(`/api/contaazul/autorizar/${clienteId}`);
      window.location.href = url;
    } catch {
      setConectando(null);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Ajustes</h1>

      {contaAzulParam && (
        <p className={`settings-hint ${contaAzulParam === "sucesso" ? "status-ok" : "status-error"}`}>
          {contaAzulParam === "sucesso"
            ? "Conta Azul conectado com sucesso."
            : "Não foi possível conectar o Conta Azul. Tenta de novo."}
        </p>
      )}

      {/* Cards em pares lado a lado (empilham em tela estreita, ver AjustesPage.css). */}
      <div className="settings-pair">
        <section className="settings-card">
          <h2 className="settings-card-title">
            <UserCircle size={18} weight="regular" />
            Meu perfil
          </h2>
          <div className="profile-avatar-row">
            <ClientAvatar client={{ name: profileName || profile.name, logoUrl: profile.avatarUrl }} size={64} />
            <div>
              <button type="button" className="profile-avatar-btn" onClick={() => avatarInputRef.current?.click()}>
                Alterar foto
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          <form className="profile-form" onSubmit={handleSaveProfile}>
            <label className="profile-field">
              Nome
              <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Seu nome" />
            </label>
            <div className="profile-field">
              E-mail
              <span className="status-badge status-role">{user?.email}</span>
            </div>
            <div className="profile-field">
              Perfil de acesso
              <span className="status-badge status-role">{ROLE_LABELS[user?.papel] ?? user?.papel}</span>
            </div>
            <button type="submit" className="profile-save">
              {profileSaved ? "Salvo!" : "Salvar"}
            </button>
          </form>

          <form className="profile-form" onSubmit={handleAlterarSenha}>
            <label className="profile-field">
              Senha atual
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="profile-field">
              Nova senha
              <input
                type="password"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
              />
            </label>
            <button type="submit" className="profile-save">
              Trocar senha
            </button>
          </form>
          {senhaMsg && <p className="settings-hint status-ok">{senhaMsg}</p>}
          {senhaErro && <p className="settings-hint status-error">{senhaErro}</p>}
        </section>
        <section className="settings-card">
          <h2 className="settings-card-title">
            {theme === "dark" ? <MoonStars size={18} weight="regular" /> : <Sun size={18} weight="regular" />}
            Aparência
          </h2>
          <label className="settings-row settings-row-toggle">
            <span>Tema escuro</span>
            <span className="toggle-switch">
              <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
              <span className="toggle-switch-track" />
            </span>
          </label>
          <p className="settings-hint">Alterna entre tema claro e escuro em todo o dashboard.</p>
        </section>
      </div>

      <div className="settings-pair">
        {isMaster && (
          <section className="settings-card">
            <h2 className="settings-card-title">
              <UserPlus size={18} weight="regular" />
              Cadastrar cliente novo
            </h2>
            <form className="onboarding-form" onSubmit={handleAddClient}>
              <input
                placeholder="Nome do cliente"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button type="submit" disabled={criandoCliente}>
                {criandoCliente ? "Cadastrando..." : "Cadastrar"}
              </button>
            </form>
            {erroCliente && <p className="settings-hint status-error">{erroCliente}</p>}
            <p className="settings-hint">
              Depois de cadastrado, use "Conectar Conta Azul" ao lado pra autorizar o acesso aos dados
              financeiros desse cliente.
            </p>
          </section>
        )}
        {isMaster && (
          <section className="settings-card">
            <h2 className="settings-card-title">
              <Plugs size={18} weight="regular" />
              Conexões (Conta Azul)
            </h2>
            <div className="settings-list">
              {clients.map((c) => (
                <div key={c.id} className="settings-row">
                  <span>{c.name}</span>
                  <button
                    type="button"
                    className="profile-avatar-btn"
                    disabled={conectando === c.id}
                    onClick={() => handleConectarContaAzul(c.id)}
                  >
                    {conectando === c.id ? "Redirecionando..." : "Conectar Conta Azul"}
                  </button>
                </div>
              ))}
            </div>
            <p className="settings-hint">
              Abre o login do Conta Azul pra autorizar o acesso desse cliente.
            </p>
          </section>
        )}
      </div>

      <div className="settings-pair">
        {isMaster && activeClientId && (
          <ConvitesSection clienteId={activeClientId} clienteNome={activeClient?.name} />
        )}
        {isEquipe && (
          <section className="settings-card">
            <h2 className="settings-card-title">
              <SquaresFour size={18} weight="regular" />
              Cards visíveis na Home{activeClient ? ` — ${activeClient.name}` : ""}
            </h2>
            <div className="settings-list">
              {HOME_CARDS.map((card) => (
                <label key={card.id} className="settings-row settings-row-toggle">
                  <span>{card.label}</span>
                  <span className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isVisible(card.id)}
                      onChange={(e) => setOverride(card.id, e.target.checked)}
                    />
                    <span className="toggle-switch-track" />
                  </span>
                </label>
              ))}
            </div>
            <p className="settings-hint">Marca só o que quer ver na Home desse cliente.</p>
          </section>
        )}
      </div>

      {isMaster && activeClientId && (
        <>
          <CategoriasSection clienteId={activeClientId} clienteNome={activeClient?.name} />
          <CategoriasSection clienteId={activeClientId} clienteNome={activeClient?.name} tipo="receita" />
        </>
      )}
    </div>
  );
}
