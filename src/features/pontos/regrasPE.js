// Economia dos Pontos de Estudo (PE). Fonte única de quanto cada atividade rende e quanto custa cada item da loja.
// Inspirada no Duolingo: o PE vem de TERMINAR uma atividade (não de abrir), acerto rende mais, nota boa dá bônus,
// repetir o mesmo vídeo não rende de novo, e a loja vende proteção de ofensiva e PE em dobro por tempo.
// Dois números diferentes no estado da conta:
//   totalXp     = tudo o que a pessoa já ganhou (define o nível; nunca diminui ao gastar)
//   studyPoints = saldo para gastar na loja (totalXp - spentStudyPoints)
// JS puro (testado em regrasPE.test.mjs).

/** PE por atividade concluída (antes do bônus de nota e do dobro). */
export const PE_POR_ATIVIDADE = {
  consulta: 40, // Consulta ao Vivo encerrada e registrada
  plantao_vivo: 35, // Plantão com a enfermeira Ana até o fim
  sbar_completed: 35, // passagem de plantão gravada ou preenchida
  case_solved: 50, // caso clínico (5 etapas do PE)
  tecnica: 20, // minijogo das Técnicas concluído
  minijogo: 20, // minijogo dentro de uma cena (ex.: ausculta na consulta)
  video: 15, // vídeo/POP assistido até o fim (só na 1ª vez de cada vídeo)
  procedure_completed: 15, // checklist do POP concluído (só na 1ª vez)
  questao: 15, // cada questão certa numa sessão de questões
  revisao: 10, // sessão de revisão concluída
  calculo_medico: 0, // o Cálculo calcula o próprio PE por acerto (xpDaRodada)
  send_support: 0, // incentivo a colega não rende PE (evita troca de PE entre amigos)
};

/** Bônus pela nota final (0-100) das atividades que têm nota. */
export function bonusPorNota(nota) {
  const n = Number(nota);
  if (!Number.isFinite(n)) return 0;
  if (n >= 90) return 20;
  if (n >= 70) return 10;
  return 0;
}

/** PE em dobro está ativo agora? (`dobroAte` = data em ms até quando vale) */
export function dobroAtivo(estado, agora = Date.now()) {
  return Number(estado?.dobroAte) > agora;
}

/** Minutos que faltam do PE em dobro (0 se não está ativo). */
export function minutosDeDobro(estado, agora = Date.now()) {
  return dobroAtivo(estado, agora) ? Math.ceil((Number(estado.dobroAte) - agora) / 60000) : 0;
}

/** PE final de uma atividade: base (ou valor dado) + bônus de nota, dobrado se o PE em dobro estiver ativo. */
export function calcularPE({ tipo, valor = null, nota = null, estado = null, agora = Date.now() }) {
  const base = valor != null ? Math.max(0, Math.round(Number(valor) || 0)) : PE_POR_ATIVIDADE[tipo] ?? 20;
  const total = base + (base > 0 ? bonusPorNota(nota) : 0);
  return dobroAtivo(estado, agora) ? total * 2 : total;
}

export const MAX_BLOQUEIOS = 2;

/** Itens da loja de PE. */
export const LOJA_PE = [
  {
    id: "bloqueio_ofensiva",
    titulo: "Bloqueio de ofensiva",
    descricao: "Protege sua ofensiva por 1 dia sem estudar. É usado sozinho: se você passar um dia sem concluir nenhuma atividade, ele entra no lugar.",
    custo: 150,
    icone: "Shield",
    cor: "#5EB8FF",
  },
  {
    id: "dobro_30",
    titulo: "PE em dobro · 30 min",
    descricao: "Tudo o que você concluir nos próximos 30 minutos rende o dobro de PE.",
    custo: 100,
    minutos: 30,
    icone: "Zap",
    cor: "#FFC247",
  },
  {
    id: "dobro_60",
    titulo: "PE em dobro · 1 hora",
    descricao: "Uma hora inteira de PE em dobro. Sai mais barato por minuto que o de 30.",
    custo: 180,
    minutos: 60,
    icone: "Zap",
    cor: "#FF9F43",
  },
];

/**
 * Pode comprar? Devolve { ok: true } ou { ok: false, motivo }.
 * Bloqueio: no máximo MAX_BLOQUEIOS guardados (como no Duolingo).
 */
export function podeComprar(item, estado) {
  if (!item) return { ok: false, motivo: "Item desconhecido." };
  const saldo = Number(estado?.studyPoints ?? 0);
  if (item.id === "bloqueio_ofensiva" && Number(estado?.streakFreezeAvailable ?? 0) >= MAX_BLOQUEIOS) {
    return { ok: false, motivo: `Você já tem ${MAX_BLOQUEIOS} bloqueios guardados, o máximo.` };
  }
  if (saldo < item.custo) return { ok: false, motivo: `Faltam ${item.custo - saldo} PE.` };
  return { ok: true };
}

/** Aplica a compra no estado (sem salvar). Devolve o estado novo. PE em dobro soma ao tempo que ainda resta. */
export function aplicarCompra(item, estado, agora = Date.now()) {
  const novo = { ...estado };
  novo.studyPoints = Number(estado.studyPoints ?? 0) - item.custo;
  novo.spentStudyPoints = Number(estado.spentStudyPoints ?? 0) + item.custo;
  if (item.id === "bloqueio_ofensiva") novo.streakFreezeAvailable = Number(estado.streakFreezeAvailable ?? 0) + 1;
  if (item.minutos) {
    const desde = Math.max(agora, Number(estado.dobroAte) || 0);
    novo.dobroAte = desde + item.minutos * 60000;
  }
  novo.compras = [...(Array.isArray(estado.compras) ? estado.compras.slice(-49) : []), { item: item.id, custo: item.custo, em: new Date(agora).toISOString() }];
  return novo;
}
