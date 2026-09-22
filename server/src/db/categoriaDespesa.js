// categoria_id -> { mae_id, mae_nome } de todas as despesas marcadas do cliente.
// `mae_id`/`mae_nome` vêm nulos nas linhas antigas, de antes da mãe existir.
export async function listarMaesPorCategoria(db, clienteId) {
  const { results } = await db
    .prepare(
      `SELECT d.categoria_id, d.mae_id, m.nome AS mae_nome
       FROM categoria_despesa d
       LEFT JOIN categoria_mae m ON m.id = d.mae_id
       WHERE d.cliente_id = ? AND d.is_despesa = 1`
    )
    .bind(clienteId)
    .all();
  return new Map(results.map((r) => [r.categoria_id, { mae_id: r.mae_id, mae_nome: r.mae_nome }]));
}

// Substitui a marcação inteira do cliente pela lista recebida (mais simples
// e previsível do front do que ficar mandando diffs de marcar/desmarcar).
export async function salvarCategoriasDespesa(db, clienteId, categorias) {
  const statements = [
    db.prepare("DELETE FROM categoria_despesa WHERE cliente_id = ?").bind(clienteId),
    ...categorias.map((cat) =>
      db
        .prepare(
          `INSERT INTO categoria_despesa (cliente_id, categoria_id, categoria_nome, is_despesa, mae_id)
           VALUES (?, ?, ?, 1, ?)`
        )
        .bind(clienteId, cat.categoria_id, cat.categoria_nome, cat.mae_id ?? null)
    ),
  ];
  await db.batch(statements);
}
