export const emptyHistory = { data: [], loading: true, error: null };

export function historyForRequest(state, key) {
  return state.key === key ? state : emptyHistory;
}

export function parseHistory(response) {
  if (!Array.isArray(response?.meses) || response.meses.some((item) =>
    !item || typeof item.mes !== 'string' || typeof item.label !== 'string' ||
    (item.disponivel !== false && ['receitas', 'despesas', 'resultado', 'vencidas'].some((field) => !Number.isFinite(item[field])))
  )) throw new Error('Resposta de histórico inválida.');
  return response.meses;
}
