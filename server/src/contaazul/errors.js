// Erro específico pra quando a conexão de um cliente com o Conta Azul não
// pode mais ser renovada (refresh_token inválido/revogado) — precisa de
// nova autorização (onboarding de novo), não é um erro genérico de servidor.
export class ContaAzulDesconectadaError extends Error {
  constructor(clienteId) {
    super(`Conexão do cliente ${clienteId} com o Conta Azul não pôde ser renovada.`);
    this.name = "ContaAzulDesconectadaError";
  }
}
