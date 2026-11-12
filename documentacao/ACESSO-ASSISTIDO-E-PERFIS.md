# Perfis na conta e acesso como cliente

Em Ajustes → Acessos, o administrador escolhe uma empresa e encontra os usuários cliente já cadastrados. Cada usuário oferece Editar perfil e Acessar como usuário. Convites que ainda aguardam primeiro acesso não representam uma conta cadastrada.

Nome e foto são gravados no D1, na tabela usuario_perfis, separados do cadastro de autenticação. O administrador edita o perfil diretamente ou abre a visão do cliente para configurar Meu perfil. O próprio cliente também pode editar seu perfil. As antigas preferências locais não são importadas automaticamente; o formulário passa a salvar na conta.

A foto é convertida no navegador para JPEG com até 256 pixels no maior lado. A API aceita somente dados JPEG/PNG com assinatura correspondente e até 128 KiB; rejeita SVG e URLs externas. Nome tem limite de 100 caracteres. Não há mudança de e-mail, senha ou vínculo de empresa por esse formulário.

## Acesso como cliente

Somente master pode iniciar a visão, e o alvo precisa ter papel cliente e empresa vinculada. Contas da equipe não podem ser assumidas por esse fluxo. A sessão original é preservada; um segundo cookie HttpOnly assinado define a visão por 30 minutos. Cada requisição valida o administrador original, sua versão de sessão, o usuário alvo, seu papel e sua versão de sessão. As permissões e o vínculo financeiro são os do cliente. Uma visão inválida ou expirada não recupera silenciosamente privilégios administrativos.

A faixa identifica a conta em uso e oferece Voltar ao administrador. A troca de senha fica bloqueada na interface e na API durante a visão. Sair encerra ambos os cookies. O retorno funciona mesmo depois de expirar a visão, desde que a sessão original ainda seja válida. A seleção da empresa é restaurada quando o armazenamento de sessão está disponível. Como os cookies são compartilhados, a visão também se aplica às outras abas desse navegador; recarregue abas antigas para atualizar a interface.

## Histórico

A tabela auditoria_acessos registra ator real, usuário alvo, empresa, ação, request ID e horário. O salvamento do perfil e seu registro são transacionais: se o log falhar, o perfil não é alterado. O histórico guarda nomes anterior/novo e um indicador de troca da foto, sem duplicar os bytes da imagem. Acessos iniciados e retornos ativos são registrados; o término automático após 30 minutos é determinado pela expiração do token. Os últimos 50 eventos de cada empresa aparecem em Acessos, somente para master.

A migração 0015 é aditiva e idempotente. As rotas também preparam o mesmo esquema via vínculo D1, sem ampliar permissões do token de deploy.
