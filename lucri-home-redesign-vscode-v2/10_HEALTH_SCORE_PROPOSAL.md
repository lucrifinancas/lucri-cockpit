# Proposta de score de Saúde Financeira

Esta é uma proposta v1, não uma métrica contábil oficial.

## Objetivo

Transformar múltiplos sinais em um indicador simples para leitura do empresário.

## Componentes

### 1. Resultado — peso 35
Se resultado >= 0:
- score = 100

Se negativo:
- penalizar proporcionalmente à receita;
- limitar mínimo em 0.

Exemplo conceitual:
`100 - min(abs(resultado) / receita * 200, 100)`

### 2. Cobertura de saldo — peso 25
`saldo / despesas`

- >= 1.0 = 100
- >= 0.5 = 75
- >= 0.25 = 50
- > 0 = 25
- <= 0 = 0

### 3. Inadimplência — peso 20
- 0% = 100
- <= 5% = 80
- <= 10% = 60
- <= 20% = 30
- > 20% = 0

### 4. Contas vencidas — peso 20
Se `contas_vencidas == 0`:
- 100

Caso contrário, comparar vencidas com total a receber.

## Resultado final

`score = resultado*0.35 + cobertura*0.25 + inadimplencia*0.20 + vencidas*0.20`

Arredondar para inteiro.

## Faixas

- 80–100: Boa
- 60–79: Atenção
- 0–59: Crítica

## Observação

Manter a fórmula isolada em helper para permitir revisão futura sem refatorar o componente.
