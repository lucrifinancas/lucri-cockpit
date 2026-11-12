// Camada única de acesso ao backend real (server/, ver API-CONTRACT.md no
// repo lucrifinancas/lucri-cockpit). `credentials: "include"` é obrigatório
// em todo fetch: front e back estão em domínios diferentes, e é o cookie de
// sessão (`lucri_sessao`) que autentica.
import { APP_VERSION, reportClientError } from '../data/errorTelemetry.js';

export const BASE_URL =
  import.meta.env?.VITE_API_URL ??
  "https://lucri-cockpit-server.lucrifinancas-54e.workers.dev";

export async function apiFetch(path, options = {}) {
  const requestedClient = Number(path.match(/^\/api\/clientes\/(\d+)(?:\/|$)/)?.[1]);
  const clientId = Number.isSafeInteger(requestedClient) && requestedClient > 0 ? requestedClient : null;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let resp;
  const url = new URL(`${BASE_URL}${path}`);
  // Query de versão mantém compatibilidade com o CORS do backend anterior.
  url.searchParams.set('versao_app', APP_VERSION);
  try { resp = await fetch(url.toString(), {
    ...options,
    credentials: "include",
    headers,
  }); } catch (error) {
    if (error?.name === 'AbortError') throw error;
    const reference = crypto.randomUUID();
    void reportClientError(BASE_URL, { codigo: 'REDE_INDISPONIVEL', operacao: path, metodo: options.method ?? 'GET', referencia: reference, clientId });
    const failure = new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    failure.requestId = reference;
    throw failure;
  }
  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({}));
    const failure = new Error(erro?.erro ?? `Erro ${resp.status}`);
    failure.requestId = erro?.request_id ?? resp.headers.get('X-Request-ID');
    failure.status = resp.status;
    throw failure;
  }
  if (resp.status === 204) return null;
  try { return await resp.json(); } catch {
    const reference = resp.headers.get('X-Request-ID') ?? crypto.randomUUID();
    void reportClientError(BASE_URL, { codigo: 'RESPOSTA_INVALIDA', operacao: path, metodo: options.method ?? 'GET', referencia: reference, clientId });
    const failure = new Error('A resposta do servidor não pôde ser lida. Tente novamente.');
    failure.requestId = reference;
    throw failure;
  }
}
