export async function criarCliente(db, nome) {
  const resultado = await db
    .prepare("INSERT INTO clientes (nome) VALUES (?) RETURNING *")
    .bind(nome)
    .first();
  return resultado;
}

export async function listarClientes(db) {
  const { results } = await db.prepare("SELECT * FROM clientes ORDER BY nome").all();
  return results;
}

export async function buscarClientePorId(db, id) {
  return db.prepare("SELECT * FROM clientes WHERE id = ?").bind(id).first();
}
