# O que a API do Conta Azul consegue ver

Mapa de tudo que já testamos contra a API v2 do Conta Azul
(`https://api-v2.contaazul.com/v1`), com um token OAuth real de um cliente
conectado (Nick Publicidade). Fontes: `DADOS-CONTA-AZUL-API.md`,
`API-CONTRACT.md`, e os testes ao vivo da sessão de 10/09/2026.

**Legenda:**
- 🟢 **Verde** — consegue ver completamente, dado bate com o Conta Azul
- 🟡 **Amarelo** — consegue ver, mas os valores não batem 100% com o
  relatório nativo do Conta Azul (limitação da API, não bug nosso)
- 🔴 **Vermelho** — não consegue ver / não existe na API pública

---

## Financeiro (entradas, saídas, caixa)

| Dado | Status | Observação |
|---|---|---|
| Lançamentos de contas a receber | 🟢 | `GET /financeiro/eventos-financeiros/contas-a-receber/buscar` — lista completa, paginada corretamente (426 lançamentos no cliente de teste) |
| Lançamentos de contas a pagar | 🟢 | Mesmo endpoint/estrutura, `contas-a-pagar` (1.477 lançamentos no cliente de teste) |
| Total pago no período (`totais.pago.valor`) | 🟡 | **Só filtra por `data_vencimento_de/ate`** — não existe filtro por data de pagamento, recebimento, baixa, liquidação ou competência (testado e confirmado: todos retornam erro). Um título que vence num mês mas é pago em outro não reconcilia com o relatório nativo "Análise de recebimentos" do Conta Azul (achado 10/09: diferença de R$1.440 num teste real de agosto/2026) |
| Status do lançamento (pago/vencido/pendente) | 🟢 | `status_traduzido`: PAGO, VENCIDO, VENCE_HOJE, PENDENTE |
| Saldo por conta bancária | 🟢 | Não vem na listagem de contas, mas existe endpoint próprio não documentado publicamente: `GET /conta-financeira/{id}/saldo-atual` — resolvido em 12/08 |
| Regime de caixa vs. competência | 🟡 | Temos os dois campos (`valor`/total do título e `valor_pago`), mas só dá pra agrupar por vencimento — sem filtro de data de pagamento real, "regime de caixa por mês" não fecha 100% com o Conta Azul quando há atraso entre vencimento e pagamento |

## Categorização (plano de contas / DRE)

| Dado | Status | Observação |
|---|---|---|
| Lista de categorias (plano de contas) | 🟢 | `GET /categorias` — 133 categorias no cliente de teste, com `tipo` (RECEITA/DESPESA) |
| Categoria de cada lançamento | 🟢 | Vem junto no lançamento (`categorias[0].nome`) |
| Estrutura oficial de DRE (`entrada_dre`) | 🟢 | Vem pronta em cada categoria — não precisamos inventar agrupamento próprio |
| Estrutura oficial de Balanço | 🔴 | Não verificado ainda se existe algo equivalente a `entrada_dre` pro Balanço — pendência aberta |
| **Nome** da categoria-pai (ex: "Despesas Administrativas") | 🔴 | A API só devolve o **ID** da categoria-pai dentro de cada categoria-filha — confirmado pelo suporte oficial do Conta Azul como limitação conhecida, sem previsão de correção. Precisa ser cadastrado manualmente uma vez por cliente (já resolvido no nosso app — ver `categoria_pai_nome`) |

## Contas bancárias

| Dado | Status | Observação |
|---|---|---|
| Lista de contas cadastradas | 🟢 | `GET /conta-financeira` — banco, agência, número, tipo, ativo/inativo |
| Saldo atual de cada conta | 🟢 | Endpoint separado, ver acima |

## Clientes e fornecedores

| Dado | Status | Observação |
|---|---|---|
| Cadastro de pessoas (clientes/fornecedores) | 🟢 | `GET /pessoas` — nome, documento, e-mail, telefone, tipo (Física/Jurídica), perfis |

## Vendas e serviços

| Dado | Status | Observação |
|---|---|---|
| Funil de vendas (aprovado/cancelado/esperando) | 🟢 | `GET /venda/` — totais por status em valor e quantidade |
| Catálogo de serviços | 🟢 | `GET /servico` — descrição, preço, custo, status |
| Catálogo de produtos | 🟢 | `GET /produtos` — estrutura confirmada (cliente de teste não usa) |
| Centro de custo | 🟢 | `GET /centro-de-custo` — estrutura confirmada (cliente de teste não usa) |
| Orçamentos | 🟢 | `GET /orcamentos` — estrutura confirmada (cliente de teste não tinha nenhum) |

## Documentos fiscais

| Dado | Status | Observação |
|---|---|---|
| Notas fiscais | 🔴 | `GET /notas-fiscais` existe mas exige parâmetros obrigatórios não documentados (erro 400 genérico) — não investigado a fundo por não ser prioridade |
| Contratos | 🔴 | Mesma situação de notas fiscais |

## Autenticação / conexão

| Dado | Status | Observação |
|---|---|---|
| OAuth por cliente (uma vez, com refresh automático) | 🟢 | Funciona, mas precisa logar com e-mail/senha do próprio cliente (não dá pra usar a conta master da Lucri) — overhead operacional de onboarding, não técnico |

---

## Resumo

**Totalmente verde:** cadastro (pessoas, contas bancárias, categorias,
serviços, produtos, centro de custo, orçamentos), lista de lançamentos,
vendas, DRE (estrutura oficial), saldo bancário.

**Amarelo — únicos pontos de atenção:** os totais agregados de "quanto
entrou/saiu" só filtram por data de vencimento, então podem divergir do
relatório nativo do Conta Azul quando um título atrasa entre vencimento e
pagamento. Não é um bug nosso — é o que a API pública permite consultar.

**Vermelho:** nome da categoria-pai (contornado com cadastro manual),
estrutura oficial de Balanço (ainda não verificada), notas fiscais e
contratos (não investigados, não essenciais hoje).
