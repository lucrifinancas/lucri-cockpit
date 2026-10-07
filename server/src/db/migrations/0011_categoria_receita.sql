-- Categoria-mãe das RECEITAS, igual às despesas (0005/0006): o master cria a
-- lista de mães de receita do cliente e marca, receita por receita, a qual mãe
-- cada uma pertence. Lista separada das mães de despesa (pedido do usuário,
-- 07/10) pra não misturar "Despesas Administrativas" com receita.
CREATE TABLE categoria_mae_receita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  nome TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (cliente_id, nome)
);

-- Só existe linha pra receita que já tem mãe; sem linha = "Sem mãe".
CREATE TABLE categoria_receita (
  cliente_id INTEGER NOT NULL,
  categoria_id TEXT NOT NULL,
  categoria_nome TEXT NOT NULL,
  mae_id INTEGER NOT NULL REFERENCES categoria_mae_receita(id),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (cliente_id, categoria_id)
);
