import { buscarContasAPagar, buscarContasAReceber, buscarCategorias } from "./api.js";
import { listarOverridesDespesa } from "../db/categoriaDespesa.js";
import { idsDeDespesa } from "../utils/despesas.js";

// Últimos `n` meses no formato "AAAA-MM", do mais antigo pro mais recente
// (mesmo formato de chave usado em historico_mensal e no /historico-mensal).
export function ultimosMeses(n, referencia = new Date()) {
  return mesesEntre(n - 1, 0, referencia);
}

// Meses de "mesesAtras" atrás até "mesesAFrente" à frente do mês atual
// (inclusive dos dois lados), do mais antigo pro mais recente — usado pelo
// cron pra cobrir a janela mais larga que o Balanço precisa (título velho
// em aberto ou já lançado pro futuro), sem repetir a lógica de
// ultimosMeses (que só olha pra trás).
export function mesesEntre(mesesAtras, mesesAFrente, referencia = new Date()) {
  const total = mesesAtras + mesesAFrente + 1;
  return Array.from({ length: total }, (_, i) => {
    const ref = new Date(referencia.getFullYear(), referencia.getMonth() - mesesAtras + i, 1);
    return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
  });
}

// Janela que o /balanco precisa pra não perder título velho em aberto nem
// título já lançado pro futuro (mesmo espírito da janela larga que o
// cálculo ao vivo original usava — 2 anos atrás, 1 ano à frente — só que
// em meses, pra caber no mesmo cache por mês do histórico). Superset da
// janela de 12 meses que a Home/Histórico mostra, então o cron só precisa
// rodar essa.
export function mesesJanelaBalanco(referencia = new Date()) {
  return mesesEntre(24, 12, referencia);
}

// Receitas/despesas/vencidas de UM mês só — janela estreita de propósito
// (poucas dezenas de lançamentos na prática, cabe numa página só de cada
// endpoint) pra nunca precisar da janela larga de 12 meses que estourava o
// limite de subrequisições do Worker numa invocação só. Mesma regra de
// classificação do /despesas (tipo=DESPESA automático + override do
// master) e do /historico-mensal antigo (vencida = ainda em aberto e já
// passou do vencimento hoje).
export async function computarMes(db, accessToken, clienteId, mesChave) {
  const [ano, mesNum] = mesChave.split("-").map(Number);
  const de = `${mesChave}-01`;
  const ultimoDia = new Date(ano, mesNum, 0).getDate();
  const ate = `${mesChave}-${String(ultimoDia).padStart(2, "0")}`;
  const hojeISO = new Date().toISOString().slice(0, 10);

  const [contasAReceber, contasAPagar, categorias, overridesDespesa] = await Promise.all([
    buscarContasAReceber(accessToken, { de, ate }),
    buscarContasAPagar(accessToken, { de, ate }),
    buscarCategorias(accessToken),
    listarOverridesDespesa(db, clienteId),
  ]);
  const categoriaIdsDespesa = idsDeDespesa(categorias.itens, overridesDespesa);

  let receitas = 0;
  let vencidas = 0;
  let receberAberto = 0;
  for (const item of contasAReceber.itens) {
    receitas += item.pago ?? 0;
    if ((item.nao_pago ?? 0) > 0) {
      receberAberto += item.nao_pago;
      if (item.data_vencimento < hojeISO) vencidas += item.nao_pago;
    }
  }

  let despesas = 0;
  let pagarAberto = 0;
  for (const item of contasAPagar.itens) {
    if ((item.nao_pago ?? 0) > 0) pagarAberto += item.nao_pago;
    const categoriaId = item.categorias?.[0]?.id;
    if (!categoriaId || !categoriaIdsDespesa.has(categoriaId)) continue;
    despesas += item.pago ?? 0;
  }

  return { receitas, despesas, vencidas, receberAberto, pagarAberto };
}
