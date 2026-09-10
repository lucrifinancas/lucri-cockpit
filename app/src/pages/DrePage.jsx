import "../styles/page.css";

export default function DrePage() {
  return (
    <div className="page">
      <h1 className="page-title">DRE</h1>
      <p className="pending-notice">
        <strong>Em aberto:</strong> o backend já tem o endpoint pronto
        (<code>GET /api/clientes/:id/dre</code>), usando a estrutura oficial
        do Conta Azul (<code>entrada_dre</code> em cada categoria, configurada
        pelo contador da empresa) — falta só o front renderizar a tabela
        contábil hierárquica. Ver <code>API-CONTRACT.md</code>.
      </p>
    </div>
  );
}
