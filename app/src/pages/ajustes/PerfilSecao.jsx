import { usePendingChanges } from "../../hooks/usePendingChanges";
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
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [profileError, setProfileError] = useState(null);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const avatarRef = useRef(null);

  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [senhaMsg, setSenhaMsg] = useState(null);
  const [senhaErro, setSenhaErro] = useState(null);
  const [trocando, setTrocando] = useState(false);
  const papel = ROLE_LABELS[user?.papel] ?? user?.papel;

  const dirty = nome.trim() !== profile.name || avatarUrl !== profile.avatarUrl;
  usePendingChanges(dirty || Boolean(atual || nova || confirma), trocando || readingPhoto);

  function trocarFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileError(null);
    setSalvo(false);
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setProfileError("Escolha uma imagem de até 2 MB.");
      e.target.value = "";
      return;
    }
    setReadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => { setAvatarUrl(reader.result); setReadingPhoto(false); };
    reader.onerror = () => { setProfileError("Não foi possível ler a imagem. Tente novamente."); setReadingPhoto(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function salvarPerfil(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setProfileError(null);
    setSalvo(false);
    try {
      profile.save({ name: nome.trim(), avatarUrl });
      setNome(nome.trim());
      setSalvo(true);
    } catch {
      setProfileError("Não foi possível salvar neste navegador. Verifique o espaço disponível ou as permissões de armazenamento e tente novamente.");
    }
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
      <SecaoHeader icone={icone} titulo="Meu perfil" descricao="Seu nome de exibição e foto aparecem na barra de cima do Cockpit e ficam salvos somente neste navegador." />

      <section className="aj-card">
        <div className="aj-perfil-topo">
          <ClientAvatar client={{ name: nome || profile.name, logoUrl: avatarUrl }} size={64} />
          <div className="aj-perfil-id">
            <strong>{profile.name}</strong>
            <span className="aj-badge">{papel}</span>
          </div>
          <button type="button" className="aj-btn-util" disabled={readingPhoto} onClick={() => avatarRef.current?.click()}><Camera size={15} aria-hidden="true" /> Alterar foto</button>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={trocarFoto} />
        </div>

        <h3 className="aj-card-titulo"><IdentificationCard size={18} aria-hidden="true" /> Dados pessoais</h3>
        <p className="aj-hint">Nome e foto são preferências deste navegador. Clique em Salvar neste navegador para aplicar os dois. A troca de senha é feita na sua conta.</p>
        <form className="aj-form" onSubmit={salvarPerfil}>
          <label className="aj-campo">
            Nome
            <input value={nome} onChange={(e) => { setNome(e.target.value); setSalvo(false); }} placeholder="Seu nome" />
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
            <button type="submit" className="aj-btn-primario" disabled={!dirty || !nome.trim() || readingPhoto}>Salvar neste navegador</button>
          </div>
        </form>
        {salvo && <p className="aj-hint aj-ok" role="status">Nome e foto salvos neste navegador.</p>}
        {dirty && <p className="aj-hint">Há alterações de perfil não salvas.</p>}
        {profileError && <p className="aj-hint aj-erro" role="alert">{profileError}</p>}
      </section>

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
    </>
  );
}
