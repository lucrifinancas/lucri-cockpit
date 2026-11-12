import { useState } from 'react';
import { Lock } from '@phosphor-icons/react';
import { useAuth } from '../../auth/AuthContext';
import { useLocalProfile } from '../../hooks/useLocalProfile';
import { usePendingChanges } from '../../hooks/usePendingChanges';
import ProfileEditor from '../../components/ProfileEditor';
import { SecaoHeader } from './comum';

export default function PerfilSecao({ icone }) {
  const { user } = useAuth();
  const profile = useLocalProfile(user?.email);
  return <>
    <SecaoHeader icone={icone} titulo="Meu perfil" descricao="Configure o nome e a foto da sua conta." />
    <section className="aj-card">
      {profile.loading ? <p className="aj-hint" role="status">Carregando perfil…</p> : profile.error ? <>
        <p className="aj-hint aj-erro" role="alert">{profile.error}</p><button type="button" className="aj-btn-util" onClick={profile.retry}>Tentar novamente</button>
      </> : <ProfileEditor key={user.email} initial={{ name: profile.name, avatarUrl: profile.avatarUrl }} email={user.email} onSave={profile.save} />}
    </section>
    {user.acesso_assistido ? <p className="aj-hint">A troca de senha não está disponível durante o acesso como cliente.</p> : <Senha />}
  </>;
}
function Senha() {
  const { alterarSenha } = useAuth();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');
  const [senhaMsg, setSenhaMsg] = useState(null);
  const [senhaErro, setSenhaErro] = useState(null);
  const [trocando, setTrocando] = useState(false);
  usePendingChanges(Boolean(atual || nova || confirma), trocando);
  async function trocarSenha(e) {
    e.preventDefault();
    setSenhaMsg(null);
    setSenhaErro(null);
    if (nova !== confirma) {
      setSenhaErro("A confirmação não bate com a nova senha.");
      return;
    }
    setTrocando(true);
    try {
      await alterarSenha({ senhaAtual: atual, senhaNova: nova });
      setSenhaMsg("Senha alterada com sucesso.");
      setAtual("");
      setNova("");
      setConfirma("");
    } catch (err) {
      setSenhaErro(err.message);
    } finally {
      setTrocando(false);
    }
  }

  return (
      <section className="aj-card">
        <h3 className="aj-card-titulo"><Lock size={18} aria-hidden="true" /> Segurança</h3>
        <p className="aj-hint">Troque a senha de entrada no Cockpit. Mínimo de 8 caracteres. Essa alteração vale para a conta e encerra as sessões anteriores.</p>
        <form className="aj-form" onSubmit={trocarSenha}>
          <label className="aj-campo">
            Senha atual
            <input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" />
          </label>
          <label className="aj-campo">
            Nova senha
            <input type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" />
          </label>
          <label className="aj-campo">
            Confirmar nova senha
            <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
          </label>
          <div className="aj-form-acoes">
            <button type="submit" className="aj-btn-primario" disabled={trocando || !atual || !nova}>
              {trocando ? "Trocando..." : "Trocar senha"}
            </button>
          </div>
        </form>
        {senhaMsg && <p className="aj-hint aj-ok" role="status">{senhaMsg}</p>}
        {senhaErro && <p className="aj-hint aj-erro" role="alert">{senhaErro}</p>}
      </section>
  );
}
