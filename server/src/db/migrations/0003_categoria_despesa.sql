-- Guarda quais categorias financeiras o master marcou como "despesa
-- operacional" (o que diferencia DESPESAS de SAÍDAS) — decisão de usar
-- marcação manual em vez do entrada_dre automático do Conta Azul.
CREATE TABLE categoria_despesa (
  cliente_id INTEGER NOT NULL,
  categoria_id TEXT NOT NULL,
  categoria_nome TEXT NOT NULL,
  is_despesa INTEGER NOT NULL DEFAULT 1,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (cliente_id, categoria_id)
);
