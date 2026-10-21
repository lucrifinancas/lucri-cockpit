import { todayISO } from "./period.js";

export function recebimentosVencidos(lancamentos, hoje = todayISO()) {
  return lancamentos.filter((item) => item.valor_em_aberto > 0 && item.data_vencimento < hoje);
}
