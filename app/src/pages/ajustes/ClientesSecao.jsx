import OnboardingChecklist from "./OnboardingChecklist";
import { useState } from "react";
import { Link as LinkIcone, Plus, UserPlus, Users } from "@phosphor-icons/react";
import { apiFetch } from "../../api/client";
import { useActiveClient } from "../../context/ClientContext";
import ClientAvatar from "../../components/ClientAvatar";
import { SecaoHeader, StatusContaAzul } from "./comum";
import { fmtData } from "./util";
import { conectarContaAzul, useClientesResumo } from "./useClientesResumo";

// Clientes → Clientes: lista com status de cada empresa + cadastro de novo.
export default function ClientesSecao({ irPara, icone }) {
  const { addClient, setSelectedClientId, activeClientId } = useActiveClient();
  const { lista, loading, erro, recarregar } = useClientesResumo();
  const [abrirNovo, setAbrirNovo] = useState(false);
  const [nome, setNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [erroNovo, setErroNovo] = useState(null);
  const [conectando, setConectando] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  async function criar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setCriando(true);
    setErroNovo(null);
    try {
      const novo = await apiFetch("/api/clientes", { method: "POST", body: JSON.stringify({ nome: nome.trim() }) });
      addClient({ id: novo.id, name: novo.nome, logoUrl: null }, true);
      setNome("");
      setAbrirNovo(false);
      recarregar();
    } catch (err) {
      setErroNovo(err.message);
    } finally {
      setCriando(false);
    }
  }

  function configurar(id) {
    if (setSelectedClientId(id)) irPara("acessos");
  }

  async function conectar(id) {
    setConectando(id);
    setConnectionError(null);
    try { await conectarContaAzul(id); } catch (error) { setConnectionError({ id, message: error.message }); setConectando(null); }
  }

  return (
    <>
      <SecaoHeader icone={icone} titulo="Clientes" descricao="Empresas atendidas no Cockpit. Depois de cadastrar, conecte a Conta Azul pra liberar os dados.">
        <button type="button" className="aj-btn-primario" onClick={() => setAbrirNovo((v) => !v)} aria-expanded={abrirNovo}>
          <Plus size={14} weight="bold" aria-hidden="true" /> Novo cliente
        </button>
      </SecaoHeader>

      {abrirNovo && (
        <section className="aj-card">
          <form className="aj-form aj-form-linha" onSubmit={criar}>
            <label className="aj-campo aj-campo-largo">
              Nome do cliente
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Mania Natural" autoFocus />
            </label>
            <div className="aj-form-acoes">
              <button type="button" className="aj-btn-util" onClick={() => setAbrirNovo(false)}>Cancelar</button>
              <button type="submit" className="aj-btn-primario" disabled={criando || !nome.trim()}>{criando ? "Cadastrando..." : "Cadastrar"}</button>
            </div>
          </form>
          {erroNovo && <p className="aj-hint aj-erro" role="alert">{erroNovo}</p>}
        </section>
      )}

      {!loading && !erro && lista.find((client) => client.id === activeClientId) && (
        <OnboardingChecklist key={activeClientId} client={lista.find((client) => client.id === activeClientId)} irPara={irPara} />
      )}
      <section className="aj-card aj-card-tabela">
        {loading && <p className="aj-hint">Carregando clientes...</p>}
        {erro && <p className="aj-hint aj-erro" role="alert">{erro} <button type="button" className="aj-btn-util" onClick={recarregar}>Tentar novamente</button></p>}
        {!loading && !erro && (
          <table className="aj-tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Conta Azul</th>
                <th className="num">Usuários</th>
                <th><span className="aj-sr">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="aj-cliente-nome">
                      <ClientAvatar client={{ name: c.nome }} size={28} />
                      {c.nome}
                    </span>
                  </td>
                  <td>
                    <span title={c.conta_azul_conectado ? `Acesso renovado em ${fmtData(c.conta_azul_atualizado_em)}` : undefined}>
                      <StatusContaAzul conectado={c.conta_azul_conectado} />
                    </span>
                  </td>
                  <td className="num">
                    <span className="aj-usuarios"><Users size={15} aria-hidden="true" /> {c.usuarios}</span>
                    {c.convites > 0 && <span className="aj-hint-inline"> + {c.convites} convite{c.convites > 1 ? "s" : ""}</span>}
                  </td>
                  <td className="aj-acoes-linha">
                    {!c.conta_azul_conectado && (
                      <button type="button" className="aj-btn-secundario" disabled={conectando === c.id} onClick={() => conectar(c.id)}>
                        <LinkIcone size={15} aria-hidden="true" /> {conectando === c.id ? "Abrindo..." : "Conectar Conta Azul"}
                      </button>
                    )}
                    <button type="button" className="aj-btn-util" onClick={() => setSelectedClientId(c.id)}>Ver configuração</button>
                    <button type="button" className="aj-btn-util" onClick={() => configurar(c.id)}><UserPlus size={15} aria-hidden="true" /> Acessos</button>
                    {connectionError?.id === c.id && <p className="aj-hint aj-erro" role="alert">Não foi possível abrir a conexão: {connectionError.message}. Tente novamente.</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
