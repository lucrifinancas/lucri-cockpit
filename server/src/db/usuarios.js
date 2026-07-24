// Consultas relacionadas à tabela "usuarios".

export async function buscarUsuarioPorEmail(db, email) {
  const resultado = await db
    .prepare("SELECT * FROM usuarios WHERE email = ?")
    .bind(email)
    .first();
  return resultado ?? null;
}
