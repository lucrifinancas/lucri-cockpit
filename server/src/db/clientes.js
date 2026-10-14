export async function criarCliente(db, nome) {
  const resultado = await db
    .prepare("INSERT INTO clientes (nome) VALUES (?) RETURNING *")
    .bind(nome)
    .first();
  return resultado;
}

// Lista com o resumo que a tela de Ajustes → Clientes mostra. NUNCA traz
// colunas de conexoes_contaazul além da data (lá ficam os tokens).
// `conta_azul_atualizado_em` = última vez que o acesso foi criado/renovado
// (o token renova sempre que o Cockpit busca dados) — não garante que ainda
// está válido: se o Conta Azul derrubar, a linha continua (ver tokenManager).
export async function listarClientes(db) {
  const { results } = await db
    .prepare(
      `SELECT c.id, c.nome, c.criado_em,
         (SELECT MAX(cc.atualizado_em) FROM conexoes_contaazul cc WHERE cc.cliente_id = c.id) AS conta_azul_atualizado_em,
         (SELECT COUNT(*) FROM usuarios u WHERE u.cliente_id = c.id AND u.papel = 'cliente') AS usuarios,
         (SELECT COUNT(*) FROM convites_cliente v WHERE v.cliente_id = c.id) AS convites
       FROM clientes c
       ORDER BY c.nome`
    )
    .all();
  return results.map((c) => ({ ...c, conta_azul_conectado: c.conta_azul_atualizado_em != null }));
}

export async function buscarClientePorId(db, id) {
  return db.prepare("SELECT * FROM clientes WHERE id = ?").bind(id).first();
}
