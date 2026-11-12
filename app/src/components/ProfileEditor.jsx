import { useRef, useState } from 'react';
import { Camera } from '@phosphor-icons/react';
import ClientAvatar from './ClientAvatar';
import { usePendingChanges } from '../hooks/usePendingChanges';

export default function ProfileEditor({ initial, email, onSave, onSaved }) {
  const [baseline, setBaseline] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const input = useRef(null);
  const dirty = name.trim() !== baseline.name || avatarUrl !== baseline.avatarUrl;
  usePendingChanges(dirty, busy || reading);
  async function photo(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null); setSaved(false);
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Escolha uma foto JPEG, PNG ou WebP de até 5 MB.'); return;
    }
    setReading(true);
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const ratio = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      setAvatarUrl(canvas.toDataURL('image/jpeg', 0.86));
    } catch { setError('Não foi possível abrir essa foto. Tente outra imagem.'); }
    finally { bitmap?.close(); setReading(false); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(null); setSaved(false);
    try {
      const data = await onSave({ name: name.trim(), avatarUrl });
      setBaseline(data); setName(data.name); setAvatarUrl(data.avatarUrl); setSaved(true);
      onSaved?.(data);
    } catch (err) { setError(err.message || 'Não foi possível salvar o perfil. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <form className="aj-form aj-profile-form" onSubmit={save}>
    <div className="aj-perfil-topo">
      <ClientAvatar client={{ name, logoUrl: avatarUrl }} size={64} />
      <div className="aj-profile-photo-actions">
        <button type="button" className="aj-btn-util" disabled={busy || reading} onClick={() => input.current?.click()}><Camera size={16} aria-hidden="true" />{reading ? 'Preparando foto…' : 'Alterar foto'}</button>
        {avatarUrl && <button type="button" className="aj-btn-util" disabled={busy || reading} onClick={() => { setAvatarUrl(null); setSaved(false); }}>Remover foto</button>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={photo} />
    </div>
    <p className="aj-hint">Nome e foto ficam salvos na conta e aparecem em todos os dispositivos.</p>
    <label className="aj-campo">Nome<input required maxLength={100} value={name} disabled={busy} onChange={e => { setName(e.target.value); setSaved(false); }} autoComplete="name" /></label>
    <label className="aj-campo">E-mail<input value={email} readOnly /></label>
    <div className="aj-form-acoes"><button className="aj-btn-primario" type="submit" disabled={!dirty || !name.trim() || busy || reading}>{busy ? 'Salvando…' : 'Salvar perfil'}</button></div>
    {dirty && <p className="aj-hint">Há alterações de perfil não salvas.</p>}
    {saved && <p className="aj-hint aj-ok" role="status">Perfil salvo na conta.</p>}
    {error && <p className="aj-hint aj-erro" role="alert">{error}</p>}
  </form>;
}
