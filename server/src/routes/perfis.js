import { Hono } from 'hono';
import { exigirPapel } from '../auth/guard.js';
import { lerSessaoOriginal, lerSessaoValida, criarVisao, encerrarVisao } from '../auth/sessao.js';
import { buscarUsuarioPorId } from '../db/usuarios.js';
import { prepararPerfis, lerPerfil, salvarPerfil, validarPerfil, registrarAcesso } from '../db/perfis.js';

export const perfisRoutes = new Hono();
const idValido = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
async function lerDados(c) {
  const text = await c.req.text();
  if (text.length > 181000) return null;
  try { return JSON.parse(text); } catch { return null; }
}
function identidade(s) {
  return { email: s.email, papel: s.papel, cliente_id: s.cliente_id, acesso_assistido: s.acesso_assistido ?? null };
}
async function alvoCliente(c) {
  if (!idValido(c.req.param('usuarioId'))) return null;
  const alvo = await buscarUsuarioPorId(c.env.DB, Number(c.req.param('usuarioId')));
  return alvo?.papel === 'cliente' && alvo.cliente_id ? alvo : null;
}
perfisRoutes.get('/perfil', exigirPapel('master', 'analista', 'cliente'), async c => {
  const u = await buscarUsuarioPorId(c.env.DB, c.get('usuario').sub);
  return c.json(await lerPerfil(c.env.DB, u));
});
perfisRoutes.put('/perfil', exigirPapel('master', 'analista', 'cliente'), async c => {
  const body = await lerDados(c);
  const erro = validarPerfil(body);
  if (erro) return c.json({ erro }, 400);
  const sessao = c.get('usuario');
  const u = await buscarUsuarioPorId(c.env.DB, sessao.sub);
  return c.json(await salvarPerfil(c.env.DB, u, sessao.acesso_assistido?.administrador_id ?? sessao.sub, body, c.get('requestId')));
});
perfisRoutes.get('/admin/usuarios/:usuarioId/perfil', exigirPapel('master'), async c => {
  const u = await alvoCliente(c);
  if (!u) return c.json({ erro: 'Usuário cliente não encontrado.' }, 404);
  return c.json({ ...await lerPerfil(c.env.DB, u), email: u.email });
});
perfisRoutes.put('/admin/usuarios/:usuarioId/perfil', exigirPapel('master'), async c => {
  const u = await alvoCliente(c);
  if (!u) return c.json({ erro: 'Usuário cliente não encontrado.' }, 404);
  const body = await lerDados(c);
  const erro = validarPerfil(body);
  if (erro) return c.json({ erro }, 400);
  return c.json(await salvarPerfil(c.env.DB, u, c.get('usuario').sub, body, c.get('requestId')));
});
perfisRoutes.post('/admin/usuarios/:usuarioId/acessar', exigirPapel('master'), async c => {
  const u = await alvoCliente(c);
  if (u?.ativo === 0) return c.json({ erro: 'O acesso dessa pessoa está desativado.' }, 409);
  if (!u) return c.json({ erro: 'Usuário cliente não encontrado.' }, 404);
  await registrarAcesso(c.env.DB, { atorId: c.get('usuario').sub, usuario: u, acao: 'acesso_iniciado', requestId: c.get('requestId') });
  await criarVisao(c, c.get('usuario'), u);
  return c.json({ ok: true });
});
// Usa a sessão original mesmo quando a visão já expirou. Nunca depende do papel do alvo.
perfisRoutes.post('/admin/voltar', async c => {
  const original = await lerSessaoOriginal(c, c.env.JWT_SECRET, c.env.DB);
  if (!original) return c.json({ erro: 'Não autenticado.' }, 401);
  if (original.papel !== 'master') return c.json({ erro: 'Sem permissão.' }, 403);
  const efetiva = await lerSessaoValida(c, c.env.JWT_SECRET, c.env.DB);
  if (efetiva?.acesso_assistido) {
    const alvo = await buscarUsuarioPorId(c.env.DB, efetiva.sub);
    await registrarAcesso(c.env.DB, { atorId: original.sub, usuario: alvo, acao: 'acesso_encerrado', requestId: c.get('requestId') });
  }
  encerrarVisao(c);
  return c.json(identidade(original));
});
perfisRoutes.get('/clientes/:clienteId/auditoria-acessos', exigirPapel('master'), async c => {
  if (!idValido(c.req.param('clienteId'))) return c.json({ erro: 'Cliente inválido.' }, 400);
  await prepararPerfis(c.env.DB);
  const { results } = await c.env.DB.prepare(`SELECT a.id, a.acao, a.criado_em, a.detalhes_json,
    ator.email AS administrador_email, alvo.email AS usuario_email FROM auditoria_acessos a
    JOIN usuarios ator ON ator.id = a.ator_id JOIN usuarios alvo ON alvo.id = a.usuario_id
    WHERE a.cliente_id = ? ORDER BY a.id DESC LIMIT 50`).bind(Number(c.req.param('clienteId'))).all();
  return c.json(results);
});

perfisRoutes.get('/admin/sessao', async c => {
  const original = await lerSessaoOriginal(c, c.env.JWT_SECRET, c.env.DB);
  if (!original || original.papel !== 'master') return c.json({ erro: 'Não autenticado.' }, 401);
  return c.json({ pode_voltar: true });
});
