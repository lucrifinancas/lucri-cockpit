export function situacaoDe(item, hoje) {
  if (item.valor_em_aberto <= 0) return 'pago';
  if (item.data_vencimento < hoje) return 'vencido';
  if (item.data_vencimento === hoje) return 'hoje';
  return 'avencer';
}

export function correspondeSituacao(item, filtro) {
  return filtro === 'todos' || (filtro === 'pago' ? item.valor_pago > 0 : item.situacao === filtro);
}

export function valorDaSituacao(item, filtro) {
  return filtro === 'pago' ? item.valor_pago : filtro === 'todos' ? item.valor : item.valor_em_aberto;
}
