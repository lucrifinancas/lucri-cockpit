import "../styles/page.css";

export default function FinanceDataState({ title, loading, error, retry, awaitingClient }) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      {awaitingClient ? (
        <p className="pending-notice" role="status">Selecione uma empresa para consultar os dados.</p>
      ) : error ? (
        <div className="pending-notice" role="alert">
          <p>Não foi possível carregar os dados financeiros. Os valores estão indisponíveis.</p>
          <button type="button" onClick={retry}>Tentar novamente</button>
        </div>
      ) : loading ? (
        <div role="status" aria-live="polite" aria-busy="true">
          <p>Carregando dados financeiros…</p>
          <div className="skeleton-row" aria-hidden="true">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
