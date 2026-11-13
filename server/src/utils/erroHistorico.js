const etapas = new Set(['autenticacao', 'consulta', 'salvamento']);
const causas = new Set(['CONEXAO_INTERROMPIDA', 'LIMITE_CONTA_AZUL', 'AUTORIZACAO_CONTA_AZUL', 'INDISPONIBILIDADE_CONTA_AZUL', 'RESPOSTA_CONTA_AZUL', 'REDE', 'RESPOSTA_INVALIDA', 'NAO_IDENTIFICADA']);
export function detalhesHistoricoSeguros(value) {
  if (!value || typeof value !== 'object') return null;
  return { mes: typeof value.mes === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value.mes) ? value.mes : null,
    etapa: etapas.has(value.etapa) ? value.etapa : null,
    causa: causas.has(value.causa) ? value.causa : 'NAO_IDENTIFICADA' };
}
export function causaHistorico(error) {
  if (error?.name === 'ContaAzulDesconectadaError') return 'CONEXAO_INTERROMPIDA';
  if (error?.contaAzulStatus === 429) return 'LIMITE_CONTA_AZUL';
  if ([401, 403].includes(error?.contaAzulStatus)) return 'AUTORIZACAO_CONTA_AZUL';
  if (error?.contaAzulStatus >= 500 && error.contaAzulStatus <= 599) return 'INDISPONIBILIDADE_CONTA_AZUL';
  if (Number.isInteger(error?.contaAzulStatus)) return 'RESPOSTA_CONTA_AZUL';
  if (error?.contaAzulRede === true) return 'REDE';
  if (error?.name === 'SyntaxError') return 'RESPOSTA_INVALIDA';
  return 'NAO_IDENTIFICADA';
}
