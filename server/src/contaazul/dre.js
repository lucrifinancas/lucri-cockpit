// Monta o DRE combinando a estrutura oficial do cliente (grupos/subgrupos
// vindos do Conta Azul) com os valores movimentados no período.
//
// Ideia central: cada categoria financeira já contribui com sinal certo —
// contas a receber somam positivo, contas a pagar somam negativo — então
// o "resultado" em qualquer ponto do relatório é simplesmente a soma
// acumulada de tudo que veio antes, na mesma ordem que o Conta Azul usa
// (é assim que "Receita Bruta", "Lucro Bruto", "Lucro Líquido" etc. vão
// sendo formados, um em cima do outro).

function somarNo(node, valorPorCategoria) {
  let total = 0;
  for (const cat of node.categorias_financeiras ?? []) {
    total += valorPorCategoria.get(cat.id) ?? 0;
  }
  for (const sub of node.subitens ?? []) {
    total += somarNo(sub, valorPorCategoria);
  }
  return total;
}

export function montarDre(estrutura, valorPorCategoria) {
  let acumulado = 0;
  const linhas = [];

  for (const item of estrutura.itens) {
    if (item.indica_totalizador) {
      // Linha de subtotal (ex: "Lucro Bruto") — não tem categoria própria,
      // só reporta o acumulado até aqui.
      linhas.push({
        codigo: item.codigo,
        descricao: item.descricao,
        totalizador: true,
        valor: acumulado,
      });
      continue;
    }

    const valorGrupo = somarNo(item, valorPorCategoria);
    acumulado += valorGrupo;

    linhas.push({
      codigo: item.codigo,
      descricao: item.descricao,
      totalizador: false,
      valor: valorGrupo,
      subitens: (item.subitens ?? []).map((sub) => ({
        codigo: sub.codigo,
        descricao: sub.descricao,
        valor: somarNo(sub, valorPorCategoria),
      })),
    });
  }

  return { linhas, resultado_final: acumulado };
}
