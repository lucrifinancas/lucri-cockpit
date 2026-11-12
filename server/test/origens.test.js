import test from 'node:test';
import assert from 'node:assert/strict';
import { origemPermitida } from '../src/auth/origem.js';
import worker from '../src/index.js';

const canonical = 'https://cockpit.lucribpo.com.br';
const legacy = 'https://lucri-cockpit.pages.dev';
const env = { APP_URL: canonical, ADDITIONAL_APP_ORIGINS: legacy };
const context = { env, req: { url: 'https://lucri-cockpit-server.lucrifinancas-54e.workers.dev/api/health' } };

test('origem canônica e endereço antigo são aceitos por igualdade exata', () => {
  assert.equal(origemPermitida(canonical, context), true);
  assert.equal(origemPermitida(legacy, context), true);
  for (const value of [null, 'http://cockpit.lucribpo.com.br', 'https://cockpit.lucribpo.com.br.exemplo.test', 'https://outro.lucribpo.com.br', 'http://localhost:5173']) {
    assert.equal(origemPermitida(value, context), false, String(value));
  }
});

test('aliases rejeitam coringa, caminho, protocolo inseguro e entradas malformadas', () => {
  const c = { ...context, env: { ...env, ADDITIONAL_APP_ORIGINS: '*,https://invalido.test/caminho,http://inseguro.test, https://valido.test ' } };
  for (const origin of ['*', 'https://invalido.test', 'http://inseguro.test']) assert.equal(origemPermitida(origin, c), false);
  assert.equal(origemPermitida('https://valido.test', c), true);
});

test('CORS permite os dois endereços e mantém credenciais e referência de requisição', async () => {
  for (const origin of [canonical, legacy]) {
    const response = await worker.fetch(new Request('https://api.example.test/api/health', { headers: { Origin: origin } }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true');
    assert.ok(response.headers.get('X-Request-ID'));
  }
});

test('CSRF permite logout nas origens oficiais e bloqueia terceiros', async () => {
  for (const origin of [canonical, legacy, 'https://fora.example.test']) {
    const response = await worker.fetch(new Request('https://api.example.test/api/auth/logout', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}' }), env);
    assert.equal(response.status, origin === 'https://fora.example.test' ? 403 : 200);
  }
});
