import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { exigirPapel } from '../auth/guard.js';
import { dentroDoLimite } from '../db/limiteTaxa.js';
import { listarRegistros, registrarErro } from '../db/registros.js';
import { normalizarOperacao, versaoSegura } from '../utils/observabilidade.js';

export const registrosRoutes = new Hono();
export const auditoriaRoutes = new Hono();
const positiveInt = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

function pagination(c) {
  const antes = c.req.query('antes');
  const limite = c.req.query('limite') ?? '25';
  if ((antes !== undefined && !positiveInt(antes)) || !positiveInt(limite) || Number(limite) > 100) return null;
  return { antes: antes === undefined ? null : Number(antes), limite: Number(limite) };
}

registrosRoutes.get('/erros', exigirPapel('master'), async c => {
  const page = pagination(c);
  const client = c.req.query('cliente_id');
  if (!page || (client !== undefined && !positiveInt(client))) return c.json({ erro: 'Filtro de registros inválido.' }, 400);
  return c.json(await listarRegistros(c.env.DB, 'erros', { ...page, clienteId: client === undefined ? null : Number(client) }));
});

auditoriaRoutes.get('/:id/auditoria-categorias', exigirPapel('master'), async c => {
  const page = pagination(c);
  if (!page || !positiveInt(c.req.param('id'))) return c.json({ erro: 'Filtro de histórico inválido.' }, 400);
  return c.json(await listarRegistros(c.env.DB, 'auditoria', { ...page, clienteId: Number(c.req.param('id')) }));
});

// Erros de navegador são relatos, nunca eventos de auditoria. Identidade vem
// da sessão; qualquer mensagem/stack/URL enviada fora desta lista é descartada.
registrosRoutes.post('/erros', exigirPapel('master', 'analista', 'cliente'), bodyLimit({ maxSize: 2048, onError: c => c.json({ erro: 'Relato muito grande.' }, 413) }), async c => {
  const text = await c.req.text();
  if (new TextEncoder().encode(text).length > 2048) return c.json({ erro: 'Relato muito grande.' }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return c.json({ erro: 'Relato inválido.' }, 400); }
  const codes = ['FRONTEND_RUNTIME', 'FRONTEND_PROMISE', 'REDE_INDISPONIVEL', 'RESPOSTA_INVALIDA'];
  if (!body || !codes.includes(body.codigo) || typeof body.operacao !== 'string') return c.json({ erro: 'Relato inválido.' }, 400);
  const user = c.get('usuario');
  const client = body.cliente_id;
  if (client != null && !positiveInt(client)) return c.json({ erro: 'Empresa inválida.' }, 400);
  if (user.papel === 'cliente' && client != null && Number(client) !== user.cliente_id) return c.json({ erro: 'Empresa não permitida.' }, 403);
  if (!(await dentroDoLimite(c.env.DB, `registros:${user.sub}`, 20, 60))) return c.body(null, 204);
  const requestId = typeof body.referencia === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(body.referencia) ? body.referencia : c.get('requestId');
  await registrarErro(c.env.DB, {
    requestId, origem: 'frontend', codigo: body.codigo, operacao: normalizarOperacao(body.operacao),
    metodo: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(body.metodo) ? body.metodo : null,
    clienteId: user.papel === 'cliente' ? user.cliente_id : client == null ? null : Number(client),
    usuarioId: user.sub, papel: user.papel, versao: versaoSegura(body.versao),
  });
  return c.body(null, 204);
});
