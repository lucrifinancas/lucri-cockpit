import { Link } from 'react-router-dom';
import PublicPage from './PublicPage';
import { privacyContact } from './privacyContact';

export default function PrivacidadePage(){
 return <PublicPage title="Privacidade e cookies" description="Saiba quais informações o Lucri Cockpit utiliza para permitir o acesso, apresentar seus dados financeiros e manter a segurança da conta.">
  <p className="public-updated">Atualizado em 13 de novembro de 2026.</p>
  <section><h2>Quem opera o Cockpit</h2><p>O Lucri Cockpit é disponibilizado pela {privacyContact.organization} para a equipe e para usuários autorizados das empresas atendidas.</p>
   {privacyContact.taxId&&<p>CNPJ: {privacyContact.taxId}.</p>}
   <p>A empresa atendida fornece ou autoriza o acesso aos dados financeiros apresentados no serviço. O tratamento desses dados também considera o serviço contratado e as responsabilidades de cada parte.</p>
  </section>
  <section><h2>Informações utilizadas</h2><ul>
   <li><strong>Conta e perfil:</strong> nome, e-mail, foto opcional, perfil de acesso e empresa vinculada. As senhas são armazenadas como resumos criptográficos, e não como texto legível.</li>
   <li><strong>Dados financeiros:</strong> lançamentos, categorias, saldos e históricos obtidos da integração com o Conta Azul. Podem incluir nomes e informações de pessoas que constam nesses registros.</li>
   <li><strong>Relatórios:</strong> PDFs disponibilizados pela equipe para cada empresa e informações sobre o envio desses arquivos.</li>
   <li><strong>Segurança e suporte:</strong> referências de erro, operações realizadas, versões da aplicação e histórico de alterações de categorias, perfis e permissões.</li>
  </ul><p>Essas informações permitem prestar o serviço, organizar o acesso por empresa, manter a segurança e investigar falhas. A infraestrutura também processa informações técnicas necessárias à conexão.</p></section>
  <section><h2>Cookies necessários ao acesso</h2><p>Os cookies do Cockpit mantêm sua autenticação e protegem os fluxos de entrada. Eles não oferecem uma opção de recusa que permita continuar usando a mesma sessão autenticada: se forem bloqueados ou apagados, pode ser necessário entrar novamente.</p>
   <div className="public-table-scroll" role="region" aria-label="Cookies de autenticação" tabIndex={0}><table><thead><tr><th scope="col">Finalidade</th><th scope="col">Duração</th></tr></thead><tbody>
    <tr><td>Manter a sessão de entrada</td><td>Até 7 dias, sujeito a encerramento ou revogação.</td></tr>
    <tr><td>Validar a etapa de entrada com Google, quando escolhida</td><td>Até 10 minutos.</td></tr>
    <tr><td>Identificar a visão temporária de um cliente pelo administrador</td><td>A autorização vale por até 30 minutos. O marcador pode permanecer até o retorno ao administrador ou fechamento da sessão do navegador.</td></tr>
   </tbody></table></div>
   <p>O código desta versão não instala cookies de publicidade nem integra ferramentas de anúncios. Os registros de erros e de alterações descritos neste aviso têm finalidade operacional e de segurança.</p>
  </section>
  <section><h2>Preferências no navegador</h2><p>O navegador pode guardar o tema claro ou escuro, o período escolhido e as preferências dos indicadores da visão geral. Durante o acesso como cliente, também pode guardar qual empresa estava selecionada para facilitar o retorno do administrador.</p><p>Essas preferências são separadas da senha e do cookie de autenticação. O nome e a foto do perfil são salvos na conta, para aparecerem em outros dispositivos.</p></section>
  <section><h2>Acesso da equipe e serviços utilizados</h2><p>Usuários cliente consultam os dados e PDFs da própria empresa. A equipe Lucri recebe permissões conforme seu perfil. O administrador pode abrir uma visão temporária do cliente para suporte e configuração; a interface identifica esse acesso e os eventos são registrados.</p><ul>
   <li><strong>Cloudflare:</strong> hospedagem, armazenamento e infraestrutura do Cockpit.</li>
   <li><strong>Conta Azul:</strong> origem dos dados financeiros da integração autorizada.</li>
   <li><strong>Google:</strong> autenticação quando você escolhe entrar com Google e fornecimento das fontes visuais carregadas pela aplicação.</li>
   <li><strong>Resend:</strong> envio dos e-mails de redefinição de senha, quando solicitados.</li>
  </ul><p>Os serviços envolvidos podem processar dados fora do Brasil, conforme sua infraestrutura e as condições aplicáveis ao serviço.</p></section>
  <section><h2>Por quanto tempo os registros ficam disponíveis</h2><p>Os registros de erros têm limpeza programada após 30 dias; o histórico de alterações de categorias, após 365 dias. Dados de conta, relatórios e históricos de acesso e administração não são apagados automaticamente ao desativar uma conta.</p><p>A necessidade de manter ou excluir esses dados deve ser avaliada conforme o serviço contratado, os pedidos recebidos e as obrigações aplicáveis. Desativar o acesso impede novos logins, mas não equivale a solicitar a exclusão dos dados.</p></section>
  <section><h2>Seus pedidos sobre dados pessoais</h2><p>Você pode pedir informações sobre o uso dos seus dados, acesso e correção, além de solicitar a análise de bloqueio ou exclusão e exercer os demais direitos previstos na LGPD. O atendimento considera sua identificação e as condições legais aplicáveis a cada pedido.</p>
   {privacyContact.email?<p>Entre em contato com {privacyContact.organization}: <a href={`mailto:${privacyContact.email}`}>{privacyContact.email}</a>. Não envie senhas, códigos de verificação nem links de redefinição.</p>:<p>Para tratar de dados da sua empresa, utilize o canal de atendimento já combinado com a equipe Lucri. Não envie senhas, códigos de verificação nem links de redefinição.</p>}
   <p>Consulte também as <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares" target="_blank" rel="noopener noreferrer">orientações da ANPD sobre os direitos dos titulares</a>.</p>
  </section>
  <section><h2>Precisa de ajuda para entrar?</h2><p>Veja a <Link to="/ajuda">Ajuda do Cockpit</Link> para primeiro acesso, senha, Google, relatórios e problemas de conexão.</p></section>
 </PublicPage>;
}
