import { obterAccessTokenValido } from "../contaazul/tokenManager.js";
import { computarMes, ultimosMeses } from "../contaazul/historico.js";
import { listarClienteIdsConectados } from "../db/conexoesContaazul.js";
import { statusHistoricoPorCliente, upsertHistoricoMes } from "../db/historicoMensal.js";

const JANELA_MESES = 12;
const HORAS_FRESCOR = 20; // mês só entra na fila de novo depois disso
const LIMITE_POR_EXECUCAO = 6; // teto de (cliente, mês) recalculados por invocação — cada um é ~4 requisições à Conta Azul (contas a pagar/receber, paginadas), fica bem abaixo do limite de subrequisições do Worker mesmo somando os 6

function idadeEmHoras(atualizadoEm) {
  if (!atualizadoEm) return Infinity; // nunca calculado — prioridade máxima
  const dataUTC = new Date(atualizadoEm.replace(" ", "T") + "Z");
  return (Date.now() - dataUTC.getTime()) / 3_600_000;
}

// Roda de hora em hora (ver wrangler.toml); cada mês individual só é
// recalculado ~1x/dia (HORAS_FRESCOR), mas a invocação em si é frequente
// de propósito — processar em fatias pequenas é o que evita estourar o
// limite de subrequisições que o cálculo ao vivo batia (ver
// CHECKLIST-V1.0.md, achado de 23/09). Também serve de backfill: mês nunca
// calculado tem prioridade máxima (idade "infinita"), então um cliente novo
// preenche os 12 meses em poucas execuções.
export async function recalcularHistoricoPendente(env) {
  const clienteIds = await listarClienteIdsConectados(env.DB);
  if (clienteIds.length === 0) return;

  const mesesChaves = ultimosMeses(JANELA_MESES);

  const pendentes = [];
  for (const clienteId of clienteIds) {
    const status = await statusHistoricoPorCliente(env.DB, clienteId);
    for (const mes of mesesChaves) {
      const idade = idadeEmHoras(status.get(mes));
      if (idade > HORAS_FRESCOR) pendentes.push({ clienteId, mes, idade });
    }
  }
  pendentes.sort((a, b) => b.idade - a.idade);

  for (const { clienteId, mes } of pendentes.slice(0, LIMITE_POR_EXECUCAO)) {
    try {
      const accessToken = await obterAccessTokenValido(env.DB, env, clienteId);
      if (!accessToken) continue; // desconectou entre a listagem e agora
      const valores = await computarMes(env.DB, accessToken, clienteId, mes);
      await upsertHistoricoMes(env.DB, clienteId, mes, valores);
    } catch (erro) {
      // Um cliente/mês falhando não pode travar os outros da fatia.
      console.error(`Falha ao recalcular histórico do cliente ${clienteId}, mês ${mes}:`, erro);
    }
  }
}
