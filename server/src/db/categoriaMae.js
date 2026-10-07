export async function listarMaes(db, clienteId) {
  const { results } = await db
    .prepare("SELECT id, nome FROM categoria_mae WHERE cliente_id = ? ORDER BY nome COLLATE NOCASE")
    .bind(clienteId)
    .all();
  return results;
}

// Devolve a mãe criada, ou null se o cliente já tem uma com esse nome.
export async function criarMae(db, clienteId, nome) {
  const existente = await db
    .prepare("SELECT id FROM categoria_mae WHERE cliente_id = ? AND nome = ? COLLATE NOCASE")
    .bind(clienteId, nome)
    .first();
  if (existente) return null;

  const { meta } = await db
    .prepare("INSERT INTO categoria_mae (cliente_id, nome) VALUES (?, ?)")
    .bind(clienteId, nome)
    .run();
  return { id: meta.last_row_id, nome };
}

// Só apaga se nenhuma despesa do cliente estiver usando essa categoria
// master. Devolve "nao_encontrada", "em_uso" ou "ok".
export async function removerMae(db, clienteId, maeId) {
  const mae = await db
    .prepare("SELECT nome FROM categoria_mae WHERE id = ? AND cliente_id = ?")
    .bind(maeId, clienteId)
    .first();
  if (!mae) return "nao_encontrada";

  const emUso = await db
    .prepare("SELECT 1 FROM categoria_despesa WHERE cliente_id = ? AND mae_id = ? LIMIT 1")
    .bind(clienteId, maeId)
    .first();
  if (emUso) return "em_uso";

  await db.batch([
    db.prepare("DELETE FROM contas_pagar_mae WHERE cliente_id = ? AND mae_id = ?").bind(clienteId, maeId),
    db.prepare("DELETE FROM categoria_mae WHERE id = ? AND cliente_id = ?").bind(maeId, clienteId),
  ]);
  return "ok";
}

// Mães que entram na página Contas a pagar (tabela contas_pagar_mae, 0012).
export async function listarMaesContasPagar(db, clienteId) {
  const { results } = await db
    .prepare(
      `SELECT m.id, m.nome FROM contas_pagar_mae c
       JOIN categoria_mae m ON m.id = c.mae_id
       WHERE c.cliente_id = ? ORDER BY m.nome COLLATE NOCASE`
    )
    .bind(clienteId)
    .all();
  return results;
}

export async function salvarMaesContasPagar(db, clienteId, maeIds) {
  await db.batch([
    db.prepare("DELETE FROM contas_pagar_mae WHERE cliente_id = ?").bind(clienteId),
    ...maeIds.map((maeId) =>
      db.prepare("INSERT INTO contas_pagar_mae (cliente_id, mae_id) VALUES (?, ?)").bind(clienteId, maeId)
    ),
  ]);
}
