// Mantém nomes internacionais sem permitir controles no cabeçalho HTTP.
export function pdfDisposition(filename, download = false) {
  const original = Array.from(String(filename || 'relatorio.pdf')).filter(character => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127).join('');
  const fallback = original.replace(/[^\x20-\x7e]|["\\/]/g, '_') || 'relatorio.pdf';
  const encoded = encodeURIComponent(original).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${download ? 'attachment' : 'inline'}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
