# Relatório de bugs — Backend Lucri Cockpit

Levantado em 11/08/2026, revisando `server/src/`. Achados via leitura de
código, não teste em produção — cada item cita arquivo/linha pra conferir.

---

## 1. Saídas e Entradas somam o valor total da conta, não o valor pago

**Severidade: alta — provável causa de divergência entre o dado mostrado e o real**

- `server/src/contaazul/normalizar.js:8` — cada lançamento normalizado expõe
  `valor` (total da conta) e `valor_pago` (o que efetivamente foi pago) como
  campos separados.
- `app/src/pages/SaidasPage.jsx` e `app/src/pages/EntradasPage.jsx` somam
  `sumValores()`, que soma o campo `valor`
  (`app/src/data/mockFinance.js:225`) — ou seja, o "Total no período"
  mostrado é o valor de **tudo que vence no período, pago ou não**, não o
  que **realmente saiu/entrou do caixa**.
- Mesmo padrão na Home: `totalEntradas` e `totalSaidas` usam
  `.totais.todos`, não `.totais.pago.valor`.

**Decisão que falta:** o app deveria mostrar regime de **competência**
(tudo que vence no período, é o que está hoje) ou **caixa** (só o que foi
pago)? Se for caixa, o front precisa trocar pra somar `valor_pago` em vez
de `valor`.

---

## 2. Despesas não tem endpoint no backend — é mock

**Severidade: média — não é bug, é gap conhecido, registrando formalmente**

- `app/src/hooks/useFinanceData.js:17,47` — comentário explícito no código:
  "despesas segue mockado — não existe endpoint ainda".
- Não existe rota `/despesas` em `server/src/routes/financeiro.js`.

---

## 3. Token do Conta Azul expirado retorna 500 genérico, sem mensagem tratável

**Severidade: média**

- `server/src/contaazul/tokenManager.js:22` — chama `renovarToken()` sem
  `try/catch`. Quando o Conta Azul recusa o refresh (`invalid_grant`), a
  exceção sobe sem tratamento e vira 500 cru pro front, que não consegue
  diferenciar isso de qualquer outro erro.
- **Sugestão:** capturar esse erro específico e responder algo como
  `{"erro": "conta_azul_desconectada"}` (código 409 ou 401), pro front
  poder mostrar "reconecte o Conta Azul" em vez de erro genérico.
- **Efeito colateral real disso hoje:** cliente "Nick Publicidade" está com
  token expirado e a Home dele quebra com 500.

---

## Referência

- Contrato de API: `API-CONTRACT.md`
- Relatório de teste de integração anterior (06/08):
  `RELATORIO-TESTE-INTEGRACAO-2026-08-06.md`
