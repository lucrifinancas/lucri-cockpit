-- receber_aberto/pagar_aberto: soma do que ainda está em aberto (nao_pago)
-- pra títulos com vencimento naquele mês, calculado de graça no mesmo
-- fetch que já preenche receitas/despesas/vencidas (zero requisição extra
-- à Conta Azul). Alimenta o /balanco pré-computado — ver
-- CHECKLIST-V1.0.md, mesmo achado de subrequisições do histórico.
ALTER TABLE historico_mensal ADD COLUMN receber_aberto REAL NOT NULL DEFAULT 0;
ALTER TABLE historico_mensal ADD COLUMN pagar_aberto REAL NOT NULL DEFAULT 0;
