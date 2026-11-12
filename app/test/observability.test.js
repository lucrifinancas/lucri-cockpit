import test from 'node:test';
import assert from 'node:assert/strict';
import { safeOperation, reportClientError, setTelemetryClient } from '../src/data/errorTelemetry.js';
import { auditChanges } from '../src/data/auditChanges.js';
import { apiFetch } from '../src/api/client.js';

test('telemetria descarta queries, mensagens livres e IDs da URL, sem recursão ou repetição', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; setTelemetryClient(null); });
  const requests = [];
  globalThis.fetch = async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); throw new Error('offline'); };
  setTelemetryClient(7);
  const event = { codigo: 'FRONTEND_RUNTIME', operacao: '/api/clientes/7/relatorios/documento-secreto/arquivo?token=segredo', mensagem: 'senha=segredo' };
  await reportClientError('https://api.example.test', event);
  await reportClientError('https://api.example.test', event);
  await reportClientError('https://api.example.test', { ...event, operacao: '/api/registros/erros' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].body.operacao, '/api/clientes/:id/relatorios/:item/arquivo');
  assert.equal(requests[0].body.cliente_id, 7);
  assert.ok(!JSON.stringify(requests).includes('segredo'));
  assert.equal(safeOperation('/qualquer/pessoa@example.test'), '/desconhecida');
});

test('falha HTTP preserva mensagem de domínio e referência sem duplicar registro do backend', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let count = 0;
  globalThis.fetch = async () => { count++; return Response.json({ erro: 'conta_azul_desconectada', request_id: 'ref-teste' }, { status: 409 }); };
  await assert.rejects(() => apiFetch('/api/clientes/7/home'), error => error.message === 'conta_azul_desconectada' && error.requestId === 'ref-teste');
  assert.equal(count, 1);
});

test('cancelamento não gera erro e falha de rede recebe referência sem perder o erro original', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let count = 0;
  globalThis.fetch = async () => { count++; throw new DOMException('cancelado', 'AbortError'); };
  await assert.rejects(() => apiFetch('/api/clientes/7/home'), { name: 'AbortError' });
  assert.equal(count, 1);
  globalThis.fetch = async url => { if (url.endsWith('/api/registros/erros')) return new Response(null, { status: 204 }); throw new TypeError('rede'); };
  await assert.rejects(() => apiFetch('/api/clientes/7/home'), error => Boolean(error.requestId) && error.message.includes('conectar'));
});

test('histórico mostra somente vínculos alterados, incluindo remoção e mudança da regra de despesa', () => {
  const a = { categoria_id: 'a', categoria_nome: 'Aluguel', mae_id: 1, mae_nome: 'Imóvel', is_despesa: 1 };
  const b = { categoria_id: 'b', categoria_nome: 'Tarifa', mae_id: 2, mae_nome: 'Financeiras', is_despesa: 1 };
  const changes = auditChanges({ acao: 'mapeamento_despesas', antes: [a, b], depois: [{ ...a, is_despesa: 0 }] });
  assert.equal(changes.length, 2);
  assert.match(changes[0].depois, /Fora das despesas/);
  assert.match(changes[1].depois, /Regra automática/);
  assert.deepEqual(auditChanges({ acao: 'mapeamento_receitas', antes: [a], depois: [a] }), []);
  assert.equal(auditChanges({ acao: 'grupo_receita_removido', evento_id: 'id', antes: { nome: 'Serviços' }, depois: null })[0].depois, 'Removido');
});

test('erro tardio continua associado à empresa consultada antes da troca de cliente', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; setTelemetryClient(null); });
  let fail;
  let reported;
  globalThis.fetch = (url, options) => {
    if (url.endsWith('/api/registros/erros')) { reported = JSON.parse(options.body); return Promise.resolve(new Response(null, { status: 204 })); }
    return new Promise((_, reject) => { fail = reject; });
  };
  setTelemetryClient(7);
  const pending = apiFetch('/api/clientes/7/dre');
  setTelemetryClient(8);
  fail(new Error('offline'));
  await assert.rejects(() => pending);
  assert.equal(reported.cliente_id, 7);
});
