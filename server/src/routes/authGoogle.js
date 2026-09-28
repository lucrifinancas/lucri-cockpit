import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { gerarUrlAutorizacaoGoogle, obterUsuarioGoogle } from "../auth/google.js";
import { buscarUsuarioPorEmail, criarUsuarioClienteGoogle } from "../db/usuarios.js";
import { buscarConvitePorEmail, apagarConvitePorEmail } from "../db/convites.js";
import { criarSessao } from "../auth/sessao.js";
import { ehDesenvolvimento } from "../auth/origem.js";
import { criarHashSenha } from "../auth/senha.js";

export const authGoogleRoutes = new Hono();

// Senha aleatória que ninguém digita — só pra satisfazer a coluna NOT NULL
// de contas criadas por convite, que só entram via Google.
async function gerarHashSenhaInutilizavel() {
  const senhaAleatoria = crypto.randomUUID() + crypto.randomUUID();
  return criarHashSenha(senhaAleatoria);
}

const NOME_COOKIE_STATE = "google_oauth_state";

// Passo 1: gera o link de autorização do Google. O front deve redirecionar
// o navegador pra cá (não é fetch comum).
authGoogleRoutes.get("/iniciar", (c) => {
  const state = crypto.randomUUID();
  const ehProducao = !ehDesenvolvimento(c);

  setCookie(c, NOME_COOKIE_STATE, state, {
    httpOnly: true,
    secure: ehProducao,
    sameSite: ehProducao ? "None" : "Lax",
    path: "/",
    maxAge: 600, // 10 minutos — só dura o tempo do login
  });

  return c.redirect(gerarUrlAutorizacaoGoogle(c.env, state));
});

// Passo 2: Google redireciona o navegador pra cá depois do usuário
// autorizar. Se já existe um usuário com esse e-mail, só autentica. Se não
// existe mas tem um convite pendente pra esse e-mail, cria a conta "cliente"
// na hora, já vinculada ao cliente do convite (autocadastro).
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

  let usuario = await buscarUsuarioPorEmail(c.env.DB, usuarioGoogle.email);

  if (!usuario) {
    const convite = await buscarConvitePorEmail(c.env.DB, usuarioGoogle.email);
    if (!convite) {
      return c.redirect(`${urlApp}/?google=conta_nao_encontrada`);
    }

    const senhaHashAleatorio = await gerarHashSenhaInutilizavel();
    usuario = await criarUsuarioClienteGoogle(
      c.env.DB,
      convite.cliente_id,
      usuarioGoogle.email,
      usuarioGoogle.nome,
      usuarioGoogle.sobrenome,
      senhaHashAleatorio
    );
    await apagarConvitePorEmail(c.env.DB, usuarioGoogle.email);
  }

  await criarSessao(c, usuario, c.env.JWT_SECRET);
  return c.redirect(urlApp);
});
