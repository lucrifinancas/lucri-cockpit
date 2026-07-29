import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { criarCliente, listarClientes, buscarClientePorId } from "../db/clientes.js";
import { criarUsuarioCliente, buscarUsuarioPorEmail } from "../db/usuarios.js";
import { criarHashSenha } from "../auth/senha.js";

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

// Cria o login do cliente (papel "cliente"), pra ele acessar o próprio
// dashboard. Só master — mesma regra já aplicada no front.
clientesRoutes.post("/:id/login", exigirPapel("master"), async (c) => {
  const clienteId = Number(c.req.param("id"));
  const { email, senha } = await c.req.json();

  if (!email || !senha) {
    return c.json({ erro: "E-mail e senha são obrigatórios." }, 400);
  }
  if (senha.length < 8) {
    return c.json({ erro: "A senha precisa ter pelo menos 8 caracteres." }, 400);
  }

  const cliente = await buscarClientePorId(c.env.DB, clienteId);
  if (!cliente) {
    return c.json({ erro: "Cliente não encontrado." }, 404);
  }

  const jaExiste = await buscarUsuarioPorEmail(c.env.DB, email);
  if (jaExiste) {
    return c.json({ erro: "Já existe um usuário com esse e-mail." }, 409);
  }

  const senhaHash = await criarHashSenha(senha);
  const usuario = await criarUsuarioCliente(c.env.DB, clienteId, email, senhaHash);

  return c.json(usuario, 201);
});
