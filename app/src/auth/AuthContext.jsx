import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../api/client";

// Auth real (backend documentado em API-CONTRACT.md) — sessão via cookie
// httpOnly, não localStorage. `user` = { email, papel, cliente_id }. Ao
// carregar a aplicação, `GET /api/auth/me` diz se já existe sessão válida.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReturn, setCanReturn] = useState(false);
  const [profileState, setProfileState] = useState(null);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(setUser)
      .catch(async () => {
        setUser(null);
        const original = await apiFetch('/api/admin/sessao').catch(() => null);
        setCanReturn(Boolean(original?.pode_voltar));
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const profileEmail = user?.email;
  useEffect(() => {
    if (!profileEmail) return;
    let cancelled = false;
    const email = profileEmail;
    apiFetch('/api/perfil').then(data => {
      if (!cancelled) setProfileState({ email, data });
    }).catch(error => { if (!cancelled) setProfileState({ email, error: error.message }); });
    return () => { cancelled = true; };
  }, [profileEmail]);

  async function saveProfile(patch) {
    const data = await apiFetch('/api/perfil', { method: 'PUT', body: JSON.stringify(patch) });
    setProfileState({ email: user.email, data });
    return data;
  }
  async function refreshProfile() {
    setProfileState(null);
    try { setProfileState({ email: user.email, data: await apiFetch('/api/perfil') }); }
    catch (error) { setProfileState({ email: user.email, error: error.message }); }
  }
  async function accessAs(usuarioId, clienteId) {
    await apiFetch(`/api/admin/usuarios/${usuarioId}/acessar`, { method: 'POST' });
    try { sessionStorage.setItem('lucri-admin-retorno-cliente', String(clienteId)); } catch { /* Retorno continua disponível sem armazenamento. */ }
    window.location.assign('/ajustes?secao=perfil');
  }
  async function returnToAdmin() {
    await apiFetch('/api/admin/voltar', { method: 'POST' });
    let cliente = '';
    try { cliente = sessionStorage.getItem('lucri-admin-retorno-cliente') || ''; sessionStorage.removeItem('lucri-admin-retorno-cliente'); } catch { /* Usa a seleção padrão. */ }
    window.location.assign('/ajustes?secao=acessos' + (/^[1-9]\d*$/.test(cliente) ? '&cliente=' + cliente : ''));
  }

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

  async function esqueciSenha({ email }) {
    await apiFetch("/api/auth/esqueci-senha", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async function redefinirSenha({ token, senhaNova }) {
    await apiFetch("/api/auth/redefinir-senha", {
      method: "POST",
      body: JSON.stringify({ token, senha_nova: senhaNova }),
    });
  }

  return (
    <AuthContext.Provider
      value={{ user, checkingSession, login, logout, alterarSenha, esqueciSenha, redefinirSenha,
        profileState: profileState?.email === user?.email ? profileState : null,
        saveProfile, refreshProfile, accessAs, returnToAdmin, canReturn }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
