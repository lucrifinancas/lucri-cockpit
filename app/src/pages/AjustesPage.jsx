import { useRef, useState } from "react";
import { MoonStars, Plugs, SquaresFour, Sun, UserCircle, UserPlus } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS, isInternalRole } from "../auth/roles";
import { useActiveClient } from "../context/ClientContext";
import { useTheme } from "../context/ThemeContext";
import { MOCK_CLIENTS, getClientById } from "../data/mockClients";
import { HOME_CARDS, useHomeCardPrefs } from "../hooks/useHomeCardPrefs";
import ClientAvatar from "../components/ClientAvatar";
import "../styles/page.css";
import "./AjustesPage.css";

export default function AjustesPage() {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isEquipe = isInternalRole(user?.role);
  const isMaster = user?.role === "master";
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [newName, setNewName] = useState("");
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl ?? null);
  const [profileSaved, setProfileSaved] = useState(false);
  const avatarInputRef = useRef(null);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileAvatar(reader.result);
    reader.readAsDataURL(file);
  }
  const { activeClientId } = useActiveClient();
  const activeClient = getClientById(activeClientId);
  const { isVisible, setOverride } = useHomeCardPrefs(activeClientId, activeClient?.tipo);

  const visibleClients = isEquipe ? clients : clients.filter((c) => c.id === user.clientId);

  function handleAddClient(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "-");
    setClients((prev) => [...prev, { id, name: newName.trim(), tipo: "produto" }]);
    setNewName("");
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    if (!profileName.trim()) return;
    updateProfile({ name: profileName.trim(), avatarUrl: profileAvatar });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  return (
    <div className="page">
      <h1 className="page-title">Ajustes</h1>

      <section className="settings-card">
        <h2 className="settings-card-title">
          <UserCircle size={18} weight="regular" />
          Meu perfil
        </h2>
        <div className="profile-avatar-row">
          <ClientAvatar client={{ name: profileName || user?.name, logoUrl: profileAvatar }} size={64} />
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
            Perfil de acesso
            <span className="status-badge status-role">{ROLE_LABELS[user?.role] ?? user?.role}</span>
          </div>
          <button type="submit" className="profile-save">
            {profileSaved ? "Salvo!" : "Salvar"}
          </button>
        </form>
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

      <section className="settings-card">
        <h2 className="settings-card-title">
          <Plugs size={18} weight="regular" />
          Conexões (Conta Azul)
        </h2>
        <div className="settings-list">
          {visibleClients.map((c) => (
            <div key={c.id} className="settings-row">
              <span>{c.name}</span>
              <span className="status-badge status-pending">
                <span className="status-badge-dot" />
                Aguardando credenciais
              </span>
            </div>
          ))}
        </div>
        <p className="settings-hint">
          Status real depende do acesso à API do Conta Azul, ainda não solicitado
          — todos os clientes aparecem como pendente até lá.
        </p>
      </section>

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
          <p className="settings-hint">
            Marca só o que quer ver na Home desse cliente. Sem marcar nada,
            usa o padrão automático (cards de recorrência só aparecem pra
            cliente tipo "serviço").
          </p>
        </section>
      )}

      {isMaster && (
        <section className="settings-card">
          <h2 className="settings-card-title">
            <UserPlus size={18} weight="regular" />
            Cadastrar cliente novo (admin)
          </h2>
          <form className="onboarding-form" onSubmit={handleAddClient}>
            <input
              placeholder="Nome do cliente"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit">Cadastrar e iniciar conexão Conta Azul</button>
          </form>
          <p className="settings-hint">
            Mock local (não persiste) — no backend real esse fluxo cria o
            registro do cliente e inicia o redirect OAuth do Conta Azul dele.
          </p>
        </section>
      )}
    </div>
  );
}
