import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { sign } from 'hono/jwt';
import worker from '../src/index.js';
import { validarPerfil, PERFIS_SCHEMA } from '../src/db/perfis.js';
const secret = 'somente-para-testes-de-acesso-assistido';
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
async function token(id = 1, version = 1) {
  return sign({ sub: id, versao: version, exp: Math.floor(Date.now()/1000) + 3600 }, secret);
}
async function request(db, path, { method = 'GET', body, cookie, id = 1, origin = 'https://app.example.test' } = {}) {
  cookie ??= `lucri_sessao=${await token(id)}`;
  return worker.fetch(new Request('https://api.example.test/api' + path, { method,
    headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
    ...(body !== undefined ? {body:JSON.stringify(body)} : {}) }), { DB:db, JWT_SECRET:secret, APP_URL:'https://app.example.test' });
}
async function start(db) {
  const root = `lucri_sessao=${await token()}`;
  const r = await request(db, '/admin/usuarios/3/acessar', { method:'POST', cookie:root });
  assert.equal(r.status,200);
  const cookie = r.headers.getSetCookie().find(c => c.startsWith('lucri_visao=')).split(';')[0];
  assert.ok(!r.headers.getSetCookie().some(c => c.startsWith('lucri_sessao=')), 'preserva cookie original');
  return root + '; ' + cookie;
}
const foto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=';

test('perfil do cliente é persistido no servidor e compartilhado com nova sessão',async t=>{
  const {db,sql}=database(t);
  const r=await request(db,'/admin/usuarios/3/perfil',{method:'PUT',body:{name:'Nome preparado',avatarUrl:foto}});
  assert.equal(r.status,200);
  assert.deepEqual(await (await request(db,'/perfil',{id:3})).json(),{name:'Nome preparado',avatarUrl:foto});
  const listed=await (await request(db,'/clientes/7/usuarios')).json();
  assert.equal(listed[0].nome_exibicao,'Nome preparado');
  assert.equal(listed[0].senha_hash,undefined);
  const audit=sql.prepare('SELECT * FROM auditoria_acessos').get();
  assert.equal(audit.ator_id,1);assert.equal(audit.usuario_id,3);
  assert.ok(!audit.detalhes_json.includes('base64'));
  assert.equal(sql.prepare('SELECT sessao_versao FROM usuarios WHERE id=3').get().sessao_versao,1);
});
test('cliente e analista não editam nem acessam terceiros',async t=>{
 const {db}=database(t);
 for(const id of [2,3]) for(const [method,path] of [['GET','/admin/usuarios/3/perfil'],['PUT','/admin/usuarios/3/perfil'],['POST','/admin/usuarios/3/acessar'],['GET','/clientes/7/auditoria-acessos'],['POST','/admin/voltar']]) {
  assert.equal((await request(db,path,{method,id,body:method==='PUT'?{name:'x',avatarUrl:null}:undefined})).status,403);
 }
});
test('perfil próprio ignora IDs enviados no corpo e registra o autor real',async t=>{
 const {db,sql}=database(t);
 assert.equal((await request(db,'/perfil',{id:3,method:'PUT',body:{name:'Cliente',avatarUrl:null,usuario_id:4}})).status,200);
 const row=sql.prepare('SELECT * FROM usuario_perfis').get();assert.equal(row.usuario_id,3);
 assert.equal(sql.prepare('SELECT ator_id FROM auditoria_acessos').get().ator_id,3);
});
test('visão usa apenas permissões e tenant do cliente; edição registra o administrador',async t=>{
 const {db,sql}=database(t);const cookie=await start(db);
 const me=await (await request(db,'/auth/me',{cookie})).json();
 assert.equal(me.papel,'cliente');assert.equal(me.email,'cliente@example.test');assert.equal(me.cliente_id,7);
 assert.equal(me.acesso_assistido.administrador_id,1);
 assert.equal((await request(db,'/clientes/7',{cookie})).status,200);
 assert.equal((await request(db,'/clientes/8',{cookie})).status,403);
 assert.equal((await request(db,'/admin/usuarios/4/acessar',{cookie,method:'POST'})).status,403);
 assert.equal((await request(db,'/auth/alterar-senha',{cookie,method:'POST',body:{senha_atual:'x',senha_nova:'12345678'}})).status,403);
 assert.equal((await request(db,'/perfil',{cookie,method:'PUT',body:{name:'Preparado na visão',avatarUrl:null}})).status,200);
 const event=sql.prepare("SELECT * FROM auditoria_acessos WHERE acao='perfil_atualizado'").get();
 assert.equal(event.ator_id,1);assert.equal(event.usuario_id,3);
 const back=await request(db,'/admin/voltar',{cookie,method:'POST'});assert.equal(back.status,200);
 assert.equal((await back.json()).papel,'master');assert.match(back.headers.get('Set-Cookie'),/lucri_visao=;/);
 assert.equal(sql.prepare("SELECT count(*) AS n FROM auditoria_acessos WHERE acao='acesso_encerrado'").get().n,1);
});
test('token expirado, adulterado, outro administrador e sessões revogadas falham fechados',async t=>{
 const {db,sql}=database(t); const root=await token();const now=Math.floor(Date.now()/1000);
 const claims={tipo:'visao_cliente',ator_id:1,ator_versao:1,alvo_id:3,alvo_versao:1,exp:now+100};
 for(const patch of [{exp:now-1},{ator_id:2},{alvo_versao:2},{tipo:'outro'}]) {
  const visao=await sign({...claims,...patch},secret);
  assert.equal((await request(db,'/auth/me',{cookie:`lucri_sessao=${root}; lucri_visao=${visao}`})).status,401);
 }
 assert.equal((await request(db,'/auth/me',{cookie:`lucri_sessao=${root}; lucri_visao=invalido`})).status,401);
 const expired=await sign({...claims,exp:now-1},secret);
 assert.equal((await request(db,'/admin/voltar',{method:'POST',cookie:`lucri_sessao=${root}; lucri_visao=${expired}`})).status,200);
 const cookie=await start(db);
 sql.exec('UPDATE usuarios SET sessao_versao=2 WHERE id=1');
 assert.equal((await request(db,'/auth/me',{cookie})).status,401);
 assert.equal((await request(db,'/admin/voltar',{method:'POST',cookie})).status,401);
});
test('não inicia visão de equipe, IDs inválidos e CSRF de outra origem',async t=>{
 const {db}=database(t);
 for(const id of ['1','2','999','abc','0','1.5']) assert.equal((await request(db,`/admin/usuarios/${id}/acessar`,{method:'POST'})).status,404);
 assert.equal((await request(db,'/admin/usuarios/3/acessar',{method:'POST',origin:'https://fora.example.test'})).status,403);
 assert.equal((await request(db,'/perfil',{method:'PUT',body:{name:'X',avatarUrl:null},origin:'https://fora.example.test'})).status,403);
});
test('validação recusa nomes vazios, SVG, URLs e fotos grandes ou malformadas',()=>{
 for(const body of [null,{}, {name:'',avatarUrl:null},{name:'x'.repeat(101),avatarUrl:null},{name:'X',avatarUrl:'https://foto.example/a.png'},{name:'X',avatarUrl:'data:image/svg+xml;base64,PHN2Zz4='},{name:'X',avatarUrl:'data:image/png;base64,YWJj'}, {name:'X',avatarUrl:'x'.repeat(180001)}]) assert.ok(validarPerfil(body));
 assert.equal(validarPerfil({name:' Nome ',avatarUrl:foto}),null);
 assert.equal(validarPerfil({name:' Nome ',avatarUrl:null}),null);
});
test('falha na auditoria impede salvar o perfil',async t=>{
 const {db,sql}=database(t);
 sql.exec("CREATE TRIGGER impedir_auditoria BEFORE INSERT ON auditoria_acessos BEGIN SELECT RAISE(ABORT, 'falha'); END;");
 const r=await request(db,'/perfil',{method:'PUT',body:{name:'Não salvar',avatarUrl:null}});
 assert.equal(r.status,500);assert.equal(sql.prepare('SELECT count(*) AS n FROM usuario_perfis').get().n,0);
});
test('schema runtime corresponde à migração e pode inicializar banco antigo',async t=>{
 const {db,sql}=database(t);sql.exec('DROP TABLE auditoria_acessos; DROP TABLE usuario_perfis;');
 assert.equal((await request(db,'/perfil')).status,200);
 const migration=readFileSync(new URL('../src/db/migrations/0015_perfis_acesso_assistido.sql',import.meta.url),'utf8');
 assert.equal(migration.trim(),PERFIS_SCHEMA.join(';\n\n')+';');
});

test('revogar ou mudar o papel do alvo encerra a visão sem recuperar privilégios',async t=>{
 const {db,sql}=database(t);const cookie=await start(db);
 sql.exec('UPDATE usuarios SET sessao_versao=2 WHERE id=3');
 assert.equal((await request(db,'/auth/me',{cookie})).status,401);
 assert.equal((await request(db,'/admin/voltar',{cookie,method:'POST'})).status,200);
 sql.exec("UPDATE usuarios SET sessao_versao=1, papel='analista' WHERE id=3");
 assert.equal((await request(db,'/auth/me',{cookie})).status,401);
});
test('logout apaga os dois cookies e histórico só aparece ao administrador da consulta',async t=>{
 const {db}=database(t);const cookie=await start(db);
 const out=await request(db,'/auth/logout',{cookie,method:'POST'});
 assert.equal(out.headers.getSetCookie().length,2);
 const a=await (await request(db,'/clientes/7/auditoria-acessos')).json();
 const b=await (await request(db,'/clientes/8/auditoria-acessos')).json();
 assert.equal(a.length,1);assert.equal(a[0].administrador_email,'admin@example.test');assert.equal(b.length,0);
});
