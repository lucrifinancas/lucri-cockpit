-- Histórico mensal pré-computado (receitas/despesas/vencidas por mês) —
-- preenchido por um cron (ver src/cron/historico.js), não mais calculado ao
-- vivo em cada abertura da Home. O cálculo ao vivo buscava uma janela de 12
-- meses de contas a pagar/receber numa invocação só, o que estourava o
-- limite de subrequisições do Worker pra clientes com bastante lançamento
-- (ver CHECKLIST-V1.0.md, achado de 23/09).
CREATE TABLE historico_mensal (
  cliente_id INTEGER NOT NULL,
  mes TEXT NOT NULL, -- "2026-08"
  receitas REAL NOT NULL DEFAULT 0,
  despesas REAL NOT NULL DEFAULT 0,
  vencidas REAL NOT NULL DEFAULT 0,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (cliente_id, mes)
);
