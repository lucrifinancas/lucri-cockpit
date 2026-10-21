import { useState } from "react";
import { ArrowsClockwise, Cloud, Link as LinkIcone } from "@phosphor-icons/react";
import { SecaoHeader, StatusContaAzul } from "./comum";
import { fmtData } from "./util";
import { conectarContaAzul, useClientesResumo } from "./useClientesResumo";

// Clientes → Integrações: conexão de cada cliente com a Conta Azul.
// "Renovado em" = última vez que o acesso foi criado/renovado (acontece
// sempre que o Cockpit busca dados). Se o Conta Azul derrubar o acesso, a
// Home avisa e aqui o caminho é Reconectar.
export default function IntegracoesSecao({ icone }) {
  const { lista, loading, erro, recarregar } = useClientesResumo();
  const [conectando, setConectando] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  async function conectar(id) {
    setConectando(id);
    setConnectionError(null);
    try { await conectarContaAzul(id); } catch (error) { setConnectionError({ id, message: error.message }); setConectando(null); }
  }

  return (
    <>
      <SecaoHeader icone={icone} titulo="Integrações" descricao="Conexão de cada cliente com a Conta Azul, de onde vêm todos os números do Cockpit." />
      <section className="aj-card">
        <h3 className="aj-card-titulo"><Cloud size={18} aria-hidden="true" /> Conta Azul</h3>
        {loading && <p className="aj-hint">Carregando...</p>}
        {erro && <p className="aj-hint aj-erro" role="alert">{erro} <button type="button" className="aj-btn-util" onClick={recarregar}>Tentar novamente</button></p>}
        <ul className="aj-lista">
          {lista.map((c) => (
            <li key={c.id} className="aj-integracao">
              <div>
                <strong>{c.nome}</strong>
                <StatusContaAzul conectado={c.conta_azul_conectado} detalhe={c.conta_azul_conectado ? `acesso renovado em ${fmtData(c.conta_azul_atualizado_em)}` : null} />
              </div>
              <button
                type="button"
                className={c.conta_azul_conectado ? "aj-btn-util" : "aj-btn-primario"}
                disabled={conectando === c.id}
                onClick={() => conectar(c.id)}
              >
                {c.conta_azul_conectado ? <ArrowsClockwise size={15} aria-hidden="true" /> : <LinkIcone size={15} aria-hidden="true" />}
                {conectando === c.id ? "Abrindo..." : c.conta_azul_conectado ? "Reconectar" : "Conectar Conta Azul"}
              </button>
              {connectionError?.id === c.id && <p className="aj-hint aj-erro" role="alert">Não foi possível abrir a conexão: {connectionError.message}. Tente novamente.</p>}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
