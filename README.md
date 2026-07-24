# Lucri Cockpit

Painel financeiro da Lucri Finanças Corporativas — o cockpit onde o
empresário enxerga a saúde financeira do negócio e toma decisões, sem
depender de planilha ou achismo.

## Sobre a Lucri

A Lucri é uma empresa de finanças corporativas que atua como o braço
direito do empresário, ajudando micro, pequenas e médias empresas a
entenderem seus números, organizarem seus processos e tomarem decisões
com segurança — através de **BPO Financeiro**, **Controladoria** e
**Consultoria**.

- Instagram: [@lucrifinancas](https://instagram.com/lucrifinancas)
- Todos os links: [linktr.ee/lucrifinancas](https://linktr.ee/lucrifinancas)

## Sobre o projeto

O Lucri Cockpit centraliza receitas, despesas e caixa dos clientes
atendidos pela Lucri num só painel, alimentado pela API do Conta Azul.

**Dois públicos, um produto:**
- **Visão interna (equipe Lucri)** — acompanha todos os clientes atendidos.
- **Visão do cliente final** — cada empresário-cliente loga e vê só os
  próprios números.

O projeto nasceu como protótipo funcional (front construído com dado
mockado no formato real da API do Conta Azul, já documentado), evoluindo
em ciclos curtos direto com o usuário — cada tela passou por validação
visual antes de seguir pra próxima. O backend está sendo construído em
paralelo, consumindo o mesmo contrato de dados.

## Stack

- **Front:** React + Vite (SPA), hospedado no Cloudflare Pages.
- **Back:** Cloudflare Workers + D1 — ver `DIRETRIZES-BACKEND.md`.
- **Fonte de dados:** API do Conta Azul (OAuth), 1 conexão por cliente.

## Rodando localmente

```bash
cd app
npm install
npm run dev
```

## Desenvolvido por

- **Augusto Furtado** — Frontend
- **Diogo Carvalho** — Backend

## Documentação técnica

- `DECISOES-E-ESCOPO.md` — decisões fechadas e pendências do produto.
- `DIRETRIZES-FRONTEND.md` — guia pro dev de frontend.
- `DIRETRIZES-BACKEND.md` — guia pro dev de backend.
- `DADOS-CONTA-AZUL-API.md` — levantamento real da API do Conta Azul.
- `LUCRI COCKPIT/` — identidade visual e racional do nome do produto.

Não confundir com o dashboard de métricas de redes sociais
(`4.DASHBOARD/2.0/`) — são projetos separados, sem código compartilhado.
