import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { useActiveClient } from '../../context/ClientContext';
import { useConfirmLeave, usePendingChanges } from '../../hooks/usePendingChanges';
import { SecaoHeader } from './comum';
import './CentralAcessosSecao.css';

const roles={master:'Administrador',analista:'Equipe Lucri',cliente:'Cliente'};
const blank={nome:'',email:'',papel:'cliente',cliente_id:'',ativo:true};
export default function CentralAcessosSecao({icone}) {
 const {clients}=useActiveClient();
 const confirmLeave=useConfirmLeave();
 const [data,setData]=useState(null),[error,setError]=useState(null),[revision,setRevision]=useState(0);
 const [query,setQuery]=useState(''),[role,setRole]=useState('todos'),[editing,setEditing]=useState(null);
 const [busy,setBusy]=useState(null),[message,setMessage]=useState(null),[draft,setDraft]=useState(blank);
 const [audit,setAudit]=useState(null),[auditError,setAuditError]=useState(null);
 const dirty=Boolean(draft.nome||draft.email||draft.cliente_id||draft.papel!=='cliente'||!draft.ativo);
 usePendingChanges(dirty,Boolean(busy));
 useEffect(()=>{
  let cancelled=false;setError(null);
  apiFetch('/api/central-acessos/usuarios').then(value=>{if(!cancelled)setData(value);}).catch(e=>{if(!cancelled)setError(e.message);});
  apiFetch('/api/central-acessos/auditoria').then(value=>{if(!cancelled){setAudit(value);setAuditError(null);}}).catch(e=>{if(!cancelled)setAuditError(e.message);});
  return ()=>{cancelled=true;};
 },[revision]);
 async function create(event){
  event.preventDefault();setBusy('create');setError(null);setMessage(null);
  try{await apiFetch('/api/central-acessos/usuarios',{method:'POST',body:JSON.stringify({...draft,cliente_id:draft.papel==='cliente'?Number(draft.cliente_id):null})});setDraft(blank);setRevision(v=>v+1);setMessage(draft.ativo?'Conta criada. A pessoa já pode entrar com Google. Para usar senha, envie o link de redefinição na lista abaixo.':'Conta criada com acesso desativado. Ative a conta antes de orientar o primeiro login.');}
  catch(e){setError(e.message);}finally{setBusy(null);}
 }
 async function reset(user){
  setBusy(user.id);setError(null);setMessage(null);
  try{await apiFetch(`/api/central-acessos/usuarios/${user.id}/redefinir-senha`,{method:'POST'});setMessage(`Link de redefinição enviado para ${user.email}. Válido por 60 minutos.`);setRevision(v=>v+1);}
  catch(e){setError(e.message);}finally{setBusy(null);}
 }
 const users=data?.usuarios.filter(u=>(role==='todos'||u.papel===role)&&`${u.nome} ${u.email} ${u.empresa||''}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')))??[];
 return <>
  <SecaoHeader icone={icone} titulo="Central de acessos" descricao="Gerencie os logins da equipe Lucri e de todas as empresas clientes." />
  <section className="aj-card">
   <h3 className="aj-card-titulo">Criar acesso</h3>
   <p className="aj-hint">Autorize o e-mail e escolha o perfil. Não é preciso definir nem compartilhar uma senha.</p>
   <form className="aj-form central-access-create" aria-label="Criar acesso" onSubmit={create}>
    <label className="aj-campo">Nome<input required maxLength={100} value={draft.nome} disabled={Boolean(busy)} onChange={e=>setDraft({...draft,nome:e.target.value})} autoComplete="off" /></label>
    <label className="aj-campo">E-mail<input type="email" required maxLength={254} value={draft.email} disabled={Boolean(busy)} onChange={e=>setDraft({...draft,email:e.target.value})} autoComplete="off" /></label>
    <AccessFields value={draft} onChange={setDraft} clients={clients} disabled={Boolean(busy)} />
    <div className="aj-form-acoes"><button type="submit" className="aj-btn-primario" disabled={Boolean(busy)||!data}>{busy==='create'?'Criando…':'Criar acesso'}</button></div>
   </form>
  </section>
  {error&&<p className="pending-notice" role="alert">{error} <button type="button" className="aj-btn-util" onClick={()=>setRevision(v=>v+1)} disabled={Boolean(busy)}>Atualizar lista</button></p>}
  {message&&<p className="pending-notice" role="status">{message}</p>}
  <section className="aj-card central-users">
   <h3 className="aj-card-titulo">Usuários e permissões</h3>
   <div className="central-filters"><label className="aj-campo">Buscar pessoa<input type="search" placeholder="Nome, e-mail ou empresa" value={query} onChange={e=>setQuery(e.target.value)} /></label>
    <label className="aj-campo">Perfil<select value={role} onChange={e=>setRole(e.target.value)}><option value="todos">Todos</option>{Object.entries(roles).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <button type="button" className="aj-btn-util" disabled={Boolean(busy)} onClick={()=>setRevision(v=>v+1)}>Atualizar</button>
   </div>
   {!data&&!error&&<p className="aj-hint" role="status">Carregando usuários…</p>}
   {data&&users.length===0&&<p className="aj-hint">Nenhuma pessoa encontrada com esses filtros.</p>}
   <ul className="central-user-list">{users.map(u=><li key={u.id}>
    <div className="central-user-row"><div className="central-user-identity"><strong>{u.nome||u.email}</strong><span>{u.email}</span><small>{roles[u.papel]} · {u.papel==='cliente'?u.empresa:'Lucri · todas as empresas'}</small></div>
    <span className="aj-badge">{u.ativo?'Ativo':'Desativado'}{u.id===data.meu_id?' · Você':''}</span>
    <div className="central-user-actions"><button type="button" className="aj-btn-util" disabled={Boolean(busy)||u.id===data.meu_id} aria-expanded={editing===u.id} onClick={()=>{if(confirmLeave())setEditing(editing===u.id?null:u.id);}}>Editar acesso</button>
    <button type="button" className="aj-btn-util" disabled={Boolean(busy)||!u.ativo} onClick={()=>reset(u)}>{busy===u.id?'Enviando…':'Enviar redefinição de senha'}</button></div></div>
    {editing===u.id&&<EditAccess key={`${u.id}-${u.sessao_versao}`} user={u} clients={clients} onSaved={()=>{setEditing(null);setRevision(v=>v+1);setMessage('Permissões atualizadas. As sessões anteriores foram encerradas.');}} />}
   </li>)}</ul>
   <p className="aj-hint">Sua própria conta não pode ser desativada nem ter as permissões alteradas por aqui. Alterações de acesso encerram as sessões anteriores da pessoa.</p>
  </section>
  {data?.convites.length>0&&<section className="aj-card"><h3 className="aj-card-titulo">Convites aguardando primeiro acesso</h3><p className="aj-hint">Estes e-mails já podem entrar com Google. Você também pode preparar a conta antes do primeiro acesso.</p><ul className="central-user-list">{data.convites.map(v=><li key={v.id} className="central-user-row"><div><strong>{v.email}</strong><p className="aj-hint">{v.empresa}</p></div><button type="button" className="aj-btn-util" disabled={Boolean(busy)} onClick={()=>{if(confirmLeave()){setDraft({...blank,email:v.email,cliente_id:String(v.cliente_id)});window.scrollTo({top:0,behavior:'smooth'});}}}>Preparar conta</button></li>)}</ul></section>}
  <details className="aj-card"><summary className="central-audit-summary">Histórico da central de acessos</summary>
   {auditError&&<p className="aj-hint aj-erro" role="alert">{auditError}</p>}
   {!audit&&!auditError&&<p className="aj-hint">Carregando histórico…</p>}
   {audit?.length===0&&<p className="aj-hint">Nenhuma alteração registrada ainda.</p>}
   <ul className="central-user-list">{audit?.map(a=><li key={a.id}><strong>{{usuario_criado:'Conta criada',acesso_alterado:'Permissões alteradas',redefinicao_enviada:'Redefinição enviada'}[a.acao]||a.acao}</strong><p className="aj-hint">{a.usuario_email} · por {a.ator_email} · {new Date(a.criado_em.replace(' ','T')+'Z').toLocaleString('pt-BR')}</p></li>)}</ul>
  </details>
 </>;
}
function AccessFields({value,onChange,clients,disabled}){
 return <>
  <label className="aj-campo">Perfil de acesso<select value={value.papel} disabled={disabled} onChange={e=>onChange({...value,papel:e.target.value,cliente_id:''})}>{Object.entries(roles).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
  {value.papel==='cliente'?<label className="aj-campo">Empresa do cliente<select required disabled={disabled} value={value.cliente_id??''} onChange={e=>onChange({...value,cliente_id:e.target.value})}><option value="">Selecione uma empresa</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>:<p className="aj-hint">{value.papel==='master'?'Administrador: gerencia usuários, empresas e configurações.':'Equipe Lucri: consulta as empresas e utiliza os recursos internos permitidos ao analista.'}</p>}
  <label className="aj-campo">Situação<select value={value.ativo?'ativo':'inativo'} disabled={disabled} onChange={e=>onChange({...value,ativo:e.target.value==='ativo'})}><option value="ativo">Ativo</option><option value="inativo">Desativado</option></select></label>
 </>;
}
function EditAccess({user,clients,onSaved}){
 const [draft,setDraft]=useState({papel:user.papel,cliente_id:user.cliente_id??'',ativo:Boolean(user.ativo)}),[busy,setBusy]=useState(false),[error,setError]=useState(null);
 const dirty=draft.papel!==user.papel||String(draft.cliente_id)!==String(user.cliente_id??'')||draft.ativo!==Boolean(user.ativo);
 usePendingChanges(dirty,busy);
 async function save(e){e.preventDefault();setBusy(true);setError(null);try{await apiFetch(`/api/central-acessos/usuarios/${user.id}`,{method:'PUT',body:JSON.stringify({...draft,cliente_id:draft.papel==='cliente'?Number(draft.cliente_id):null,sessao_versao:user.sessao_versao})});onSaved();}catch(err){setError(err.message);}finally{setBusy(false);}}
 return <form className="aj-form central-edit" aria-label={`Editar acesso de ${user.email}`} onSubmit={save}><AccessFields value={draft} onChange={setDraft} clients={clients} disabled={busy}/><div className="aj-form-acoes"><button type="submit" className="aj-btn-primario" disabled={!dirty||busy}>{busy?'Salvando…':'Salvar acesso'}</button></div>{error&&<p className="aj-hint aj-erro" role="alert">{error}</p>}</form>;
}
