import { prepararRegistros } from './registrosSchema.js';

// Captura antes e depois dentro do batch transacional do D1. Se qualquer
// statement falhar, tanto a alteração quanto a auditoria sofrem rollback.
export async function batchAuditado(db, { clienteId, contexto = {}, acao, snapshot, bindings }, statements) {
  await prepararRegistros(db);
  const eventoId = crypto.randomUUID();
  const results = await db.batch([
    db.prepare(`INSERT INTO auditoria_categorias
      (evento_id, cliente_id, usuario_id, papel, request_id, versao, acao, antes_json, depois_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((${snapshot}), 'null'), 'null')`)
      .bind(eventoId, clienteId, contexto.usuarioId ?? null, contexto.papel ?? null,
        contexto.requestId ?? crypto.randomUUID(), contexto.versao ?? null, acao, ...bindings),
    ...statements,
    db.prepare(`UPDATE auditoria_categorias SET depois_json = COALESCE((${snapshot}), 'null') WHERE evento_id = ?`)
      .bind(...bindings, eventoId),
    // Um salvamento sem mudança real não deve poluir o histórico.
    db.prepare('DELETE FROM auditoria_categorias WHERE evento_id = ? AND antes_json = depois_json').bind(eventoId),
  ]);
  return results.slice(1, -2);
}

export function snapshotMapeamento(tipo) {
  const despesa = tipo === 'despesas';
  const table = despesa ? 'categoria_despesa' : 'categoria_receita';
  const groups = despesa ? 'categoria_mae' : 'categoria_mae_receita';
  return `SELECT COALESCE(json_group_array(json_object(
    'categoria_id', c.categoria_id, 'categoria_nome', c.categoria_nome,
    'mae_id', c.mae_id, 'mae_nome', m.nome${despesa ? ", 'is_despesa', c.is_despesa" : ''}
  )), '[]') FROM (SELECT * FROM ${table} WHERE cliente_id = ? ORDER BY categoria_id) c
  LEFT JOIN ${groups} m ON m.id = c.mae_id AND m.cliente_id = c.cliente_id`;
}

export function snapshotGrupo(tipo, porNome = false) {
  const table = tipo === 'despesas' ? 'categoria_mae' : 'categoria_mae_receita';
  return `SELECT json_object('id', id, 'nome', nome) FROM ${table} WHERE cliente_id = ? AND ${porNome ? 'nome' : 'id'} = ?`;
}

export const snapshotContasPagar = `SELECT COALESCE(json_group_array(json_object('id', m.id, 'nome', m.nome)), '[]')
  FROM (SELECT * FROM contas_pagar_mae WHERE cliente_id = ? ORDER BY mae_id) c
  JOIN categoria_mae m ON m.id = c.mae_id AND m.cliente_id = c.cliente_id`;
