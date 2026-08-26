import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { criarCliente, listarClientes, buscarClientePorId } from "../db/clientes.js";
import { criarUsuarioCliente, buscarUsuarioPorEmail } from "../db/usuarios.js";
import { criarHashSenha } from "../auth/senha.js";
import { salvarCategoriasDespesa, listarCategoriaIdsDespesa } from "../db/categoriaDespesa.js";
import { listarNomesPai, salvarNomesPai } from "../db/categoriaPaiNome.js";
import { obterAccessTokenValido } from "../contaazul/tokenManager.js";
import { buscarCategorias } from "../contaazul/api.js";

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

// Lista o plano de contas do cliente, com um campo extra `is_despesa`
// indicando o que o master já marcou (usado na tela de Ajustes).
clientesRoutes.get("/:id/categorias", async (c) => {
  const clienteId = Number(c.req.param("id"));

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const [categorias, marcadas] = await Promise.all([
    buscarCategorias(accessToken),
    listarCategoriaIdsDespesa(c.env.DB, clienteId),
  ]);

  return c.json(
    categorias.itens.map((cat) => ({
      id: cat.id,
      nome: cat.nome,
      tipo: cat.tipo,
      is_despesa: marcadas.has(cat.id),
    }))
  );
});

// Salva quais categorias contam como "despesa operacional" — só master.
clientesRoutes.put("/:id/categorias/despesas", exigirPapel("master"), async (c) => {
  const clienteId = Number(c.req.param("id"));
  const { categorias } = await c.req.json();

  if (!Array.isArray(categorias)) {
    return c.json({ erro: "Campo 'categorias' precisa ser uma lista." }, 400);
  }

  await salvarCategoriasDespesa(c.env.DB, clienteId, categorias);
  return c.json({ ok: true });
});

// Lista as categorias-pai encontradas no plano de contas do cliente — a API
// do Conta Azul não devolve o nome delas (limitação confirmada pelo
// suporte), só o ID dentro de cada categoria filha. Aqui devolvemos cada
// categoria-pai com o nome já cadastrado (se houver) e uma amostra das
// categorias filhas, pra o master conseguir identificar qual é qual
// olhando a tela do próprio Conta Azul.
clientesRoutes.get("/:id/categorias-pai", async (c) => {
  const clienteId = Number(c.req.param("id"));

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const [categorias, nomesPai] = await Promise.all([
    buscarCategorias(accessToken),
    listarNomesPai(c.env.DB, clienteId),
  ]);

  const filhasPorPai = new Map();
  for (const cat of categorias.itens) {
    if (!cat.categoria_pai) continue;
    if (!filhasPorPai.has(cat.categoria_pai)) filhasPorPai.set(cat.categoria_pai, []);
    filhasPorPai.get(cat.categoria_pai).push(cat.nome);
  }

  const paisOrdenados = [...filhasPorPai.entries()].map(([paiId, filhas]) => ({
    categoria_pai_id: paiId,
    nome: nomesPai.get(paiId) ?? null,
    categorias_filhas: filhas,
  }));

  return c.json(paisOrdenados);
});

// Salva o nome de uma ou mais categorias-pai — só master.
clientesRoutes.put("/:id/categorias-pai", exigirPapel("master"), async (c) => {
  const clienteId = Number(c.req.param("id"));
  const { categorias_pai } = await c.req.json();

  if (!Array.isArray(categorias_pai)) {
    return c.json({ erro: "Campo 'categorias_pai' precisa ser uma lista." }, 400);
  }

  await salvarNomesPai(c.env.DB, clienteId, categorias_pai);
  return c.json({ ok: true });
});
