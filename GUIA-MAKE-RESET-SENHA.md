# Guia — Envio de e-mail de redefinição de senha via Make

Este documento é para quem for configurar o cenário no Make. O backend do
Lucri Cockpit vai **chamar um webhook do Make** sempre que um usuário pedir
para redefinir a senha — o Make fica responsável só pela parte de **enviar o
e-mail**, nada mais.

## O que o backend manda pro Make

Uma requisição HTTP `POST`, com esse formato de dados (JSON):

```json
{
  "email": "usuario@exemplo.com",
  "nome": "Nome do usuário (se tiver)",
  "link_redefinicao": "https://lucri-cockpit.pages.dev/redefinir-senha?token=abc123...",
  "expira_em_minutos": 60
}
```

O `link_redefinicao` já vem pronto — o Make só precisa colocar esse valor
dentro do corpo do e-mail, não precisa montar nada.

## Passo a passo no Make

### 1. Criar o cenário e o webhook

1. No Make, crie um **novo cenário**.
2. Adicione o módulo **Webhooks → Custom webhook**.
3. Clique em **"Add"** para criar um novo webhook, dê um nome (ex:
   `lucri-cockpit-reset-senha`).
4. O Make vai gerar uma **URL única** — copie essa URL, ela precisa ser
   enviada de volta pro backend (ver seção "O que fazer com a URL do
   webhook", no final deste guia).

### 2. Capturar a estrutura dos dados

1. Com o webhook criado, clique em **"Redetermine data structure"** (ou
   "Run once", dependendo da versão do Make).
2. Peça pro time do backend disparar um teste (ou use uma ferramenta como
   Postman/Insomnia para simular o envio) — isso ensina o Make quais campos
   vêm no JSON (`email`, `nome`, `link_redefinicao`, `expira_em_minutos`).

### 3. Adicionar o envio de e-mail

1. Adicione um módulo de e-mail — pode ser **Gmail → Send an Email** (se a
   conta de envio for um Gmail da Lucri) ou o módulo **Email** genérico do
   Make.
2. Configure:
   - **Para**: `{{email}}` (campo vindo do webhook)
   - **Assunto**: algo como `Redefinição de senha — Lucri Cockpit`
   - **Corpo do e-mail** (pode ser HTML simples):
     ```
     Olá {{nome}},

     Recebemos um pedido para redefinir sua senha no Lucri Cockpit.

     Clique no link abaixo para criar uma nova senha (válido por
     {{expira_em_minutos}} minutos):

     {{link_redefinicao}}

     Se você não pediu essa redefinição, pode ignorar este e-mail.
     ```
3. Salve e **ative o cenário** (toggle "ON" no canto do cenário).

### 4. Testar de ponta a ponta

Depois que o backend estiver configurado com a URL do webhook (ver abaixo),
peça pro backend disparar um pedido de redefinição de teste e confirme que o
e-mail chega certinho.

## O que fazer com a URL do webhook

Depois de criar o webhook (passo 1), **envie a URL gerada pro time de
backend** — ela vai ser guardada como variável de ambiente/segredo
(`MAKE_RESET_SENHA_WEBHOOK_URL`), nunca exposta no código ou no front.

## Observações de segurança

- A URL do webhook do Make funciona como uma senha — só o backend deve saber
  dela. Não compartilhar em prints, chats públicos, etc.
- Se a URL vazar algum dia, é só recriar o webhook no Make (gera uma nova
  URL) e atualizar a variável de ambiente no backend.
