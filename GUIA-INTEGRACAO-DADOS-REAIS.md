# Guia — Trocar dado mockado por dado real (Beta 1: HOME + AJUSTES)

O backend já está publicado e testado (`API-CONTRACT.md`). Este guia mapeia,
arquivo por arquivo, o que precisa mudar no front pra sair do mock e falar
com a API de verdade — e sinaliza duas lacunas de dado que precisam de
decisão antes de fechar 100%.

Base URL do backend: `https://lucri-cockpit-server.lucrifinancas-54e.workers.dev`

## 1. Criar a camada de API (`src/api/client.js`)

Ainda não existe (`app/src/api/` não existe hoje). Sugestão mínima:

```js
const BASE_URL = "https://lucri-cockpit-server.lucrifinancas-54e.workers.dev";

export async function apiFetch(path, options = {}) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include", // obrigatório: é o que manda/recebe o cookie de sessão
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({}));
    throw new Error(erro.erro ?? `Erro ${resp.status}`);
  }
  return resp.json();
}
```

## 2. Autenticação real (`src/auth/AuthContext.jsx`)

Hoje `login({ role, clientId, name })` aceita qualquer coisa (mock
declarado no próprio comentário do arquivo). Trocar por:

```js
async function login({ email, senha }) {
  const dados = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
  setUser(dados); // { email, papel, cliente_id }
}
```

**`LoginPage.jsx`** precisa trocar o formulário atual (seletor de
role/cliente fake) por campos reais de e-mail/senha.

**Atenção**: `user.role` vira `user.papel` (nomenclatura do backend:
`master`/`analista`/`cliente`) — já bate com o que foi ajustado no commit
"Reconcilia papéis de usuário com o schema do backend", então essa parte já
está alinhada.

## 3. Lista de clientes real (`src/data/mockClients.js` → API)

Hoje `MOCK_CLIENTS` tem IDs tipo `"padaria-bomgosto"` (string). No backend
real, os IDs são números (`1`, `2`, ...). Trocar a origem da lista:

```js
const clientes = await apiFetch("/api/clientes"); // só master/analista
```

`ClientContext.jsx` deve passar a guardar o `id` numérico como
`activeClientId`, não mais a string mockada.

## 4. Dados financeiros reais (`src/hooks/useFinanceData.js`)

Trocar `generateFinanceData(activeClientId)` por chamadas reais:

```js
const home = await apiFetch(`/api/clientes/${activeClientId}/home?de=${range.start}&ate=${range.end}`);
const entradasResp = await apiFetch(`/api/clientes/${activeClientId}/entradas?de=${range.start}&ate=${range.end}`);
const saidasResp = await apiFetch(`/api/clientes/${activeClientId}/saidas?de=${range.start}&ate=${range.end}`);
```

Ver `API-CONTRACT.md` pro formato exato de cada resposta.

---

## ⚠️ Duas lacunas de dado — resolver antes de fechar a Home 100% real

Comparando o mock (`mockFinance.js`) com o que a API do Conta Azul
realmente devolve, achei duas diferenças que quebram partes da Home:

### 1. Não existe campo de `tipo` (recorrente/pontual/outro) nas entradas

A Home usa isso pra calcular "recorrentes", "pontuais", "outros" e ticket
médio (`HomePage.jsx`, linhas ~44-51). Isso foi **inventado no mock** — a
API real do Conta Azul não classifica lançamentos dessa forma, só devolve
`categoria` (nome da categoria financeira, ex: "Receitas de Serviços").

**Decisão necessária**: ou (a) descartar esses cards específicos na v1 real,
(b) criar uma heurística própria baseada na `categoria` ou descrição, ou
(c) perguntar pro Conta Azul/suporte se existe algum outro campo que sirva
pra isso. Recomendo (a) por enquanto, pra não inventar uma regra de negócio
sem base.

### 2. Não existe campo de `saldo` por conta bancária

A Home soma `contasBancarias[].saldo` pro card "Saldo em conta"
(`sumSaldoContas`). O endpoint real (`GET /conta-financeira`, documentado em
`DADOS-CONTA-AZUL-API.md`) **não retorna saldo** — só dados cadastrais da
conta (banco, agência, número).

**Decisão necessária**: confirmar com o suporte do Conta Azul se existe outro
endpoint pra saldo, ou se precisa ser calculado somando lançamentos
(complexo e sujeito a erro). Esse card não deve ser conectado a dado real
até isso ser resolvido — mantém mockado ou oculto por enquanto.

### 3. Card "Despesas" também não tem fonte real ainda

`totalDespesas` vem de `despesas` (subconjunto de saídas, com categorização
fixo/variável) — esse recorte não existe como endpoint no backend ainda
(está bloqueado esperando confirmação sobre `entrada_dre`, ver
`DECISOES-E-ESCOPO.md` "Em aberto"). Mantém mockado até o endpoint de
DESPESAS existir.

---

## Resumo do que dá pra conectar de verdade hoje

✅ Login/sessão · ✅ Lista de clientes · ✅ Contas a pagar/receber (totais e
detalhado) · ✅ Contas bancárias (dados cadastrais, sem saldo) · ✅ Onboarding
de cliente (Ajustes)

❌ Saldo em conta (falta o dado na origem) · ❌ Classificação recorrente/
pontual/outro (não existe na origem) · ❌ Despesas/DRE (bloqueado por
categorização)
