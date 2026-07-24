# Dados disponíveis na API do Conta Azul

Levantamento feito testando a API v2 (`https://api-v2.contaazul.com/v1`) ao vivo,
com um token OAuth real de um cliente conectado. Estrutura, campos e exemplos
abaixo são reais (dados de teste de um cliente da carteira da Lucri).

## Como funciona a autorização (confirmado com o suporte do Conta Azul)

- A autorização OAuth **sempre usa a conta que estiver logada no navegador** no
  momento — não existe parâmetro, header ou seleção de empresa dentro do fluxo.
- Para acessar os dados de um cliente específico, é obrigatório logar no fluxo
  OAuth com o **e-mail/senha daquele cliente**, não a conta master/Plus da Lucri.
  Entrar na conta do cliente pela interface visual do Plus **não** muda o escopo
  do token — ele fica vinculado à sessão de quem de fato autenticou.
- O app usado precisa ser de **produção**, não de desenvolvimento (apps de
  desenvolvimento parecem restritos à própria conta de quem os criou).
- Isso só precisa ser feito **uma vez por cliente** — o `refresh_token` renova
  sozinho depois, sem precisar logar de novo. Equivalente ao "Conectar conta
  bancária" de qualquer app financeiro.

## Endpoints confirmados

### Contas a pagar
`GET /financeiro/eventos-financeiros/contas-a-pagar/buscar`
Parâmetros obrigatórios: `data_vencimento_de`, `data_vencimento_ate`

Retorna lista de lançamentos + totais agregados por status (`pago`, `vencido`,
`vence_hoje`, `pendente`, `aberto`, `todos`), cada um com valor em R$.

No cliente de teste: **1.477 lançamentos**.

Campos de cada lançamento:
```json
{
  "id": "8c081c50-9dd4-11ef-a6a8-abad3a81ac2a",
  "status": "ACQUITTED",
  "status_traduzido": "RECEBIDO",
  "total": 20.00,
  "pago": 20.00,
  "nao_pago": 0.00,
  "descricao": "INTEGRALIZACAO CAPITAL",
  "data_vencimento": "2024-11-06",
  "data_competencia": "2024-11-06",
  "data_criacao": "2024-11-08T10:22:47.97218",
  "data_alteracao": "2024-11-08T10:22:47.97218",
  "categorias": [{ "id": "...", "nome": "Tarifas Bancárias" }],
  "centros_de_custo": [],
  "fornecedor": { "id": null, "nome": null }
}
```

### Contas a receber
`GET /financeiro/eventos-financeiros/contas-a-receber/buscar`
Mesma estrutura e parâmetros do endpoint de contas a pagar. Diferenças: o campo
`fornecedor` vira `cliente`, e existe também `renegociacao` (null quando não há).

No cliente de teste: **426 lançamentos**.

### Categorias financeiras (plano de contas)
`GET /categorias`

No cliente de teste: **133 categorias** já cadastradas por padrão.

```json
{
  "nome": "13º Salário - 1ª Parcela",
  "categoria_pai": "6f0ea43b-f8ac-4410-a4bc-834ade0dc341",
  "tipo": "DESPESA",
  "entrada_dre": "DESPESAS_ADMINISTRATIVAS",
  "considera_custo_dre": false
}
```
`tipo` é `RECEITA` ou `DESPESA`. **`entrada_dre` já vem pronto do Conta Azul** —
não precisamos construir a lógica de agrupamento de DRE do zero.

### Contas bancárias
`GET /conta-financeira`

No cliente de teste: **3 contas** cadastradas.

```json
{
  "banco": "SICREDI",
  "codigo_banco": 748,
  "nome": "Sicredi - Nick",
  "ativo": true,
  "tipo": "CONTA_CORRENTE",
  "agencia": "0730",
  "numero": "24622",
  "conta_padrao": false
}
```

> ⚠️ **Pendente confirmar:** esse payload não tem campo de saldo. A Home do
> front agora mostra (hover no card "Saldo em conta") o detalhamento por
> conta bancária, o que exige um valor de saldo por conta. Confirmar se
> `GET /conta-financeira` retorna saldo em outro campo/endpoint, ou se
> precisa ser calculado (ex: somar lançamentos daquela conta) — normalizar
> como `{ ...conta, saldo }` pro front antes de expor.

### Pessoas (clientes e fornecedores)
`GET /pessoas`

No cliente de teste: **47 pessoas** cadastradas.

```json
{
  "nome": "Academia da Intimidade",
  "documento": "18455649000162",
  "email": "vaniadobro2@gmail.com",
  "telefone": "41995861421",
  "ativo": true,
  "perfis": ["Cliente"],
  "tipo_pessoa": "Jurídica",
  "data_criacao": "2025-11-14T15:48:21.394"
}
```
`perfis` indica se é Cliente e/ou Fornecedor. `tipo_pessoa` é Física ou Jurídica.

### Serviços
`GET /servico`

No cliente de teste: **3 serviços** cadastrados.

```json
{
  "descricao": "Gerenciamento de Tráfego Pago",
  "preco": 1000.0,
  "custo": null,
  "status": "ATIVO",
  "tipo_servico": "PRESTADO"
}
```

### Produtos
`GET /produtos`
Estrutura confirmada, mas o cliente de teste não usa produtos (0 cadastrados).

### Vendas
`GET /venda/`

No cliente de teste: **471 vendas**, total de R$ 621.261,37 (R$ 260.145,37
aprovado, R$ 361.116 esperando aprovação, R$ 0 cancelado).

Totais vêm por status, tanto em valor quanto em quantidade: `total`, `aprovado`,
`cancelado`, `esperando_aprovacao`.

### Centro de custo
`GET /centro-de-custo`
Estrutura confirmada (lista + contagem `ativo`/`inativo`/`todos`), mas o cliente
de teste não usa centro de custo (0 cadastrados).

### Orçamentos
`GET /orcamentos`
Estrutura confirmada, mas o cliente de teste não tinha orçamentos (0).

### Notas fiscais e Contratos — não finalizados
`GET /notas-fiscais` e `GET /contratos` existem, mas exigem parâmetros
obrigatórios que ainda não descobrimos (erro 400 pedindo "campos obrigatórios"
sem especificar quais). Não são essenciais pro fluxo de caixa/DRE já priorizado
— revisitar só se entrarem na lista de métricas da v1.

## O que dá pra montar na dashboard com esses dados

- **Fluxo de caixa** (contas a pagar x receber por período)
- **DRE** (usando `entrada_dre`, já vem pronto nas categorias)
- **Inadimplência** (status `vencido` em contas a receber)
- **Contas vencendo hoje / em aberto**
- **Despesas por categoria** (agrupando por `categoria_pai`)
- **Funil de vendas** (aprovado x cancelado x esperando aprovação)
- **Ranking de clientes** (usando `pessoas` + valores de `venda`/contas a receber)
- **Saldo por conta bancária** (via `conta-financeira`)
- **Catálogo de serviços/preços** (via `servico`)
