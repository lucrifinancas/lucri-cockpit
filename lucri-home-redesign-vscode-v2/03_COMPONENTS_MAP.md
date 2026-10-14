# Mapa de componentes

## Reutilizar primeiro

Verificar antes:
- `StatCard`
- `DataTable`
- `PeriodSelector`
- `ClientAvatar`
- `ComparisonBarChart`
- `HistoryBarChart`
- `HorizontalBarChart`
- `ProportionDonut`
- `chartUtils.js`

## Componentes sugeridos

Criar apenas se não houver equivalente.

### `FinancialHealthCard`
Props sugeridas:
- `score`
- `status`
- `summary`
- `metrics`
- `periodLabel`
- `isLoading`

### `ProgressSummaryCard`
Pode ser genérico para pagar/receber.

Props:
- `title`
- `primaryLabel`
- `primaryValue`
- `secondaryLabel`
- `secondaryValue`
- `total`
- `percentage`
- `tone`

### `InsightsCard`
Props:
- `items`

Cada item:
```js
{
  id,
  tone: 'good' | 'bad' | 'info' | 'warning',
  text
}
```

### `EmptyMetricState`
Props:
- `title`
- `value`
- `message`
- `icon`
- `action`

## Não criar

- um segundo sistema de cards;
- um segundo sistema de gráficos;
- componentes exclusivos para `master` e `cliente`;
- CSS com cores hardcoded;
- wrappers desnecessários para cada métrica.
