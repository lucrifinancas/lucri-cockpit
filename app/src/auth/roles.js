// Papéis de usuário — espelha o CHECK da tabela `usuarios` no backend
// (server/src/db/migrations/0001_inicial.sql): master/analista são as duas
// variações de "equipe Lucri" (acesso a todos os clientes), cliente é o
// empresário-cliente (só os próprios dados). Master e analista têm o mesmo
// acesso de visualização; só master pode cadastrar cliente novo (onboarding).
export const ROLE_LABELS = {
  master: "Master",
  analista: "Analista",
  cliente: "Cliente",
};

export function isInternalRole(role) {
  return role === "master" || role === "analista";
}
