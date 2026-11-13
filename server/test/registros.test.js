import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { sign } from 'hono/jwt';
import worker from '../src/index.js';
import { salvarCategoriasDespesa } from '../src/db/categoriaDespesa.js';
import { salvarCategoriasReceita } from '../src/db/categoriaReceita.js';
import { criarMae, removerMae, salvarMaesContasPagar } from '../src/db/categoriaMae.js';
import { criarMaeReceita, removerMaeReceita } from '../src/db/categoriaReceita.js';
import { limparRegistros } from '../src/db/registros.js';
import { normalizarOperacao } from '../src/utils/observabilidade.js';
import { salvarNomesPai } from '../src/db/categoriaPaiNome.js';
import { prepararRegistros, REGISTROS_SCHEMA } from '../src/db/registrosSchema.js';

const secret = 'somente-para-testes-de-registros';
const context = { usuarioId: 1, papel: 'master', requestId: crypto.randomUUID(), versao: 'teste.1' };
function database(t) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  const dir = new URL('../src/db/migrations/', import.meta.url);
  for (const name of readdirSync(dir).filter(name => name.endsWith('.sql') && !name.startsWith('._')).sort()) sql.exec(readFileSync(new URL(name, dir), 'utf8'));
  sql.exec(`INSERT INTO clientes (id, nome) VALUES (7, 'Empresa A'), (8, 'Empresa B');
    INSERT INTO usuarios (id, email, senha_hash, papel, cliente_id) VALUES
    (1,'admin@example.test','hash','master',NULL), (2,'analista@example.test','hash','analista',NULL), (3,'cliente@example.test','hash','cliente',7);`);
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
async function request(db, path, { method = 'GET', body, role = 'master', session = true, headers = {} } = {}) {
  const userId = { master: 1, analista: 2, cliente: 3 }[role];
  const token = session ? await sign({ sub: userId, versao: 1, exp: Math.floor(Date.now() / 1000) + 60 }, secret) : null;
  return worker.fetch(new Request(`https://api.example.test${path}`, { method,
    headers: { Origin: 'https://app.example.test', ...(token ? { Cookie: `lucri_sessao=${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), { DB: db, APP_URL: 'https://app.example.test', JWT_SECRET: secret });
}
const audits = sql => sql.prepare('SELECT * FROM auditoria_categorias ORDER BY id').all();

test('alteração e histórico de despesas são atômicos, preservam antes/depois e ignoram no-op', async t => {
  const { db, sql } = database(t);
  const a = await criarMae(db, 7, 'Administrativas', context);
  const b = await criarMae(db, 7, 'Financeiras', context);
  const category = { categoria_id: 'cat-1', categoria_nome: 'Tarifas', is_despesa: true, mae_id: a.id };
  await salvarCategoriasDespesa(db, 7, [category], context);
  await salvarCategoriasDespesa(db, 7, [{ ...category, mae_id: b.id, is_despesa: false }], context);
  const events = audits(sql);
  const last = events.at(-1);
  assert.equal(last.usuario_id, 1);
  assert.equal(last.request_id, context.requestId);
  assert.equal(JSON.parse(last.antes_json)[0].mae_nome, 'Administrativas');
  assert.equal(JSON.parse(last.depois_json)[0].mae_nome, 'Financeiras');
  assert.equal(JSON.parse(last.depois_json)[0].is_despesa, 0);
  await salvarCategoriasDespesa(db, 7, [{ ...category, mae_id: b.id, is_despesa: false }], context);
  assert.equal(audits(sql).length, events.length);
  await assert.rejects(() => salvarCategoriasDespesa(db, 7, [{ ...category, mae_id: 99999 }], context));
  assert.equal(audits(sql).length, events.length, 'falha não deixa evento de sucesso');
  assert.equal(sql.prepare('SELECT mae_id FROM categoria_despesa').get().mae_id, b.id, 'falha não deixa exclusão parcial');
});

test('se gravar auditoria falha, a categoria também não é alterada', async t => {
  const { db, sql } = database(t);
  const group = await criarMae(db, 7, 'Pessoal', context);
  sql.exec("CREATE TRIGGER falhar_auditoria BEFORE UPDATE ON auditoria_categorias BEGIN SELECT RAISE(ABORT, 'falha simulada'); END;");
  await assert.rejects(() => salvarCategoriasDespesa(db, 7, [{ categoria_id: 'salario', categoria_nome: 'Salário', is_despesa: true, mae_id: group.id }], context));
  assert.equal(sql.prepare('SELECT count(*) AS n FROM categoria_despesa').get().n, 0);
  assert.equal(audits(sql).length, 1);
});

test('receitas, criação/remoção de grupos e grupos de contas a pagar registram identidade e conteúdo', async t => {
  const { db, sql } = database(t);
  const expense = await criarMae(db, 7, 'Pessoal', context);
  const income = await criarMaeReceita(db, 7, 'Serviços', context);
  assert.equal(JSON.parse(audits(sql)[0].depois_json).id, expense.id);
  await salvarMaesContasPagar(db, 7, [expense.id], context);
  assert.equal(JSON.parse(audits(sql).at(-1).depois_json)[0].nome, 'Pessoal');
  await salvarCategoriasReceita(db, 7, [{ categoria_id: 'venda', categoria_nome: 'Consultoria', mae_id: income.id }], context);
  assert.equal(await removerMaeReceita(db, 7, income.id, context), 'em_uso');
  await salvarCategoriasReceita(db, 7, [], context);
  assert.equal(await removerMaeReceita(db, 7, income.id, context), 'ok');
  assert.equal(JSON.parse(audits(sql).at(-1).antes_json).nome, 'Serviços');
  assert.equal(audits(sql).at(-1).depois_json, 'null');
  assert.equal(await removerMae(db, 7, expense.id, context), 'ok');
  assert.equal(sql.prepare('SELECT count(*) AS n FROM contas_pagar_mae').get().n, 0);
});

test('rotas geram auditoria com ator da sessão, isolam empresa e paginam sem repetir eventos', async t => {
  const { db, sql } = database(t);
  const response = await request(db, '/api/clientes/7/maes', { method: 'POST', body: { nome: 'Pessoal', usuario_id: 999 }, headers: { 'X-App-Version': 'abc123' } });
  assert.equal(response.status, 201);
  assert.equal(audits(sql)[0].usuario_id, 1);
  assert.equal(audits(sql)[0].versao, 'abc123');
  assert.equal(audits(sql)[0].request_id, response.headers.get('X-Request-ID'));
  await criarMae(db, 7, 'Administrativas', context);
  await criarMae(db, 8, 'Exclusivo de B', context);
  const first = await (await request(db, '/api/clientes/7/auditoria-categorias?limite=1')).json();
  assert.equal(first.itens.length, 1);
  assert.ok(first.proximo);
  const second = await (await request(db, `/api/clientes/7/auditoria-categorias?limite=1&antes=${first.proximo}`)).json();
  assert.notEqual(second.itens[0].id, first.itens[0].id);
  assert.equal(second.proximo, null);
  assert.equal(second.itens[0].cliente_id, 7);
  assert.equal(typeof second.itens[0].depois, 'object');
  for (const role of ['analista', 'cliente']) {
    assert.equal((await request(db, '/api/clientes/7/auditoria-categorias', { role })).status, 403);
    assert.equal((await request(db, '/api/registros/erros', { role })).status, 403);
  }
  assert.equal((await request(db, '/api/registros/erros', { session: false })).status, 401);
  assert.equal((await request(db, '/api/clientes/7/auditoria-categorias?antes=abc')).status, 400);
});

test('relatos de navegador descartam dados livres, impedem outra empresa e limitam volume', async t => {
  const { db, sql } = database(t);
  const body = { codigo: 'FRONTEND_RUNTIME', operacao: '/ajustes?token=segredo', cliente_id: 7, versao: 'abc.1', mensagem: 'senha=segredo', stack: 'Bearer segredo', usuario_id: 999 };
  assert.equal((await request(db, '/api/registros/erros', { method: 'POST', body, role: 'cliente' })).status, 204);
  const row = sql.prepare('SELECT * FROM registros_erros').get();
  assert.equal(row.usuario_id, 3);
  assert.equal(row.operacao, '/ajustes');
  assert.ok(!JSON.stringify(row).includes('segredo'));
  assert.equal((await request(db, '/api/registros/erros', { method: 'POST', role: 'cliente', body: { ...body, cliente_id: 8 } })).status, 403);
  assert.equal((await request(db, '/api/registros/erros', { method: 'POST', session: false, body })).status, 401);
  assert.equal((await request(db, '/api/registros/erros', { method: 'POST', body: { ...body, stack: 'x'.repeat(3000) } })).status, 413);
  for (let i = 0; i < 22; i++) await request(db, '/api/registros/erros', { method: 'POST', role: 'cliente', body });
  assert.equal(sql.prepare('SELECT count(*) AS n FROM registros_erros').get().n, 20);
});

test('erro interno retorna referência, persiste versão e nunca grava mensagem bruta', async t => {
  const { db, sql } = database(t);
  const original = db.prepare;
  db.prepare = query => { if (query.includes('FROM clientes c')) throw new Error('senha=sigilo token=sigilo'); return original(query); };
  const messages = [];
  const log = console.error;
  console.error = value => messages.push(value);
  t.after(() => { console.error = log; });
  const response = await request(db, '/api/clientes?token=sigilo', { headers: { 'X-App-Version': 'commit.1' } });
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.request_id, response.headers.get('X-Request-ID'));
  const event = sql.prepare('SELECT * FROM registros_erros').get();
  assert.equal(event.request_id, body.request_id);
  assert.equal(event.codigo, 'ERRO_INTERNO');
  assert.equal(event.versao, 'commit.1');
  assert.ok(!JSON.stringify([event, body, messages]).includes('sigilo'));
});

test('retenção limpa somente eventos antigos e normalização não guarda segmentos secretos', async t => {
  const { db, sql } = database(t);
  await criarMae(db, 7, 'Grupo', context);
  sql.exec("UPDATE auditoria_categorias SET criado_em = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-366 days');");
  await request(db, '/api/registros/erros', { method: 'POST', body: { codigo: 'FRONTEND_RUNTIME', operacao: '/ajustes' } });
  sql.exec("UPDATE registros_erros SET criado_em = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-31 days');");
  await request(db, '/api/registros/erros', { method: 'POST', body: { codigo: 'FRONTEND_PROMISE', operacao: '/busca' } });
  await limparRegistros(db);
  assert.equal(audits(sql).length, 0);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM registros_erros').get().n, 1);
  assert.equal(normalizarOperacao('/api/clientes/7/relatorios/segredo/arquivo?token=outro'), '/api/clientes/:id/relatorios/:item/arquivo');
  assert.equal(normalizarOperacao('/qualquer/email@segredo'), '/desconhecida');
});

test('migração pode ser repetida e nomes de origem também ficam auditados', async t => {
  const { db, sql } = database(t);
  await salvarNomesPai(db, 7, [{ categoria_pai_id: 'pai', nome: 'Original' }], context);
  await salvarNomesPai(db, 7, [{ categoria_pai_id: 'pai', nome: 'Revisado' }], context);
  const event = audits(sql).at(-1);
  assert.equal(JSON.parse(event.antes_json)[0].nome, 'Original');
  assert.equal(JSON.parse(event.depois_json)[0].nome, 'Revisado');
  sql.exec(readFileSync(new URL('../src/db/migrations/0014_registros.sql', import.meta.url), 'utf8'));
  assert.equal(audits(sql).length, 2);
});

test('falha ao persistir erro mantém resposta e referência originais', async t => {
  const { db } = database(t);
  const prepare = db.prepare;
  db.prepare = query => { if (query.includes('FROM clientes c') || query.includes('INSERT INTO registros_erros')) throw new Error('falha'); return prepare(query); };
  const previous = console.error;
  const messages = [];
  console.error = value => messages.push(value);
  t.after(() => { console.error = previous; });
  const response = await request(db, '/api/clientes');
  assert.equal(response.status, 500);
  assert.ok((await response.json()).request_id);
  assert.ok(messages.some(message => JSON.parse(message).evento === 'falha_registro_erro'));
});

test('primeiro uso cria esquema pelo vínculo D1 e equivale à migração versionada', async t => {
  const { db, sql } = database(t);
  sql.exec('DROP TABLE auditoria_categorias; DROP TABLE registros_erros;');
  await criarMae(db, 7, 'Grupo inicial', context);
  assert.equal(audits(sql).length, 1);
  const file = readFileSync(new URL('../src/db/migrations/0014_registros.sql', import.meta.url), 'utf8');
  const normalize = value => value.replace(/^\s*--.*$/gm, '').replace(/\s+/g, ' ').replace(/\s*;\s*/g, ';').trim().replace(/;$/, '');
  assert.equal(normalize(REGISTROS_SCHEMA.join(';')), normalize(file));
});

test('preparação compartilha uma execução e permite repetir após falha transitória', async t => {
  const { db } = database(t);
  const batch = db.batch;
  let attempts = 0;
  db.batch = async statements => { attempts++; if (attempts === 1) throw new Error('indisponibilidade transitória'); return batch(statements); };
  await assert.rejects(() => prepararRegistros(db));
  await Promise.all([prepararRegistros(db), prepararRegistros(db)]);
  assert.equal(attempts, 2);
  await prepararRegistros(db);
  assert.equal(attempts, 2);
});


test('cron registra mês, etapa e causa segura sem sobrescrever histórico salvo', async t => {
  const { db, sql } = database(t);
  const { recalcularHistoricoPendente } = await import('../src/cron/historico.js');
  const { detalhesHistoricoSeguros, causaHistorico } = await import('../src/utils/erroHistorico.js');
  sql.prepare('INSERT INTO conexoes_contaazul (cliente_id, access_token, refresh_token, expira_em) VALUES (?, ?, ?, ?)').run(7, 'token-secreto', 'refresh-secreto', '2099-01-01T00:00:00Z');
  sql.exec("INSERT INTO historico_mensal (cliente_id, mes, receitas, despesas, vencidas) VALUES (7, '2020-01', 123, 45, 0)");
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const logs = [];
  globalThis.fetch = async () => new Response('corpo-sensivel', { status: 401 });
  console.error = value => logs.push(value);
  t.after(() => { globalThis.fetch = originalFetch; console.error = originalError; });
  await recalcularHistoricoPendente({ DB: db });
  const rows = sql.prepare('SELECT * FROM registros_erros').all();
  assert.equal(rows.length, 6);
  for (const row of rows) {
    const details = JSON.parse(row.detalhes_json);
    assert.match(details.mes, /^\d{4}-\d{2}$/);
    assert.equal(details.etapa, 'consulta');
    assert.equal(details.causa, 'AUTORIZACAO_CONTA_AZUL');
  }
  assert.equal(sql.prepare("SELECT receitas FROM historico_mensal WHERE mes = '2020-01'").get().receitas, 123);
  assert.doesNotMatch(JSON.stringify(rows) + logs.join(''), /token-secreto|refresh-secreto|corpo-sensivel/);
  assert.deepEqual(detalhesHistoricoSeguros({ mes: 'segredo', etapa: 'token', causa: 'corpo' }), { mes: null, etapa: null, causa: 'NAO_IDENTIFICADA' });
  assert.equal(causaHistorico({ contaAzulStatus: 429 }), 'LIMITE_CONTA_AZUL');
  assert.equal(causaHistorico({ contaAzulStatus: 503 }), 'INDISPONIBILIDADE_CONTA_AZUL');
});

test('atualiza esquema antigo de registros preservando eventos existentes', async t => {
  const { db, sql } = database(t);
  sql.exec('ALTER TABLE registros_erros DROP COLUMN detalhes_json');
  await prepararRegistros(db);
  await prepararRegistros(db);
  assert.ok(sql.prepare('PRAGMA table_info(registros_erros)').all().some(c => c.name === 'detalhes_json'));
});
