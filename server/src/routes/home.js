import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { obterAccessTokenValido } from "../contaazul/tokenManager.js";
import { resolverPeriodo } from "../utils/periodo.js";
import {
  buscarContasAPagar,
  buscarContasAReceber,
  buscarContasBancarias,
} from "../contaazul/api.js";

export const homeRoutes = new Hono();

homeRoutes.get("/:clienteId/home", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const { de, ate } = resolverPeriodo(c);

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
