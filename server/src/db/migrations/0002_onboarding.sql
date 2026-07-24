-- Guarda tentativas de autorização em andamento, ligando o "state" (código
-- aleatório de segurança) ao cliente que está sendo conectado. Cada linha é
-- apagada assim que a autorização é concluída (ou expira).
CREATE TABLE contaazul_autorizacoes_pendentes (
  state TEXT PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
