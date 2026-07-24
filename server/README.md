# Backend — Lucri Cockpit

Pasta reservada pro código do backend. Antes de começar, leia (nessa ordem):

1. `../README.md` — contexto geral do produto.
2. `../DIRETRIZES-BACKEND.md` — responsabilidades, decisões fechadas e a
   seção **"Hospedagem/deploy (decidido)"**: GitHub + Cloudflare Workers +
   Cloudflare D1. O runtime não é Node/Express tradicional — nada de
   `express-session`/`connect-pg-simple`/dependências de filesystem.
3. `../DADOS-CONTA-AZUL-API.md` — levantamento real dos endpoints do Conta
   Azul (campos, exemplos de payload, pendência do saldo por conta
   bancária).

Sugestão de estrutura (ajustar como fizer sentido pro framework escolhido,
ex. Hono):

```
server/
  src/
    contaazul/     # camada isolada de integração com o Conta Azul
    routes/
    db/             # schema/migrations do D1
  wrangler.toml
  package.json
```

Documentar o contrato de request/response de cada endpoint em
`API-CONTRACT.md` nesta pasta assim que possível — desbloqueia o front a
trabalhar contra mock fiel em vez de dado inventado.
