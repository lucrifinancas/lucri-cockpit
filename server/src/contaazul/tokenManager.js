// Garante que sempre usamos um access_token válido pra um cliente — renova
// sozinho quando necessário, sem exigir ação humana.

import { buscarConexaoPorCliente, atualizarTokens } from "../db/conexoesContaazul.js";
import { renovarToken } from "./oauth.js";
import { ContaAzulDesconectadaError } from "./errors.js";

const MARGEM_SEGURANCA_MS = 60_000; // renova 1 minuto antes de expirar de vez

function estaValido(conexao) {
  const expiraEm = new Date(conexao.expira_em).getTime();
  return expiraEm - MARGEM_SEGURANCA_MS > Date.now();
}

export async function obterAccessTokenValido(db, env, clienteId) {
  const conexao = await buscarConexaoPorCliente(db, clienteId);
  if (!conexao) {
    return null; // cliente ainda não conectou o Conta Azul
  }

  if (estaValido(conexao)) {
    return conexao.access_token;
  }

  try {
    const novosTokens = await renovarToken(env, conexao.refresh_token);
    await atualizarTokens(db, clienteId, novosTokens);
    return novosTokens.accessToken;
  } catch (erro) {
    // Pode ser que outra requisição concorrente já tenha renovado esse
    // mesmo token entre o momento em que lemos e agora (o refresh_token do
    // Conta Azul só serve uma vez por renovação) — antes de desistir,
    // confere se já tem um token novo válido salvo.
    const conexaoAtualizada = await buscarConexaoPorCliente(db, clienteId);
    if (conexaoAtualizada && estaValido(conexaoAtualizada)) {
      return conexaoAtualizada.access_token;
    }

    console.error(`Falha ao renovar token do cliente ${clienteId}:`, erro);
    throw new ContaAzulDesconectadaError(clienteId);
  }
}
