import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { gerarUrlAutorizacaoGoogle, obterUsuarioGoogle } from "../auth/google.js";
import { buscarUsuarioPorEmail } from "../db/usuarios.js";
import { criarSessao } from "../auth/sessao.js";

export const authGoogleRoutes = new Hono();

const NOME_COOKIE_STATE = "google_oauth_state";

// Passo 1: gera o link de autorização do Google. O front deve redirecionar
// o navegador pra cá (não é fetch comum).
authGoogleRoutes.get("/iniciar", (c) => {
  const state = crypto.randomUUID();
  const ehHttps = c.req.url.startsWith("https://");

  setCookie(c, NOME_COOKIE_STATE, state, {
    httpOnly: true,
    secure: ehHttps,
    sameSite: ehHttps ? "None" : "Lax",
    path: "/",
    maxAge: 600, // 10 minutos — só dura o tempo do login
  });

  return c.redirect(gerarUrlAutorizacaoGoogle(c.env, state));
});

// Passo 2: Google redireciona o navegador pra cá depois do usuário
// autorizar. Só autentica quem já tem um usuário nosso com esse e-mail —
// não cria conta nova sozinho.
authGoogleRoutes.get("/callback", async (c) => {
  const urlApp = c.env.APP_URL;
  const code = c.req.query("code");
  const state = c.req.query("state");
  const stateCookie = getCookie(c, NOME_COOKIE_STATE);
  deleteCookie(c, NOME_COOKIE_STATE, { path: "/" });

  if (!code || !state || state !== stateCookie) {
    return c.redirect(`${urlApp}/?google=erro`);
  }

  let usuarioGoogle;
  try {
    usuarioGoogle = await obterUsuarioGoogle(c.env, code);
  } catch (erro) {
    console.error(erro);
    return c.redirect(`${urlApp}/?google=erro`);
  }

  if (!usuarioGoogle.emailVerificado) {
    return c.redirect(`${urlApp}/?google=email_nao_verificado`);
  }

  const usuario = await buscarUsuarioPorEmail(c.env.DB, usuarioGoogle.email);
  if (!usuario) {
    return c.redirect(`${urlApp}/?google=conta_nao_encontrada`);
  }

  await criarSessao(c, usuario, c.env.JWT_SECRET);
  return c.redirect(urlApp);
});
