// Camada única de acesso ao backend real (server/, ver API-CONTRACT.md no
// repo lucrifinancas/lucri-cockpit). `credentials: "include"` é obrigatório
// em todo fetch: front e back estão em domínios diferentes, e é o cookie de
// sessão (`lucri_sessao`) que autentica.
const BASE_URL =
  import.meta.env.VITE_API_URL ??
  "https://lucri-cockpit-server.lucrifinancas-54e.workers.dev";

export async function apiFetch(path, options = {}) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({}));
    throw new Error(erro.erro ?? `Erro ${resp.status}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}
