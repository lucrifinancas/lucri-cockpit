// Confere se a senha digitada bate com o hash salvo no banco.
// Usa PBKDF2 (mesmo algoritmo do scripts/criar-usuario.mjs), mas aqui via
// Web Crypto — a API de criptografia que roda dentro do Cloudflare Workers
// (o Workers não tem o módulo "crypto" do Node disponível).

function bytesParaHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verificarSenha(senhaDigitada, hashArmazenado) {
  const [algoritmo, iteracoesStr, saltHex, hashEsperadoHex] = hashArmazenado.split("$");
  if (algoritmo !== "pbkdf2") return false;

  const iteracoes = Number(iteracoesStr);
  // O script que cria o usuário (Node) passa o salt como STRING de texto
  // pro pbkdf2Sync, não como bytes decodificados do hex — por isso aqui
  // também precisa ser o texto do salt "cru", não o hex convertido em bytes.
  const salt = new TextEncoder().encode(saltHex);

  const chaveBase = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(senhaDigitada),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bitsDerivados = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iteracoes },
    chaveBase,
    256 // 32 bytes, igual ao script de criação
  );

  const hashCalculadoHex = bytesParaHex(bitsDerivados);

  // Comparação em tempo constante — evita que um atacante descubra a senha
  // certa "cronometrando" quantos caracteres bateram numa comparação normal.
  if (hashCalculadoHex.length !== hashEsperadoHex.length) return false;
  let diferenca = 0;
  for (let i = 0; i < hashCalculadoHex.length; i++) {
    diferenca |= hashCalculadoHex.charCodeAt(i) ^ hashEsperadoHex.charCodeAt(i);
  }
  return diferenca === 0;
}
