import { useEffect, useRef, useState } from "react";
import { MoonStars, Plus, Plugs, Receipt, SquaresFour, Sun, UserCircle, UserPlus, X } from "@phosphor-icons/react";
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

// Despesas do cliente (categorias do Conta Azul) ligadas a uma categoria-mãe.
// O master cadastra as mães do cliente (ex: "Despesas Fixas") e escolhe a mãe
// de cada despesa. Regra: ter mãe = conta como despesa operacional; sem mãe
// fica fora do dashboard. No dashboard (Home) aparece a mãe, e dentro dela as
// despesas (ver API-CONTRACT.md: /categorias, /maes, PUT /categorias/despesas).
function CategoriasSection({ clienteId, clienteNome }) {
  const [categorias, setCategorias] = useState([]);
  const [nomesMae, setNomesMae] = useState([]);
  const [novaMae, setNovaMae] = useState("");
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
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
      apiFetch(`/api/clientes/${clienteId}/maes`),
    ])
      .then(([cats, listaMaes]) => {
        if (cancelled) return;
        setCategorias(cats.filter((cat) => cat.tipo === "DESPESA"));
        setNomesMae(listaMaes);
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

  // A lista de mães é gravada na hora; o "Salvar" grava só a mãe de cada despesa.
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

  function setMaeDaCategoria(categoriaId, valor) {
    const maeId = valor === "" ? null : Number(valor);
    setCategorias((prev) => prev.map((cat) => (cat.id === categoriaId ? { ...cat, mae_id: maeId } : cat)));
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    try {
      // Só vai o que tem mãe: sem mãe, a despesa deixa de contar.
      const comMae = categorias
        .filter((cat) => cat.mae_id != null)
        .map((cat) => ({ categoria_id: cat.id, categoria_nome: cat.nome, mae_id: cat.mae_id }));
      await apiFetch(`/api/clientes/${clienteId}/categorias/despesas`, {
        method: "PUT",
        body: JSON.stringify({ categorias: comMae }),
      });
      // O que estava marcado de antes, sem mãe, deixou de contar: reflete na tela.
      setCategorias((prev) => prev.map((cat) => ({ ...cat, is_despesa: cat.mae_id != null })));
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const termo = busca.trim().toLowerCase();
  const visiveis = categorias.filter((cat) => {
    if (termo && !cat.nome.toLowerCase().includes(termo)) return false;
    if (filtro === "sem" && cat.mae_id != null) return false;
    if (filtro === "com" && cat.mae_id == null) return false;
    return true;
  });
  const comMaeTotal = categorias.filter((cat) => cat.mae_id != null).length;

  return (
    <section className="settings-card">
      <h2 className="settings-card-title">
        <Receipt size={18} weight="regular" />
        Categorias de Despesa{clienteNome ? ` — ${clienteNome}` : ""}
      </h2>
      <p className="settings-hint">
        Cadastre as categorias-mãe desse cliente (ex: Despesas Fixas) e escolha a mãe de cada
        despesa. Despesa com mãe conta no dashboard, agrupada pela mãe; sem mãe, fica de fora.
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
                placeholder="Cadastrar categoria-mãe (ex: Despesas Fixas)"
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
          <div className="categoria-filtros">
            <input
              className="categoria-search"
              placeholder="Buscar despesa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select className="categoria-filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              <option value="sem">Sem mãe</option>
              <option value="com">Com mãe</option>
            </select>
          </div>
          <p className="settings-hint">
            {comMaeTotal} de {categorias.length} despesas com mãe.
          </p>
          <div className="settings-list settings-list-scroll categoria-lista">
            {visiveis.length === 0 && <p className="settings-hint">Nada encontrado.</p>}
            {visiveis.map((cat) => (
              <div key={cat.id} className="settings-row categoria-linha">
                <span className="categoria-linha-nome">
                  {cat.nome}
                  {cat.is_despesa && cat.mae_id == null && (
                    <span className="categoria-legado">contava antes — escolha uma mãe pra manter</span>
                  )}
                </span>
                <select
                  className="categoria-mae-select"
                  value={cat.mae_id ?? ""}
                  onChange={(e) => setMaeDaCategoria(cat.id, e.target.value)}
                >
                  <option value="">Sem mãe</option>
                  {nomesMae.map((mae) => (
                    <option key={mae.id} value={mae.id}>
                      {mae.nome}
                    </option>
                  ))}
                </select>
              </div>
            ))}
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
