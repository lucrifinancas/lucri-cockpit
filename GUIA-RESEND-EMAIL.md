# Guia — Envio de e-mail via Resend (redefinição de senha)

O backend chama a API do [Resend](https://resend.com) diretamente por
código (`server/src/email/resend.js`) sempre que um usuário pede
redefinição de senha — sem plataforma de automação no meio (substituiu o
Make, que vinha dando problema).

## Passo a passo

### 1. Criar conta no Resend

Acesse [resend.com](https://resend.com) e crie uma conta (dá pra usar o
e-mail da Lucri). O plano gratuito cobre 3.000 e-mails/mês, 100/dia — mais
que suficiente pro volume do projeto.

### 2. Verificar um domínio

Pra enviar e-mail de produção (não só pra você mesmo testar), o Resend
exige um domínio verificado:

1. No painel do Resend, vá em **Domains → Add Domain**.
2. Informe um domínio que você controla o DNS (ex: `lucrifinancas.com.br`,
   ou um subdomínio tipo `mail.lucrifinancas.com.br`).
3. O Resend mostra 2-3 registros DNS (geralmente `TXT`, `MX` e `CNAME`
   para DKIM) — adicione esses registros no painel onde o domínio está
   registrado (Registro.br, Cloudflare DNS, etc).
4. Volte no Resend e clique em **Verify** — pode levar alguns minutos até
   propagar.

### 3. Gerar a API key

Em **API Keys → Create API Key**, crie uma chave (permissão de envio
basta). Copie o valor — só aparece uma vez.

### 4. Configurar o backend

Rodando dentro da pasta `server/`:

```
wrangler secret put RESEND_API_KEY
```
(cola a chave quando pedir — vira um secret, nunca aparece no código)

E no `server/wrangler.toml`, ajuste a variável `EMAIL_REMETENTE` pro
endereço do domínio que você verificou (ex:
`"Lucri Cockpit <nao-responda@lucrifinancas.com.br>"`) — precisa ser um
endereço do domínio verificado, não um Gmail comum.

Pra testar localmente, adicione as mesmas variáveis no seu `.dev.vars`
(`RESEND_API_KEY=...`) — o `EMAIL_REMETENTE` já vem do `wrangler.toml`.

### 5. Testar de ponta a ponta

Chame `POST /api/auth/esqueci-senha` com um e-mail cadastrado (via
Postman/Insomnia ou pelo próprio site quando o front tiver a tela) e
confirme que o e-mail chega.

## Observações de segurança

- A API key do Resend funciona como uma senha — nunca comitar no código,
  sempre via `wrangler secret`.
- Se a chave vazar, revogue no painel do Resend (**API Keys → Delete**) e
  gere uma nova.
