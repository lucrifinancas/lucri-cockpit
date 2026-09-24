# Revisão de segurança — Lucri Cockpit

Data: 24/09/2026. Escopo: código local do frontend React/Vite e backend Hono/Cloudflare Workers, autenticação, autorização, integrações, consultas SQL e dependências dos dois package-lock.json. Inclui alterações locais ainda não commitadas.

Método: revisão manual, npm audit consultando o registro npm e requisições em memória ao worker real, com banco simulado e credenciais fictícias. Nenhuma requisição de teste foi enviada à produção, nenhum e-mail foi enviado e nenhum dado real foi alterado. Não foram usados Semgrep ou CodeQL. As configurações efetivas de WAF, Cloudflare, secrets e implantação não foram inspecionadas. Os resultados não comprovam invasão nem ausência de outras falhas.

## 1. Alta — CSRF permite criar convites com a sessão de um master

Evidências: `server/src/index.js:29`, `server/src/auth/sessao.js:31`, `server/src/routes/clientes.js:208` (rota POST de convites).

O cookie de produção usa SameSite=None. O backend não valida Origin nem exige token CSRF antes das gravações. O parser c.req.json() aceita JSON mesmo quando Content-Type é text/plain, que pode ser enviado por um fetch cross-origin sem preflight. CORS controla a leitura da resposta pelo navegador, mas não bloqueia a execução da rota.

Teste: POST /api/clientes/1/convites com Origin fictício não autorizado, Content-Type text/plain, JSON contendo e-mail fictício e cookie master sintético retornou 201 e executou uma gravação no banco simulado, sem Access-Control-Allow-Origin.

Impacto: se um master visitar uma página maliciosa e o navegador enviar o cookie cross-site, essa página pode cadastrar um e-mail controlado pelo atacante como convidado. O fluxo de login Google aceita esse convite e cria a conta vinculada ao cliente. Atualmente as rotas financeiras rejeitam o papel cliente, portanto não foi demonstrada leitura financeira por essa nova conta. A criação indevida de acesso foi demonstrada no backend; não houve teste completo em navegador. Bloqueio de cookies de terceiros pode impedir o ataque em determinados navegadores.

Correção: validar uma lista explícita de origens nas operações de escrita, exigir application/json nas rotas JSON e adotar proteção CSRF. Tratar callbacks OAuth separadamente com suas próprias validações. Testar que a requisição acima recebe 403/415 sem gravação.

## 2. Alta — redefinir senha não revoga sessões existentes

Evidências: `server/src/auth/sessao.js:7`, `server/src/auth/sessao.js:39`, `server/src/auth/guard.js:8`, `server/src/routes/auth.js:89` e `server/src/routes/auth.js:137`.

Os JWTs duram sete dias e são aceitos apenas pela assinatura e validade. Não há consulta de sessão revogada ou versão da sessão no banco. Trocar/redefinir a senha atualiza somente senha_hash; logout apenas remove o cookie do navegador.

Teste: a rota de redefinição retornou 200 e executou UPDATE de senha no banco simulado. O JWT emitido antes continuou acessando GET /api/clientes com status 200. O mesmo ocorreu após logout.

Impacto: alguém que já tenha obtido uma sessão pode continuar usando-a até a expiração, mesmo após a vítima recuperar a conta. O achado pressupõe comprometimento prévio da sessão; não demonstra roubo de cookie.

Correção: sessões revogáveis ou session_version/invalid_before persistido e verificado em cada requisição. Revogar sessões ao redefinir senha e oferecer revogação global; invalidar a sessão específica no logout.

## 3. Média — login e recuperação sem limitação na aplicação

Evidências: `server/src/routes/auth.js:26` e `server/src/routes/auth.js:98`; não há middleware de rate limit no index.js nem binding correspondente no wrangler.toml.

Teste: 25 tentativas sequenciais com e-mail fictício inexistente receberam 401, sem 429. A revisão confirma que o ramo de senha de usuário existente também não possui contador de tentativas. A recuperação apaga tokens anteriores e envia novo e-mail a cada solicitação para uma conta existente.

Impacto: tentativas automatizadas de senha e abuso do envio de e-mails; pedidos repetidos também invalidam links legítimos de recuperação. Eventuais regras externas do Cloudflare podem mitigar isso, mas não foram verificadas.

Correção: limites por IP e conta, janela de espera para recuperação e monitoramento de abuso, evitando bloqueio permanente que permita negar acesso à vítima.

## 4. Média — Hono instalado tem ReDoS aplicável ao CORS

Evidências: server/package-lock.json fixa Hono 4.12.32; a cópia instalada tem a mesma versão. `server/src/index.js:31` usa cors() sem allowHeaders explícito.

O npm audit identificou GHSA-8j4g-w8fx-2239. O aviso do mantenedor confirma que o parser de Access-Control-Request-Headers pode consumir CPU excessiva em OPTIONS sem autenticação quando allowHeaders não é definido. A configuração atual satisfaz essas condições. Não foi executado teste de carga/DoS.

Correção: atualizar Hono para uma versão corrigida para todos os alertas atuais do audit, atualizar o lockfile e validar as rotas. 4.12.34 corrige especificamente esse ReDoS, mas o audit atual também lista outros alertas com correções em 4.13.5. Definir allowHeaders explicitamente reduz a exposição a esse caminho enquanto a atualização é preparada.

Fonte: [aviso oficial do Hono](https://github.com/honojs/hono/security/advisories/GHSA-8j4g-w8fx-2239).

## 5. Média — origens locais têm acesso com credenciais em produção

Evidência: `server/src/index.js:32`.

Além de APP_URL, a política aceita qualquer porta de localhost HTTP e determinados endereços privados, sem condicionamento ao ambiente.

Teste: GET /api/auth/me com Origin http://localhost:9999 e cookie sintético retornou 200, Access-Control-Allow-Origin correspondente e Access-Control-Allow-Credentials: true.

Impacto condicionado: uma página maliciosa servida por uma dessas origens, aberta pelo usuário, pode ler respostas autenticadas se o navegador enviar o cookie. Isso não significa que qualquer site remoto possa ler a API.

Correção: em produção permitir somente origens oficiais exatas; separar backend/credenciais de desenvolvimento e permitir origens locais apenas nele.

## 6. Média — autorização pendente do Conta Azul não expira

Evidências: `server/src/db/conexoesContaazul.js:49`, `server/src/db/migrations/0002_onboarding.sql:4` e `server/src/routes/contaazulOnboarding.js:45`.

O state é aleatório, mas a consulta não verifica criado_em. O consumo faz SELECT e DELETE separados, sem garantir consumo único atômico. O callback depende desse state para escolher a empresa cuja conexão será substituída.

Teste: a função consumiu e devolveu um registro simulado criado em 2000. A ausência de condição temporal na consulta foi confirmada no código. A corrida de consumo não foi reproduzida.

Impacto condicionado: um link antigo não utilizado e posteriormente obtido por terceiro continua permitindo iniciar a vinculação à empresa de destino; ainda seria necessário um code OAuth válido. A ausência de vínculo com navegador pode ser intencional para compartilhar a autorização com o cliente, portanto não é classificada isoladamente como falha.

Correção: prazo curto explícito, consumo atômico condicionado à validade e cancelamento de links anteriores. Preservar, se necessário, o fluxo legítimo de autorização compartilhada com o cliente.

## Dependências: resultado e aplicabilidade

`npm audit --json --ignore-scripts` concluiu em ambos os projetos. Código de saída 1 representa alertas encontrados.

| Projeto | Pacotes sinalizados | Classificação do npm |
| --- | --- | --- |
| Backend | 5 | 4 altos, 1 moderado |
| Frontend | 4 | 3 altos, 1 moderado |

Esses números contam pacotes afetados, inclusive dependências que herdam o mesmo alerta; não representam nove ataques independentes comprovados.

- Backend: Hono 4.12.32 é dependência de produção. O ReDoS de CORS é aplicável; não foram encontrados usos de memo SSR, proxy helper, language middleware, toSSG ou parseBody que justifiquem tratar os outros avisos desses recursos como exploração confirmada. A aplicabilidade do alerta do parser de query a este deployment não foi demonstrada.
- Wrangler 4.114.0, Miniflare 4.20260722.0, Undici 7.28.0 e Sharp 0.35.2 são dependências de desenvolvimento. Atualizar, mas não confundir com bibliotecas servidas pelo Worker em produção.
- Frontend: React Router/React Router DOM 7.18.1 foram sinalizados por falha de RSC. Este projeto usa BrowserRouter, createRoot e Vite, sem RSC identificado; o vetor do aviso não se aplica à arquitetura revisada. [Aviso do mantenedor](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2).
- Nanoid 3.3.16 e PostCSS 8.5.21 são dependências de desenvolvimento. Os alertas justificam atualização da cadeia de build, sem evidência de exploração por um visitante do site.
- O npm informou correção disponível para todos os pacotes sinalizados. Nenhum npm audit fix foi executado.

## Outros pontos e controles existentes

- Tokens de reset e access/refresh tokens do Conta Azul são gravados diretamente nas colunas do banco. Um vazamento de leitura do banco ampliaria o impacto. Considerar hash dos tokens de reset e criptografia de aplicação dos tokens recuperáveis com chave separada. Não foi constatado acesso público ao banco; também não se afirma ausência de criptografia da infraestrutura.
- Tokens de reset são consultados e apagados em operações separadas. Recomenda-se consumo atômico e invalidação dos tokens pendentes na troca autenticada de senha.
- Consultas SQL revisadas usam bind; não foi encontrada concatenação de entrada do usuário em SQL.
- JWT usa verificação explícita HS256; cookies são HttpOnly e Secure em HTTPS. Google OAuth verifica state e email_verified.
- Rotas administrativas/financeiras verificam papel no servidor. Testes locais retornaram 401 para consulta anônima de clientes e 403 para papel cliente acessando home de outra empresa. Isso não é uma auditoria exaustiva de autorização.
- As rotas financeiras também rejeitam o papel cliente para sua própria empresa. É uma limitação funcional atual, não evidência de isolamento completo de um portal cliente já operacional.
- Não foi encontrado uso de dangerouslySetInnerHTML, innerHTML ou eval no código de aplicação pesquisado. Isso não constitui garantia de ausência de XSS.

## Ordem sugerida

1. Bloquear CSRF nas gravações e restringir origens em produção.
2. Implementar revogação de sessões na recuperação de conta.
3. Atualizar Hono e a cadeia de dependências; verificar rate limits na aplicação e no Cloudflare.
4. Expirar e consumir autorizações OAuth/reset atomicamente.

Foram preservadas as alterações locais existentes. Esta revisão adicionou somente este relatório; não aplicou correções nem realizou deploy.

---

## Status das correções (24/09/2026, mesmo dia)

Todos os 6 achados e os pontos de "Outros pontos" foram corrigidos no
código e testados localmente (`wrangler dev --local`, usuário de teste
descartado depois). Nenhum item foi deixado pendente do lado do código —
os únicos pontos fora do escopo do código estão listados no final desta
seção.

1. **CSRF (Alta)** — `server/src/middleware/csrf.js` + `server/src/auth/origem.js`.
   Toda escrita (POST/PUT/PATCH/DELETE) agora exige Origin numa lista
   explícita (a mesma usada pelo CORS) e, se tiver corpo, `Content-Type:
   application/json` de verdade — não só declarado. Testado: origem
   estranha e ausência de Origin retornam 403; `Content-Type: text/plain`
   com corpo retorna 415; origem permitida sem cookie cai corretamente em
   401 (nunca chega a gravar).
2. **Sessão não revogada (Alta)** — coluna `sessao_versao` em `usuarios`
   (migration 0009). Toda sessão (JWT) carrega a versão vigente no
   momento do login; trocar ou redefinir a senha incrementa essa coluna
   (`atualizarSenha`, usada pelas duas rotas), e `lerSessaoValida`
   confere essa versão no banco em toda requisição autenticada. Testado
   ponta a ponta: login → `/me` 200 → trocar senha → `/me` com o mesmo
   cookie antigo → 401.
3. **Sem limite de tentativas (Média)** — `server/src/db/limiteTaxa.js`,
   tabela `limite_taxa` (migration 0009). Login: 10 tentativas/15 min por
   e-mail (429 depois disso). Esqueci-senha: 3 pedidos/15 min por e-mail
   (resposta continua `200 ok` mesmo bloqueado, pra não expor nem
   invalidar token legítimo). Testado: 11ª tentativa de login seguida
   recebe 429.
4. **Hono com ReDoS (Média)** — atualizado para 4.13.5 via `npm
   install`/`npm audit fix`. `npm audit` no backend: 0 vulnerabilidades.
   `allowHeaders: ["Content-Type"]` também adicionado ao `cors()` como
   reforço.
5. **Origens de dev em produção (Média)** — mesma função
   `origemPermitida` usada pelo CORS: localhost/rede local só passam
   quando a requisição chega via http (dev); em produção (https) só a
   origem oficial (`APP_URL`) é aceita.
6. **Autorização Conta Azul sem expiração (Média)** —
   `consumirAutorizacaoPendente` agora confere e apaga na mesma consulta
   (`DELETE ... RETURNING`), com validade de 10 minutos. Limpeza
   oportunista de state expirado a cada nova autorização criada.
7. **Outros pontos** — tokens de redefinição de senha passam a guardar só
   o hash (SHA-256) no banco (migration 0009 renomeia a coluna
   `token`→`token_hash`); consumo do token também virou atômico
   (`consumirTokenReset`, `DELETE ... RETURNING`); trocar a senha estando
   logado agora também invalida qualquer link de redefinição pendente.

**Dependências do frontend**: `npm audit fix` rodado em `app/` também —
0 vulnerabilidades (React Router, Nanoid, PostCSS atualizados). Build
(`npm run build`) confirmado funcionando depois da atualização do React
Router.

**Fora do escopo do código, ainda dependem de ação manual**:
- Aplicar a migration `0009_seguranca.sql` no D1 de produção
  (`wrangler d1 execute lucri-cockpit-db --remote --file=...`).
- Configuração de WAF/rate limit na borda da Cloudflare (a limitação
  agora existe na aplicação, mas uma camada extra no painel da Cloudflare
  continua sendo uma boa prática, como o próprio relatório menciona).
- Rotação do secret usado pra assinar os cookies de sessão
  (`JWT_SECRET`), caso o time queira invalidar TODAS as sessões
  existentes de uma vez (diferente da revogação por usuário implementada
  aqui, que já cobre o caso relatado).

**Observação adicional (fora do escopo original do relatório)**: durante
a correção, notei que `GET /api/contaazul/autorizar/:clienteId`
(`server/src/routes/contaazulOnboarding.js`) tem efeito colateral (grava
uma autorização pendente no banco) apesar de ser um GET — foge do padrão
REST e, em teoria, permite que uma página de terceiros force essa
gravação via `<img src="...">` usando a sessão de um master/analista (o
corpo da resposta não seria lido pelo atacante, só o efeito colateral
aconteceria). Não foi corrigido nesta rodada por mudar o contrato da rota
(exigiria trocar pra POST e ajustar o front) — sinalizando pra decisão
do time antes de mexer.
