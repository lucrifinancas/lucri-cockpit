import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSaidasView, legacyExpensesLocation } from '../src/data/saidasView.js';

const data = {
  saidas: {
    totais: { pago: { valor: 550 } },
    lancamentos: [
      { id: 1, descricao: 'Aluguel', valor: 200, valor_pago: 50 },
      { id: 2, descricao: 'Transferência', valor: 500, valor_pago: 500 },
    ],
  },
  despesas: [{ id: 1, descricao: 'Aluguel', valor: 50, valor_pago: 50 }],
};
test('todas as saídas inclui transferências e usa valores efetivamente pagos', () => {
  const view = buildSaidasView(data, false);
  assert.equal(view.total, 550);
  assert.deepEqual(view.lancamentos.map((item) => item.valor), [50, 500]);
  assert.equal(data.saidas.lancamentos[0].valor, 200, 'não altera a resposta da API');
});
test('despesas usa só a base classificada, sem incluir transferências', () => {
  const view = buildSaidasView(data, true);
  assert.equal(view.total, 50);
  assert.deepEqual(view.lancamentos.map((item) => item.id), [1]);
});
test('base vazia não reaproveita valores da outra visão', () => {
  assert.equal(buildSaidasView({ ...data, despesas: [] }, true).total, 0);
  assert.deepEqual(buildSaidasView({ saidas: null }, false).lancamentos, []);
});
test('link antigo abre despesas na página unificada e preserva parâmetros', () => {
  assert.equal(legacyExpensesLocation(''), '/saidas?visao=despesas');
  const url = new URL(legacyExpensesLocation('?busca=aluguel&visao=todas'), 'https://example.com');
  assert.equal(url.pathname, '/saidas');
  assert.equal(url.searchParams.get('visao'), 'despesas');
  assert.equal(url.searchParams.get('busca'), 'aluguel');
});
