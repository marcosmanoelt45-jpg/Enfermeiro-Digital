// Duas chances por minijogo. Errou a primeira: um aviso específico do jogo e o aluno continua mexendo
// (nada some do lugar). Errou a segunda: o resultado com o que estava errado.
// Entregar vazio não gasta chance (só pergunta se está pronto mesmo).

export const CHANCES = 2;

/**
 * acao: o que o jogo mandou conferir; r: a avaliação. Devolve { vazio, mensagem }.
 */
export function avisoDoErro(def, acao, r) {
  if (def.tipo === "arrastar") {
    const colocados = acao ?? {};
    const itens = def.arrastar.itens;
    const dentro = itens.filter((i) => colocados[i.id]);
    if (dentro.length === 0) {
      const mesa = def.arrastar.cena?.tipo === "mesa";
      return { vazio: true, mensagem: mesa ? "Sua bandeja está vazia, tem certeza de que está pronta?" : "Você ainda não colocou nada. Tem certeza de que terminou?" };
    }
    const faltam = itens.filter((i) => i.alvoCorreto !== null && colocados[i.id] !== i.alvoCorreto).length;
    const sobram = itens.filter((i) => i.alvoCorreto === null && colocados[i.id]).length;
    if (faltam && sobram) return { vazio: false, mensagem: "Falta material e tem coisa que não é usada aqui. Revise com calma." };
    if (sobram) return { vazio: false, mensagem: sobram === 1 ? "Tem um item que não é usado neste procedimento. Qual é?" : "Tem itens que não são usados neste procedimento." };
    if (faltam === 1) return { vazio: false, mensagem: "Você está quase, mas ainda falta algo!" };
    return { vazio: false, mensagem: "Ainda faltam alguns materiais. Pense no passo a passo do procedimento." };
  }
  if (def.tipo === "ordenar") {
    const fora = r?.foraDeLugar?.length ?? 0;
    return { vazio: false, mensagem: fora <= 2 ? "Quase! Só algumas etapas estão trocadas." : "Algumas etapas estão fora de ordem. O que vem antes de tocar no paciente?" };
  }
  if (def.tipo === "medir") return { vazio: false, mensagem: "O valor não confere. Leia de novo com calma." };
  if (def.tipo === "escolher") return { vazio: false, mensagem: r?.detalhes?.[0]?.feedback || "Não é essa. Pense de novo." };
  return { vazio: false, mensagem: "Quase! Revise e tente de novo." };
}
