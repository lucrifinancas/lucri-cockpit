// Cria e lê o "crachá" de sessão (JWT assinado) guardado num cookie.

import { sign, verify } from "hono/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { buscarUsuarioPorId } from "../db/usuarios.js";
import { ehDesenvolvimento } from "./origem.js";

const NOME_COOKIE = "lucri_sessao";
const COOKIE_VISAO = "lucri_visao";
const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

export async function criarSessao(c, usuario, segredo) {
  encerrarVisao(c);
  const agora = Math.floor(Date.now() / 1000);
  const payload = {
    sub: usuario.id,
    email: usuario.email,
    papel: usuario.papel,
    cliente_id: usuario.cliente_id ?? null,
    // Carimba a sessão com a versão vigente no momento do login — trocar a
    // senha incrementa essa coluna (ver atualizarSenha em usuarios.js), e
    // qualquer token emitido antes passa a ser rejeitado em lerSessaoValida,
    // mesmo que ainda não tenha expirado. Ver
    // RELATORIO-SEGURANCA-2026-09-24.md, achado 2.
    versao: usuario.sessao_versao ?? 1,
    iat: agora,
    exp: agora + DURACAO_SEGUNDOS,
  };

  const token = await sign(payload, segredo);
  const ehProducao = !ehDesenvolvimento(c);

  setCookie(c, NOME_COOKIE, token, {
    httpOnly: true, // JavaScript do navegador não consegue ler esse cookie (protege contra roubo via script malicioso)
    secure: ehProducao, // só exige https quando não estamos rodando localmente
    // Front e back moram em domínios diferentes (pages.dev vs workers.dev),
    // então o cookie precisa de SameSite=None pra ser enviado nas chamadas
    // do front — exige "Secure" junto, por isso só em produção (https).
    // Localmente, front e back rodam ambos em "localhost" (portas
    // diferentes contam como mesmo "site"), então "Lax" já basta.
    sameSite: ehProducao ? "None" : "Lax",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function lerSessao(c, segredo) {
  const token = getCookie(c, NOME_COOKIE);
  if (!token) return null;

  try {
    return await verify(token, segredo, "HS256");
  } catch {
    return null; // token inválido, adulterado ou expirado
  }
}

// Mesma coisa que lerSessao, mas também confere no banco se a sessão ainda
// é a versão vigente daquele usuário — é o que faz uma troca/redefinição de
// senha derrubar sessões antigas na prática (sem isso, um JWT continuaria
// válido por até 7 dias mesmo depois da vítima recuperar a conta). Usar
// esta função em todo lugar que hoje usa lerSessao pra proteger uma rota.
export async function lerSessaoOriginal(c, segredo, db) {
  const sessao = await lerSessao(c, segredo);
  if (!sessao) return null;

  const usuario = await buscarUsuarioPorId(db, sessao.sub);
  if (!usuario || usuario.ativo === 0 || usuario.sessao_versao !== sessao.versao) return null;

  return { ...sessao, email: usuario.email, papel: usuario.papel, cliente_id: usuario.cliente_id ?? null };
}

export async function lerSessaoValida(c, segredo, db) {
  const original = await lerSessaoOriginal(c, segredo, db);
  if (!original) return null;
  const token = getCookie(c, COOKIE_VISAO);
  if (!token) return original;
  // Uma visão inválida/expirada nunca volta silenciosamente aos poderes do admin.
  try {
    const visao = await verify(token, segredo, 'HS256');
    if (visao.tipo !== 'visao_cliente' || original.papel !== 'master' || visao.ator_id !== original.sub || visao.ator_versao !== original.versao) return null;
    const alvo = await buscarUsuarioPorId(db, visao.alvo_id);
    if (!alvo || alvo.ativo === 0 || alvo.papel !== 'cliente' || !alvo.cliente_id || alvo.sessao_versao !== visao.alvo_versao) return null;
    return { sub: alvo.id, email: alvo.email, papel: alvo.papel, cliente_id: alvo.cliente_id,
      versao: alvo.sessao_versao, acesso_assistido: { administrador_id: original.sub, administrador_email: original.email, expira_em: visao.exp } };
  } catch { return null; }
}

export async function criarVisao(c, original, alvo) {
  const agora = Math.floor(Date.now() / 1000);
  const token = await sign({ tipo: 'visao_cliente', ator_id: original.sub, ator_versao: original.versao,
    alvo_id: alvo.id, alvo_versao: alvo.sessao_versao, iat: agora, exp: agora + 1800 }, c.env.JWT_SECRET);
  const producao = !ehDesenvolvimento(c);
  // Cookie de sessão: permanece presente após expirar o JWT, impedindo fallback ao admin.
  setCookie(c, COOKIE_VISAO, token, { httpOnly: true, secure: producao, sameSite: producao ? 'None' : 'Lax', path: '/' });
}
function apagarCookieSessao(c, nome) {
  const producao = !ehDesenvolvimento(c);
  // A exclusão também é um Set-Cookie: sem SameSite=None; Secure o
  // navegador a rejeita na chamada do Cockpit para o domínio da API.
  deleteCookie(c, nome, { path: '/', httpOnly: true, secure: producao, sameSite: producao ? 'None' : 'Lax' });
}
export function encerrarVisao(c) { apagarCookieSessao(c, COOKIE_VISAO); }

export function encerrarSessao(c) {
  encerrarVisao(c);
  apagarCookieSessao(c, NOME_COOKIE);
}
