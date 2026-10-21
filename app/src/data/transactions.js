import { todayISO } from './period.js';
import { categoryLabel } from './labels.js';

export const TRANSACTION_FILTERS = ['vencido', 'hoje', 'avencer', 'pago', 'todos'];
export function transactionStatus(item, today = todayISO()) {
  if (item.valor_em_aberto <= 0) return 'pago';
  if (item.data_vencimento < today) return 'vencido';
  if (item.data_vencimento === today) return 'hoje';
  return 'avencer';
}

export function transactionItems({ entradas, saidas, despesas = [] }, kind, expensesOnly = false, today = todayISO()) {
  const original = new Map((saidas?.lancamentos ?? []).map((item) => [item.id, item]));
  const source = kind === 'entrada' ? entradas?.lancamentos ?? [] : expensesOnly ? despesas : saidas?.lancamentos ?? [];
  return source.map((item) => ({
    ...item,
    valor_total: expensesOnly ? item.valor_titulo ?? original.get(item.id)?.valor ?? null : item.valor,
    categoria_principal: categoryLabel(item.mae_exibicao ?? item.mae ?? 'Sem categoria'),
    categoria_original: item.subcategoria ?? item.categoria,
    situacao: transactionStatus(item, today),
  }));
}

export function filterTransactions(items, { search = '', category = '', counterpart = '' } = {}) {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  return items.filter((item) => (!category || item.categoria_original === category) &&
    (!counterpart || item.contraparte === counterpart) &&
    (!term || [item.descricao, item.categoria_original, item.categoria_principal, item.contraparte].some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(term))));
}
export function matchesTransaction(item, filter) {
  return filter === 'todos' || (filter === 'pago' ? item.valor_pago > 0 : item.situacao === filter);
}
export function transactionTotal(items, filter) {
  const field = filter === 'pago' ? 'valor_pago' : filter === 'todos' ? 'valor_total' : 'valor_em_aberto';
  const selected = items.filter((item) => matchesTransaction(item, filter));
  return selected.some((item) => !Number.isFinite(item[field])) ? null : selected.reduce((sum, item) => sum + item[field], 0);
}
