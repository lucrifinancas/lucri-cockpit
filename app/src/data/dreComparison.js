import { monthRange, previousRange } from './period.js';

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const identity = (row) => `${row.totalizador ? 'total' : 'group'}:${row.codigo != null ? `code:${row.codigo}` : `name:${normalize(row.descricao)}`}`;

export function dreComparisonRange(range, preset) {
  if (['mes', 'mes-especifico'].includes(preset) && range.start?.endsWith('-01') && range.end === monthRange(range.start.slice(0, 7)).end) {
    const [year, month] = range.start.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 2, 1));
    return monthRange(date.toISOString().slice(0, 7));
  }
  return previousRange(range);
}

export function parseDre(response) {
  function valid(rows) {
    return Array.isArray(rows) && rows.every((row) => row && typeof row.descricao === 'string' && Number.isFinite(row.valor) && (!row.subitens || valid(row.subitens)));
  }
  if (!response || !Number.isFinite(response.resultado_final) || !valid(response.linhas)) throw new Error('Resposta de DRE inválida.');
  return response;
}

// Une pela identidade da linha dentro do mesmo grupo; ausência não significa zero.
export function compareDreRows(current, previous = []) {
  const previousMap = new Map(previous.map((row) => [identity(row), row]));
  const currentKeys = new Set(current.map(identity));
  const merge = (row, before, present) => ({
    key: identity(row), descricao: row.descricao, codigo: row.codigo, totalizador: Boolean(row.totalizador),
    current: present ? row.valor : null,
    previous: before ? before.valor : null,
    delta: present && before ? row.valor - before.valor : null,
    previousOnly: !present,
    children: compareDreRows(present ? row.subitens ?? [] : [], before?.subitens ?? []),
  });
  return [
    ...current.map((row) => merge(row, previousMap.get(identity(row)), true)),
    ...previous.filter((row) => !currentKeys.has(identity(row))).map((row) => merge(row, row, false)),
  ];
}

export function netRevenue(dre) {
  const row = dre?.linhas.find((item) => item.totalizador && /^receitas? liquidas?( de .*)?$/.test(normalize(item.descricao)));
  return row && Number.isFinite(row.valor) ? row.valor : null;
}
export function dreMargin(result, revenue) {
  return Number.isFinite(result) && Number.isFinite(revenue) && revenue > 0 ? result / revenue * 100 : null;
}

export function dreReading(current, previous) {
  const money = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const result = current.resultado_final;
  if (!previous) return {
    text: `O resultado no período é ${money(result)}. A comparação será apresentada quando houver dados do período anterior.`,
    attention: 'Consulte os grupos do DRE para identificar a composição do resultado.',
  };
  const change = result - previous.resultado_final;
  const revenue = netRevenue(current), before = netRevenue(previous);
  const parts = [Math.abs(change) < 0.005 ? `O resultado permaneceu em ${money(result)}.` : `O resultado ${change > 0 ? 'aumentou' : 'diminuiu'} ${money(Math.abs(change))}, passando de ${money(previous.resultado_final)} para ${money(result)}.`];
  if (revenue != null && before != null) {
    const diff = revenue - before;
    parts.push(Math.abs(diff) < 0.005 ? 'A receita líquida permaneceu estável.' : `A receita líquida ${diff > 0 ? 'aumentou' : 'diminuiu'} ${money(Math.abs(diff))}.`);
  }
  const groups = compareDreRows(current.linhas, previous.linhas).filter((row) => !row.totalizador && row.delta != null && Math.abs(row.delta) >= 0.005);
  const largest = groups.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  return {
    text: parts.join(' '),
    attention: largest ? `Revise o grupo “${largest.descricao}”: maior variação absoluta entre os grupos, de ${money(largest.delta)}.` : 'Não há variação nos grupos comparáveis. Revise eventuais linhas sem correspondência entre os períodos.',
  };
}
