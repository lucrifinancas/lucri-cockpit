import { useRef, useState } from "react";
import { Camera, IdentificationCard, Lock } from "@phosphor-icons/react";
import { useAuth } from "../../auth/AuthContext";
import { ROLE_LABELS } from "../../auth/roles";
import { useLocalProfile } from "../../hooks/useLocalProfile";
import ClientAvatar from "../../components/ClientAvatar";
import { SecaoHeader } from "./comum";

// Minha conta → Perfil: dados pessoais e, separado, a troca de senha.
export default function PerfilSecao({ icone }) {
  const { user, alterarSenha } = useAuth();
  const profile = useLocalProfile(user?.email);
  const [nome, setNome] = useState(profile.name);
  const [salvo, setSalvo] = useState(false);
  const avatarRef = useRef(null);

  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [senhaMsg, setSenhaMsg] = useState(null);
  const [senhaErro, setSenhaErro] = useState(null);
  const [trocando, setTrocando] = useState(false);
  const papel = ROLE_LABELS[user?.papel] ?? user?.papel;

  function trocarFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => profile.save({ name: nome, avatarUrl: reader.result });
    reader.readAsDataURL(file);
  }

  function salvarPerfil(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    profile.save({ name: nome.trim() });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

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
    <>
      <SecaoHeader icone={icone} titulo="Meu perfil" descricao="Seu nome e foto aparecem na barra de cima do Cockpit." />

      <section className="aj-card">
        <div className="aj-perfil-topo">
          <ClientAvatar client={{ name: nome || profile.name, logoUrl: profile.avatarUrl }} size={64} />
          <div className="aj-perfil-id">
            <strong>{profile.name}</strong>
            <span className="aj-badge">{papel}</span>
          </div>
          <button type="button" className="aj-btn-util" onClick={() => avatarRef.current?.click()}><Camera size={15} aria-hidden="true" /> Alterar foto</button>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={trocarFoto} />
        </div>

        <h3 className="aj-card-titulo"><IdentificationCard size={18} aria-hidden="true" /> Dados pessoais</h3>
        <form className="aj-form" onSubmit={salvarPerfil}>
          <label className="aj-campo">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
          </label>
          <label className="aj-campo">
            E-mail
            <input value={user?.email ?? ""} readOnly aria-readonly="true" />
          </label>
          <label className="aj-campo">
            Perfil de acesso
            <input value={papel ?? ""} readOnly aria-readonly="true" />
          </label>
          <div className="aj-form-acoes">
            <button type="submit" className="aj-btn-primario">{salvo ? "Salvo!" : "Salvar alterações"}</button>
          </div>
        </form>
      </section>

      <section className="aj-card">
        <h3 className="aj-card-titulo"><Lock size={18} aria-hidden="true" /> Segurança</h3>
        <p className="aj-hint">Troque a senha de entrada no Cockpit. Mínimo de 8 caracteres.</p>
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
    </>
  );
}
