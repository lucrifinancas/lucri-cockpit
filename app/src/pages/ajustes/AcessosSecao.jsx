import { Fragment, useEffect, useState } from "react";
import { EnvelopeSimple, PaperPlaneTilt, UserPlus, Users, X } from "@phosphor-icons/react";
import { apiFetch } from "../../api/client";
import { useActiveClient } from "../../context/ClientContext";
import { ClienteAlvo, SecaoHeader } from "./comum";
import { useAuth } from '../../auth/AuthContext';
import { useConfirmLeave } from '../../hooks/usePendingChanges';
import ClientAvatar from '../../components/ClientAvatar';
import UsuarioPerfilEditor from './UsuarioPerfilEditor';

// Clientes → Acessos: quem já entra no Cockpit dessa empresa e convites
// pendentes. Convite = reserva o e-mail; na 1ª vez que a pessoa entra com
// Google usando esse e-mail, a conta "cliente" é criada sozinha.
export default function AcessosSecao({ icone }) {
  const { activeClientId } = useActiveClient();
  const { accessAs } = useAuth();
  const confirmLeave = useConfirmLeave();
  const [editing, setEditing] = useState(null);
  const [accessing, setAccessing] = useState(null);
  const [revision, setRevision] = useState(0);
  const [audit, setAudit] = useState(null);
  const [auditError, setAuditError] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [convites, setConvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelado = false;
    setLoading(true);
    setErro(null);
    Promise.all([apiFetch(`/api/clientes/${activeClientId}/usuarios`), apiFetch(`/api/clientes/${activeClientId}/convites`)])
      .then(([u, c]) => { if (!cancelado) { setUsuarios(u); setConvites(c); } })
      .catch((e) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setLoading(false));
    return () => { cancelado = true; };
  }, [activeClientId, revision]);

  useEffect(() => { setEditing(null); }, [activeClientId]);
  useEffect(() => {
    if (!activeClientId) return;
    let cancelled = false;
    setAudit(null); setAuditError(null);
    apiFetch(`/api/clientes/${activeClientId}/auditoria-acessos`).then(data => { if (!cancelled) setAudit(data); })
      .catch(error => { if (!cancelled) setAuditError(error.message); });
    return () => { cancelled = true; };
  }, [activeClientId, revision]);
  async function acessar(u) {
    if (!confirmLeave()) return;
    setEditing(null); setAccessing(u.id); setErro(null);
    try { await accessAs(u.id, activeClientId); }
    catch (error) { setErro(error.message); setAccessing(null); }
  }

  async function convidar(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    setErro(null);
    setSuccess(null);
    try {
      const novo = await apiFetch(`/api/clientes/${activeClientId}/convites`, { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setConvites((prev) => [...prev, novo]);
      setSuccess(`Acesso autorizado para ${novo.email}. Compartilhe o endereço do Cockpit e oriente a pessoa a entrar com Google usando esse e-mail. Nenhum e-mail foi enviado por este fluxo.`);
      setEmail("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar(id) {
    setErro(null);
    try {
      await apiFetch(`/api/clientes/${activeClientId}/convites/${id}`, { method: "DELETE" });
      setConvites((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setErro(err.message);
    }
  }

  const nomeCompleto = (u) => u.nome_exibicao || [u.nome, u.sobrenome].filter(Boolean).join(" ");

  return (
    <>
      <SecaoHeader icone={icone} titulo="Acessos" descricao="Quem do cliente consegue entrar no Cockpit para ver os próprios números.">
        <ClienteAlvo />
      </SecaoHeader>

      <section className="aj-card">
        <h3 className="aj-card-titulo"><Users size={18} aria-hidden="true" /> Usuários com acesso</h3>
        {loading && <p className="aj-hint">Carregando...</p>}
        {!loading && !erro && usuarios.length === 0 && <p className="aj-hint">Ninguém dessa empresa tem acesso ainda. Autorize um e-mail abaixo.</p>}
        <ul className="aj-lista">
          {usuarios.map((u) => (
            <Fragment key={u.id}>
            <li className="aj-pessoa aj-access-person">
              <ClientAvatar client={{ name: nomeCompleto(u) || u.email, logoUrl: u.avatar_url }} size={40} />
              <div className="aj-access-identity">
                <strong>{nomeCompleto(u) || u.email}</strong>
                {nomeCompleto(u) && <span className="aj-hint-inline">{u.email}</span>}
              </div>
              <div className="aj-access-actions">
                <button type="button" className="aj-btn-util" disabled={Boolean(accessing)} aria-expanded={editing === u.id} onClick={() => { if (confirmLeave()) setEditing(editing === u.id ? null : u.id); }}>Editar perfil</button>
                <button type="button" className="aj-btn-util" disabled={Boolean(accessing)} onClick={() => acessar(u)}>{accessing === u.id ? 'Abrindo…' : 'Acessar como usuário'}</button>
              </div>
              {editing === u.id && <UsuarioPerfilEditor key={u.id} usuario={u} onSaved={() => setRevision(v => v + 1)} />}
            </li>
            </Fragment>
          ))}
        </ul>
      </section>

      <section className="aj-card">
        <h3 className="aj-card-titulo"><UserPlus size={18} aria-hidden="true" /> Autorizar acesso</h3>
        <p className="aj-hint">O e-mail fica autorizado a entrar com Google, com perfil Cliente. Compartilhe o endereço do Cockpit com a pessoa: este fluxo não envia e-mail.</p>
        <form className="aj-form aj-form-linha" onSubmit={convidar}>
          <label className="aj-campo aj-campo-largo">
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" />
          </label>
          <div className="aj-form-acoes">
            <button type="submit" className="aj-btn-primario" disabled={enviando || !email.trim()}><PaperPlaneTilt size={15} aria-hidden="true" /> {enviando ? "Autorizando..." : "Autorizar e-mail"}</button>
          </div>
        </form>
        {erro && <p className="aj-hint aj-erro" role="alert">{erro}</p>}
        {success && <p className="aj-hint" role="status">{success}</p>}
        {convites.length > 0 && (
          <>
            <h4 className="aj-subtitulo">E-mails autorizados · aguardando primeiro acesso</h4>
            <ul className="aj-lista">
              {convites.map((c) => (
                <li key={c.id} className="aj-pessoa">
                  <EnvelopeSimple size={20} className="aj-pessoa-icone" aria-hidden="true" />
                  <span>{c.email}</span>
                  <button type="button" className="aj-btn-icone" onClick={() => cancelar(c.id)} aria-label={`Cancelar convite de ${c.email}`} title="Cancelar convite">
                    <X size={14} weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className="aj-card">
        <h3 className="aj-card-titulo">Histórico de acessos e perfis</h3>
        <p className="aj-hint">Últimos 50 eventos desta empresa. As fotos não são copiadas para o histórico.</p>
        {!audit && !auditError && <p className="aj-hint">Carregando histórico…</p>}
        {auditError && <p className="aj-hint aj-erro" role="alert">{auditError}</p>}
        {audit?.length === 0 && <p className="aj-hint">Nenhum evento registrado ainda.</p>}
        <ul className="aj-lista">{audit?.map(item => <li key={item.id} className="aj-access-event">
          <strong>{{ perfil_atualizado: 'Perfil atualizado', acesso_iniciado: 'Acesso como cliente iniciado', acesso_encerrado: 'Retorno ao administrador' }[item.acao]}</strong>
          <span>{item.usuario_email} · por {item.administrador_email}</span>
          <time dateTime={item.criado_em.replace(' ', 'T') + 'Z'}>{new Date(item.criado_em.replace(' ', 'T') + 'Z').toLocaleString('pt-BR')}</time>
        </li>)}</ul>
        {auditError && <button type="button" className="aj-btn-util" onClick={() => setRevision(v => v + 1)}>Tentar novamente</button>}
      </section>
    </>
  );
}
