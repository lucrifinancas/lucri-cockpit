// Cria e lê o "crachá" de sessão (JWT assinado) guardado num cookie.

import { sign, verify } from "hono/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { buscarUsuarioPorId } from "../db/usuarios.js";

const NOME_COOKIE = "lucri_sessao";
const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

export async function criarSessao(c, usuario, segredo) {
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
  const ehHttps = c.req.url.startsWith("https://");

  setCookie(c, NOME_COOKIE, token, {
    httpOnly: true, // JavaScript do navegador não consegue ler esse cookie (protege contra roubo via script malicioso)
    secure: ehHttps, // só exige https quando não estamos rodando localmente
    // Front e back moram em domínios diferentes (pages.dev vs workers.dev),
    // então o cookie precisa de SameSite=None pra ser enviado nas chamadas
    // do front — exige "Secure" junto, por isso só em produção (https).
    // Localmente, front e back rodam ambos em "localhost" (portas
    // diferentes contam como mesmo "site"), então "Lax" já basta.
    sameSite: ehHttps ? "None" : "Lax",
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
export async function lerSessaoValida(c, segredo, db) {
  const sessao = await lerSessao(c, segredo);
  if (!sessao) return null;

  const usuario = await buscarUsuarioPorId(db, sessao.sub);
  if (!usuario || usuario.sessao_versao !== sessao.versao) return null;

  return sessao;
}

export function encerrarSessao(c) {
  deleteCookie(c, NOME_COOKIE, { path: "/" });
}
