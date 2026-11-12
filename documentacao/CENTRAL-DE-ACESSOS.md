# Central de acessos

Disponível somente para administradores em Ajustes → Administração → Central de acessos. A lista abrange todos os usuários e empresas, independentemente da seleção financeira do topo.

## Perfis

- Administrador (`master`): gerencia empresas, usuários e configurações.
- Equipe Lucri (`analista`): consulta as empresas e usa os recursos internos já permitidos ao analista; não gerencia usuários.
- Cliente (`cliente`): obrigatoriamente vinculado a uma empresa, acessa somente seus dados e PDFs.

O cadastro autoriza um e-mail normalizado e cria uma senha aleatória inutilizável. A pessoa pode entrar com Google usando o e-mail autorizado ou receber um link para definir uma senha. Criar uma conta não dispara e-mail automaticamente. Convites existentes da mesma empresa são consumidos ao preparar a conta; convites de outra empresa exigem cancelamento prévio para evitar atribuição acidental.

## Gerenciamento

Editar acesso permite mudar o perfil, trocar a empresa do cliente, desativar e reativar a conta. Mudanças de permissão incrementam a versão da sessão, encerrando as sessões anteriores e invalidando links de redefinição antigos. Contas desativadas são bloqueadas no login por senha, no Google, na recuperação de senha e nas sessões já emitidas. A visão assistida também recusa usuários desativados.

A própria conta administrativa não pode ser desativada nem ter suas permissões alteradas nessa central. Para isso é necessário outro administrador. A escrita também protege a existência de ao menos um administrador ativo. Edições usam controle de versão para rejeitar alterações sobre dados antigos.

Enviar redefinição de senha usa o Resend já configurado. O link vale por 60 minutos e só pode ser usado uma vez. Há limite de três pedidos por e-mail a cada 15 minutos, compartilhado com o fluxo Esqueci a senha. Somente o hash do token é armazenado; o token não é devolvido à central nem registrado nos logs. Nenhum envio real é executado nos testes automatizados: o provedor é simulado.

## Histórico e banco

A migração 0016 acrescenta `usuarios.ativo`, com padrão 1 para preservar os cadastros existentes, e cria `auditoria_usuarios`. A central prepara o esquema via vínculo D1 antes de usá-lo; a autenticação continua compatível com bancos que ainda não receberam a coluna. A inicialização verifica a coluna antes de alterá-la e tolera inicializações concorrentes.

Criação de contas e alteração de permissões são transacionais com o histórico. Registram ator, alvo, ação, horário, referência da requisição e permissões anterior/nova. Não registram senhas nem tokens. Os últimos 50 eventos aparecem no histórico da central.
