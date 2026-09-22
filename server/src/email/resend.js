// Envia o e-mail de redefinição de senha via Resend (API HTTP simples, sem
// SDK) — substitui o webhook do Make (dava problema com frequência). Ver
// GUIA-RESEND-EMAIL.md, na raiz do repo, pro passo a passo de configuração.
export async function enviarEmailResetSenha(apiKey, remetente, { email, linkRedefinicao, expiraEmMinutos }) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: email,
      subject: "Redefinição de senha — Lucri Cockpit",
      html: `
        <p>Recebemos um pedido para redefinir sua senha no Lucri Cockpit.</p>
        <p>Clique no link abaixo para criar uma nova senha (válido por ${expiraEmMinutos} minutos):</p>
        <p><a href="${linkRedefinicao}">${linkRedefinicao}</a></p>
        <p>Se você não pediu essa redefinição, pode ignorar este e-mail.</p>
      `,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Resend respondeu ${resp.status}: ${await resp.text()}`);
  }
}
