export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'local';
const CODES = new Set(['FRONTEND_RUNTIME', 'FRONTEND_PROMISE', 'REDE_INDISPONIVEL', 'RESPOSTA_INVALIDA']);
const PAGES = new Set(['/', '/entradas', '/saidas', '/despesas', '/caixa', '/contas-a-pagar', '/balanco', '/dre', '/relatorios', '/ajustes', '/busca', '/redefinir-senha']);
let activeClientId = null;
let installed = false;
const recent = new Map();

export function setTelemetryClient(id) { activeClientId = Number.isSafeInteger(Number(id)) && Number(id) > 0 ? Number(id) : null; }

// O caminho original nunca sai do navegador: queries e valores de segmentos
// livres são descartados antes do envio; o backend aplica sua própria lista.
export function safeOperation(value) {
  const path = String(value ?? '').split(/[?#]/, 1)[0];
  if (PAGES.has(path)) return path;
  const normalized = path.replace(/^(\/api\/central-acessos\/usuarios)\/\d+/, '$1/:usuarioId').replace(/^(\/api\/admin\/usuarios)\/\d+/, '$1/:usuarioId').replace(/^(\/api\/clientes)\/\d+/, '$1/:id')
    .replace(/^(\/api\/clientes\/:id\/(?:maes|maes-receita|convites|relatorios))\/[^/]+/, '$1/:item');
  if (/^\/api\/central-acessos\/(?:usuarios|auditoria|usuarios\/:usuarioId(?:\/redefinir-senha)?)$/.test(normalized)) return normalized;
  if (/^\/api\/(?:perfil|admin\/(?:sessao|voltar)|admin\/usuarios\/:usuarioId\/(?:perfil|acessar)|clientes\/:id\/auditoria-acessos)$/.test(normalized)) return normalized;
  return /^\/api\/(?:clientes(?:\/:id(?:\/(?:home|entradas|saidas|despesas|caixa|dre|balanco|historico-mensal|categorias|maes|maes-receita|contas-pagar-maes|auditoria-categorias|categorias-pai|convites|usuarios|login|relatorios))?(?:\/(?:receitas|despesas|:item)(?:\/arquivo)?)?)?|auth\/(?:me|login|logout|alterar-senha|esqueci-senha|redefinir-senha)|registros\/erros)$/.test(normalized) ? normalized : '/desconhecida';
}

export async function reportClientError(base, { codigo, operacao, metodo, referencia = crypto.randomUUID(), clientId = activeClientId }) {
  if (!CODES.has(codigo) || safeOperation(operacao) === '/api/registros/erros') return;
  const operation = safeOperation(operacao);
  const key = JSON.stringify([codigo, operation, metodo, clientId]);
  const now = Date.now();
  if (recent.has(key) && now - recent.get(key) < 60_000) return;
  if (recent.size >= 100) recent.delete(recent.keys().next().value);
  recent.set(key, now);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${base}/api/registros/erros`, {
      method: 'POST', credentials: 'include', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, operacao: operation, metodo: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo) ? metodo : undefined,
        cliente_id: clientId, versao: APP_VERSION, referencia }),
    });
  } catch { /* Telemetria indisponível nunca bloqueia nem gera outro relato. */ }
  finally { clearTimeout(timeout); }
}

export function installErrorTelemetry(base) {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', event => {
    if (event.error) void reportClientError(base, { codigo: 'FRONTEND_RUNTIME', operacao: window.location.pathname });
  });
  window.addEventListener('unhandledrejection', event => {
    if (event.reason?.name !== 'AbortError') void reportClientError(base, { codigo: 'FRONTEND_PROMISE', operacao: window.location.pathname });
  });
}
