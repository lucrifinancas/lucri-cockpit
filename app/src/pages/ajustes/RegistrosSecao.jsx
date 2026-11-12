import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { useActiveClient } from '../../context/ClientContext';
import { SecaoHeader, ClienteAlvo } from './comum';
import { AUDIT_LABELS, auditChanges } from '../../data/auditChanges';
import '../../components/DataTable.css';
import './RegistrosSecao.css';

const formatDate = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo' }).format(new Date(value));
const actor = item => item.usuario_email ?? (item.usuario_id ? `Usuário #${item.usuario_id}` : 'Sistema / sessão não identificada');
const ERRORS = { FALHA_LOGIN_GOOGLE: 'Falha no login Google', FALHA_CONEXAO_CONTA_AZUL: 'Falha na conexão com Conta Azul', FALHA_HISTORICO: 'Falha na atualização do histórico', ERRO_INTERNO: 'Erro no servidor', CONTA_AZUL_DESCONECTADA: 'Conexão com Conta Azul interrompida', FRONTEND_RUNTIME: 'Erro na interface', FRONTEND_PROMISE: 'Falha de operação na interface', REDE_INDISPONIVEL: 'Falha de conexão relatada pelo navegador', RESPOSTA_INVALIDA: 'Resposta inválida do servidor' };

export default function RegistrosSecao({ icone }) {
  const { activeClientId } = useActiveClient();
  const [type, setType] = useState('erros');
  const [scope, setScope] = useState('empresa');
  return <>
    <SecaoHeader titulo="Registros" descricao="Investigue erros e confira quem alterou a classificação de categorias." icone={icone}><ClienteAlvo /></SecaoHeader>
    <div className="records-controls">
      <div className="aj-abas" role="group" aria-label="Tipo de registro">
        <button type="button" className={type === 'erros' ? 'ativo' : ''} aria-pressed={type === 'erros'} onClick={() => setType('erros')}>Erros</button>
        <button type="button" className={type === 'auditoria' ? 'ativo' : ''} aria-pressed={type === 'auditoria'} onClick={() => setType('auditoria')}>Alterações de categorias</button>
      </div>
      {type === 'erros' && <label>Consultar<select aria-label="Escopo dos erros" value={scope} onChange={event => setScope(event.target.value)}><option value="empresa">Empresa selecionada</option><option value="todos">Todos os erros, incluindo sistema</option></select></label>}
    </div>
    <p className="aj-hint">Erros ficam disponíveis por 30 dias; alterações de categorias, por 365 dias. Relatos do navegador são identificados separadamente dos eventos registrados pela API.</p>
    {(!activeClientId && (type === 'auditoria' || scope === 'empresa')) ? <p className="aj-hint" role="status">Selecione uma empresa para consultar os registros.</p> :
      <Records key={`${type}-${scope}-${activeClientId}`} type={type} clientId={type === 'auditoria' || scope === 'empresa' ? activeClientId : null} />}
  </>;
}

function Records({ type, clientId }) {
  const [cursors, setCursors] = useState([null]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, items: [], next: null });
  const cursor = cursors.at(-1);
  const key = JSON.stringify([cursor, attempt]);
  const current = state.key === key ? state : { loading: true, items: [], next: null };
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ limite: '25' });
    if (cursor !== null) params.set('antes', cursor);
    if (type === 'erros' && clientId) params.set('cliente_id', clientId);
    const path = type === 'erros' ? '/api/registros/erros' : `/api/clientes/${clientId}/auditoria-categorias`;
    apiFetch(`${path}?${params}`).then(data => {
      if (!Array.isArray(data?.itens)) throw new Error('Resposta de registros inválida.');
      if (!cancelled) setState({ key, loading: false, items: data.itens, next: data.proximo, error: null });
    }).catch(error => { if (!cancelled) setState({ key, loading: false, items: [], next: null, error: error.message, reference: error.requestId }); });
    return () => { cancelled = true; };
  }, [key, cursor, clientId, type]);
  return <section className="records-panel" aria-label={type === 'erros' ? 'Erros da aplicação' : 'Histórico de categorias'}>
    <header className="records-head"><h3>{type === 'erros' ? 'Erros da aplicação' : 'Histórico de categorias'}</h3><button type="button" className="aj-btn-util" disabled={current.loading} onClick={() => { setCursors([null]); setAttempt(value => value + 1); }}>Atualizar</button></header>
    {current.loading ? <p className="records-message" role="status">Carregando registros…</p> : current.error ? <div className="records-message" role="alert"><p>Não foi possível consultar os registros. Tente atualizar.</p>{current.reference && <p>Referência: <code>{current.reference}</code></p>}<button type="button" className="aj-btn-util" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : current.items.length === 0 ? <p className="records-message" role="status">{type === 'erros' ? 'Nenhum erro registrado neste recorte. Relatos dependem da conexão do navegador e não cobrem todos os testes.' : 'Nenhuma alteração registrada neste recorte. O histórico começa após a ativação deste recurso.'}</p> :
      type === 'erros' ? <div className="data-table-scroll" tabIndex={0} role="region" aria-label="Tabela de erros"><table className="data-table records-table"><thead><tr><th scope="col">Quando</th><th scope="col">Erro e referência</th><th scope="col">Operação</th><th scope="col">Origem e usuário</th></tr></thead><tbody>{current.items.map(item => <tr key={item.id}>
        <td>{formatDate(item.criado_em)}</td><td><strong>{ERRORS[item.codigo] ?? 'Erro da aplicação'}</strong><code className="record-reference">{item.request_id}</code></td>
        <td>{item.metodo} {item.operacao}<small className="record-meta">{item.status ? `HTTP ${item.status} · ` : ''}Versão: {item.versao ?? 'Não informada'}</small></td>
        <td>{item.origem === 'backend' ? 'API' : 'Relato do navegador'}<small className="record-meta">{actor(item)}{item.cliente_id ? ` · Empresa #${item.cliente_id}` : ''}</small></td>
      </tr>)}</tbody></table></div> : <ol className="records-audit">{current.items.map(item => {
        const changes = auditChanges(item);
        return <li key={item.id}><h4>{AUDIT_LABELS[item.acao] ?? 'Alteração de categorias'}</h4><p className="record-meta">{formatDate(item.criado_em)} · {actor(item)}</p>
          <details><summary>Ver {changes.length} {changes.length === 1 ? 'alteração' : 'alterações'}</summary><div className="data-table-scroll" tabIndex={0} role="region" aria-label="Valores antes e depois"><table className="data-table"><thead><tr><th scope="col">Categoria / grupo</th><th scope="col">Antes</th><th scope="col">Depois</th></tr></thead><tbody>{changes.map(change => <tr key={change.id}><th scope="row">{change.nome}</th><td>{change.antes}</td><td>{change.depois}</td></tr>)}</tbody></table></div><p className="record-meta">Referência: <code>{item.request_id}</code> · Versão: {item.versao ?? 'Não informada'}</p></details>
        </li>;
      })}</ol>}
    <nav className="records-pagination" aria-label="Paginação dos registros"><button type="button" className="aj-btn-util" disabled={current.loading || cursors.length === 1} onClick={() => setCursors(previous => previous.slice(0, -1))}>Mais recentes</button><span role="status">Página {cursors.length} · até 25 registros</span><button type="button" className="aj-btn-util" disabled={current.loading || !current.next} onClick={() => setCursors(previous => [...previous, current.next])}>Mais antigos</button></nav>
  </section>;
}
