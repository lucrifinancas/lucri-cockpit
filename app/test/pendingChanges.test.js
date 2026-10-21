import test from 'node:test';
import assert from 'node:assert/strict';
import { createPendingChanges } from '../src/data/pendingChanges.js';

test('sem alteração não pede confirmação', () => {
  const registry = createPendingChanges();
  registry.register('form', { dirty: false, saving: false });
  assert.equal(registry.hasPending(), false);
  assert.equal(registry.canLeave(() => assert.fail('não deve perguntar'), () => assert.fail()), true);
});
test('cancelar preserva a proteção; confirmar permite continuar', () => {
  const registry = createPendingChanges();
  registry.register('categorias', { dirty: true });
  assert.equal(registry.canLeave(() => false, () => assert.fail()), false);
  assert.equal(registry.hasPending(), true);
  assert.equal(registry.canLeave(() => true, () => assert.fail()), true);
});
test('salvamento em andamento bloqueia saída sem oferecer descarte', () => {
  const registry = createPendingChanges();
  registry.register('categorias', { dirty: true, saving: true });
  let avisos = 0;
  assert.equal(registry.canLeave(() => assert.fail(), () => avisos++), false);
  assert.equal(avisos, 1);
});
test('salvar, reverter e desmontar removem pendência; falha mantém proteção', () => {
  const registry = createPendingChanges();
  const cleanup = registry.register('categorias', { dirty: true, saving: false });
  assert.equal(registry.hasPending(), true);
  registry.register('categorias', { dirty: false, saving: false });
  assert.equal(registry.hasPending(), false);
  registry.register('categorias', { dirty: true, saving: false });
  cleanup();
  assert.equal(registry.hasPending(), false);
});
