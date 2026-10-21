import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReport, reportSize, MAX_REPORT_BYTES } from '../src/data/reports.js';
import { apiFetch } from '../src/api/client.js';

test('valida assinatura do PDF e referência sem confiar na extensão', async () => {
  await validateReport(new File(['%PDF-1.7\nconteudo ficticio'], 'relatorio.pdf'), 'Setembro/2026');
  await assert.rejects(() => validateReport(new File(['arquivo de texto'], 'falso.pdf'), '2026'), /PDF válido/);
  await assert.rejects(() => validateReport(null, '2026'), /Selecione/);
  await assert.rejects(() => validateReport(new File(['%PDF-'], 'a.pdf'), '   '), /referência/);
});
test('rejeita arquivo acima de 20 MB antes de ler seu conteúdo', async () => {
  await assert.rejects(() => validateReport({ size: MAX_REPORT_BYTES + 1 }, '2026'), /20 MB/);
  assert.equal(reportSize(1024), '1 KB');
  assert.equal(reportSize(2 * 1024 * 1024), '2 MB');
});
test('apiFetch envia FormData com cookies e sem Content-Type fixo', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let captured;
  globalThis.fetch = async (url, options) => { captured = { url, options }; return Response.json({ id: 1 }); };
  const body = new FormData(); body.append('referencia', '2026'); body.append('arquivo', new File(['%PDF-'], 'arquivo.pdf'));
  assert.deepEqual(await apiFetch('/api/clientes/7/relatorios', { method: 'POST', body }), { id: 1 });
  assert.equal(captured.options.credentials, 'include');
  assert.equal(captured.options.headers.has('Content-Type'), false);
  assert.equal(captured.options.body, body);
});
test('apiFetch preserva JSON e cabeçalhos personalizados', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    assert.equal(options.headers.get('X-Test'), '1');
    return Response.json({ ok: true });
  };
  await apiFetch('/teste', { method: 'PUT', body: '{}', headers: new Headers({ 'X-Test': '1' }) });
});
test('apiFetch propaga erro do upload em vez de confirmar envio', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => Response.json({ erro: 'Arquivo inválido.' }, { status: 400 });
  await assert.rejects(() => apiFetch('/teste', { method: 'POST', body: new FormData() }), /Arquivo inválido/);
});
