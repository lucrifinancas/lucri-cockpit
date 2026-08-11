import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../api/client";

// Auth real (backend documentado em API-CONTRACT.md) — sessão via cookie
// httpOnly, não localStorage. `user` = { email, papel, cliente_id }. Ao
// carregar a aplicação, `GET /api/auth/me` diz se já existe sessão válida.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  async function login({ email, senha }) {
    const dados = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    setUser(dados);
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  async function alterarSenha({ senhaAtual, senhaNova }) {
    await apiFetch("/api/auth/alterar-senha", {
      method: "POST",
      body: JSON.stringify({ senha_atual: senhaAtual, senha_nova: senhaNova }),
    });
  }

  return (
    <AuthContext.Provider value={{ user, checkingSession, login, logout, alterarSenha }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
