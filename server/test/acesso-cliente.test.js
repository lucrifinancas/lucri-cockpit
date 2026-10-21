import test from 'node:test';
import assert from 'node:assert/strict';
import { sign } from 'hono/jwt';
import worker from '../src/index.js';

const secret = 'segredo-exclusivo-dos-testes-locais';
const reads = ['home', 'entradas', 'saidas', 'despesas', 'caixa', 'dre', 'balanco', 'historico-mensal', 'maes', 'contas-pagar-maes'];

async function request(path, { papel = 'cliente', tenant = 7, tokenRole = papel, tokenTenant = tenant, session = true, version = 1, method = 'GET' } = {}) {
  const queries = [];
  const DB = { prepare(sql) {
    const query = { sql, args: [] };
    queries.push(query);
    return {
      bind(...args) { query.args = args; return this; },
      async first() {
        if (sql.includes('FROM clientes WHERE id')) return { id: query.args[0], nome: 'Empresa de teste', token_secreto: 'nao-expor' };
        if (sql.includes('FROM usuarios WHERE id')) return { id: 1, papel, cliente_id: tenant, sessao_versao: 1 };
        return null;
      },
      async all() { return { results: [] }; },
    };
  } };
  const token = session ? await sign({ sub: 1, papel: tokenRole, cliente_id: tokenTenant, versao: version, exp: Math.floor(Date.now() / 1000) + 60 }, secret) : null;
  const response = await worker.fetch(new Request(`https://api.example.com/api/clientes${path === "/" ? "" : path}`, {
    method,
    headers: { ...(token ? { Cookie: `lucri_sessao=${token}` } : {}), Origin: 'https://app.example.com' },
  }), { DB, JWT_SECRET: secret, APP_URL: 'https://app.example.com' });
  return { response, queries };
}

for (const route of reads) {
  test(`cliente lê própria empresa: ${route}`, async () => {
    const { response } = await request(`/7/${route}`);
    // Sem conexão Conta Azul: resposta de domínio, após passar autorização.
    assert.ok([200, 404].includes(response.status), `status inesperado: ${response.status}`);
    if (response.status === 404) assert.equal((await response.json()).erro, "Cliente ainda não conectou o Conta Azul.");
  });
  test(`cliente não lê outra empresa: ${route}`, async () => {
    const { response, queries } = await request(`/8/${route}`);
    assert.equal(response.status, 403);
    assert.equal(queries.length, 1, 'bloqueia antes de consultar dados da empresa');
  });
  for (const papel of ['master', 'analista']) {
    test(`${papel} lê qualquer empresa: ${route}`, async () => {
      const { response } = await request(`/8/${route}`, { papel, tenant: null });
      assert.ok([200, 404].includes(response.status), `status inesperado: ${response.status}`);
    if (response.status === 404) assert.equal((await response.json()).erro, "Cliente ainda não conectou o Conta Azul.");
    });
  }
}
for (const path of ['/', '/7/convites', '/7/usuarios', '/7/categorias']) {
  test(`cliente não acessa administração: ${path === "/" ? "" : path}`, async () => {
    assert.equal((await request(path)).response.status, 403);
  });
}
for (const [method, path] of [['POST', '/'], ['POST', '/7/login'], ['PUT', '/7/contas-pagar-maes'], ['DELETE', '/7/maes/1']]) {
  test(`cliente não altera configuração: ${method} ${path === "/" ? "" : path}`, async () => {
    assert.equal((await request(path, { method })).response.status, 403);
  });
}
test('sem sessão e sessão revogada são rejeitadas', async () => {
  assert.equal((await request('/7/home', { session: false })).response.status, 401);
  assert.equal((await request('/7/home', { version: 2 })).response.status, 401);
});
test('cliente sem empresa e papel desconhecido são rejeitados', async () => {
  assert.equal((await request('/7/home', { tenant: null })).response.status, 403);
  assert.equal((await request('/7/home', { papel: 'desconhecido' })).response.status, 403);
});
test('permissão usa vínculo e papel atuais do banco, mesmo com JWT antigo', async () => {
  assert.equal((await request('/8/home', { tokenRole: 'master', tokenTenant: 8 })).response.status, 403);
  assert.equal((await request('/8/home', { tenant: 8, tokenTenant: 7 })).response.status, 404);
});
test('IDs inválidos são rejeitados', async () => {
  for (const id of ['0', '-1', 'abc', '1.5']) assert.equal((await request(`/${id}/home`)).response.status, 400);
});
test('analista não cadastra empresa', async () => {
  assert.equal((await request('/', { papel: 'analista', method: 'POST' })).response.status, 403);
});

test('identidade retorna só nome e ID da própria empresa', async () => {
  const { response } = await request('/7');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 7, nome: 'Empresa de teste' });
});
test('identidade não expõe outra empresa e exige sessão', async () => {
  assert.equal((await request('/8')).response.status, 403);
  assert.equal((await request('/7', { session: false })).response.status, 401);
});

for (const [method, path] of [['GET', '/7/relatorios'], ['POST', '/7/relatorios'], ['GET', '/7/relatorios/1/arquivo'], ['DELETE', '/7/relatorios/1']]) {
  test(`relatórios internos exigem equipe: ${method} ${path}`, async () => {
    const { response, queries } = await request(path, { method });
    assert.equal(response.status, 403);
    assert.equal(queries.length, 1);
    assert.equal((await request(path, { method, session: false })).response.status, 401);
  });
}
for (const papel of ['master', 'analista']) {
  test(`${papel} mantém acesso à listagem de PDFs`, async () => {
    assert.equal((await request('/7/relatorios', { papel })).response.status, 200);
  });
}
