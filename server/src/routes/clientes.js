import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { criarCliente, listarClientes } from "../db/clientes.js";

export const clientesRoutes = new Hono();

clientesRoutes.use("*", exigirPapel("master", "analista"));

clientesRoutes.get("/", async (c) => {
  const clientes = await listarClientes(c.env.DB);
  return c.json(clientes);
});

clientesRoutes.post("/", async (c) => {
  const { nome } = await c.req.json();
  if (!nome) {
    return c.json({ erro: "Nome é obrigatório." }, 400);
  }
  const cliente = await criarCliente(c.env.DB, nome);
  return c.json(cliente, 201);
});
