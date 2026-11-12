import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import ProfileEditor from '../../components/ProfileEditor';

export default function UsuarioPerfilEditor({ usuario, onSaved }) {
  const [state, setState] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/admin/usuarios/${usuario.id}/perfil`).then(data => { if (!cancelled) setState({ data }); })
      .catch(error => { if (!cancelled) setState({ error: error.message }); });
    return () => { cancelled = true; };
  }, [usuario.id, attempt]);
  if (!state) return <p className="aj-hint" role="status">Carregando perfil…</p>;
  if (state.error) return <div><p className="aj-hint aj-erro" role="alert">{state.error}</p><button className="aj-btn-util" type="button" onClick={() => { setState(null); setAttempt(v => v + 1); }}>Tentar novamente</button></div>;
  return <div className="aj-access-editor"><h4 className="aj-subtitulo">Perfil de {usuario.email}</h4>
    <ProfileEditor initial={state.data} email={usuario.email}
      onSave={patch => apiFetch(`/api/admin/usuarios/${usuario.id}/perfil`, { method: 'PUT', body: JSON.stringify(patch) })} onSaved={onSaved} />
  </div>;
}
