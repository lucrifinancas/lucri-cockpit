import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch, BASE_URL } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { isInternalRole } from "../auth/roles";
import { useActiveClient } from "../context/ClientContext";
import { usePendingChanges } from "../hooks/usePendingChanges";
import { validateReport, reportSize } from "../data/reports";
import "../styles/page.css";
import "../components/DataTable.css";
import "./RelatoriosPage.css";

function sentAt(value) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}
export default function RelatoriosPage() {
  const { user } = useAuth();
  const { activeClientId, activeClient } = useActiveClient();
  if (!isInternalRole(user?.papel)) return <Navigate to="/" replace />;
  if (!activeClientId) return <div className="page"><h1 className="page-title">Relatórios</h1><p className="pending-notice">Selecione uma empresa para consultar os relatórios.</p></div>;
  return <Reports key={activeClientId} clientId={activeClientId} clientName={activeClient?.name} />;
}
function Reports({ clientId, clientName }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [reference, setReference] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInput = useRef(null);
  const busy = uploading || deleting !== null;
  usePendingChanges(Boolean(reference.trim() || file), busy);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    apiFetch(`/api/clientes/${clientId}/relatorios`)
      .then((data) => { if (!Array.isArray(data)) throw new Error("Resposta de relatórios inválida."); if (!cancelled) setReports(data); })
      .catch((error) => { if (!cancelled) setLoadError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, attempt]);
  async function upload(event) {
    event.preventDefault();
    if (busy) return;
    setUploading(true); setActionError(null); setSuccess(null);
    try {
      await validateReport(file, reference);
      const body = new FormData();
      body.append("referencia", reference.trim()); body.append("arquivo", file);
      await apiFetch(`/api/clientes/${clientId}/relatorios`, { method: "POST", body });
      setReference(""); setFile(null); if (fileInput.current) fileInput.current.value = "";
      setSuccess("Relatório enviado e salvo para esta empresa.");
      setAttempt((value) => value + 1);
    } catch (error) { setActionError(error.message); }
    finally { setUploading(false); }
  }
  async function remove(report) {
    if (busy || !window.confirm(`Apagar o relatório “${report.nome_arquivo}” (${report.referencia}) de ${clientName || "esta empresa"}? O PDF será removido do armazenamento.`)) return;
    setDeleting(report.id); setActionError(null); setSuccess(null);
    try {
      await apiFetch(`/api/clientes/${clientId}/relatorios/${report.id}`, { method: "DELETE" });
      setReports((items) => items.filter((item) => item.id !== report.id));
      setSuccess("Relatório apagado.");
    } catch (error) { setActionError(error.message); }
    finally { setDeleting(null); }
  }
  return <div className="page reports-page">
    <header className="page-heading"><div><h1 className="page-title">Relatórios</h1><p className="page-description">Relatórios em PDF de {clientName || "esta empresa"}. Acesso interno da equipe Lucri.</p></div></header>
    <section className="reports-card" aria-labelledby="report-upload-title">
      <h2 id="report-upload-title">Adicionar relatório</h2>
      <p className="section-empty">O PDF é salvo para a empresa selecionada e fica disponível para administrador e analista.</p>
      <form className="reports-form" onSubmit={upload} aria-busy={uploading}>
        <label>Período de referência<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ex.: Setembro/2026 ou 2026" maxLength={120} disabled={busy} required /></label>
        <label>Arquivo PDF · até 20 MB<input ref={fileInput} type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={busy} required /></label>
        <button type="submit" className="reports-primary" disabled={busy || !reference.trim() || !file}>{uploading ? "Enviando PDF…" : "Enviar relatório"}</button>
      </form>
    </section>
    {actionError && <p className="pending-notice" role="alert">{actionError}</p>}
    {success && <p className="pending-notice" role="status">{success}</p>}
    <section className="data-table-wrap" aria-label="Relatórios da empresa">
      <header className="data-table-toolbar"><div className="data-table-heading"><h2>Relatórios da empresa</h2>{!loading && !loadError && <span>{reports.length} arquivo(s)</span>}</div><button type="button" className="reports-button" disabled={busy || loading} onClick={() => setAttempt((value) => value + 1)}>Atualizar lista</button></header>
      {loading ? <p className="reports-message" role="status">Carregando relatórios…</p> : loadError ? <div className="reports-message" role="alert">Não foi possível carregar os relatórios: {loadError}. <button type="button" className="reports-button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div> : reports.length === 0 ? <p className="reports-message">Nenhum relatório enviado para esta empresa.</p> :
        <div className="data-table-scroll" role="region" tabIndex={0} aria-label="Lista de relatórios PDF"><table className="data-table reports-table"><thead><tr><th scope="col">Referência</th><th scope="col">Arquivo</th><th scope="col">Enviado em</th><th scope="col">Enviado por</th><th scope="col" className="num">Tamanho</th><th scope="col">Ações</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}>
          <td>{report.referencia}</td><td>{report.nome_arquivo}</td><td>{sentAt(report.criado_em)}</td><td>{report.enviado_por_email || "—"}</td><td className="num">{reportSize(report.tamanho_bytes)}</td><td><div className="reports-actions"><a className="reports-button" href={`${BASE_URL}/api/clientes/${clientId}/relatorios/${report.id}/arquivo`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir PDF ${report.nome_arquivo} em nova aba`}>Abrir PDF ↗</a><button type="button" className="reports-button reports-delete" disabled={busy} onClick={() => remove(report)} aria-label={`Apagar relatório ${report.nome_arquivo}`}>{deleting === report.id ? "Apagando…" : "Apagar"}</button></div></td>
        </tr>)}</tbody></table></div>}
    </section>
  </div>;
}
