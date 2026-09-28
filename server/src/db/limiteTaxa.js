// Limitador de tentativas simples, em janelas fixas, guardado no D1 — sem
// precisar de nenhum serviço extra. Ver RELATORIO-SEGURANCA-2026-09-24.md,
// achado 3 (login e recuperação de senha sem limitação nenhuma hoje).
//
// `chave` identifica o que está sendo limitado (ex: "login:fulano@x.com" ou
// "reset:fulano@x.com"). `janelaSegundos` é o tamanho da janela de tempo
// (ex: 900 = 15 min) e `limite` é quantas tentativas cabem nela.
export async function dentroDoLimite(db, chave, limite, janelaSegundos) {
  const janela = Math.floor(Date.now() / 1000 / janelaSegundos);

  const linha = await db
    .prepare(
      `INSERT INTO limite_taxa (chave, janela, contagem) VALUES (?, ?, 1)
       ON CONFLICT (chave, janela) DO UPDATE SET contagem = contagem + 1
       RETURNING contagem`
    )
    .bind(chave, janela)
    .first();

  // Limpeza oportunista de janelas antigas (1 em cada ~20 chamadas), pra
  // tabela não crescer pra sempre sem precisar de um Cron Trigger só pra isso.
  if (Math.random() < 0.05) {
    await db.prepare("DELETE FROM limite_taxa WHERE janela < ?").bind(janela - 1).run();
  }

  return linha.contagem <= limite;
}
