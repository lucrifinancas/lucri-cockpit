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

// A "mãe" das despesas é o grupo (categoria-pai) do Conta Azul. A API só
// entrega o CÓDIGO do grupo, não o nome, então o master identifica cada grupo
// uma vez — vendo uma despesa de exemplo — e escolhe a mãe dele. Toda despesa do
// grupo herda essa mãe automaticamente, inclusive as criadas depois. Grupo sem
// mãe aparece como "Sem mãe" na Home (ver API-CONTRACT.md: /categorias,
// /categorias-pai, /maes).
function CategoriasSection({ clienteId, clienteNome }) {
  const [grupos, setGrupos] = useState([]);
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
        // Só interessam os grupos que têm pelo menos uma categoria de despesa.
        const nomesDespesa = new Set(cats.filter((cat) => cat.tipo === "DESPESA").map((cat) => cat.nome));
        const comDespesa = pais
          .map((pai) => ({
            ...pai,
            despesas: pai.categorias_filhas
              .filter((nome) => nomesDespesa.has(nome))
              .sort((x, y) => x.localeCompare(y, "pt-BR")),
          }))
          .filter((pai) => pai.despesas.length > 0)
          .sort((x, y) => x.despesas[0].localeCompare(y.despesas[0], "pt-BR"));
        setGrupos(comDespesa);
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

  // A lista de mães é gravada na hora; o "Salvar" grava a mãe de cada grupo.
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

  function setMaeDoGrupo(paiId, nome) {
    setGrupos((prev) => prev.map((g) => (g.categoria_pai_id === paiId ? { ...g, nome: nome || null } : g)));
  }

  function toggleAberto(paiId) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(paiId)) novo.delete(paiId);
      else novo.add(paiId);
      return novo;
    });
  }

  const faltam = grupos.filter((g) => !g.nome).length;

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    try {
      const nomeados = grupos.filter((g) => g.nome).map((g) => ({ categoria_pai_id: g.categoria_pai_id, nome: g.nome }));
      await apiFetch(`/api/clientes/${clienteId}/categorias-pai`, {
        method: "PUT",
        body: JSON.stringify({ categorias_pai: nomeados }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? grupos.filter((g) => g.despesas.some((nome) => nome.toLowerCase().includes(termo)))
    : grupos;

  return (
    <section className="settings-card">
      <h2 className="settings-card-title">
        <Receipt size={18} weight="regular" />
        Categorias de Despesa{clienteNome ? ` — ${clienteNome}` : ""}
      </h2>
      <p className="settings-hint">
        O Conta Azul agrupa as despesas em categorias-mãe, mas só informa o código do grupo, não o
        nome. Veja a despesa de exemplo de cada grupo, escolha a mãe dele, e todas as despesas do
        grupo (inclusive as novas) passam a usar essa mãe no dashboard.
      </p>
      {loading && <p className="settings-hint">Carregando categorias...</p>}
      {erro && <p className="settings-hint status-error">{erro}</p>}
      {!loading && grupos.length === 0 && !erro && (
        <p className="settings-hint">Nenhuma categoria de despesa encontrada no Conta Azul.</p>
      )}
      {!loading && grupos.length > 0 && (
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
            placeholder="Buscar despesa pra achar o grupo dela..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <p className={"settings-hint" + (faltam > 0 ? " categoria-faltam" : "")}>
            {faltam > 0
              ? `Faltam ${faltam} de ${grupos.length} grupos sem mãe.`
              : `Todos os ${grupos.length} grupos têm mãe.`}
          </p>
          <div className="settings-list settings-list-scroll categoria-grupos-lista">
            {visiveis.length === 0 && <p className="settings-hint">Nada encontrado.</p>}
            {visiveis.map((grupo) => {
              const aberto = abertos.has(grupo.categoria_pai_id) || Boolean(termo);
              const opcoes = nomesMae.map((mae) => mae.nome);
              if (grupo.nome && !opcoes.some((n) => n.toLowerCase() === grupo.nome.toLowerCase())) opcoes.push(grupo.nome);
              const mostradas = aberto ? grupo.despesas : grupo.despesas.slice(0, 1);
              return (
                <div key={grupo.categoria_pai_id} className="categoria-grupo-item">
                  <div className="settings-row categoria-linha">
                    <span className="categoria-linha-nome">
                      <span className="categoria-grupo-exemplo">{grupo.despesas[0]}</span>
                      <button type="button" className="categoria-grupo-ver" onClick={() => toggleAberto(grupo.categoria_pai_id)}>
                        {grupo.despesas.length > 1
                          ? aberto
                            ? "Recolher"
                            : `e mais ${grupo.despesas.length - 1} despesas do grupo`
                          : "1 despesa no grupo"}
                      </button>
                    </span>
                    <select
                      className="categoria-mae-select"
                      value={grupo.nome ?? ""}
                      onChange={(e) => setMaeDoGrupo(grupo.categoria_pai_id, e.target.value)}
                    >
                      <option value="">Escolha a mãe…</option>
                      {opcoes.map((nome) => (
                        <option key={nome} value={nome}>
                          {nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  {aberto && grupo.despesas.length > 1 && (
                    <ul className="categoria-grupo-despesas">
                      {mostradas.slice(1).map((nome) => (
                        <li key={nome}>{nome}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <button type="button" className="profile-save" onClick={handleSalvar} disabled={salvando || faltam > 0}>
            {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar"}
          </button>
          {faltam > 0 && <p className="settings-hint">O Salvar libera quando todos os grupos tiverem mãe.</p>}
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
