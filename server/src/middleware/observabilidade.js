import { registrarErro } from '../db/registros.js';
import { clienteDaRequisicao, contextoAuditoria, normalizarOperacao } from '../utils/observabilidade.js';

export async function observarRequisicao(c, next) {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
  // Não duplicar erros que o navegador já enviou à própria coleta.
  if (!(c.res.status >= 500 || c.get('codigoErro'))) return;
  const event = { ...contextoAuditoria(c), requestId, origem: 'backend',
    codigo: c.get('codigoErro') ?? 'ERRO_INTERNO', operacao: normalizarOperacao(c.req.path),
    metodo: c.req.method, status: c.res.status, clienteId: clienteDaRequisicao(c) };
  console.error(JSON.stringify({ evento: 'erro_aplicacao', ...event }));
  if (c.req.path === '/api/registros/erros') return;
  const persist = registrarErro(c.env.DB, event).catch(() => {
    console.error(JSON.stringify({ evento: 'falha_registro_erro', requestId }));
  });
  try { c.executionCtx.waitUntil(persist); } catch { await persist; }
}
