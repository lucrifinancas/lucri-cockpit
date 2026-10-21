import test from 'node:test';
import assert from 'node:assert/strict';
import { readProfile, writeProfile, PROFILE_PREFIX } from '../src/data/localProfile.js';
import { categoryLabel } from '../src/data/labels.js';

function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test('foto e nome são preservados em atualizações parciais', () => {
  const store = storage();
  writeProfile(store, 'a@example.com', { name: 'Ana', avatarUrl: 'data:image/png;base64,abc' });
  writeProfile(store, 'a@example.com', { name: 'Ana Silva' });
  assert.equal(readProfile(store, 'a@example.com').avatarUrl, 'data:image/png;base64,abc');
  writeProfile(store, 'a@example.com', { avatarUrl: null });
  assert.deepEqual(readProfile(store, 'a@example.com'), { name: 'Ana Silva', avatarUrl: null });
});
test('preferências permanecem separadas por conta', () => {
  const store = storage();
  writeProfile(store, 'a@example.com', { name: 'Ana' });
  writeProfile(store, 'b@example.com', { name: 'Bruno' });
  assert.equal(readProfile(store, 'a@example.com').name, 'Ana');
  assert.equal(readProfile(store, 'b@example.com').name, 'Bruno');
});
test('conteúdo inválido no navegador não quebra leitura', () => {
  const store = storage();
  for (const value of ['invalido', 'null', '12', '{"name":12,"avatarUrl":42}']) {
    store.setItem(PROFILE_PREFIX + 'a@example.com', value);
    assert.ok(!readProfile(store, 'a@example.com').name);
  }
});
test('falha de armazenamento é propagada sem simular sucesso', () => {
  const store = storage();
  writeProfile(store, 'a@example.com', { name: 'Ana' });
  const failing = { ...store, setItem() { throw new Error('QuotaExceeded'); } };
  assert.throws(() => writeProfile(failing, 'a@example.com', { name: 'Novo' }), /QuotaExceeded/);
  assert.equal(readProfile(store, 'a@example.com').name, 'Ana');
  assert.throws(() => writeProfile(store, null, { name: 'Ana' }), /Entre na sua conta/);
});
test('rótulos de apresentação preservam nomes reais de categorias', () => {
  assert.equal(categoryLabel('Sem mãe'), 'Não classificado');
  assert.equal(categoryLabel('Sem categoria'), 'Não classificado');
  assert.equal(categoryLabel('Despesas administrativas'), 'Despesas administrativas');
});
