-- Token de redefinição de senha, gerado quando o usuário pede "esqueci minha
-- senha". Cada linha é apagada assim que o token é usado ou quando expira
-- (mesmo espírito de contaazul_autorizacoes_pendentes).
CREATE TABLE reset_senha_tokens (
  token TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  expira_em TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
