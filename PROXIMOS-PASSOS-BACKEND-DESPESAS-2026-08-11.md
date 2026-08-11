# Próximos passos — Backend (categorização de Despesas)

Levantado em 11/08/2026, a partir da lista de métricas da Nick Publicidade
que você mandou. Objetivo: sair do mock de Despesas usando marcação manual
de categoria (feita por `master` em Ajustes) em vez de depender do
`entrada_dre` do Conta Azul — mais simples e mais rápido de entregar.

> ⚠️ **Nota (11/08, à noite):** cheguei a prototipar isso e vi que a tabela
> `categoria_despesa` **já existe** no D1 de produção — parece que você já
> começou essa frente em paralelo. Removi meu protótipo (não cheguei a subir
> pro GitHub) pra não conflitar com o que você já está fazendo. Só um detalhe
> que reparei: a tabela existente tem `is_despesa INTEGER NOT NULL DEFAULT 1`
> (categoria nova já nasce marcada como despesa) — confirma se é esse o
> comportamento que você quer, porque o instinto seria o oposto (nascer
> desmarcada, só virar despesa quando alguém confirmar explicitamente).

---

## 1. Deploy do fix da conta bancária inativa

Já corrigido em `server/src/routes/home.js` — o endpoint `/home` listava
todas as contas bancárias (`GET /conta-financeira`) sem checar o campo
`ativo`. No cliente de teste, a conta "Asaas" está inativa e ainda assim
entrava na lista. Corrigido pra filtrar `conta.ativo` antes de mapear.
Não afeta nada em produção hoje (o card "Saldo em conta" nem foi construído
ainda), mas evita o bug no dia em que for.

**Ação:** `wrangler deploy` do `server/`.

---

## 2. Expor o plano de contas do cliente

**Novo endpoint:** `GET /api/clientes/:id/categorias`

Proxy simples pro `GET /categorias` do Conta Azul (já confirmado
funcionando, ver `DADOS-CONTA-AZUL-API.md`). Retornar por categoria:

```json
{ "id": "...", "nome": "Tarifas Bancárias", "tipo": "DESPESA", "entrada_dre": "DESPESAS_ADMINISTRATIVAS" }
```

Sem isso a tela de Ajustes não tem o que listar pro master marcar.

---

## 3. Tabela nova no D1

Guarda quais categorias o master marcou como "Despesa operacional" (a
distinção que separa Despesas de Saídas — ver `SaidasPage.jsx`).

Sugestão de schema:

```sql
CREATE TABLE categoria_despesa (
  cliente_id INTEGER NOT NULL,
  categoria_id TEXT NOT NULL,
  categoria_nome TEXT NOT NULL,
  is_despesa INTEGER NOT NULL DEFAULT 0,
  atualizado_em TEXT NOT NULL,
  PRIMARY KEY (cliente_id, categoria_id)
);
```

Migration em `server/src/db/migrations/`, seguindo o padrão das existentes.

---

## 4. Endpoint pra salvar a marcação (só master)

**Novo endpoint:** `PUT /api/clientes/:id/categorias/despesas`

Recebe a lista de `categoria_id`s marcados como despesa, grava/atualiza na
tabela nova. Usar `exigirPapel("master")` — diferente dos outros endpoints
financeiros (que liberam `"master", "analista"`), essa tela é exclusiva de
master.

---

## 5. Endpoint `/despesas` de verdade

**Novo endpoint:** `GET /api/clientes/:id/despesas`

Mesmo padrão de `/entradas` e `/saidas`:
- Chama `buscarContasAPagar` (já existe em `contaazul/api.js`)
- Filtra só os lançamentos cuja `categoria_id` está marcada como despesa na
  tabela `categoria_despesa`
- Soma `valor_pago` — regime de caixa, já decidido (ver "⚠️ Regime de caixa"
  no topo do `API-CONTRACT.md`)
- Mesmo formato de resposta dos outros dois (`{periodo, totais, lancamentos}`),
  pra manter consistência e o front reaproveitar o mesmo hook

---

## Depois disso (lado front, já mapeado, não é tarefa do back)

- Tela em Ajustes (só master) pra listar categorias e marcar/desmarcar
- `useFinanceData.js` troca a chamada de `generateFinanceData(...).despesas`
  (mock) pelo `apiFetch("/api/clientes/:id/despesas")` real
- `HomePage.jsx` já está pronto pra receber dado real de despesas (o
  `topCategorias`/`groupByCategoria` já funcionam com o mesmo formato que
  entradas/saídas usam)

## Referência

- `DADOS-CONTA-AZUL-API.md` — endpoints confirmados, incluindo `/categorias`
- `API-CONTRACT.md` — contrato dos endpoints existentes (seguir o mesmo padrão)
- `DEMANDAS-PARA-FINALIZAR.md`, item 4 — decisão registrada de não depender
  do `entrada_dre` do Conta Azul, usar marcação manual em vez disso
