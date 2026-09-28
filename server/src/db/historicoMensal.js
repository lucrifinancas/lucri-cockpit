export async function upsertHistoricoMes(
  db,
  clienteId,
  mes,
  { receitas, despesas, vencidas, receberAberto = 0, pagarAberto = 0 }
) {
  await db
    .prepare(
      `INSERT INTO historico_mensal (cliente_id, mes, receitas, despesas, vencidas, receber_aberto, pagar_aberto, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT (cliente_id, mes) DO UPDATE SET
         receitas = excluded.receitas,
         despesas = excluded.despesas,
         vencidas = excluded.vencidas,
         receber_aberto = excluded.receber_aberto,
         pagar_aberto = excluded.pagar_aberto,
         atualizado_em = excluded.atualizado_em`
    )
    .bind(clienteId, mes, receitas, despesas, vencidas, receberAberto, pagarAberto)
    .run();
}

// Últimos `meses` já pré-computados pro cliente, em ordem cronológica
// (mais antigo primeiro) — mês sem linha ainda vira zero, não falta.
export async function listarHistoricoMensal(db, clienteId, mesesChaves) {
  const { results } = await db
    .prepare(
      `SELECT mes, receitas, despesas, vencidas FROM historico_mensal
       WHERE cliente_id = ? AND mes IN (${mesesChaves.map(() => "?").join(",")})`
    )
    .bind(clienteId, ...mesesChaves)
    .all();
  const porMes = new Map(results.map((r) => [r.mes, r]));
  return mesesChaves.map(
    (mes) => porMes.get(mes) ?? { mes, receitas: 0, despesas: 0, vencidas: 0 }
  );
}

// Soma do "em aberto" (contas a receber/pagar ainda não quitadas) em todos
// os meses já pré-computados dentro da janela — alimenta o /balanco.
// Mês fora da janela ou nunca calculado simplesmente não entra na soma
// (mesmo efeito de "zero", sem precisar de linha placeholder).
export async function somarAbertoNaJanela(db, clienteId, mesesChaves) {
  const linha = await db
    .prepare(
      `SELECT COALESCE(SUM(receber_aberto), 0) AS realizavel, COALESCE(SUM(pagar_aberto), 0) AS passivo
       FROM historico_mensal
       WHERE cliente_id = ? AND mes IN (${mesesChaves.map(() => "?").join(",")})`
    )
    .bind(clienteId, ...mesesChaves)
    .first();
  return { realizavel: linha?.realizavel ?? 0, passivo: linha?.passivo ?? 0 };
}

// mes -> atualizado_em, pra o cron decidir o que já está fresco.
export async function statusHistoricoPorCliente(db, clienteId) {
  const { results } = await db
    .prepare("SELECT mes, atualizado_em FROM historico_mensal WHERE cliente_id = ?")
    .bind(clienteId)
    .all();
  return new Map(results.map((r) => [r.mes, r.atualizado_em]));
}
