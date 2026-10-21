export function categoryProgress(categories) {
  const financial = categories.filter((item) => ['DESPESA', 'RECEITA'].includes(item.tipo));
  const classified = financial.filter((item) => (item.tipo === 'RECEITA' ? item.mae_receita_id : item.mae_id) != null).length;
  return { total: financial.length, classified, complete: financial.length > 0 && classified === financial.length };
}

export function onboardingSteps(client, categories = null) {
  const progress = categories === null ? null : categoryProgress(categories);
  return [
    { id: 'cadastro', label: 'Cadastro', complete: true, status: 'Empresa cadastrada' },
    { id: 'integracoes', label: 'Conexão', complete: Boolean(client.conta_azul_conectado), status: client.conta_azul_conectado ? 'Conexão cadastrada; consulte os dados para verificar o acesso' : 'Conecte a conta do cliente ao Conta Azul' },
    { id: 'categorias', label: 'Categorias', complete: Boolean(progress?.complete), status: progress ? `${progress.classified} de ${progress.total} categorias financeiras classificadas` : 'Classificação ainda não verificada' },
    { id: 'acessos', label: 'Acesso', complete: client.usuarios > 0, status: client.usuarios > 0 ? `${client.usuarios} usuário(s) com acesso` : client.convites > 0 ? 'E-mail autorizado; aguardando primeiro acesso com Google' : 'Autorize o e-mail do cliente' },
  ];
}
