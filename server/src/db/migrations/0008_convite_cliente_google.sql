-- Convite de acesso por e-mail: o master reserva um e-mail pra um cliente,
-- sem senha nenhuma. Quando essa pessoa entra com Google pela primeira vez
-- e o e-mail bate com um convite pendente, a conta "cliente" é criada
-- automaticamente já vinculada à empresa certa (ver server/src/routes/authGoogle.js).
CREATE TABLE convites_cliente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Nome/sobrenome, preenchidos automaticamente pelos dados do Google no
-- autocadastro (given_name/family_name) — contas antigas (master/analista,
-- clientes cadastrados manualmente) ficam com esses campos vazios.
ALTER TABLE usuarios ADD COLUMN nome TEXT;
ALTER TABLE usuarios ADD COLUMN sobrenome TEXT;
