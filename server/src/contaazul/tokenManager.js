// Garante que sempre usamos um access_token válido pra um cliente — renova
// sozinho quando necessário, sem exigir ação humana.

import { buscarConexaoPorCliente, atualizarTokens } from "../db/conexoesContaazul.js";
import { renovarToken } from "./oauth.js";

const MARGEM_SEGURANCA_MS = 60_000; // renova 1 minuto antes de expirar de vez

export async function obterAccessTokenValido(db, env, clienteId) {
  const conexao = await buscarConexaoPorCliente(db, clienteId);
  if (!conexao) {
    return null; // cliente ainda não conectou o Conta Azul
  }

  const expiraEm = new Date(conexao.expira_em).getTime();
  const aindaValido = expiraEm - MARGEM_SEGURANCA_MS > Date.now();

  if (aindaValido) {
    return conexao.access_token;
  }

  const novosTokens = await renovarToken(env, conexao.refresh_token);
  await atualizarTokens(db, clienteId, novosTokens);
  return novosTokens.accessToken;
}
