# Arquivos que provavelmente serão tocados

Esta lista é orientação, não obrigação.

## Prováveis

- `app/src/pages/Home*.jsx`
- CSS específico da Home, se já existir
- `app/src/components/StatCard.jsx`
- `app/src/components/charts/*` apenas se a melhoria for genérica
- `app/src/hooks/useFinanceData*`
- `app/src/hooks/useHistoricoMensal*`
- `app/src/data/financialHealth.js` (novo helper possível)
- `app/src/data/homeInsights.js` (novo helper possível)

## Evitar tocar

- `App.jsx`
- `auth/*`
- `context/ClientContext.jsx`
- `context/PeriodContext.jsx`
- `api/client.js`
- rotas
- páginas não relacionadas

Só alterar esses arquivos se houver necessidade real e documentada.
