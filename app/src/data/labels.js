// Apenas apresentação: preserva os nomes e IDs recebidos da API.
export function categoryLabel(value) {
  return value === 'Sem mãe' || value === 'Sem categoria' ? 'Não classificado' : value;
}
