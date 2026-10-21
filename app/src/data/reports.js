export const MAX_REPORT_BYTES = 20 * 1024 * 1024;
export async function validateReport(file, reference) {
  if (!reference.trim()) throw new Error('Informe o período de referência.');
  if (!file) throw new Error('Selecione um arquivo PDF.');
  if (file.size > MAX_REPORT_BYTES) throw new Error('O PDF deve ter no máximo 20 MB.');
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (![0x25, 0x50, 0x44, 0x46, 0x2d].every((byte, index) => header[index] === byte)) throw new Error('O arquivo selecionado não é um PDF válido.');
}
export function reportSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
