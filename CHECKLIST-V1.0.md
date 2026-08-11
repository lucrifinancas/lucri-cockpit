# Checklist — Lucri Cockpit v1.0

Consolidado em 11/08/2026 a partir de `DECISOES-E-ESCOPO.md`,
`DEMANDAS-PARA-FINALIZAR.md`, `CHECKLIST-FRONTEND.md` e do que foi resolvido
nesta sessão. v1.0 = as 8 abas do escopo fechado (`DECISOES-E-ESCOPO.md`)
funcionando com dado real: Home, Ajustes, Entradas, Saídas, Despesas, Caixa,
Balanço, DRE.

---

## ✅ Pronto

- [x] Auth completo (login, sessão, trocar senha, papéis master/analista/cliente)
- [x] Onboarding de cliente (cadastro, OAuth Conta Azul, criar login de cliente)
- [x] **HOME** 100% real: Entradas, Saídas, Despesas (total e por categoria),
  Contas vencidas, Inadimplência, Receitas x Despesas histórico, Resultado
  histórico, Vencidas por mês — só falta Saldo em Conta (ver pendências)
- [x] **AJUSTES**: perfil, trocar senha, tema, conexões Conta Azul por
  cliente, cards visíveis na Home, cadastro de cliente, categorias de
  despesa (marcação manual, só master)
- [x] Backend: entradas, saídas, despesas, caixa, home, categorias,
  historico-mensal — todos com dado real, regime de caixa
- [x] Erro 409 `conta_azul_desconectada` tratado com mensagem amigável (Home)
- [x] Bug de paginação do Conta Azul corrigido (listas > 10 itens)
- [x] Bug de regime de caixa corrigido (valor vs. valor_pago)

---

## 🔴 Bloqueadores de v1.0 (faltam decisão + implementação)

- [ ] **Estrutura do BALANÇO** — decidir linhas/subtotais (ativo circulante/
  não circulante, passivo, PL) antes de fixar layout ou construir endpoint
- [ ] **Estrutura do DRE** — decidir níveis de subtotal antes de fixar layout
  ou construir endpoint
- [ ] **Saldo em conta bancária** — `GET /conta-financeira` não traz saldo;
  confirmar com o Conta Azul se existe em outro endpoint ou se precisa ser
  calculado (somar lançamentos por conta)

## 🟡 Telas que existem mas não estão roteadas/finalizadas

- [ ] **ENTRADAS** — página já busca dado real (`useFinanceData`), mas não
  está roteada em `App.jsx` (ainda cai em `UnderConstructionPage`). Revisar
  layout e rotear.
- [ ] **SAÍDAS** — mesma situação de ENTRADAS: dado real pronto, falta
  rotear e revisar layout.
- [ ] **DESPESAS** — só existe como cards na Home hoje; não tem página
  própria com tabela de lançamentos (padrão de ENTRADAS/SAÍDAS).
- [ ] **CAIXA** — endpoint pronto (`/caixa`), página não existe/roteada.

## 🟢 Configuração pendente (não é código, é ação manual)

- [ ] **Marcar categorias de Despesa por cliente** — o backend/front estão
  prontos, mas ninguém marcou nenhuma categoria ainda pra nenhum cliente
  (Ajustes → Categorias de Despesa). Sem isso, Despesas aparece zerada.
  Fazer pelo menos pra Nick Publicidade.
- [ ] **Deploy automático do backend (CI/CD)** — hoje é manual
  (`wrangler deploy` local), e dois devs deployando em paralelo sem avisar
  já causou uma rota sumir do ar nesta sessão (quem deploya por último
  "vence", mesmo com código desatualizado). Configurar GitHub Actions pra
  deployar o `server/` a partir do push no `main`, igual o front já faz
  com Cloudflare Pages — ou pelo menos combinar "sempre `git pull` antes
  de `wrangler deploy`" como regra da equipe.
- [ ] **Limpar cliente de teste** — "Cliente Teste Playwright" (id 3) ficou
  no banco de produção desde o teste de integração de 06/08, sem conexão
  Conta Azul. Decidir se apaga ou deixa (aparece na lista de clientes pra
  quem for master/analista).

## ⚪ Fora de escopo v1.0 / adiado (não bloqueia)

- [ ] Esqueci minha senha por e-mail (ver `GUIA-MAKE-RESET-SENHA.md`) —
  troca de senha estando logado já existe
- [ ] Token do Conta Azul intermitente (Nick Publicidade) — já teve episódio
  antes, se resolveu sozinho; 409 tratado no front se acontecer de novo

---

## Referência

- Escopo fechado: `DECISOES-E-ESCOPO.md`
- Contrato de API: `API-CONTRACT.md`
- Histórico de bugs achados: `RELATORIO-BUGS-BACKEND-2026-08-11.md`
- Regras Conta Azul (competência/caixa/extrato): `RESUMO-DOCUMENTACAO-CONTAAZUL-2026-08-11.md`
