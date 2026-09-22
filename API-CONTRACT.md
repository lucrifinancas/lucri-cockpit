# Contrato da API — Lucri Cockpit

Formato de request/response de cada endpoint do backend, testado com dados
reais. Base URL (produção): `https://lucri-cockpit-server.lucrifinancas-54e.workers.dev`

## ⚠️ Bug corrigido: paginação do Conta Azul (12/08)

A API do Conta Azul limita listas a 10 itens por página por padrão, mesmo
quando `itens_totais` reporta um número maior — ENTRADAS e SAÍDAS chegaram
a mostrar listas cortadas silenciosamente (ex.: cliente com 35 saídas no
mês, só 10 apareciam). **Corrigido no backend** (busca todas as páginas
automaticamente) — o front não precisa se preocupar com isso, os
`lancamentos` retornados já vêm completos.

## Autenticação geral

- Sessão via cookie (`lucri_sessao`), setado automaticamente no login.
- Todo fetch do front precisa incluir `credentials: "include"` pra o cookie
  ser enviado/recebido (domínios diferentes entre front e back).
- Rotas marcadas como **protegidas** retornam `401` se não houver sessão
  válida, e `403` se o papel do usuário não tiver permissão para aquela ação.
- Qualquer endpoint que dependa da conexão com o Conta Azul (HOME, ENTRADAS,
  SAÍDAS, CAIXA) pode retornar `409 {"erro": "conta_azul_desconectada"}` se
  a conexão do cliente não puder mais ser renovada — nesse caso, o cliente
  precisa refazer a autorização OAuth (tela de onboarding). Diferente de um
  `500`: isso é esperado acontecer eventualmente (tokens podem ser
  revogados), não é bug — o front deve tratar mostrando algo como
  "reconecte o Conta Azul desse cliente".

## ⚠️ Regime de caixa — decidido

Todos os totais de "quanto entrou/saiu" (HOME, ENTRADAS, SAÍDAS, CAIXA)
devem usar o campo **`pago`** dos `totais` (ex.: `totais.pago.valor`), **não**
`totais.todos` — `todos` inclui lançamentos vencidos/pendentes que ainda não
aconteceram de verdade. O mesmo vale por lançamento individual: some
`valor_pago`, não `valor` (que é o valor total do título, pago ou não).
Decisão: mostrar regime de **caixa** (o que realmente entrou/saiu), não
competência.

**Gráfico de resultado histórico (lucro/prejuízo por mês)**: mesma lógica —
resultado = **receita realizada − despesa realizada** (ambos em regime de
caixa). ⏳ Ainda não dá pra implementar com dado real: hoje esse gráfico
(`useMonthlyHistory` / `generateMonthlyHistory`) é 100% mockado, porque a
parte de "despesa realizada" depende do endpoint de DESPESAS, que segue
bloqueado pela definição de categorização fixo/variável (ver
`DECISOES-E-ESCOPO.md`). A parte de receita já poderia ser calculada com
dado real hoje (somando `valor_pago` de `/entradas` agrupado por mês) — mas
sem a despesa, o gráfico ficaria incompleto, então recomendo manter mockado
até o endpoint de DESPESAS existir.

### ⚠️ Limitação encontrada (10/09): nosso total pode divergir do relatório nativo do Conta Azul

`buscarContasAReceber`/`buscarContasAPagar` filtram só por
`data_vencimento_de/ate` — é o **único** filtro de data que esse endpoint
aceita (confirmado testando direto contra a API: `data_pagamento_de`,
`data_recebimento_de`, `data_baixa_de`, `data_liquidacao_de` e
`data_competencia_de` todos voltam 400 "parâmetro obrigatório
data_vencimento_de não foi informado" — ou seja, nem existem como filtro
nesse endpoint).

Isso significa: um título que **venceu num mês mas foi pago em outro**
não aparece no nosso total daquele mês de pagamento (nem no de
vencimento, porque group by aqui é sempre por vencimento). O relatório
nativo do Conta Azul ("Relatórios → Análise de recebimentos") não bate
com o nosso `totais.pago.valor` quando isso acontece — testado com o
cliente Nick Publicidade, mês de agosto/2026: nosso total deu R$
16.549,64, o relatório nativo deles deu R$ 17.989,64 pro mesmo período
(print comparado lado a lado).

Como o relatório nativo deles claramente usa outro critério (ou outro
endpoint, não documentado nessa API v1 pública), isso é uma limitação
da API que temos acesso, não um bug de cálculo nosso — nosso
`pago.valor` já é exatamente o que a Conta Azul devolve, sem
recalcularmos nada. Não tentei resolver sozinho porque muda o contrato
usado por HOME/ENTRADAS/SAÍDAS/histórico-mensal inteiros — @Diogo, vale
perguntar pro suporte do Conta Azul se existe algum endpoint de
relatório equivalente ao "Análise de recebimentos" que a gente possa
chamar diretamente, no mesmo espírito da resposta que eles já deram
sobre categoria-pai.

---

## `GET /api/health`

Verificação de que o backend está no ar. Pública, sem autenticação.

**Resposta `200`:**
```json
{ "status": "ok", "servico": "lucri-cockpit-server" }
```

---

## `POST /api/auth/login`

Pública. Autentica um usuário e cria a sessão (cookie).

**Corpo da requisição:**
```json
{ "email": "usuario@exemplo.com", "senha": "..." }
```

**Resposta `200`** (mais o cookie `Set-Cookie`):
```json
{ "email": "usuario@exemplo.com", "papel": "master", "cliente_id": null }
```
`papel` é `"master"`, `"analista"` ou `"cliente"`. `cliente_id` só é
diferente de `null` quando `papel = "cliente"`.

**Resposta `401`** (credenciais erradas):
```json
{ "erro": "E-mail ou senha incorretos." }
```

---

## `GET /api/auth/me`

Protegida (qualquer papel logado). Retorna os dados do usuário da sessão
atual — útil pro front saber quem está logado ao carregar a aplicação.

**Resposta `200`:**
```json
{ "email": "usuario@exemplo.com", "papel": "master", "cliente_id": null }
```

---

## `POST /api/auth/logout`

Protegida. Encerra a sessão (apaga o cookie).

**Resposta `200`:**
```json
{ "ok": true }
```

---

## `GET /api/auth/google/iniciar`

Pública. Início do login com Google — **não é fetch comum, é navegação de
página inteira** (o front deve fazer `window.location.href = ...` ou um
link `<a>` normal, não `fetch`). Redireciona pro Google.

## `GET /api/auth/google/callback`

Pública (chamada pelo Google, não pelo front). Processa o retorno do login
Google e redireciona o navegador de volta pro front:
- Sucesso: `{APP_URL}/` (sessão já criada, mesmo cookie do login normal)
- Erros possíveis, todos como `{APP_URL}/?google=<motivo>`:
  - `erro` — falha genérica no fluxo OAuth
  - `email_nao_verificado` — conta Google sem e-mail verificado
  - `conta_nao_encontrada` — e-mail da conta Google não corresponde a
    nenhum usuário cadastrado (login com Google **não cria conta nova**,
    só autentica quem o master já cadastrou)

O front deve ler esse parâmetro `google` na URL ao carregar e mostrar um
aviso apropriado, mesmo padrão do `?contaazul=sucesso/erro` no onboarding.

---

## `POST /api/auth/alterar-senha`

Protegida (qualquer papel). O usuário logado troca a própria senha —
funcionalidade recomendada para a tela "Meu perfil" em Ajustes, e também o
primeiro passo natural depois que um cliente recebe a senha inicial criada
pelo master (ver `POST /api/clientes/:id/login` abaixo).

**Corpo da requisição:**
```json
{ "senha_atual": "senhaAtualDoUsuario", "senha_nova": "novaSenhaEscolhida" }
```
`senha_nova` precisa ter pelo menos 8 caracteres.

**Resposta `200`:**
```json
{ "ok": true }
```

**Resposta `401`** (senha atual errada):
```json
{ "erro": "Senha atual incorreta." }
```

---

## `GET /api/clientes`

Protegida (`master`, `analista`). Lista todos os clientes cadastrados.

**Resposta `200`:**
```json
[
  { "id": 1, "nome": "Nick Publicidade", "criado_em": "2026-07-27 21:12:39" }
]
```

---

## `POST /api/clientes`

Protegida (`master`, `analista`). Cria um cliente novo.

**Corpo da requisição:**
```json
{ "nome": "Nome da Empresa" }
```

**Resposta `201`:**
```json
{ "id": 3, "nome": "Nome da Empresa", "criado_em": "2026-07-29 18:00:00" }
```

---

## `POST /api/clientes/:id/login`

Protegida — **só `master`** (analista não pode criar login de cliente,
mesma regra já aplicada no front). Cria o acesso do cliente ao próprio
dashboard, vinculado ao cliente indicado na URL.

Fluxo sugerido: o master define uma senha inicial aqui (pode ser gerada
automaticamente ou digitada) e repassa pro cliente por fora do sistema
(WhatsApp, e-mail manual). O cliente já pode trocar essa senha depois, via
`POST /api/auth/alterar-senha`.

**Corpo da requisição:**
```json
{ "email": "contato@clientedaLucri.com", "senha": "senhaInicialEscolhida" }
```
`senha` precisa ter pelo menos 8 caracteres.

**Resposta `201`:**
```json
{
  "id": 6,
  "email": "contato@clientedaLucri.com",
  "papel": "cliente",
  "cliente_id": 1,
  "criado_em": "2026-07-29 18:14:14"
}
```

**Resposta `409`** (e-mail já cadastrado em outro usuário):
```json
{ "erro": "Já existe um usuário com esse e-mail." }
```

**Resposta `403`** (quem chamou não é master):
```json
{ "erro": "Sem permissão para esta ação." }
```

---

## `GET /api/clientes/:id/categorias`

Protegida (`master`, `analista`). Lista o plano de contas do cliente (via
Conta Azul), com campos extras: `pai_id` (código do **grupo** dessa categoria no Conta
Azul — é a "mãe" das despesas; ver `/categorias-pai`) e `is_despesa`/`mae_id`
(marcação **antiga**, por despesa, que o front não usa mais; ver `PUT
/categorias/despesas`).

**Resposta `200`:**
```json
[
  { "id": "1fc3a9ae-...", "nome": "Pró-labore", "tipo": "DESPESA", "pai_id": "82529007-...", "is_despesa": false, "mae_id": null },
  { "id": "30f602d7-...", "nome": "Adiantamentos para AFAC", "tipo": "RECEITA", "pai_id": "9424c4c9-...", "is_despesa": false, "mae_id": null }
]
```

---

## `PUT /api/clientes/:id/categorias/despesas`

> ⚠️ **Legado.** O front não usa mais: o dashboard passou a contar **toda**
> categoria do tipo DESPESA, agrupada pela mãe do grupo (ver `/despesas`).
> Continua no ar só por compatibilidade.

Protegida — **só `master`**. Substitui a marcação inteira do cliente pela
lista enviada (não é um "adicionar", é um "isso é tudo que está marcado
agora" — o front deve mandar a lista completa dos IDs marcados a cada
salvamento).

**Corpo da requisição:**
```json
{
  "categorias": [
    { "categoria_id": "1fc3a9ae-...", "categoria_nome": "Pró-labore", "mae_id": 1 },
    { "categoria_id": "94fbc5c4-...", "categoria_nome": "Remuneração - Operação", "mae_id": 2 }
  ]
}
```

`mae_id` (opcional) precisa ser uma mãe **desse cliente** (`GET /maes`), senão
`400`.

**Resposta `200`:**
```json
{ "ok": true }
```

---

## `GET /api/clientes/:id/categorias-pai`

> **A mãe das despesas é o grupo (categoria-pai) do Conta Azul.** Este endpoint
> e o `PUT` abaixo são como o master dá o nome de cada grupo, uma vez. Toda
> despesa do grupo — inclusive as criadas depois — herda esse nome em
> `/despesas`. O front (Ajustes) mostra uma despesa de exemplo por grupo e o
> master escolhe a mãe entre as cadastradas em `/maes`.


Protegida (`master`, `analista`). Lista as categorias-**pai** (grupos como
"Despesas Administrativas") encontradas no plano de contas do cliente.

⚠️ **A API do Conta Azul não devolve o nome da categoria-pai** — confirmado
pelo suporte oficial deles como limitação conhecida, registrada na lista de
melhorias deles, sem previsão de correção. Só o **ID** aparece (no campo
`categoria_pai` de cada categoria filha). Por isso este endpoint devolve,
pra cada `categoria_pai_id`, uma amostra das categorias filhas (
`categorias_filhas`) — o master usa isso pra identificar visualmente qual
grupo é qual (comparando com a tela de Categorias do próprio Conta Azul) e
digitar o nome uma vez.

**Resposta `200`:**
```json
[
  {
    "categoria_pai_id": "82529007-a072-4bd0-a3e9-3d2a7b3650db",
    "nome": "Despesas Administrativas",
    "categorias_filhas": ["Água e Saneamento", "Aluguel", "Alvará de Funcionamento", "..."]
  },
  {
    "categoria_pai_id": "6f0ea43b-f8ac-4410-a4bc-834ade0dc341",
    "nome": null,
    "categorias_filhas": ["13º Salário - 1ª Parcela", "13º Salário - 2ª Parcela", "..."]
  }
]
```
`nome: null` significa que ninguém cadastrou ainda — nesse caso, o endpoint
`/despesas` cai de volta pra mostrar a subcategoria em vez do grupo (ver
abaixo).

---

## `PUT /api/clientes/:id/categorias-pai`

Protegida — **só `master`**. Cadastra/atualiza o nome de uma ou mais
categorias-pai. Diferente de `/categorias/despesas`, aqui é um upsert
incremental (não substitui a lista inteira) — só afeta os IDs enviados.

**Corpo da requisição:**
```json
{
  "categorias_pai": [
    { "categoria_pai_id": "82529007-a072-4bd0-a3e9-3d2a7b3650db", "nome": "Despesas Administrativas" }
  ]
}
```

**Resposta `200`:**
```json
{ "ok": true }
```

---

## `GET /api/clientes/:id/maes`

Protegida (`master`, `analista`). Lista as **categorias-mãe cadastradas** do
cliente (nomes como "Despesas Administrativas"). Cada cliente tem a sua
lista. O master cadastra a lista uma vez e depois **escolhe** qual mãe é cada
grupo do Conta Azul, em vez de digitar o nome toda vez (o vínculo grupo → nome
continua sendo salvo em `PUT /categorias-pai`).

**Resposta `200`:** ordenada por nome.
```json
[
  { "id": 1, "nome": "Despesas Administrativas" },
  { "id": 2, "nome": "Folha de Pagamento" }
]
```

---

## `POST /api/clientes/:id/maes`

Protegida — **só `master`**. Cadastra uma categoria-mãe nova pro cliente.

**Corpo da requisição:** `{ "nome": "Despesas Administrativas" }`

**Resposta `201`:** `{ "id": 1, "nome": "Despesas Administrativas" }`

**Erros:** `400` (nome vazio) e `409` (o cliente já tem uma mãe com esse nome;
a comparação ignora maiúsculas/minúsculas).

---

## `DELETE /api/clientes/:id/maes/:maeId`

Protegida — **só `master`**. Remove uma categoria-mãe da lista do cliente.

**Resposta `200`:** `{ "ok": true }`

**Erros:** `404` (não existe pra esse cliente) e `409` (a mãe está em uso por
algum grupo em `categoria_pai_nome` — troque a mãe do grupo antes de apagar).

---

## `GET /api/contaazul/autorizar/:clienteId`

Protegida (`master`, `analista`). Gera o link de autorização OAuth do Conta
Azul para um cliente específico. O front deve **redirecionar o navegador**
para essa URL (não é uma chamada de fetch comum — é navegação de página
inteira, porque o usuário precisa logar no Conta Azul).

**Resposta `200`:**
```json
{ "url": "https://auth.contaazul.com/login?response_type=code&client_id=...&state=..." }
```

**Resposta `404`** (cliente não existe):
```json
{ "erro": "Cliente não encontrado." }
```

---

## `GET /api/contaazul/callback`

Pública (chamada pelo Conta Azul, não pelo front). O usuário é redirecionado
pra cá automaticamente depois de autorizar. Ao final, redireciona o
navegador de volta para o front:
- Sucesso: `{APP_URL}/ajustes?contaazul=sucesso`
- Erro: `{APP_URL}/ajustes?contaazul=erro`

O front deve ler esse parâmetro da URL (`contaazul=sucesso` ou `erro`) na
tela de Ajustes para mostrar um aviso ao usuário.

---

## `GET /api/clientes/:id/home`

Protegida (`master`, `analista`). Resumo geral do cliente para a tela HOME.

**Parâmetros de query (opcionais):** `de`, `ate` (formato `AAAA-MM-DD`) —
sem eles, usa o mês atual.

**Resposta `200`:**
```json
{
  "periodo": { "de": "2026-07-01", "ate": "2026-07-31" },
  "contas_a_pagar": {
    "pago": { "valor": 17237.26 },
    "vencido": { "valor": 0 },
    "vence_hoje": { "valor": 0 },
    "pendente": { "valor": 0 },
    "aberto": { "valor": 0 },
    "todos": 17237.26
  },
  "contas_a_receber": { "...": "mesma estrutura de contas_a_pagar" },
  "contas_bancarias": [
    {
      "id": "7c4cbf3f-...",
      "banco": "Conta PJ Conta Azul IP",
      "agencia": "0001",
      "numero": "24622",
      "tipo": "CONTA_CORRENTE",
      "saldo": 0
    },
    {
      "id": "81bc5ca1-...",
      "banco": "Sicredi - Nick",
      "agencia": "0730",
      "numero": "820852",
      "tipo": "CONTA_CORRENTE",
      "saldo": 2141.87
    }
  ],
  "saldo_total": 2141.87
}
```
Só contas **ativas** entram em `contas_bancarias` (uma conta desativada no
Conta Azul, ex. um gateway de pagamento não usado mais, não deve contar no
saldo). `saldo_total` é a soma de `saldo` de todas as contas retornadas.

**Resposta `404`** (cliente existe mas nunca conectou o Conta Azul):
```json
{ "erro": "Cliente ainda não conectou o Conta Azul." }
```

---

## `GET /api/clientes/:id/entradas`

Protegida (`master`, `analista`). Lista detalhada de recebimentos.

**Parâmetros de query (opcionais):** `de`, `ate`.

**Resposta `200`:**
```json
{
  "periodo": { "de": "2026-07-01", "ate": "2026-07-31" },
  "totais": { "...": "mesma estrutura de contas_a_pagar da HOME" },
  "lancamentos": [
    {
      "id": "d0d26748-...",
      "descricao": "Venda 223",
      "valor": 1400,
      "valor_pago": 0,
      "valor_em_aberto": 1400,
      "status": "ATRASADO",
      "data_vencimento": "2026-07-01",
      "data_competencia": "2026-07-01",
      "categoria": "Receitas de Serviços",
      "categoria_id": "7a851b36-...",
      "contraparte": "DONA VIOLETA SITIO CERCADO"
    }
  ]
}
```
`contraparte` é o nome do cliente que pagou (pode vir `null` se o Conta Azul
não tiver essa informação vinculada ao lançamento).

---

## `GET /api/clientes/:id/saidas`

Protegida (`master`, `analista`). Mesma estrutura de `/entradas`, mas para
tudo que sai do caixa (não só despesa operacional — inclui qualquer débito).
`contraparte`, nesse caso, é o fornecedor.

⚠️ **Cuidado ao exibir `status`**: a própria API do Conta Azul retorna
`"RECEBIDO"` mesmo para lançamentos de saída (parece inconsistência deles,
não normalizamos esse valor). Sugestão: o front pode tratar visualmente
`RECEBIDO` como "PAGO" quando for uma saída, já que semanticamente é isso.

---

## `GET /api/clientes/:id/despesas`

Protegida (`master`, `analista`). Subconjunto de SAÍDAS: só os lançamentos
cuja categoria foi marcada como despesa operacional (ver
`PUT /categorias/despesas` acima). Categorização é manual — não usa o
`entrada_dre` automático do Conta Azul (decisão registrada em
`DEMANDAS-PARA-FINALIZAR.md`, item 4).

**Parâmetros de query (opcionais):** `de`, `ate`.

**Resposta `200`:**
```json
{
  "periodo": { "de": "2026-08-01", "ate": "2026-08-31" },
  "total_pago": 3101.94,
  "lancamentos": [
    { "id": "...", "descricao": "...", "valor_pago": 1500, "categoria": "Despesas Fixas", "subcategoria": "Pró-labore", "mae": "Despesas Fixas", "categoria_id": "1fc3a9ae-..." }
  ]
}
```
Diferente de HOME/ENTRADAS/SAÍDAS, aqui **não existe um `totais` vindo
direto do Conta Azul** (a API deles não sabe quais categorias você marcou
como despesa) — `total_pago` é calculado somando `valor_pago` só dos
lançamentos filtrados. Se o cliente ainda não tiver nenhuma categoria
marcada, retorna lista vazia e `total_pago: 0` (não é erro).

⚠️ **Campos `categoria`, `subcategoria` e `mae` aqui são diferentes de
ENTRADAS/SAÍDAS.** Cada lançamento vem agrupado pela **mãe do grupo dele**
no Conta Azul (ex: "Despesas Administrativas"), nomeada em Ajustes
(`/categorias-pai`, `/maes`):
- `categoria`: o nome da **mãe** (é por ele que o front agrupa/soma);
- `subcategoria`: a despesa original do Conta Azul (ex: "Aluguel"), pra abrir
  dentro da mãe;
- `mae`: o nome da mãe (`null` enquanto o grupo ainda não foi nomeado — nesse
  caso `categoria` vem como `"Sem mãe"`).

**Toda** categoria do tipo DESPESA conta (então `/despesas` passa a somar o
mesmo que as saídas em categorias de despesa). Grupo ainda sem nome aparece
como "Sem mãe" em vez de sumir, pra o total nunca ficar errado em silêncio.

---

## `GET /api/clientes/:id/caixa`

Protegida (`master`, `analista`). Resumo consolidado de fluxo de caixa
**realizado** (sem projeção futura, ainda não implementada).

**Parâmetros de query (opcionais):** `de`, `ate`.

**Resposta `200`:**
```json
{
  "periodo": { "de": "2026-07-01", "ate": "2026-07-31" },
  "entradas": { "...": "totais, mesma estrutura da HOME" },
  "saidas": { "...": "totais, mesma estrutura da HOME" },
  "saldo_periodo": -4871.52
}
```
`saldo_periodo` = total pago de entradas − total pago de saídas, no período.

---

## `GET /api/clientes/:id/historico-mensal`

Protegida (`master`, `analista`). Últimos N meses de receitas, despesas,
resultado (lucro/prejuízo) e contas a receber vencidas, agrupados por mês
de vencimento — alimenta os 3 gráficos históricos da Home. Busca contas a
receber e contas a pagar numa janela larga (2 chamadas no total) e agrupa
localmente, em vez de 1 chamada por mês.

**Parâmetros de query (opcionais):** `meses` (padrão `12`, máximo `24`).

**Resposta `200`:**
```json
{
  "meses": [
    { "mes": "2025-09", "label": "Setembro", "receitas": 12345.0, "despesas": 8000.0, "resultado": 4345.0, "vencidas": 663.0 },
    { "mes": "2025-10", "label": "Outubro", "receitas": 15200.0, "despesas": 9100.0, "resultado": 6100.0, "vencidas": 3470.0 }
  ]
}
```
- `receitas`/`despesas` = soma de `valor_pago` do mês (regime de caixa).
  `despesas` só conta lançamentos cuja categoria está marcada em
  `PUT /categorias/despesas` — sem nenhuma marcada, vem `0`.
- `resultado` = `receitas - despesas`.
- `vencidas` = soma de `valor_em_aberto` dos lançamentos com `data_vencimento`
  no passado e ainda não totalmente pagos.

---

## `GET /api/clientes/:id/dre`

Protegida (`master`, `analista`). Demonstrativo de Resultado completo,
usando a **estrutura oficial de DRE configurada no próprio Conta Azul**
para aquele cliente (normalmente feita pelo contador da empresa) — não é
uma regra de categorização nossa, é a árvore contábil real, com cada
categoria financeira já encaixada no grupo certo.

⚠️ **Diferente de `/despesas`** (que usa a marcação manual da tabela
`categoria_despesa`): o DRE usa a árvore completa do Conta Azul
(`GET /financeiro/categorias-dre`), que já cobre receitas, deduções,
custos, despesas, financeiro e não operacional — não só despesas.

**Parâmetros de query (opcionais):** `de`, `ate`.

**Resposta `200`:**
```json
{
  "periodo": { "de": "2026-01-01", "ate": "2026-08-25" },
  "resultado_final": -2096.19,
  "linhas": [
    {
      "codigo": "01",
      "descricao": "Receitas Operacionais",
      "totalizador": false,
      "valor": 147638.87,
      "subitens": [
        { "codigo": "01.1", "descricao": "Receita de Vendas de Produtos e Serviços", "valor": 147638.87 },
        { "codigo": "01.2", "descricao": "Receita de Fretes e Entregas", "valor": 0 }
      ]
    },
    { "codigo": null, "descricao": "Receita Bruta de Vendas", "totalizador": true, "valor": 147638.87 },
    { "codigo": "02", "descricao": "Deduções da Receita Bruta", "totalizador": false, "valor": -3097.94, "subitens": [ "..." ] },
    { "codigo": null, "descricao": "Receita Líquida de Vendas", "totalizador": true, "valor": 144540.93 }
  ]
}
```
- Linhas com `"totalizador": true` são subtotais (Receita Bruta, Receita
  Líquida, Lucro Bruto, Lucro/Prejuízo Operacional, Líquido e Final) — o
  `valor` delas é o acumulado de tudo que veio antes, não têm `subitens`.
  Linhas normais (`totalizador: false`) são os 7 grupos da estrutura
  (Receitas Operacionais, Deduções, Custos, Despesas Operacionais,
  Financeiras, Outras Receitas/Despesas, Investimentos/Empréstimos), cada
  uma com seus `subitens`.
- Valores já vêm com o sinal certo: receita positiva, despesa/dedução
  negativa — dá pra somar direto sem lógica extra no front.
- `resultado_final` é atalho pro valor da última linha (`Lucro/Prejuízo
  Final`), sem precisar procurar no array.

---

## POST /api/auth/esqueci-senha

Pede a redefinição de senha por e-mail. Body: `{ "email": "..." }`.

Sempre responde `{ "ok": true }`, mesmo se o e-mail não tiver cadastro — evita
que alguém descubra quais e-mails existem tentando um por um. Se o e-mail
existir, gera um token (válido por 60 min, guardado em
`reset_senha_tokens`) e chama a API do Resend (`RESEND_API_KEY`,
ver `GUIA-RESEND-EMAIL.md`) para enviar o e-mail com o link
`{APP_URL}/redefinir-senha?token=...`.

## POST /api/auth/redefinir-senha

Efetiva a troca, usando o token recebido por e-mail. Body:
`{ "token": "...", "senha_nova": "..." }` (mínimo 8 caracteres).

Erros: `400` se o token não existir ou já tiver expirado ("Link inválido ou
expirado. Peça uma nova redefinição."). Token é apagado depois de usado.

---

## Convites de cliente + autocadastro via Google

Fluxo pra uma pessoa nova criar a própria conta "cliente" sem o master
precisar cadastrar senha manualmente:

1. Master reserva o e-mail: `POST /api/clientes/:id/convites`, body
   `{ "email": "..." }` (só master). Não vincula senha nenhuma, só
   `email` + `cliente_id`. Erro `409` se o e-mail já está convidado ou já
   tem conta.
2. `GET /api/clientes/:id/convites` — lista convites pendentes desse
   cliente (master/analista).
3. `DELETE /api/clientes/:id/convites/:conviteId` — cancela um convite
   (só master).
4. A pessoa clica em **Entrar com Google** (`GET /api/auth/google/iniciar`).
   No callback (`GET /api/auth/google/callback`):
   - Se já existe usuário com esse e-mail → só autentica (comportamento
     de sempre).
   - Se não existe usuário, mas existe convite pendente com esse e-mail →
     cria a conta `papel: 'cliente'` na hora, vinculada ao `cliente_id`
     do convite, com `nome`/`sobrenome` preenchidos automaticamente pelo
     Google (`given_name`/`family_name`), apaga o convite e já loga a
     pessoa.
   - Se não existe nem usuário nem convite → redireciona com
     `?google=conta_nao_encontrada`, igual antes.
   - Conta criada por convite não tem senha utilizável (só entra via
     Google) — pode usar `/api/auth/esqueci-senha` se quiser habilitar
     login por senha também no futuro.

**Sobre dados do Google pra cadastro** (pergunta que o dev fez): o escopo
`profile` já usado (`server/src/auth/google.js`) devolve `given_name` e
`family_name` separados — não precisa de escopo extra. **Data de
nascimento não vem** nesse fluxo: exigiria o escopo restrito
`user.birthday.read`, que passa por revisão manual do Google (política de
privacidade, vídeo demonstrativo, pode levar semanas) e mesmo assim
muita gente não deixa a data de nascimento visível na conta — não vale a
pena depender disso. Se precisar de data de nascimento, pedir direto num
campo do próprio formulário.

---

## GET /api/clientes/:id/balanco

Balanço **simplificado** (financeiro) — decisão fechada em 22/09 depois de
conversa com o dev e a contadora: ela não usa o Balanço vindo do Conta Azul
(o dela vem de outro sistema contábil), e a própria API não expõe saldo
patrimonial (imobilizado, capital social, lucros acumulados) — só saldo
bancário e contas a pagar/receber. **Não é um balanço patrimonial contábil
completo.**

Diferente de `/dre` e `/caixa`, não recebe `de`/`ate` — é uma foto de agora,
soma de tudo que ainda está em aberto (busca numa janela larga por baixo dos
panos: 2 anos pra trás, 1 ano pra frente, pra não perder título antigo em
atraso nem título futuro já lançado).

```json
{
  "gerado_em": "2026-09-22",
  "ativo": {
    "disponivel": 1491.84,
    "realizavel": 22071.00,
    "total": 23562.84
  },
  "passivo_circulante": 5362.67,
  "saldo": 18200.17
}
```

- `ativo.disponivel` = soma do saldo atual de todas as contas bancárias
  ativas do cliente.
- `ativo.realizavel` = soma do `valor_em_aberto` de todas as contas a
  receber ainda não pagas (total ou parcialmente) dentro da janela.
- `passivo_circulante` = soma do `valor_em_aberto` de todas as contas a
  pagar ainda não pagas dentro da janela.
- `saldo` = `ativo.total - passivo_circulante`. **Não existe Patrimônio
  Líquido** nesse endpoint — esse dado não existe na API do Conta Azul.
