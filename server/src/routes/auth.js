import { Hono } from "hono";
import {
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  atualizarSenha,
  criarTokenReset,
  consumirTokenReset,
  apagarTokensResetDoUsuario,
} from "../db/usuarios.js";
import { verificarSenha, criarHashSenha } from "../auth/senha.js";
import { criarSessao, lerSessaoValida, encerrarSessao } from "../auth/sessao.js";
import { enviarEmailResetSenha } from "../email/resend.js";
import { dentroDoLimite } from "../db/limiteTaxa.js";

export const authRoutes = new Hono();

const RESET_SENHA_VALIDADE_MINUTOS = 60;

// Limites contra tentativas automatizadas (ver
// RELATORIO-SEGURANCA-2026-09-24.md, achado 3). Por e-mail, não por IP —
// mais simples e já resolve o abuso descrito no relatório (tentar senha
// repetidamente contra a mesma conta, ou pedir redefinição várias vezes
// seguidas invalidando o link legítimo anterior).
const LOGIN_LIMITE = 10;
const LOGIN_JANELA_SEGUNDOS = 15 * 60;
const RESET_LIMITE = 3;
const RESET_JANELA_SEGUNDOS = 15 * 60;

function gerarTokenReset() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

authRoutes.post("/login", async (c) => {
  const { email, senha } = await c.req.json();

  if (!email || !senha) {
    return c.json({ erro: "E-mail e senha são obrigatórios." }, 400);
  }

  const podeTentar = await dentroDoLimite(c.env.DB, `login:${email}`, LOGIN_LIMITE, LOGIN_JANELA_SEGUNDOS);
  if (!podeTentar) {
    return c.json({ erro: "Muitas tentativas. Aguarde alguns minutos e tente de novo." }, 429);
  }

  const usuario = await buscarUsuarioPorEmail(c.env.DB, email);
  if (!usuario) {
    return c.json({ erro: "E-mail ou senha incorretos." }, 401);
  }

  const senhaCorreta = await verificarSenha(senha, usuario.senha_hash);
  if (!senhaCorreta) {
    return c.json({ erro: "E-mail ou senha incorretos." }, 401);
  }

  await criarSessao(c, usuario, c.env.JWT_SECRET);

  return c.json({
    email: usuario.email,
    papel: usuario.papel,
    cliente_id: usuario.cliente_id,
  });
});

authRoutes.get("/me", async (c) => {
  const sessao = await lerSessaoValida(c, c.env.JWT_SECRET, c.env.DB);
  if (!sessao) {
    return c.json({ erro: "Não autenticado." }, 401);
  }
  return c.json({
    email: sessao.email,
    papel: sessao.papel,
    cliente_id: sessao.cliente_id,
  });
});

authRoutes.post("/logout", (c) => {
  encerrarSessao(c);
  return c.json({ ok: true });
});

authRoutes.post("/alterar-senha", async (c) => {
  const sessao = await lerSessaoValida(c, c.env.JWT_SECRET, c.env.DB);
  if (!sessao) {
    return c.json({ erro: "Não autenticado." }, 401);
  }

  const { senha_atual, senha_nova } = await c.req.json();
  if (!senha_atual || !senha_nova) {
    return c.json({ erro: "Senha atual e nova senha são obrigatórias." }, 400);
  }
  if (senha_nova.length < 8) {
    return c.json({ erro: "A nova senha precisa ter pelo menos 8 caracteres." }, 400);
  }

  const usuario = await buscarUsuarioPorId(c.env.DB, sessao.sub);
  const senhaAtualCorreta = await verificarSenha(senha_atual, usuario.senha_hash);
  if (!senhaAtualCorreta) {
    return c.json({ erro: "Senha atual incorreta." }, 401);
  }

  const novoHash = await criarHashSenha(senha_nova);
  await atualizarSenha(c.env.DB, usuario.id, novoHash);
  // Trocou a senha por aqui — qualquer link de redefinição por e-mail
  // pendente também deixa de fazer sentido.
  await apagarTokensResetDoUsuario(c.env.DB, usuario.id);

  return c.json({ ok: true });
});

// Pede a redefinição — gera um token, manda o e-mail via Resend. Sempre
// responde "ok", mesmo se o e-mail não existir, pra não deixar alguém
// descobrir quais e-mails têm cadastro tentando um por um.
authRoutes.post("/esqueci-senha", async (c) => {
  const { email } = await c.req.json();
  if (!email) {
    return c.json({ erro: "E-mail é obrigatório." }, 400);
  }

  const podePedir = await dentroDoLimite(c.env.DB, `reset:${email}`, RESET_LIMITE, RESET_JANELA_SEGUNDOS);
  if (!podePedir) {
    // Mesma resposta de sempre (200 ok) em vez de 429 — não é só por
    // segurança (não confirmar se o e-mail existe), é porque um pedido
    // "bloqueado" nem invalida o token anterior, que continua válido.
    return c.json({ ok: true });
  }

  const usuario = await buscarUsuarioPorEmail(c.env.DB, email);
  if (usuario) {
    await apagarTokensResetDoUsuario(c.env.DB, usuario.id);

    const token = gerarTokenReset();
    await criarTokenReset(c.env.DB, usuario.id, token, RESET_SENHA_VALIDADE_MINUTOS);

    const linkRedefinicao = `${c.env.APP_URL}/redefinir-senha?token=${token}`;
    await enviarEmailResetSenha(c.env.RESEND_API_KEY, c.env.EMAIL_REMETENTE, {
      email: usuario.email,
      linkRedefinicao,
      expiraEmMinutos: RESET_SENHA_VALIDADE_MINUTOS,
    });
  }

  return c.json({ ok: true });
});

// Efetiva a troca de senha usando o token recebido por e-mail.
authRoutes.post("/redefinir-senha", async (c) => {
  const { token, senha_nova } = await c.req.json();
  if (!token || !senha_nova) {
    return c.json({ erro: "Token e nova senha são obrigatórios." }, 400);
  }
  if (senha_nova.length < 8) {
    return c.json({ erro: "A nova senha precisa ter pelo menos 8 caracteres." }, 400);
  }

  // Confere e apaga o token na mesma operação — ninguém mais consegue usar
  // esse link de novo, nem em duas abas ao mesmo tempo.
  const usuario = await consumirTokenReset(c.env.DB, token);
  if (!usuario) {
    return c.json({ erro: "Link inválido ou expirado. Peça uma nova redefinição." }, 400);
  }

  const novoHash = await criarHashSenha(senha_nova);
  await atualizarSenha(c.env.DB, usuario.id, novoHash);

  return c.json({ ok: true });
});
