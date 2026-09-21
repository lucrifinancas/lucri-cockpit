import { useEffect, useRef, useState } from "react";
import { CaretDown, CaretRight, MoonStars, Plus, Plugs, Receipt, SquaresFour, Sun, UserCircle, UserPlus, X } from "@phosphor-icons/react";
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

// Categorias de despesa agrupadas por "mãe". O Conta Azul só entrega as
// subcategorias (filhas) e o código da mãe, sem o nome: o master dá o nome de
// cada mãe aqui (uma vez por cliente) e marca quais filhas contam como despesa
// operacional — só o que estiver marcado aparece em "Despesas" no dashboard,
// agrupado pelo nome da mãe (ver API-CONTRACT.md: /categorias, /categorias-pai).
const SEM_MAE = "__sem_mae__";

function CategoriasSection({ clienteId, clienteNome }) {
  const [categorias, setCategorias] = useState([]);
  const [maes, setMaes] = useState([]);
  const [nomesMae, setNomesMae] = useState([]);
  const [novaMae, setNovaMae] = useState("");
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState(() => new Set());
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!clienteId) return;
    let cancelled = false;
    setLoading(true);
    setErro(null);
    Promise.all([
      apiFetch(`/api/clientes/${clienteId}/categorias`),
      apiFetch(`/api/clientes/${clienteId}/categorias-pai`),
      apiFetch(`/api/clientes/${clienteId}/maes`),
    ])
      .then(([cats, pais, listaMaes]) => {
        if (cancelled) return;
        const despesas = cats.filter((cat) => cat.tipo === "DESPESA");
        const nomesDespesa = new Set(despesas.map((cat) => cat.nome));
        setCategorias(despesas);
        setNomesMae(listaMaes);
        // Só as mães que têm pelo menos uma filha de despesa.
        setMaes(pais.filter((mae) => mae.categorias_filhas.some((nome) => nomesDespesa.has(nome))));
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

  // Grupos: cada mãe com as suas filhas (ligação pelo nome da filha; se o mesmo
  // nome aparece em duas mães, vale a primeira) + um grupo "sem mãe" pro resto.
  const grupos = [];
  const jaAlocadas = new Set();
  for (const mae of maes) {
    const filhas = categorias.filter((cat) => !jaAlocadas.has(cat.id) && mae.categorias_filhas.includes(cat.nome));
    filhas.forEach((cat) => jaAlocadas.add(cat.id));
    if (filhas.length > 0) grupos.push({ id: mae.categoria_pai_id, nome: mae.nome ?? "", filhas });
  }
  const semMae = categorias.filter((cat) => !jaAlocadas.has(cat.id));
  if (semMae.length > 0) grupos.push({ id: SEM_MAE, nome: null, filhas: semMae });

  // Opções do seletor: as mães cadastradas + o nome já salvo do grupo, se ele
  // veio de antes da lista existir (pra não sumir da tela).
  function opcoesMae(nomeAtual) {
    const nomes = nomesMae.map((mae) => mae.nome);
    if (nomeAtual && !nomes.some((n) => n.toLowerCase() === nomeAtual.toLowerCase())) nomes.push(nomeAtual);
    return nomes;
  }

  const termo = busca.trim().toLowerCase();
  const gruposVisiveis = grupos
    .map((grupo) => {
      const nomeGrupoBate = grupo.nome && grupo.nome.toLowerCase().includes(termo);
      const filhas = termo && !nomeGrupoBate
        ? grupo.filhas.filter((cat) => cat.nome.toLowerCase().includes(termo))
        : grupo.filhas;
      return { ...grupo, filhasVisiveis: filhas };
    })
    .filter((grupo) => !termo || grupo.filhasVisiveis.length > 0);

  function toggleCategoria(id) {
    setCategorias((prev) => prev.map((cat) => (cat.id === id ? { ...cat, is_despesa: !cat.is_despesa } : cat)));
  }

  function setNomeMae(id, nome) {
    setMaes((prev) => prev.map((mae) => (mae.categoria_pai_id === id ? { ...mae, nome } : mae)));
  }

  // A lista de mães (nomes disponíveis pra escolher) é gravada na hora, sem
  // esperar o "Salvar" — o "Salvar" grava só as marcações e a escolha de cada grupo.
  async function handleAdicionarMae(e) {
    e.preventDefault();
    const nome = novaMae.trim();
    if (!nome) return;
    setErro(null);
    try {
      const criada = await apiFetch(`/api/clientes/${clienteId}/maes`, {
        method: "POST",
        body: JSON.stringify({ nome }),
      });
      setNomesMae((prev) => [...prev, criada].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setNovaMae("");
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleRemoverMae(id) {
    setErro(null);
    try {
      await apiFetch(`/api/clientes/${clienteId}/maes/${id}`, { method: "DELETE" });
      setNomesMae((prev) => prev.filter((mae) => mae.id !== id));
    } catch (err) {
      setErro(err.message);
    }
  }

  function toggleGrupo(id) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    try {
      const marcadas = categorias
        .filter((cat) => cat.is_despesa)
        .map((cat) => ({ categoria_id: cat.id, categoria_nome: cat.nome }));
      await apiFetch(`/api/clientes/${clienteId}/categorias/despesas`, {
        method: "PUT",
        body: JSON.stringify({ categorias: marcadas }),
      });
      const nomeadas = maes
        .filter((mae) => mae.nome && mae.nome.trim())
        .map((mae) => ({ categoria_pai_id: mae.categoria_pai_id, nome: mae.nome.trim() }));
      if (nomeadas.length > 0) {
        await apiFetch(`/api/clientes/${clienteId}/categorias-pai`, {
          method: "PUT",
          body: JSON.stringify({ categorias_pai: nomeadas }),
        });
      }
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="settings-card">
      <h2 className="settings-card-title">
        <Receipt size={18} weight="regular" />
        Categorias de Despesa{clienteNome ? ` — ${clienteNome}` : ""}
      </h2>
      <p className="settings-hint">
        As categorias do Conta Azul (filhas) ficam agrupadas pela categoria-mãe. Cadastre as
        mães desse cliente, escolha qual é cada grupo e marque as filhas que contam como despesa
        operacional: só o que estiver marcado aparece em "Despesas" no dashboard, agrupado pela mãe.
      </p>
      {loading && <p className="settings-hint">Carregando categorias...</p>}
      {erro && <p className="settings-hint status-error">{erro}</p>}
      {!loading && categorias.length === 0 && !erro && (
        <p className="settings-hint">Nenhuma categoria de despesa encontrada no Conta Azul.</p>
      )}
      {!loading && categorias.length > 0 && (
        <>
          <div className="mae-cadastro">
            <form className="mae-cadastro-form" onSubmit={handleAdicionarMae}>
              <input
                className="categoria-search"
                placeholder="Cadastrar categoria-mãe (ex: Despesas Administrativas)"
                value={novaMae}
                onChange={(e) => setNovaMae(e.target.value)}
              />
              <button type="submit" className="mae-add-btn" disabled={!novaMae.trim()}>
                <Plus size={14} weight="bold" />
                Adicionar
              </button>
            </form>
            {nomesMae.length > 0 && (
              <ul className="mae-chips">
                {nomesMae.map((mae) => (
                  <li key={mae.id} className="mae-chip">
                    {mae.nome}
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
          <input
            className="categoria-search"
            placeholder="Buscar categoria ou grupo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="settings-list settings-list-scroll categoria-grupos">
            {gruposVisiveis.length === 0 && <p className="settings-hint">Nada encontrado pra essa busca.</p>}
            {gruposVisiveis.map((grupo) => {
              const aberto = Boolean(termo) || abertos.has(grupo.id);
              const marcadas = grupo.filhas.filter((cat) => cat.is_despesa).length;
              const Caret = aberto ? CaretDown : CaretRight;
              return (
                <div key={grupo.id} className="categoria-grupo">
                  <div className="categoria-grupo-head">
                    <button
                      type="button"
                      className="categoria-grupo-caret"
                      onClick={() => toggleGrupo(grupo.id)}
                      aria-expanded={aberto}
                      aria-label={aberto ? "Recolher grupo" : "Expandir grupo"}
                    >
                      <Caret size={14} weight="bold" />
                    </button>
                    {grupo.id === SEM_MAE ? (
                      <span className="categoria-grupo-semmae">Sem categoria-mãe</span>
                    ) : (
                      <select
                        className="mae-input"
                        value={grupo.nome}
                        onChange={(e) => setNomeMae(grupo.id, e.target.value)}
                      >
                        <option value="">Escolha a mãe deste grupo…</option>
                        {opcoesMae(grupo.nome).map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    )}
                    <span className="categoria-grupo-count">
                      {marcadas} de {grupo.filhas.length}
                    </span>
                  </div>
                  {aberto &&
                    grupo.filhasVisiveis.map((cat) => (
                      <label key={cat.id} className="settings-row settings-row-toggle categoria-filha">
                        <span>{cat.nome}</span>
                        <span className="toggle-switch">
                          <input type="checkbox" checked={cat.is_despesa} onChange={() => toggleCategoria(cat.id)} />
                          <span className="toggle-switch-track" />
                        </span>
                      </label>
                    ))}
                </div>
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

      {isEquipe && (
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

      {isMaster && activeClientId && (
        <CategoriasSection clienteId={activeClientId} clienteNome={activeClient?.name} />
      )}

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
            Depois de cadastrado, use "Conectar Conta Azul" acima pra autorizar o acesso aos dados
            financeiros desse cliente.
          </p>
        </section>
      )}
    </div>
  );
}
