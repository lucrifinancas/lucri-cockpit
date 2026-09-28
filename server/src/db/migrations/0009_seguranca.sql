-- Correções da revisão de segurança de 24/09 (ver
-- RELATORIO-SEGURANCA-2026-09-24.md, na raiz do repo).

-- Achado 2 (Alta): redefinir/trocar senha não revogava sessões já emitidas.
-- Cada sessão (JWT) carrega a versão vigente no momento em que foi criada;
-- ao trocar a senha, essa coluna é incrementada (ver atualizarSenha em
-- usuarios.js) e qualquer token antigo, mesmo válido e não expirado, passa
-- a ser rejeitado por não bater mais com o valor atual.
ALTER TABLE usuarios ADD COLUMN sessao_versao INTEGER NOT NULL DEFAULT 1;

-- "Outros pontos": token de redefinição de senha era guardado em texto
-- puro — um vazamento de leitura do banco entregaria tokens usáveis direto.
-- Passa a guardar só o hash (SHA-256) do token; o valor original nunca é
-- persistido, só existe no e-mail que a pessoa recebe.
ALTER TABLE reset_senha_tokens RENAME COLUMN token TO token_hash;

-- Achado 3 (Média): login e recuperação de senha sem limitação nenhuma.
-- Contador simples por janela de tempo (ver server/src/db/limiteTaxa.js).
CREATE TABLE limite_taxa (
  chave TEXT NOT NULL,
  janela INTEGER NOT NULL,
  contagem INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (chave, janela)
);
