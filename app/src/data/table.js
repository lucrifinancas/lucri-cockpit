export function sortRows(rows, key, direction = 'asc') {
  if (!key) return rows;
  const sign = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    return sign * (typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left ?? '').localeCompare(String(right ?? ''), 'pt-BR', { numeric: true }));
  });
}

export function pageRows(rows, page, size = 10) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.max(1, Math.min(page, pages));
  return { rows: rows.slice((current - 1) * size, current * size), pages, current };
}

export function sumRows(rows, net = false) {
  return rows.reduce((sum, row) => sum + (net && row.direcao === 'Saída' ? -row.valor : row.valor), 0);
}
