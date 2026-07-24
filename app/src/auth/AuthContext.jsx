import { createContext, useContext, useEffect, useState } from "react";

// Auth mock — decidido em conversa com o usuário: tela de login mockada
// (aceita qualquer credencial) enquanto o backend de auth real não existe.
// Troca de lugar quando a API real estiver pronta: manter a mesma forma de
// `user` ({ role, clientId, name }) para não precisar reescrever telas.

const STORAGE_KEY = "lucri-dash.auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  function login({ role, clientId, name }) {
    setUser({ role, clientId: role === "cliente" ? clientId : null, name });
  }

  function logout() {
    setUser(null);
  }

  function updateProfile({ name, avatarUrl }) {
    setUser((prev) => (prev ? { ...prev, name, avatarUrl: avatarUrl ?? prev.avatarUrl } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
