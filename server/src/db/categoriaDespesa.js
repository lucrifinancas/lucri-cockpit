// Override manual de "essa categoria conta como despesa?" — só existe uma
// linha aqui quando o master mexeu explicitamente naquela categoria (ver
// utils/despesas.js: sem override, vale o tipo=DESPESA automático do Conta
// Azul). categoria_id -> true/false.
export async function listarOverridesDespesa(db, clienteId) {
  const { results } = await db
    .prepare("SELECT categoria_id, is_despesa FROM categoria_despesa WHERE cliente_id = ?")
    .bind(clienteId)
    .all();
  return new Map(results.map((r) => [r.categoria_id, Boolean(r.is_despesa)]));
}

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

// Substitui os overrides do cliente pela lista recebida — só as categorias
// onde o master escolheu diferente do automático precisam vir aqui (ver
// AjustesPage.jsx: manda só o diff, não a lista inteira de categorias).
export async function salvarCategoriasDespesa(db, clienteId, categorias) {
  const statements = [
    db.prepare("DELETE FROM categoria_despesa WHERE cliente_id = ?").bind(clienteId),
    ...categorias.map((cat) =>
      db
        .prepare(
          `INSERT INTO categoria_despesa (cliente_id, categoria_id, categoria_nome, is_despesa, mae_id)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(clienteId, cat.categoria_id, cat.categoria_nome, cat.is_despesa ? 1 : 0, cat.mae_id ?? null)
    ),
  ];
  await db.batch(statements);
}
