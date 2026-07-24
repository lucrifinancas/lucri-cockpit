import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { buscarClientePorId } from "../db/clientes.js";
import {
  salvarConexao,
  criarAutorizacaoPendente,
  consumirAutorizacaoPendente,
} from "../db/conexoesContaazul.js";
import { gerarUrlAutorizacao, trocarCodePorToken } from "../contaazul/oauth.js";

export const contaazulOnboardingRoutes = new Hono();

// Passo 1: gera o link de autorização pra um cliente específico.
// Só master/analista podem iniciar essa conexão.
contaazulOnboardingRoutes.get(
  "/autorizar/:clienteId",
  exigirPapel("master", "analista"),
  async (c) => {
    const clienteId = Number(c.req.param("clienteId"));
    const cliente = await buscarClientePorId(c.env.DB, clienteId);
    if (!cliente) {
      return c.json({ erro: "Cliente não encontrado." }, 404);
    }

    const state = crypto.randomUUID();
    await criarAutorizacaoPendente(c.env.DB, state, clienteId);

    const url = gerarUrlAutorizacao(c.env, state);
    return c.json({ url });
  }
);

// Passo 2: o Conta Azul redireciona o navegador pra cá depois que o cliente
// autoriza. Não tem sessão nossa aqui necessariamente (é o navegador vindo
// de outro site) — a segurança vem do "state", que só existe porque nós
// mesmos geramos no passo 1.
contaazulOnboardingRoutes.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const urlApp = c.env.APP_URL;

  if (!code || !state) {
    return c.redirect(`${urlApp}/ajustes?contaazul=erro`);
  }

  const pendente = await consumirAutorizacaoPendente(c.env.DB, state);
  if (!pendente) {
    return c.redirect(`${urlApp}/ajustes?contaazul=erro`);
  }

  try {
    const tokens = await trocarCodePorToken(c.env, code);
    await salvarConexao(c.env.DB, pendente.cliente_id, tokens);
    return c.redirect(`${urlApp}/ajustes?contaazul=sucesso`);
  } catch (erro) {
    console.error(erro);
    return c.redirect(`${urlApp}/ajustes?contaazul=erro`);
  }
});
