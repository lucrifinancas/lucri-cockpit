import { Hono } from "hono";
import { buscarUsuarioPorEmail } from "../db/usuarios.js";
import { verificarSenha } from "../auth/senha.js";
import { criarSessao, lerSessao, encerrarSessao } from "../auth/sessao.js";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const { email, senha } = await c.req.json();

  if (!email || !senha) {
    return c.json({ erro: "E-mail e senha são obrigatórios." }, 400);
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
  const sessao = await lerSessao(c, c.env.JWT_SECRET);
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
