import { useRef, useState } from "react";
import { MoonStars, Plugs, SquaresFour, Sun, UserCircle, UserPlus } from "@phosphor-icons/react";
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
