import { useState } from "react";
import { useAuth } from "./AuthContext";
import { MOCK_CLIENTS } from "../data/mockClients";
import logo from "../assets/lucri-logo.png";
import logoLockup from "../assets/lucri-cockpit-lockup-transparent.png";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState("equipe_lucri");
  const [clientId, setClientId] = useState(MOCK_CLIENTS[0].id);
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    login({ role, clientId, name: name || (role === "equipe_lucri" ? "Equipe Lucri" : "Cliente") });
  }

  function handleDevLogin() {
    login({ role: "equipe_lucri", clientId: MOCK_CLIENTS[0].id, name: "Dev" });
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <form className="login-form-pane" onSubmit={handleSubmit}>
          <img src={logo} alt="Lucri" className="login-logo" />
          <h1>Entrar no dashboard</h1>
          <p className="login-hint">
            Login mockado — sem backend de auth real ainda. Qualquer nome é aceito.
          </p>

          <label className="login-field">
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </label>

          <label className="login-field">
            Perfil de acesso
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="equipe_lucri">Equipe Lucri (vê todos os clientes)</option>
              <option value="cliente">Cliente final (vê só os próprios dados)</option>
            </select>
          </label>

          {role === "cliente" && (
            <label className="login-field">
              Qual cliente você é
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {MOCK_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button type="submit" className="login-submit">
            Entrar
          </button>

          <button type="button" className="login-dev" onClick={handleDevLogin}>
            Entrar como DEV
          </button>
        </form>

        <div className="login-showcase-pane">
          <div className="login-showcase-cards">
            <div className="login-preview-card login-preview-card-back">
              <div className="login-preview-card-header">
                <span>Saldo em conta</span>
                <span className="login-preview-dot" />
              </div>
              <strong className="login-preview-value">R$ 37.244,12</strong>
              <div className="login-preview-bar">
                <span style={{ width: "68%", background: "var(--lucri-mint)" }} />
              </div>
            </div>

            <div className="login-preview-card login-preview-card-front">
              <div className="login-preview-card-header">
                <span>Entradas do mês</span>
              </div>
              <strong className="login-preview-value">R$ 70.670,87</strong>
              <div className="login-preview-row">
                <span>Recorrentes</span>
                <span className="login-preview-pill">84%</span>
              </div>
              <div className="login-preview-row">
                <span>Pontuais</span>
                <span className="login-preview-pill">6%</span>
              </div>
            </div>
          </div>

          <img src={logoLockup} alt="Lucri Cockpit" className="login-showcase-logo" />
          <h2>Clareza financeira pra decidir sem achismo</h2>
          <p>
            A Lucri centraliza receitas, despesas e caixa dos seus clientes em um só painel —
            visão completa pra tomar decisão com segurança.
          </p>

          <div className="login-showcase-dots">
            <span className="active" />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
