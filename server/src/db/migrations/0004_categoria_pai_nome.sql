-- A API do Conta Azul não devolve o nome da categoria-pai (só o ID, dentro
-- de cada categoria filha) — confirmado pelo suporte deles como limitação
-- conhecida, sem previsão de correção. O master cadastra manualmente, uma
-- vez por cliente, o nome de cada categoria-pai (visto na tela do próprio
-- Conta Azul).
CREATE TABLE categoria_pai_nome (
  cliente_id INTEGER NOT NULL,
  categoria_pai_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (cliente_id, categoria_pai_id)
);
