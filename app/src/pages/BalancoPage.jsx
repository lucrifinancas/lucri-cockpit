import "../styles/page.css";

export default function BalancoPage() {
  return (
    <div className="page">
      <h1 className="page-title">Balanço</h1>
      <p className="pending-notice">
        <strong>Em aberto:</strong> a estrutura exata do balanço patrimonial
        (quais linhas de ativo/passivo/patrimônio líquido, quantos níveis de
        subtotal) ainda não foi definida com o usuário. Provável candidata a um
        componente de tabela contábil hierárquica compartilhado com o DRE, em vez
        de cards soltos como as demais abas. Ver README.md da pasta
        <code> 10.DASH LUCRI</code>.
      </p>
    </div>
  );
}
