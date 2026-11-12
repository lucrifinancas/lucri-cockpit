# Registros de erros e alterações de categorias

Implementação de 12/11/2026. Consulta em **Ajustes → Registros**, somente
para administrador (`master`). A permissão é verificada também na API.

## O que é registrado

- Erros inesperados da API: referência UUID, operação normalizada, status,
  empresa quando identificável, ID do usuário autenticado, versão e horário.
- Falhas de integração Google/Conta Azul e atualização do histórico mensal.
- Relatos do navegador: erros de execução/promessas, rede indisponível e
  resposta JSON inválida. São identificados como relatos, não como auditoria.
- Alterações de grupos de despesas/receitas, seus vínculos com categorias,
  seleção de grupos de contas a pagar e nomes das categorias de origem.
- A auditoria captura configuração anterior e posterior dentro do mesmo
  `DB.batch()` transacional da alteração. Se qualquer escrita falhar, ambas
  são revertidas. Salvar a mesma configuração não cria novo evento.

Não são coletados corpos de requisição/resposta, mensagens de exceção ou
stacks brutos, senhas, tokens, parâmetros livres de URL ou valores financeiros.
Nomes e IDs de categorias/grupos são necessários ao histórico. O e-mail do
autor é consultado pelo ID do usuário somente para exibição ao administrador.

Validações comuns (400), tentativas sem sessão (401) e leituras normais não
geram incidentes persistentes. A API não aceita eventos de auditoria enviados
pelo navegador. Relatos exigem sessão e têm limite de 2 KB e 20/min/usuário;
o navegador também deduplica eventos equivalentes por 60 segundos.

## Limites e retenção

Erros: 30 dias. Auditoria: 365 dias. O cron existente limpa eventos vencidos.
Uma falha da coleta não bloqueia o usuário nem dispara coleta recursiva. Se
o D1 estiver indisponível, a API emite um evento mínimo no console do Worker.
Relatos do navegador dependem da conexão; não demonstram cobertura de todos
os erros nem substituem um registro dos cenários executados por testadores.

O histórico começa na ativação. O piloto anterior da Growthex está documentado
em `output/growthex-categorias-2026-11-12/`; não é importado como se tivesse
ocorrido depois da ativação ou com uma identidade/data reconstruída.

## Publicação

O workflow testa o backend com Node 24 e publica o Worker. As tabelas são
preparadas pelo vínculo D1 existente antes da primeira leitura de registros,
gravação de erro, auditoria ou limpeza. A preparação usa somente o DDL aditivo
e idempotente da migração 0014, com cache por vínculo/isolate e nova tentativa
se falhar. Não reaplica migrações antigas nem amplia as permissões do token
de deploy. Os testes verificam a equivalência entre o SQL e a definição de
inicialização, além da primeira execução sem as tabelas.

Publicação, na pasta `server/`:

```sh
npm test
npm run deploy
```

O frontend recebe a versão pelo SHA do Cloudflare Pages no build. A query
`versao_app` mantém compatibilidade com o CORS do backend anterior.

## Casos de teste

Automação em `server/test/registros.test.js` usa SQLite real em memória,
todas as migrações, a autenticação Hono/JWT real e empresas fictícias 7 e 8.
O frontend tem testes em `app/test/observability.test.js`.

| Caso | Resultado esperado |
|---|---|
| Reclassificar despesa e alterar seu indicador de despesa | Antes/depois corretos, autor e referência da sessão |
| Falha de FK no salvamento | Nenhuma exclusão parcial; nenhum evento de sucesso |
| Falha ao gravar auditoria | Classificação revertida |
| Salvar a mesma configuração | Nenhum evento adicional |
| Criar/remover grupo; vincular receita; selecionar contas a pagar | Eventos correspondentes com nomes/IDs corretos |
| Administrador consulta histórico da empresa | Somente registros daquela empresa |
| Cliente ou analista consulta registros administrativos | 403 |
| Relato do cliente aponta para outra empresa | 403 |
| Relato contém token em query, mensagem e stack | Valores livres ausentes no registro |
| Relato excede limite ou frequência | Corpo rejeitado ou excesso descartado |
| Erro inesperado na API | 500 genérico com referência; sem mensagem bruta |
| Coleta do erro também falha | Resposta original preservada; fallback mínimo |
| Navegar para registros mais antigos | Paginação sem repetição entre páginas |
| Reexecutar a migração 0014 | Nenhuma perda de eventos existentes |
| Limpar retenção | Apenas eventos antigos removidos |

Para registrar um teste manual, use: **data/hora · versão · empresa · papel ·
tela · passos · resultado esperado · resultado obtido · referência do erro**.
Não inclua senhas, tokens ou exportações financeiras completas nos anexos.
