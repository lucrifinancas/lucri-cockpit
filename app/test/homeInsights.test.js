import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarInsights } from '../src/data/homeInsights.js';
import { recebimentosVencidos } from '../src/data/recebimentos.js';

const base = { receitas: 0, despesas: 0, saldo: 0, vencidas: 0, inadimplenciaPct: 0 };
test('prioriza cobrança e limita a três itens sem repetir inadimplência', () => {
  const items = gerarInsights({ ...base, receitas: 100, despesas: 200, vencidas: 50, inadimplenciaPct: 50, semMae: 100, papel: 'master' });
  assert.equal(items.length, 3);
  assert.equal(items[0].id, 'recebimentos-vencidos');
  assert.equal(items[0].link.to, '/entradas?situacao=vencido');
  assert.match(items[0].text, /50,00/);
  assert.match(items[0].text, /50,0%/);
  assert.deepEqual(items.map((item) => item.id), ['recebimentos-vencidos', 'despesas-acima', 'cobertura']);
});
test('classificação abre seção correta só para master', () => {
  assert.equal(gerarInsights({ ...base, semMae: 10, papel: 'master' })[0].link.to, '/ajustes?secao=categorias');
  for (const papel of ['cliente', 'analista', undefined]) {
    const item = gerarInsights({ ...base, semMae: 10, papel })[0];
    assert.equal(item.link, undefined);
    assert.match(item.text, /equipe Lucri/);
  }
});
test('sem dados não produz alerta; cenário positivo respeita período', () => {
  assert.deepEqual(gerarInsights(base), []);
  const items = gerarInsights({ ...base, receitas: 100 });
  assert.equal(items[0].id, 'sem-vencidas');
  assert.match(items[0].text, /no período/);
});
test('filtro de cobrança inclui parcial vencido, exclui quitado, hoje e futuro', () => {
  const items = [
    { id: 1, data_vencimento: '2026-10-20', valor_em_aberto: 30, valor_pago: 70 },
    { id: 2, data_vencimento: '2026-10-20', valor_em_aberto: 0, valor_pago: 100 },
    { id: 3, data_vencimento: '2026-10-21', valor_em_aberto: 100 },
    { id: 4, data_vencimento: '2026-10-22', valor_em_aberto: 100 },
  ];
  assert.deepEqual(recebimentosVencidos(items, '2026-10-21').map((item) => item.id), [1]);
});
