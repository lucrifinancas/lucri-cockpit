import { useEffect, useState } from "react";
import { EnvelopeSimple, PaperPlaneTilt, UserCircle, UserPlus, Users, X } from "@phosphor-icons/react";
import { apiFetch } from "../../api/client";
import { useActiveClient } from "../../context/ClientContext";
import { ClienteAlvo, SecaoHeader } from "./comum";

// Clientes → Acessos: quem já entra no Cockpit dessa empresa e convites
// pendentes. Convite = reserva o e-mail; na 1ª vez que a pessoa entra com
// Google usando esse e-mail, a conta "cliente" é criada sozinha.
export default function AcessosSecao({ icone }) {
  const { activeClientId } = useActiveClient();
  const [usuarios, setUsuarios] = useState([]);
  const [convites, setConvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

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
  }, [activeClientId]);

  async function convidar(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const novo = await apiFetch(`/api/clientes/${activeClientId}/convites`, { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setConvites((prev) => [...prev, novo]);
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

  const nomeCompleto = (u) => [u.nome, u.sobrenome].filter(Boolean).join(" ");

  return (
    <>
      <SecaoHeader icone={icone} titulo="Acessos" descricao="Quem do cliente consegue entrar no Cockpit para ver os próprios números.">
        <ClienteAlvo />
      </SecaoHeader>

      <section className="aj-card">
        <h3 className="aj-card-titulo"><Users size={18} aria-hidden="true" /> Usuários com acesso</h3>
        {loading && <p className="aj-hint">Carregando...</p>}
        {!loading && usuarios.length === 0 && <p className="aj-hint">Ninguém dessa empresa tem acesso ainda. Envie um convite abaixo.</p>}
        <ul className="aj-lista">
          {usuarios.map((u) => (
            <li key={u.id} className="aj-pessoa">
              <UserCircle size={32} weight="light" className="aj-pessoa-icone" aria-hidden="true" />
              <div>
                <strong>{nomeCompleto(u) || u.email}</strong>
                {nomeCompleto(u) && <span className="aj-hint-inline">{u.email}</span>}
              </div>
              <span className="aj-badge">Cliente</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="aj-card">
        <h3 className="aj-card-titulo"><UserPlus size={18} aria-hidden="true" /> Convidar usuário</h3>
        <p className="aj-hint">A pessoa entra com o Google usando este e-mail e a conta é criada na hora, com perfil Cliente — sem precisar de senha.</p>
        <form className="aj-form aj-form-linha" onSubmit={convidar}>
          <label className="aj-campo aj-campo-largo">
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" />
          </label>
          <div className="aj-form-acoes">
            <button type="submit" className="aj-btn-primario" disabled={enviando || !email.trim()}><PaperPlaneTilt size={15} aria-hidden="true" /> {enviando ? "Enviando..." : "Enviar convite"}</button>
          </div>
        </form>
        {erro && <p className="aj-hint aj-erro" role="alert">{erro}</p>}
        {convites.length > 0 && (
          <>
            <h4 className="aj-subtitulo">Convites pendentes</h4>
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
    </>
  );
}
