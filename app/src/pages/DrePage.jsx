import "../styles/page.css";

export default function DrePage() {
  return (
    <div className="page">
      <h1 className="page-title">DRE</h1>
      <p className="pending-notice">
        <strong>Em aberto:</strong> a estrutura exata do demonstrativo de
        resultado (quais linhas, quantos níveis de subtotal — receita bruta,
        deduções, custo, despesas fixas/variáveis, resultado operacional etc.)
        ainda não foi definida com o usuário, e depende também de como
        Despesas vai categorizar fixo/variável. Ver README.md da pasta
        <code> 10.DASH LUCRI</code>.
      </p>
    </div>
  );
}
