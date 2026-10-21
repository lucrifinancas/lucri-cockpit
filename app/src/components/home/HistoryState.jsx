export default function HistoryState({ loading, error, pending, partial, retry, children }) {
  if (loading) return <p className="section-empty" role="status" aria-busy="true">Carregando histórico mensal…</p>;
  if (error) return (
    <div className="pending-notice" role="alert">
      <p>Não foi possível carregar o histórico. Os valores estão indisponíveis.</p>
      <button type="button" onClick={retry}>Tentar novamente</button>
    </div>
  );
  if (pending) return (
    <div className="pending-notice" role="status">
      <p>O histórico ainda não foi calculado para esta empresa.</p>
      <button type="button" onClick={retry}>Consultar novamente</button>
    </div>
  );
  return <>
    {partial && <p className="section-empty">Histórico parcial: meses ainda não calculados aparecem sem valor. <button type="button" onClick={retry}>Atualizar histórico</button></p>}
    {children}
  </>;
}
