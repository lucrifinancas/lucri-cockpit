# Pendências de frontend — o que o backend já entrega e falta construir na tela

Documento pro dev do frontend: consolida tudo que já está pronto e publicado
no backend, mas ainda não tem tela correspondente (ou a tela existe mas não
está roteada). Contrato completo de cada rota está em `API-CONTRACT.md`.

---

## 1. DRE

- `GET /api/clientes/:id/dre` — pronto desde 25/08. Usa a estrutura oficial
  `financeiro/categorias-dre` configurada pelo próprio contador da empresa
  no Conta Azul (grupos, subgrupos e totalizadores em cascata), não é uma
  regra nossa.
- Formato de resposta: array de linhas, cada uma com `codigo`, `descricao`,
  `totalizador` (bool — linha de subtotal, sem `subitens`), `valor` (já com
  o sinal certo: receita positiva, despesa/dedução negativa) e `subitens`
  quando aplicável. `resultado_final` é atalho pro valor da última linha
  (Lucro/Prejuízo Final). Detalhes e exemplo completo de JSON em
  `API-CONTRACT.md`.
- **Falta**: renderizar como tabela contábil hierárquica (indentação por
  nível, negrito nos totalizadores). O dev confirmou (22/09) que vai
  liberar essa tela.

## 2. Esqueci minha senha

- `POST /api/auth/esqueci-senha` — body `{ "email": "..." }`. Sempre
  responde `{ "ok": true }` (mesmo se o e-mail não existir, por segurança).
  Dispara e-mail com link de redefinição.
- `POST /api/auth/redefinir-senha` — body
  `{ "token": "...", "senha_nova": "..." }` (mínimo 8 caracteres). Erro
  `400` se o token for inválido ou tiver expirado (validade: 60 min).
- **Falta**: duas telas —
  1. Uma tela/link "Esqueci minha senha" na tela de login, com um campo de
     e-mail, chamando `POST /api/auth/esqueci-senha`.
  2. A rota `/redefinir-senha?token=...` (é pra essa URL que o e-mail
     manda a pessoa), com um campo de nova senha, chamando
     `POST /api/auth/redefinir-senha` com o `token` tirado da querystring.

## 3. Login com Google + autocadastro de cliente por convite

Duas partes que se conectam:

### 3a. Login com Google (existe desde 12/08)

- `GET /api/auth/google/iniciar` — **não é fetch**, precisa ser
  redirecionamento de página inteira (`window.location.href = ...`).
- Depois de autorizar, o Google volta pro `callback` do backend, que
  redireciona de volta pro front:
  - Sucesso → `{APP_URL}/` (sessão/cookie já criados — só chamar
    `GET /api/auth/me` normalmente).
  - Erro → `{APP_URL}/?google=<código>`: `erro` (falha genérica),
    `email_nao_verificado`, ou `conta_nao_encontrada` (não existe conta
    nem convite pra esse e-mail).

### 3b. Convite de cliente (novo, 22/09)

Permite que uma pessoa nova crie a própria conta "cliente" sem o master
precisar definir senha manualmente — o master só reserva o e-mail, e a
conta é criada automaticamente no primeiro login via Google.

```
POST   /api/clientes/:id/convites       (só master)
Body:  { "email": "pessoa@empresa.com" }
201 →  { "id": 3, "email": "pessoa@empresa.com", "cliente_id": 1 }
409 →  { "erro": "Esse e-mail já está convidado ou já tem uma conta." }

GET    /api/clientes/:id/convites       (master ou analista)
200 →  [{ "id": 3, "email": "...", "criado_em": "2026-09-22 18:40:00" }, ...]

DELETE /api/clientes/:id/convites/:conviteId   (só master)
200 →  { "ok": true }
404 →  { "erro": "Convite não encontrado." }
```

Quando a pessoa convidada entra com Google, o backend confere: já existe
usuário com esse e-mail? Se não, tem convite pendente? Se sim, cria a
conta `papel: 'cliente'` na hora, vinculada ao `cliente_id` do convite, com
nome/sobrenome já preenchidos automaticamente pelo Google
(`given_name`/`family_name`), some o convite da lista, e a pessoa cai
logada direto.

**Dúvida que o dev tinha (respondida)**: dá pra pegar primeiro nome e
sobrenome do Google de graça (já são salvos automaticamente). Data de
nascimento **não** vem nesse fluxo — exigiria escopo especial com revisão
manual do Google (pode levar semanas) e mesmo assim muita gente não deixa
esse dado visível na conta. Se precisar, pedir direto num campo do
formulário.

**Falta no front**:
- Botão "Entrar com Google" na tela de login, redirecionando pra
  `GET /api/auth/google/iniciar`. Tratar o parâmetro `?google=...` na
  volta pra mostrar mensagem de erro amigável.
- Seção "Convites de acesso" na tela de Ajustes de cada cliente: listar
  convites pendentes (`GET`), formulário de criar (`POST`, só um campo de
  e-mail, só master), botão de cancelar (`DELETE`, só master). Nenhuma
  tela de "aceitar convite" é necessária — o fluxo inteiro é pelo botão de
  login Google já existente.

## 4. Telas com dado real pronto, mas não roteadas/finalizadas

Backend 100% funcional nesses quatro; é trabalho só de front:

- **ENTRADAS** — já busca dado real (`useFinanceData`), mas não está
  roteada em `App.jsx` (cai em `UnderConstructionPage`).
- **SAÍDAS** — mesma situação: dado real pronto, falta rotear e revisar
  layout.
- **DESPESAS** — hoje só existe como cards na Home; falta página própria
  com tabela de lançamentos (padrão de ENTRADAS/SAÍDAS). Endpoint:
  `GET /api/clientes/:id/despesas`.
- **CAIXA** — endpoint pronto (`GET /api/clientes/:id/caixa`), página não
  existe/roteada.

## 5. Balanço — ainda NÃO está pronto no backend

Só pra deixar claro: diferente dos itens acima, o **Balanço** ainda não
tem endpoint implementado. Decisão fechada em 22/09 (conversa com o dev e
a contadora): vai ser uma versão simplificada — Ativo circulante disponível
(saldo bancário) + Ativo circulante realizável (contas a receber em
aberto) vs. Passivo circulante (contas a pagar em aberto), sem Patrimônio
Líquido real (a contadora não usa o Balanço vindo do Conta Azul, o dela
vem de outro sistema contábil). O endpoint ainda precisa ser construído no
backend antes de ter algo pro front consumir — não é pendência de frontend
ainda.

---

## Referência

- Contrato completo de cada rota (request/response, exemplos de JSON):
  `API-CONTRACT.md`
- Checklist geral do projeto: `CHECKLIST-V1.0.md`
- Guia do Resend (e-mail): `GUIA-RESEND-EMAIL.md`
