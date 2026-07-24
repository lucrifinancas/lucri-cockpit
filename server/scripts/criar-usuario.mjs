// Cria um usuário de login no banco, sem que a senha passe por qualquer
// lugar além do terminal de quem está rodando o script.
//
// Uso (rode de dentro da pasta server/):
//   node scripts/criar-usuario.mjs <email> <papel> <senha> <local|remoto>
//
// Exemplo:
//   node scripts/criar-usuario.mjs diogo@lucricockpit.com master "minhaSenhaForte123" remoto

import { randomBytes, pbkdf2Sync } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";

const [email, papel, senha, destino] = process.argv.slice(2);

if (!email || !papel || !senha || !destino) {
  console.error(
    "Uso: node scripts/criar-usuario.mjs <email> <papel> <senha> <local|remoto>"
  );
  process.exit(1);
}

if (!["master", "analista", "cliente"].includes(papel)) {
  console.error("Papel inválido. Use: master, analista ou cliente.");
  process.exit(1);
}

if (!["local", "remoto"].includes(destino)) {
  console.error("Destino inválido. Use: local ou remoto.");
  process.exit(1);
}

function hashSenha(s) {
  const salt = randomBytes(16).toString("hex");
  const iteracoes = 100_000;
  const hash = pbkdf2Sync(s, salt, iteracoes, 32, "sha256").toString("hex");
  return `pbkdf2$${iteracoes}$${salt}$${hash}`;
}

const senhaHash = hashSenha(senha);
const sql = `INSERT INTO usuarios (email, senha_hash, papel) VALUES ('${email.replace(/'/g, "''")}', '${senhaHash}', '${papel}');`;

const tmpFile = `./_tmp_criar_usuario_${Date.now()}.sql`;
writeFileSync(tmpFile, sql, "utf-8");

try {
  execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "lucri-cockpit-db",
      destino === "remoto" ? "--remote" : "--local",
      `--file=${tmpFile}`,
    ],
    { stdio: "inherit", shell: true }
  );
  console.log(`\nUsuário "${email}" (${papel}) criado com sucesso.`);
} finally {
  unlinkSync(tmpFile);
}
