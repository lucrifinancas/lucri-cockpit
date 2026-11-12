import { Hono } from 'hono';
import { exigirPapel } from '../auth/guard.js';
import { prepararCentral, eventoUsuario } from '../db/centralAcessos.js';
import { buscarUsuarioPorId, apagarTokensResetDoUsuario, criarTokenReset } from '../db/usuarios.js';
import { criarHashSenha } from '../auth/senha.js';
import { enviarEmailResetSenha } from '../email/resend.js';
import { dentroDoLimite } from '../db/limiteTaxa.js';

export const centralAcessosRoutes = new Hono();
centralAcessosRoutes.use('*', exigirPapel('master'));
centralAcessosRoutes.use('*', async (c,next) => { await prepararCentral(c.env.DB); c.header('Cache-Control','private, no-store'); return next(); });
const valido = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
async function dados(c) { try { const text = await c.req.text(); return text.length < 4096 ? JSON.parse(text) : null; } catch { return null; } }
async function validarAcesso(db, body) {
  if (!body || !['master','analista','cliente'].includes(body.papel) || typeof body.ativo !== 'boolean') return 'Selecione um perfil e uma situação válidos.';
  if (body.papel === 'cliente') {
    if (!valido(body.cliente_id) || !await db.prepare('SELECT id FROM clientes WHERE id = ?').bind(Number(body.cliente_id)).first()) return 'Selecione a empresa do cliente.';
  } else if (body.cliente_id != null) return 'Contas da equipe Lucri não ficam vinculadas a uma única empresa.';
  return null;
}
const publicUser = `SELECT u.id, u.email, u.papel, u.cliente_id, u.ativo, u.sessao_versao, u.criado_em,
  COALESCE(p.nome, NULLIF(trim(COALESCE(u.nome,'') || ' ' || COALESCE(u.sobrenome,'')),''), u.email) AS nome,
  c.nome AS empresa FROM usuarios u LEFT JOIN usuario_perfis p ON p.usuario_id=u.id LEFT JOIN clientes c ON c.id=u.cliente_id`;
centralAcessosRoutes.get('/usuarios', async c => {
  const {results:usuarios}=await c.env.DB.prepare(publicUser+' ORDER BY u.email').all();
  const {results:convites}=await c.env.DB.prepare('SELECT v.id, v.email, v.cliente_id, c.nome AS empresa FROM convites_cliente v JOIN clientes c ON c.id=v.cliente_id ORDER BY v.email').all();
  return c.json({usuarios,convites,meu_id:c.get('usuario').sub});
});
centralAcessosRoutes.post('/usuarios', async c => {
  const body=await dados(c);const erro=await validarAcesso(c.env.DB,body);
  if(erro) return c.json({erro},400);
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  const nome=typeof body.nome==='string'?body.nome.trim():'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!nome||nome.length>100) return c.json({erro:'Informe nome e e-mail válidos.'},400);
  const convite=await c.env.DB.prepare('SELECT cliente_id FROM convites_cliente WHERE lower(email)=?').bind(email).first();
  const clienteId=body.papel==='cliente'?Number(body.cliente_id):null;
  if(convite && convite.cliente_id!==clienteId) return c.json({erro:'Esse e-mail já tem convite para outra empresa. Cancele o convite antes de mudar o acesso.'},409);
  const hash=await criarHashSenha(crypto.randomUUID()+crypto.randomUUID());
  try {
    const result=await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO usuarios (email, senha_hash, nome, papel, cliente_id, ativo)
        SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE lower(email)=?)`)
        .bind(email,hash,nome,body.papel,clienteId,body.ativo?1:0,email),
      c.env.DB.prepare(`INSERT INTO auditoria_usuarios (ator_id, usuario_id, acao, detalhes_json, request_id)
        SELECT ?, id, 'usuario_criado', json_object('papel',papel,'cliente_id',cliente_id,'ativo',ativo), ? FROM usuarios WHERE email=? AND changes()=1`)
        .bind(c.get('usuario').sub,c.get('requestId'),email),
      c.env.DB.prepare('DELETE FROM convites_cliente WHERE changes()=1 AND lower(email)=? AND EXISTS (SELECT 1 FROM usuarios WHERE email=?)').bind(email,email),
    ]);
    if(!result[0].meta.changes) return c.json({erro:'Já existe uma conta com esse e-mail.'},409);
  } catch(error) { if(/UNIQUE constraint/.test(String(error))) return c.json({erro:'Já existe uma conta com esse e-mail.'},409); throw error; }
  return c.json({ok:true},201);
});
centralAcessosRoutes.put('/usuarios/:id', async c => {
  const id=Number(c.req.param('id'));if(!valido(id)) return c.json({erro:'Usuário inválido.'},400);
  const ator=c.get('usuario').sub;
  if(id===ator) return c.json({erro:'Use outra conta administrativa para alterar suas próprias permissões ou desativar seu acesso.'},409);
  const alvo=await buscarUsuarioPorId(c.env.DB,id);if(!alvo) return c.json({erro:'Usuário não encontrado.'},404);
  const body=await dados(c);const erro=await validarAcesso(c.env.DB,body);if(erro) return c.json({erro},400);
  if(body.sessao_versao!==alvo.sessao_versao) return c.json({erro:'O acesso foi alterado por outra pessoa. Atualize a lista antes de salvar.'},409);
  const clienteId=body.papel==='cliente'?Number(body.cliente_id):null;
  if(alvo.papel===body.papel && alvo.cliente_id===clienteId && alvo.ativo===(body.ativo?1:0)) return c.json({ok:true});
  const after={papel:body.papel,cliente_id:clienteId,ativo:body.ativo?1:0};
  const result=await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE usuarios SET papel=?, cliente_id=?, ativo=?, sessao_versao=sessao_versao+1
      WHERE id=? AND id<>? AND sessao_versao=? AND (papel<>'master' OR (?='master' AND ?=1) OR (SELECT count(*) FROM usuarios WHERE papel='master' AND ativo=1)>1)`)
      .bind(body.papel,clienteId,after.ativo,id,ator,alvo.sessao_versao,body.papel,after.ativo),
    c.env.DB.prepare(`INSERT INTO auditoria_usuarios (ator_id, usuario_id, acao, detalhes_json, request_id)
      SELECT ?, ?, 'acesso_alterado', ?, ? WHERE changes()=1`).bind(ator,id,JSON.stringify({antes:{papel:alvo.papel,cliente_id:alvo.cliente_id,ativo:alvo.ativo},depois:after}),c.get('requestId')),
    c.env.DB.prepare('DELETE FROM reset_senha_tokens WHERE usuario_id=? AND changes()=1').bind(id),
  ]);
  if(!result[0].meta.changes) return c.json({erro:'Não foi possível alterar esse acesso. Atualize a lista; ao menos um administrador deve continuar ativo.'},409);
  return c.json({ok:true});
});
centralAcessosRoutes.post('/usuarios/:id/redefinir-senha', async c => {
  const id=Number(c.req.param('id'));if(!valido(id)) return c.json({erro:'Usuário inválido.'},400);
  const u=await buscarUsuarioPorId(c.env.DB,id);if(!u) return c.json({erro:'Usuário não encontrado.'},404);
  if(u.ativo===0) return c.json({erro:'Ative a conta antes de enviar a redefinição.'},409);
  if(!c.env.RESEND_API_KEY || !c.env.EMAIL_REMETENTE) return c.json({erro:'O envio de e-mails ainda não está configurado.'},503);
  if(!await dentroDoLimite(c.env.DB,`reset:${u.email}`,3,15*60)) return c.json({erro:'Limite de pedidos atingido para esse e-mail. Aguarde alguns minutos.'},429);
  const token=crypto.randomUUID()+crypto.randomUUID();
  await apagarTokensResetDoUsuario(c.env.DB,id);
  await criarTokenReset(c.env.DB,id,token,60);
  try { await enviarEmailResetSenha(c.env.RESEND_API_KEY,c.env.EMAIL_REMETENTE,{email:u.email,linkRedefinicao:`${c.env.APP_URL}/redefinir-senha?token=${token}`,expiraEmMinutos:60}); }
  catch { await apagarTokensResetDoUsuario(c.env.DB,id); return c.json({erro:'Não foi possível enviar o e-mail. Tente novamente.'},502); }
  await eventoUsuario(c.env.DB,c.get('usuario').sub,id,'redefinicao_enviada',{},c.get('requestId')).run();
  return c.json({ok:true});
});
centralAcessosRoutes.get('/auditoria',async c=>{
 const {results}=await c.env.DB.prepare(`SELECT a.id,a.acao,a.criado_em,ator.email AS ator_email,alvo.email AS usuario_email,a.detalhes_json
   FROM auditoria_usuarios a JOIN usuarios ator ON ator.id=a.ator_id JOIN usuarios alvo ON alvo.id=a.usuario_id ORDER BY a.id DESC LIMIT 50`).all();
 return c.json(results);
});
