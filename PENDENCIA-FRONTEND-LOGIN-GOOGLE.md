# Pendência de frontend — Login com Google + convite de cliente

Documento pro dev do frontend: o que já está pronto no backend e o que falta
construir na tela pra fechar essa funcionalidade.

## O que já está pronto no backend (produção)

Duas coisas separadas, que se conectam:

### 1. Login com Google (já existia desde 12/08, sem mudança de rota)

- `GET /api/auth/google/iniciar` — **não é fetch**, precisa ser um
  redirecionamento de página inteira (`window.location.href = ...`), porque
  o Google não permite login dentro de XHR/fetch.
- Depois que a pessoa autoriza no Google, ele redireciona sozinho pro
  `callback` do backend, que termina redirecionando de volta pro front:
  - Sucesso → `{APP_URL}/` (sessão já criada, cookie já setado — é só o
    front chamar `GET /api/auth/me` normalmente, como faz hoje depois do
    login por senha)
  - Erro → `{APP_URL}/?google=<código>`, onde `<código>` pode ser:
    - `erro` — falha genérica (token inválido, etc)
    - `email_nao_verificado` — a conta Google da pessoa não tem e-mail
      verificado
    - `conta_nao_encontrada` — não existe usuário com esse e-mail **e**
      não existe convite pendente pra esse e-mail (ver seção 2)

**O que falta no front**: um botão "Entrar com Google" na tela de login,
que redireciona pra `GET /api/auth/google/iniciar`. E tratar o parâmetro
`?google=...` na URL de volta, pra mostrar uma mensagem de erro amigável
se vier um desses códigos (em vez de deixar a URL "suja" sem feedback).

### 2. Convite de cliente (novo, 22/09) — pra cliente se cadastrar sozinho

Antes, o login Google só funcionava pra quem já tinha conta criada
manualmente pelo master (`POST /api/clientes/:id/login`, com senha). Agora
existe uma segunda forma: o master **convida** um e-mail, sem senha
nenhuma, e a pessoa cria a própria conta ao entrar com Google pela primeira
vez.

**Rotas** (todas dentro de `/api/clientes/:id/convites`, `:id` = id do
cliente/empresa):

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

Quando a pessoa convidada clica em "Entrar com Google" e autoriza, o
backend confere: já existe usuário com esse e-mail? Se não, tem convite
pendente? Se sim, cria a conta `papel: 'cliente'` na hora, vinculada a
esse `cliente_id`, com nome/sobrenome já preenchidos automaticamente pelo
Google — e some o convite da lista. A pessoa cai logada direto, sem
nenhum passo extra.

**O que falta no front**:
- Na tela de **Ajustes** (onde já existe a gestão de categorias-mãe, por
  exemplo), uma seção nova por cliente: "Convites de acesso" — listar
  convites pendentes (`GET`), formulário simples pra criar um novo
  (`POST`, só um campo de e-mail), botão de cancelar em cada linha
  (`DELETE`). Só master vê o formulário de criar/cancelar; analista pode
  só visualizar a lista, se fizer sentido.
- Nenhuma tela nova de "aceitar convite" é necessária — o fluxo é 100%
  pelo botão de login Google já existente; o backend decide sozinho se é
  login ou cadastro.

## Dúvida que o dev tinha (respondida)

Sobre usar dados do Google pro cadastro: primeiro nome e sobrenome vêm
prontos (`given_name`/`family_name`), sem precisar de nada extra — já são
salvos automaticamente quando a conta é criada por convite. **Data de
nascimento não vem** nesse fluxo — exigiria um escopo especial do Google
que passa por revisão manual (pode levar semanas) e mesmo assim muita
gente não deixa esse dado visível na conta. Se precisar de data de
nascimento, melhor pedir direto num campo do formulário, não depender do
Google.

## Referência técnica completa

Contrato completo de todas as rotas de auth (login por senha, esqueci
senha, Google, convites) está em `API-CONTRACT.md`, seção "Convites de
cliente + autocadastro via Google" e as duas seções logo acima dela.
