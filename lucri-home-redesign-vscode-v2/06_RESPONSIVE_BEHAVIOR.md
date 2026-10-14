# Responsividade

## Desktop amplo
- 6 KPIs em uma linha, se couber sem compressão.
- Saúde financeira + pagar + receber na mesma faixa.
- Histórico mensal em grid 60/40 ou 1fr/1fr conforme o componente.
- Categorias lado a lado.
- Top gastos + insights lado a lado.

## Desktop médio
- KPIs em 3 colunas.
- Saúde financeira ocupa largura total.
- Pagar e receber lado a lado.
- Gráficos históricos empilhados se necessário.

## Tablet
- 2 KPIs por linha.
- cards grandes em uma coluna.
- donuts podem empilhar legenda abaixo.

## Mobile
- 1 KPI por linha ou carrossel apenas se o Design System já tiver padrão para isso.
- evitar tabelas horizontais.
- gráficos com altura reduzida.
- insights em lista simples.

## Regra

Não introduzir breakpoints arbitrários se `page.css` ou o Design System já definem uma estratégia.
