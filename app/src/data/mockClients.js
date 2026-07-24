// `logoUrl` fica null até o cliente mandar o arquivo real — enquanto isso,
// o header cai no fallback de avatar com iniciais (ver ClientAvatar.jsx).
// `tipo`: "servico" ou "produto" — guia o que aparece na Home (ex: cards de
// recorrência só fazem sentido pra quem cobra por assinatura/contrato).
export const MOCK_CLIENTS = [
  { id: "padaria-bomgosto", name: "Padaria Bom Gosto", tipo: "produto", logoUrl: null },
  { id: "estudio-marcia", name: "Estúdio Márcia Arquitetura", tipo: "servico", logoUrl: null },
  { id: "loja-vertt", name: "Vertt E-commerce", tipo: "produto", logoUrl: null },
];

export function getClientById(id) {
  return MOCK_CLIENTS.find((c) => c.id === id) ?? null;
}
