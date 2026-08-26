export async function listarNomesPai(db, clienteId) {
  const { results } = await db
    .prepare("SELECT categoria_pai_id, nome FROM categoria_pai_nome WHERE cliente_id = ?")
    .bind(clienteId)
    .all();
  return new Map(results.map((r) => [r.categoria_pai_id, r.nome]));
}

// Substitui a lista inteira recebida (mesmo padrão de salvarCategoriasDespesa).
export async function salvarNomesPai(db, clienteId, nomes) {
  const statements = nomes.map((n) =>
    db
      .prepare(
        `INSERT INTO categoria_pai_nome (cliente_id, categoria_pai_id, nome, atualizado_em)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT (cliente_id, categoria_pai_id) DO UPDATE SET nome = excluded.nome, atualizado_em = datetime('now')`
      )
      .bind(clienteId, n.categoria_pai_id, n.nome)
  );
  if (statements.length) await db.batch(statements);
}
