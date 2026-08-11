# Contrato da API — Lucri Cockpit

Formato de request/response de cada endpoint do backend, testado com dados
reais. Base URL (produção): `https://lucri-cockpit-server.lucrifinancas-54e.workers.dev`

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
      "tipo": "CONTA_CORRENTE"
    }
  ]
}
```

**Resposta `404`** (cliente existe mas nunca conectou o Conta Azul):
```json
{ "erro": "Cliente ainda não conectou o Conta Azul." }
```

⚠️ **Pendente**: não existe campo de saldo por conta bancária no payload do
Conta Azul — `contas_bancarias` hoje não inclui `saldo`. Ver
`DADOS-CONTA-AZUL-API.md`.

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

Protegida (`master`, `analista`). Últimos N meses de **contas a receber
vencidas**, somadas por mês de vencimento — pensado pro gráfico "Contas a
receber vencidas por mês" da Home. Busca contas a receber numa janela larga
(1 chamada só) e agrupa localmente, em vez de 1 chamada por mês.

**Parâmetros de query (opcionais):** `meses` (padrão `12`, máximo `24`).

**Resposta `200`:**
```json
{
  "meses": [
    { "mes": "2025-09", "label": "Setembro", "vencidas": 663.0 },
    { "mes": "2025-10", "label": "Outubro", "vencidas": 3470.0 }
  ]
}
```
`vencidas` = soma de `valor_em_aberto` dos lançamentos com `data_vencimento`
no passado e ainda não totalmente pagos, agrupados pelo mês do vencimento.

⚠️ **Só cobre "vencidas" por enquanto.** Não retorna `receitas`/`despesas`/
`resultado` — esses dependem do endpoint de DESPESAS (ver abaixo), que
outra pessoa está construindo em paralelo. Quando isso for concluído, este
endpoint deve ser estendido (não recriado) pra incluir receitas/despesas
por mês, alimentando também "Receitas x Despesas — Histórico mensal" e
"Resultado histórico (lucro/prejuízo)".

---

## Endpoints ainda não implementados

- **DESPESAS** e **DRE** — bloqueados pela definição de categorização
  fixo/variável (ver `README.md`, seção "Em aberto").
- **BALANÇO** — bloqueado pela definição de estrutura de linhas/subtotais.
- Endpoint de "esqueci minha senha" por e-mail (adiado, ver
  `GUIA-MAKE-RESET-SENHA.md`) — troca de senha *estando logado* já existe
  (`POST /api/auth/alterar-senha`).
