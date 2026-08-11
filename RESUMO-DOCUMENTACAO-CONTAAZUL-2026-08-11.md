# Resumo — Documentação oficial Conta Azul (Competência x Contas a pagar/receber x Extrato)

Lido em 11/08/2026 na central de ajuda oficial (`ajuda.contaazul.com`).
Confirma a causa do **bug #1** do `RELATORIO-BUGS-BACKEND-2026-08-11.md`
("Saídas e Entradas somam o valor total da conta, não o valor pago").

---

## O Conta Azul tem 3 visões diferentes do mesmo dinheiro

| Visão | O que mostra | Data usada |
|---|---|---|
| **Competência** | O lançamento em si (a venda/compra que gerou a obrigação), não importa se já foi pago | Data em que o lançamento **ocorreu** |
| **Contas a pagar / Contas a receber** | Todas as parcelas da obrigação — em aberto, baixadas (pagas) ou previstas | Data de **vencimento** |
| **Extrato de movimentações** | Só o que **já foi efetivamente pago ou recebido** (liquidado) | Data de **liquidação/pagamento** |

Segundo o FAQ oficial: *"Em Competência, você tem acesso aos lançamentos; Em
Contas a Pagar e Receber, às parcelas desse lançamento; Em Extrato, as
baixas das parcelas."*

## Por que os totais nunca batem entre as telas

Isso é **esperado e documentado pela própria Conta Azul** — não é bug do
lado deles:

- Uma parcela pode estar **em aberto** (ainda não vencida), **vencida sem
  pagamento**, ou **paga parcialmente** — em todos esses casos ela aparece
  no total de "Contas a pagar/receber" pelo valor cheio, mesmo sem ter
  saído/entrado dinheiro nenhum ainda.
- Só quando a baixa (pagamento) acontece, o valor aparece no **Extrato de
  movimentações**.
- Ou seja: **"Contas a pagar/receber" = obrigação (o que deveria acontecer)**,
  **"Extrato" = realidade (o que efetivamente aconteceu)**.

## Como isso confirma o nosso bug

O backend do Cockpit (`server/src/routes/financeiro.js`) chama
`buscarContasAPagar` / `buscarContasAReceber` — ou seja, já está usando a
visão de **"Contas a pagar/receber"**, que é por vencimento, não por
pagamento. O front então soma o campo `valor` (bruto, valor da parcela)
em vez de `valor_pago` — misturando parcelas pagas e não pagas no mesmo
total.

**A pergunta que fica pro time**: o Cockpit deveria mostrar regime de
**caixa** (só o que já foi pago/recebido, comparável ao extrato bancário)
ou manter o regime de **contas a pagar/receber** (o que está previsto
vencer)? A API do Conta Azul já devolve os dois valores separados
(`valor` e `valor_pago`) — é só decidir qual o produto quer exibir e
ajustar o front pra somar o campo certo.

---

## Documentação técnica (não consegui ler — bloqueada pra acesso automatizado)

O portal técnico de desenvolvedor (`developers.contaazul.com`) devolveu
403 pra todas as tentativas de leitura automática. Os links abaixo
existem e são reais, só precisam ser abertos manualmente no navegador:

- [Autenticação na API da Conta Azul](https://developers.contaazul.com/auth)
- [Renovando seu Access Token](https://developers.contaazul.com/renewingaccesstoken)
- [Trocar o código recebido por um access_token](https://developers.contaazul.com/changecode)
- [Financeiro (referência da API)](https://developers.contaazul.com/docs/financial-apis-openapi)
- [Guia de Migração: API Legada para Nova API](https://developers.contaazul.com/migration)

## Fontes lidas com sucesso

- [Diferenças entre Extrato de movimentações e Contas a pagar ou a receber](https://ajuda.contaazul.com/hc/pt-br/articles/7489796754957-Diferen%C3%A7as-entre-Extrato-de-movimenta%C3%A7%C3%B5es-e-Contas-a-pagar-ou-a-receber)
- [Perguntas frequentes | Financeiro](https://ajuda.contaazul.com/hc/pt-br/articles/10216665657997-Perguntas-frequentes-Financeiro)

## Referência

- Relatório de bugs relacionado: `RELATORIO-BUGS-BACKEND-2026-08-11.md`
