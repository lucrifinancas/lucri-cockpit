# Demandas para finalizar o Lucri Cockpit

Checklist consolidado a partir de `CHECKLIST-FRONTEND.md`,
`DECISOES-E-ESCOPO.md` e do teste de integração de 2026-08-06. Marcar
conforme for resolvendo.

## 1. Subir o que já está pronto (curto prazo)

- [ ] Revisar o diff de `app/src/` (front) — muita coisa modificada
  (`App.jsx`, `AuthContext.jsx`, `LoginPage`, `ClientContext.jsx`,
  `useFinanceData.js`, `useHomeCardPrefs.js`, `AppLayout.jsx`,
  `AjustesPage`, `HomePage.jsx`) e `app/src/data/mockClients.js` foi
  deletado — confirmar que é intencional antes de commitar
- [ ] Adicionar `app/src/api/` e `app/src/hooks/useLocalProfile.js`
  (arquivos novos, ainda não rastreados no git)
- [ ] Commitar e dar push pro `main` (`git add`, `git commit`, `git push`)
- [ ] `wrangler deploy` no `server/` (o CORS foi ajustado pra liberar
  também IPs de rede local, além de `localhost` e do domínio de produção)
- [ ] Cloudflare Pages redeploya o front sozinho a partir do push no
  `main` — conferir no painel se o build passou
- [ ] Testar login → Ajustes → Home na URL de produção depois do deploy

## 2. Pendências específicas já identificadas

- [ ] **Token do Conta Azul do cliente "Nick Publicidade" expirado** —
  reconectar pela tela Ajustes → "Conectar Conta Azul" (precisa das
  credenciais reais da conta desse cliente)
- [ ] Avaliar se vale padronizar erro de token expirado como
  `{"erro": "conta_azul_desconectada"}` em vez de 500 genérico, pra front
  mostrar mensagem amigável

## 3. Beta 1 — HOME e AJUSTES (foco atual)

- [ ] Conteúdo definitivo da HOME (ainda não fechado)
- [ ] Confirmar que AJUSTES cobre: status das conexões Conta Azul por
  cliente, toggle de tema, troca de senha (`POST /api/auth/alterar-senha`)
- [ ] Onboarding de cliente ponta a ponta: cadastro, botão "Conectar Conta
  Azul", leitura de `?contaazul=sucesso/erro` na URL, criação de login do
  cliente (só `master`)

## 4. Decisões em aberto (bloqueiam layout final de outras telas)

- [ ] Categorização fixo/variável de DESPESAS — Conta Azul já traz
  `entrada_dre` pronto por categoria; confirmar se dispensa tela própria de
  mapeamento
- [ ] Estrutura de linhas/subtotais do BALANÇO (ativo circulante/não
  circulante etc.)
- [ ] Estrutura de níveis de subtotal do DRE
- [ ] Origem do saldo por conta bancária — `GET /conta-financeira` não traz
  esse campo hoje; confirmar com o Conta Azul se existe em outro endpoint
  ou se precisa ser calculado

## 5. Telas ainda em mock (fora do escopo do Beta 1)

- [ ] ENTRADAS
- [ ] SAÍDAS
- [ ] DESPESAS — não fixar layout até o item 4 resolver
- [ ] CAIXA
- [ ] BALANÇO — não fixar layout até o item 4 resolver
- [ ] DRE — não fixar layout até o item 4 resolver

## Referência rápida

- Contrato de API: `API-CONTRACT.md`
- Passo a passo pra tirar HOME/AJUSTES do mock: `GUIA-INTEGRACAO-DADOS-REAIS.md`
- Decisões fechadas e escopo: `DECISOES-E-ESCOPO.md`
- Diretrizes de front/back: `DIRETRIZES-FRONTEND.md`, `DIRETRIZES-BACKEND.md`
