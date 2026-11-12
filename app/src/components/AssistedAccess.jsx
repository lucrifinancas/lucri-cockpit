import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useConfirmLeave } from '../hooks/usePendingChanges';
import './AssistedAccess.css';

export default function AssistedAccess({ expired = false }) {
  const { user, returnToAdmin } = useAuth();
  const confirmLeave = useConfirmLeave();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function voltar() {
    if (!confirmLeave()) return;
    setBusy(true); setError(null);
    try { await returnToAdmin(); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return <aside className="assisted-access" aria-label="Acesso como cliente">
    <div><strong>{expired ? 'O acesso como cliente expirou ou foi encerrado.' : `Você está acessando como ${user.email}`}</strong>
      <p>{expired ? 'Volte à sua conta para continuar.' : 'Permissões do cliente · Nome e foto são salvos na conta dele · Duração de 30 minutos'}</p>
      {error && <p role="alert">{error}</p>}
    </div>
    <button type="button" className="aj-btn-util" disabled={busy} onClick={voltar}>{busy ? 'Voltando…' : 'Voltar ao administrador'}</button>
  </aside>;
}
