import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { obterAccessTokenValido } from "../contaazul/tokenManager.js";
import {
  buscarContasAPagar,
  buscarContasAReceber,
  buscarContasBancarias,
} from "../contaazul/api.js";

export const homeRoutes = new Hono();

function periodoPadrao() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const formatar = (d) => d.toISOString().slice(0, 10);
  return { de: formatar(primeiroDia), ate: formatar(ultimoDia) };
}

homeRoutes.get("/:clienteId/home", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const { de, ate } = {
    de: c.req.query("de"),
    ate: c.req.query("ate"),
    ...(!c.req.query("de") && !c.req.query("ate") ? periodoPadrao() : {}),
  };

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const [contasAPagar, contasAReceber, contasBancarias] = await Promise.all([
    buscarContasAPagar(accessToken, { de, ate }),
    buscarContasAReceber(accessToken, { de, ate }),
    buscarContasBancarias(accessToken),
  ]);

  return c.json({
    periodo: { de, ate },
    contas_a_pagar: contasAPagar.totais,
    contas_a_receber: contasAReceber.totais,
    contas_bancarias: contasBancarias.itens.map((conta) => ({
      id: conta.id,
      banco: conta.nome,
      agencia: conta.agencia,
      numero: conta.numero,
      tipo: conta.tipo,
    })),
  });
});
