import { buscarContasAPagar, buscarContasAReceber, buscarCategorias } from "./api.js";
import { listarOverridesDespesa } from "../db/categoriaDespesa.js";
import { idsDeDespesa } from "../utils/despesas.js";

// Últimos `n` meses no formato "AAAA-MM", do mais antigo pro mais recente
// (mesmo formato de chave usado em historico_mensal e no /historico-mensal).
export function ultimosMeses(n, referencia = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const ref = new Date(referencia.getFullYear(), referencia.getMonth() - (n - 1 - i), 1);
    return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
  });
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
  for (const item of contasAReceber.itens) {
    receitas += item.pago ?? 0;
    if ((item.nao_pago ?? 0) > 0 && item.data_vencimento < hojeISO) {
      vencidas += item.nao_pago;
    }
  }

  let despesas = 0;
  for (const item of contasAPagar.itens) {
    const categoriaId = item.categorias?.[0]?.id;
    if (!categoriaId || !categoriaIdsDespesa.has(categoriaId)) continue;
    despesas += item.pago ?? 0;
  }

  return { receitas, despesas, vencidas };
}
