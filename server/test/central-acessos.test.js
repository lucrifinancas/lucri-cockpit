import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { sign } from 'hono/jwt';
import worker from '../src/index.js';
import { CENTRAL_SCHEMA } from '../src/db/centralAcessos.js';
const secret='teste-central-acessos';
function database(t) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  const dir = new URL('../src/db/migrations/', import.meta.url);
  for (const name of readdirSync(dir).filter(name => name.endsWith('.sql') && !name.startsWith('._')).sort()) sql.exec(readFileSync(new URL(name, dir), 'utf8'));
  sql.exec(`INSERT INTO clientes (id, nome) VALUES (7, 'Empresa A'), (8, 'Empresa B');
    INSERT INTO usuarios (id, email, senha_hash, papel, cliente_id) VALUES
    (1,'admin@example.test','hash','master',NULL), (2,'analista@example.test','hash','analista',NULL), (3,'cliente@example.test','hash','cliente',7), (4,'outro@example.test','hash','cliente',8);`);
  const db = {
    prepare(query) {
      let args = [];
      return { bind(...values) { args = values; return this; },
        async first() { return sql.prepare(query).get(...args) ?? null; },
        async all() { return { results: sql.prepare(query).all(...args) }; },
        async run() { const result = sql.prepare(query).run(...args); return { meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } }; },
      };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sql.exec('COMMIT'); return results; }
      catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
  return { db, sql };
}
async function request(db,path,{id=1,method='GET',body,session=true,version=1,env={},origin='https://app.example.test'}={}){
 const token=session?await sign({sub:id,versao:version,exp:Math.floor(Date.now()/1000)+600},secret):null;
 return worker.fetch(new Request('https://api.example.test/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(token?{Cookie:`lucri_sessao=${token}`}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})}),{DB:db,JWT_SECRET:secret,APP_URL:'https://app.example.test',...env});
}
const access=(patch={})=>({papel:'cliente',cliente_id:7,ativo:true,...patch});
const account=(patch={})=>({nome:'Nova pessoa',email:'nova@example.test',...access(),...patch});
test('apenas master acessa central e endpoints administrativos',async t=>{
 const {db}=database(t);
 for(const id of [2,3])for(const [method,path]of[['GET','/usuarios'],['POST','/usuarios'],['PUT','/usuarios/3'],['POST','/usuarios/3/redefinir-senha'],['GET','/auditoria']]){
  assert.equal((await request(db,'/central-acessos'+path,{id,method,body:method==='POST'||method==='PUT'?account():undefined})).status,403);
 }
 assert.equal((await request(db,'/central-acessos/usuarios',{session:false})).status,401);
 assert.equal((await request(db,'/central-acessos/usuarios',{method:'POST',body:account(),origin:'https://fora.example.test'})).status,403);
});
test('listagem inclui equipe, clientes e convites sem segredos',async t=>{
 const {db,sql}=database(t);sql.exec("INSERT INTO convites_cliente (email,cliente_id) VALUES ('convite@example.test',7)");
 const r=await request(db,'/central-acessos/usuarios');assert.equal(r.status,200);
 const data=await r.json();assert.equal(data.meu_id,1);assert.equal(data.usuarios.length,4);assert.equal(data.convites[0].empresa,'Empresa A');
 for(const u of data.usuarios){assert.equal(u.senha_hash,undefined);assert.equal(u.ativo,1);}
 assert.equal(r.headers.get('Cache-Control'),'private, no-store');
});
test('cria clientes e equipe, normaliza e-mails e consome convite compatível',async t=>{
 const {db,sql}=database(t);sql.exec("INSERT INTO convites_cliente (email,cliente_id) VALUES ('nova@example.test',7)");
 for(const patch of [{email:' NOVA@example.test '},{email:'equipe@example.test',papel:'analista',cliente_id:null},{email:'adm2@example.test',papel:'master',cliente_id:null}]){
  assert.equal((await request(db,'/central-acessos/usuarios',{method:'POST',body:account(patch)})).status,201);
 }
 assert.equal(sql.prepare('SELECT count(*) AS n FROM convites_cliente').get().n,0);
 assert.equal(sql.prepare("SELECT cliente_id FROM usuarios WHERE email='equipe@example.test'").get().cliente_id,null);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM auditoria_usuarios').get().n,3);
 assert.equal((await request(db,'/central-acessos/usuarios',{method:'POST',body:account()})).status,409);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM auditoria_usuarios').get().n,3);
});
test('valida papéis, vínculo e duplicidade de convites e não grava dados inválidos',async t=>{
 const {db,sql}=database(t);
 for(const patch of [{email:'invalido'},{nome:''},{papel:'root'},{cliente_id:999},{papel:'analista'},{ativo:'sim'}])assert.equal((await request(db,'/central-acessos/usuarios',{method:'POST',body:account(patch)})).status,400);
 sql.exec("INSERT INTO convites_cliente (email,cliente_id) VALUES ('nova@example.test',8)");
 assert.equal((await request(db,'/central-acessos/usuarios',{method:'POST',body:account()})).status,409);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM usuarios').get().n,4);
});
test('alterar permissões encerra sessões anteriores e audita antes/depois',async t=>{
 const {db,sql}=database(t);
 const r=await request(db,'/central-acessos/usuarios/3',{method:'PUT',body:access({papel:'analista',cliente_id:null,sessao_versao:1})});assert.equal(r.status,200);
 const u=sql.prepare('SELECT * FROM usuarios WHERE id=3').get();assert.equal(u.papel,'analista');assert.equal(u.cliente_id,null);assert.equal(u.sessao_versao,2);
 assert.equal((await request(db,'/auth/me',{id:3})).status,401);
 const event=sql.prepare('SELECT * FROM auditoria_usuarios').get();assert.equal(event.ator_id,1);assert.equal(JSON.parse(event.detalhes_json).antes.papel,'cliente');
 assert.equal((await request(db,'/central-acessos/usuarios/3',{method:'PUT',body:access({sessao_versao:1})})).status,409);
});
test('conta desativada não autentica nem mantém sessão, reativação permite novo login',async t=>{
 const {db,sql}=database(t);
 assert.equal((await request(db,'/central-acessos/usuarios/3',{method:'PUT',body:access({ativo:false,sessao_versao:1})})).status,200);
 assert.equal((await request(db,'/auth/me',{id:3,version:2})).status,401);
 assert.equal((await request(db,'/auth/login',{method:'POST',body:{email:'cliente@example.test',senha:'qualquer'}})).status,401);
 assert.equal((await request(db,'/central-acessos/usuarios/3/redefinir-senha',{method:'POST'})).status,409);
 assert.equal((await request(db,'/central-acessos/usuarios/3',{method:'PUT',body:access({sessao_versao:2})})).status,200);
 assert.equal(sql.prepare('SELECT ativo FROM usuarios WHERE id=3').get().ativo,1);
 assert.equal((await request(db,'/auth/me',{id:3,version:3})).status,200);
});
test('não permite alterar a própria permissão e update sem mudança não revoga sessão',async t=>{
 const {db,sql}=database(t);
 assert.equal((await request(db,'/central-acessos/usuarios/1',{method:'PUT',body:access({ativo:false,sessao_versao:1})})).status,409);
 assert.equal((await request(db,'/central-acessos/usuarios/3',{method:'PUT',body:access({sessao_versao:1})})).status,200);
 assert.equal(sql.prepare('SELECT sessao_versao FROM usuarios WHERE id=3').get().sessao_versao,1);
});
test('falha na auditoria reverte criação e alteração de permissões',async t=>{
 const {db,sql}=database(t);sql.exec("CREATE TRIGGER falhar_central BEFORE INSERT ON auditoria_usuarios BEGIN SELECT RAISE(ABORT,'falha'); END;");
 assert.equal((await request(db,'/central-acessos/usuarios',{method:'POST',body:account()})).status,500);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM usuarios').get().n,4);
 assert.equal((await request(db,'/central-acessos/usuarios/3',{method:'PUT',body:access({ativo:false,sessao_versao:1})})).status,500);
 assert.equal(sql.prepare('SELECT ativo FROM usuarios WHERE id=3').get().ativo,1);
});
test('redefinição envia link por provedor simulado sem expor token à central',async t=>{
 const {db,sql}=database(t);let payload;
 t.mock.method(globalThis,'fetch',async (url,options)=>{assert.equal(url,'https://api.resend.com/emails');payload=JSON.parse(options.body);return new Response('{}',{status:200});});
 const env={RESEND_API_KEY:'somente-teste',EMAIL_REMETENTE:'teste@example.test'};
 const r=await request(db,'/central-acessos/usuarios/3/redefinir-senha',{method:'POST',env});assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true});
 assert.equal(payload.to,'cliente@example.test');assert.match(payload.html,/https:\/\/app.example.test\/redefinir-senha\?token=/);
 const token=payload.html.match(/token=([a-f0-9-]+)/)[1];
 assert.ok(!JSON.stringify(sql.prepare('SELECT * FROM reset_senha_tokens').all()).includes(token));
 assert.ok(!JSON.stringify(sql.prepare('SELECT * FROM auditoria_usuarios').all()).includes(token));
 assert.equal((await request(db,'/auth/redefinir-senha',{method:'POST',session:false,body:{token,senha_nova:'Senha-nova-segura-123'}})).status,200);
 assert.equal((await request(db,'/auth/redefinir-senha',{method:'POST',session:false,body:{token,senha_nova:'Senha-nova-segura-123'}})).status,400);
 assert.equal((await request(db,'/auth/me',{id:3})).status,401);
});
test('falha de envio não exibe sucesso e apaga o token não entregue',async t=>{
 const {db,sql}=database(t);t.mock.method(globalThis,'fetch',async()=>new Response('falha',{status:500}));
 assert.equal((await request(db,'/central-acessos/usuarios/3/redefinir-senha',{method:'POST',env:{RESEND_API_KEY:'teste',EMAIL_REMETENTE:'teste@example.test'}})).status,502);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM reset_senha_tokens').get().n,0);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM auditoria_usuarios').get().n,0);
});
test('esquema runtime prepara banco antigo e preserva usuários ativos',async t=>{
 const {db,sql}=database(t);sql.exec('DROP TABLE auditoria_usuarios; ALTER TABLE usuarios DROP COLUMN ativo;');
 assert.equal((await request(db,'/central-acessos/usuarios')).status,200);
 assert.equal(sql.prepare('SELECT ativo FROM usuarios WHERE id=1').get().ativo,1);
 assert.ok(sql.prepare("SELECT sql FROM sqlite_master WHERE name='auditoria_usuarios'").get().sql.includes('ator_id'));
 assert.ok(readFileSync(new URL('../src/db/migrations/0016_central_acessos.sql',import.meta.url),'utf8').includes(CENTRAL_SCHEMA));
});

test('Google também recusa conta desativada sem emitir sessão',async t=>{
 const {db,sql}=database(t);sql.exec('UPDATE usuarios SET ativo=0 WHERE id=3');
 t.mock.method(globalThis,'fetch',async url=>new Response(JSON.stringify(String(url).includes('/token')?{access_token:'teste'}:{email:'cliente@example.test',email_verified:true}),{status:200,headers:{'Content-Type':'application/json'}}));
 const response=await worker.fetch(new Request('https://api.example.test/api/auth/google/callback?code=teste&state=teste',{headers:{Cookie:'google_oauth_state=teste'}}),{DB:db,JWT_SECRET:secret,APP_URL:'https://app.example.test'});
 assert.equal(response.status,302);assert.equal(response.headers.get('Location'),'https://app.example.test/?google=acesso_desativado');
 assert.ok(!response.headers.getSetCookie().some(c=>c.startsWith('lucri_sessao=')));
});
test('não consome tokens de recuperação quando há conflito na edição',async t=>{
 const {db,sql}=database(t);
 await request(db,'/central-acessos/usuarios');
 sql.exec("INSERT INTO reset_senha_tokens (token_hash,usuario_id,expira_em) VALUES ('teste',3,datetime('now','+1 hour'))");
 const originalBatch=db.batch;
 db.batch=async statements=>{sql.exec('UPDATE usuarios SET sessao_versao=2 WHERE id=3');return originalBatch(statements);};
 const r=await request(db,'/central-acessos/usuarios/3',{method:'PUT',body:access({ativo:false,sessao_versao:1})});
 assert.equal(r.status,409);assert.equal(sql.prepare('SELECT count(*) AS n FROM reset_senha_tokens').get().n,1);
});
