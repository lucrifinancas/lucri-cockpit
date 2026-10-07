// Categoria-mãe das receitas (migração 0011) — mesmo modelo das despesas
// (categoriaMae.js + categoriaDespesa.js), só que com lista de mães própria
// (categoria_mae_receita). Sem o override "conta como despesa?": toda
// categoria tipo RECEITA do Conta Azul entra, a mãe só agrupa.

export async function listarMaesReceita(db, clienteId) {
  const { results } = await db
    .prepare("SELECT id, nome FROM categoria_mae_receita WHERE cliente_id = ? ORDER BY nome COLLATE NOCASE")
    .bind(clienteId)
    .all();
  return results;
}

// Devolve a mãe criada, ou null se o cliente já tem uma com esse nome.
export async function criarMaeReceita(db, clienteId, nome) {
  const existente = await db
    .prepare("SELECT id FROM categoria_mae_receita WHERE cliente_id = ? AND nome = ? COLLATE NOCASE")
    .bind(clienteId, nome)
    .first();
  if (existente) return null;

  const { meta } = await db
    .prepare("INSERT INTO categoria_mae_receita (cliente_id, nome) VALUES (?, ?)")
    .bind(clienteId, nome)
    .run();
  return { id: meta.last_row_id, nome };
}

// Só apaga se nenhuma receita do cliente estiver usando essa mãe.
// Devolve "nao_encontrada", "em_uso" ou "ok".
export async function removerMaeReceita(db, clienteId, maeId) {
  const mae = await db
    .prepare("SELECT nome FROM categoria_mae_receita WHERE id = ? AND cliente_id = ?")
    .bind(maeId, clienteId)
    .first();
  if (!mae) return "nao_encontrada";

  const emUso = await db
    .prepare("SELECT 1 FROM categoria_receita WHERE cliente_id = ? AND mae_id = ? LIMIT 1")
    .bind(clienteId, maeId)
    .first();
  if (emUso) return "em_uso";

  await db.prepare("DELETE FROM categoria_mae_receita WHERE id = ? AND cliente_id = ?").bind(maeId, clienteId).run();
  return "ok";
}

// categoria_id -> { mae_id, mae_nome } das receitas já classificadas.
export async function listarMaesPorCategoriaReceita(db, clienteId) {
  const { results } = await db
    .prepare(
      `SELECT r.categoria_id, r.mae_id, m.nome AS mae_nome
       FROM categoria_receita r
       JOIN categoria_mae_receita m ON m.id = r.mae_id
       WHERE r.cliente_id = ?`
    )
    .bind(clienteId)
    .all();
  return new Map(results.map((r) => [r.categoria_id, { mae_id: r.mae_id, mae_nome: r.mae_nome }]));
}

// Substitui a classificação do cliente pela lista recebida (só as receitas
// com mãe — receita sem mãe simplesmente não vem).
export async function salvarCategoriasReceita(db, clienteId, categorias) {
  await db.batch([
    db.prepare("DELETE FROM categoria_receita WHERE cliente_id = ?").bind(clienteId),
    ...categorias.map((cat) =>
      db
        .prepare("INSERT INTO categoria_receita (cliente_id, categoria_id, categoria_nome, mae_id) VALUES (?, ?, ?, ?)")
        .bind(clienteId, cat.categoria_id, cat.categoria_nome, cat.mae_id)
    ),
  ]);
}
