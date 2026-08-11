export async function listarCategoriaIdsDespesa(db, clienteId) {
  const { results } = await db
    .prepare("SELECT categoria_id FROM categoria_despesa WHERE cliente_id = ? AND is_despesa = 1")
    .bind(clienteId)
    .all();
  return new Set(results.map((r) => r.categoria_id));
}

// Substitui a marcação inteira do cliente pela lista recebida (mais simples
// e previsível do front do que ficar mandando diffs de marcar/desmarcar).
export async function salvarCategoriasDespesa(db, clienteId, categorias) {
  const statements = [
    db.prepare("DELETE FROM categoria_despesa WHERE cliente_id = ?").bind(clienteId),
    ...categorias.map((cat) =>
      db
        .prepare(
          `INSERT INTO categoria_despesa (cliente_id, categoria_id, categoria_nome, is_despesa)
           VALUES (?, ?, ?, 1)`
        )
        .bind(clienteId, cat.categoria_id, cat.categoria_nome)
    ),
  ];
  await db.batch(statements);
}
