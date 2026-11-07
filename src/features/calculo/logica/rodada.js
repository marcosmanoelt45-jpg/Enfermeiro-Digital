// Lógica pura do Cálculo com o Médico: montagem da rodada, conferência da resposta, fluxo de tentativas
// e resumo. Nada daqui toca em tela, voz ou rede (tudo testável no Node).

export const MODOS = {
  rotina: { id: "rotina", rotulo: "Rotina", descricao: "10 prescrições, sem tempo", total: 10, erros: [0, 0], tempoPorItemS: null, pressaAoS: null },
  corrido: { id: "corrido", rotulo: "Plantão corrido", descricao: "8 prescrições, 90 segundos cada", total: 8, erros: [0, 0], tempoPorItemS: 90, pressaAoS: 60 },
  erro: { id: "erro", rotulo: "Prescrição com erro", descricao: "10 prescrições, 3 ou 4 com erro", total: 10, erros: [3, 4], tempoPorItemS: null, pressaAoS: null },
};

export const MOTIVOS = [
  { id: "dose10x", rotulo: "Dose dez vezes maior" },
  { id: "via", rotulo: "Via errada" },
  { id: "unidade", rotulo: "Unidade trocada (mg e mcg)" },
  { id: "alergia", rotulo: "Paciente alérgico" },
  { id: "outro", rotulo: "Outro motivo" },
];

function embaralhar(lista, rng) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia `n` itens revezando entre os grupos (por tipo), para a rodada não ficar toda do mesmo assunto.
function sortearRevezando(itens, chave, n, rng) {
  const grupos = new Map();
  for (const item of embaralhar(itens, rng)) {
    const k = chave(item);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(item);
  }
  const filas = embaralhar([...grupos.values()], rng);
  const saida = [];
  while (saida.length < n && filas.some((f) => f.length)) {
    for (const fila of filas) {
      if (saida.length >= n) break;
      if (fila.length) saida.push(fila.shift());
    }
  }
  return saida;
}

export function montarRodada(banco, modoId, rng = Math.random) {
  const modo = MODOS[modoId];
  if (!modo) throw new Error(`Modo desconhecido: ${modoId}`);
  const [minErros, maxErros] = modo.erros;
  const nErros = maxErros ? minErros + Math.floor(rng() * (maxErros - minErros + 1)) : 0;
  const normais = banco.filter((i) => !i.erroProposital);
  const comErro = banco.filter((i) => i.erroProposital);
  const escolhidosNormais = sortearRevezando(normais, (i) => i.tipo, modo.total - nErros, rng);
  const escolhidosErro = sortearRevezando(comErro, (i) => i.erroProposital.tipo, nErros, rng);
  return embaralhar([...escolhidosNormais, ...escolhidosErro], rng);
}

// Aceita "2,5", "2.5", 2.5. Texto com letras ou vazio é inválido ("42abc" não vira 42).
export function lerValor(entrada) {
  if (typeof entrada === "number") return Number.isFinite(entrada) ? entrada : null;
  const t = String(entrada ?? "").trim();
  if (!/^\d+([.,]\d+)?$/.test(t)) return null;
  return Number(t.replace(",", "."));
}

// "certo" | "quase" (inteiro com casa decimal perto: arredondar, sem penalidade) | "errado" | "unidade_errada" | "invalido"
export function avaliarResposta(item, entrada, unidadeDita = null) {
  const valor = lerValor(entrada);
  if (valor === null) return { estado: "invalido", valor: null };
  if (unidadeDita && unidadeDita !== item.unidade) return { estado: "unidade_errada", valor };
  if (item.casas === 0) {
    if (Number.isInteger(valor)) return { estado: valor === item.resposta ? "certo" : "errado", valor };
    return { estado: Math.abs(valor - item.resposta) <= item.tolerancia ? "quase" : "errado", valor };
  }
  return { estado: Math.abs(valor - item.resposta) <= item.tolerancia + 1e-9 ? "certo" : "errado", valor };
}

export function novoEstadoItem(item) {
  return { item, erros: 0, finalizado: false, resultado: null, grave: false, primeira: true, mostrarMemoria: false, questionouSemMotivo: false };
}

const TETO_DE_ERROS = 2;

// Aplica um evento ao item. Devolve { estado, reacao } (a reação escolhe a fala do médico).
// eventos: { tipo: "resposta", valor, unidadeDita } | { tipo: "questionar", motivo } | { tipo: "tempo" }
export function aplicar(estado, evento) {
  if (estado.finalizado) return { estado, reacao: null };
  const { item } = estado;
  const comErro = Boolean(item.erroProposital);

  if (evento.tipo === "tempo") {
    return { estado: { ...estado, finalizado: true, resultado: "erro", primeira: false, mostrarMemoria: true }, reacao: "pressa" };
  }

  if (evento.tipo === "resposta") {
    // Calcular uma prescrição errada: o médico para o aluno. Erro grave. (Texto que nem é número não conta como cálculo.)
    if (comErro && lerValor(evento.valor) === null) return { estado, reacao: null, aviso: "invalido" };
    if (comErro) return { estado: { ...estado, finalizado: true, resultado: "erro", grave: true, primeira: false, mostrarMemoria: true }, reacao: "erro_grave" };
    const r = avaliarResposta(item, evento.valor, evento.unidadeDita);
    if (r.estado === "invalido") return { estado, reacao: null, aviso: "invalido" };
    if (r.estado === "quase") return { estado, reacao: null, aviso: "quase" };
    if (r.estado === "certo") return { estado: { ...estado, finalizado: true, resultado: "acerto" }, reacao: "acerto" };
    const erros = estado.erros + 1;
    const fim = erros >= TETO_DE_ERROS;
    return {
      estado: { ...estado, erros, primeira: false, finalizado: fim, resultado: fim ? "erro" : null, mostrarMemoria: fim },
      reacao: fim ? "erro2" : "erro1",
      aviso: r.estado === "unidade_errada" ? "unidade_errada" : undefined,
    };
  }

  if (evento.tipo === "questionar") {
    if (comErro) {
      if (evento.motivo === item.erroProposital.tipo) return { estado: { ...estado, finalizado: true, resultado: "acerto" }, reacao: "questionou_certo" };
      const erros = estado.erros + 1;
      const fim = erros >= TETO_DE_ERROS;
      return { estado: { ...estado, erros, primeira: false, finalizado: fim, resultado: fim ? "erro" : null, mostrarMemoria: fim }, reacao: fim ? "erro2" : "erro1" };
    }
    // Questionou uma prescrição correta: "Está certa, pode fazer" e conta 1 erro.
    const erros = estado.erros + 1;
    const fim = erros >= TETO_DE_ERROS;
    return {
      estado: { ...estado, erros, primeira: false, questionouSemMotivo: true, finalizado: fim, resultado: fim ? "erro" : null, mostrarMemoria: fim },
      reacao: "questionou_sem_motivo",
    };
  }
  return { estado, reacao: null };
}

// Quantas falas existem de cada reação (ids calc.r.<reacao>.<n>) e a emoção que o médico mostra.
export const REACOES = {
  acerto: { emocao: "acerto" },
  erro1: { emocao: "erro" },
  erro2: { emocao: "erro" },
  questionou_certo: { emocao: "acerto" },
  questionou_sem_motivo: { emocao: undefined },
  pressa: { emocao: undefined },
  erro_grave: { emocao: "erro" },
};

// Escolhe uma fala da reação sem repetir a anterior da mesma reação. `falas`: lista { id, texto } do medico-rui.json.
export function falaDaReacao(reacao, falas, rng = Math.random, ultimas = {}) {
  const prefixo = `calc.r.${reacao}.`;
  const opcoes = falas.filter((f) => f.id.startsWith(prefixo));
  if (!opcoes.length) return null;
  const candidatas = opcoes.length > 1 ? opcoes.filter((f) => f.id !== ultimas[reacao]) : opcoes;
  const f = candidatas[Math.floor(rng() * candidatas.length)];
  return { id: f.id, texto: f.texto, emocao: REACOES[reacao]?.emocao, origem: "fixa" };
}

export function sequenciaDePrimeira(estados) {
  let atual = 0;
  let melhor = 0;
  for (const e of estados) {
    atual = e.resultado === "acerto" && e.primeira ? atual + 1 : 0;
    melhor = Math.max(melhor, atual);
  }
  return melhor;
}

export function resumirRodada(estados, temposMs = []) {
  const acertos = estados.filter((e) => e.resultado === "acerto").length;
  const primeira = estados.filter((e) => e.resultado === "acerto" && e.primeira).length;
  const graves = estados.filter((e) => e.grave).length;
  const tempoMedioS = temposMs.length ? Math.round(temposMs.reduce((a, b) => a + b, 0) / temposMs.length / 1000) : 0;
  return { total: estados.length, acertos, primeira, graves, erros: estados.length - acertos, tempoMedioS, melhorSequenciaPrimeira: sequenciaDePrimeira(estados) };
}

export function xpDaRodada(resumo) {
  return Math.max(10, 10 + resumo.acertos * 3 + resumo.primeira * 2 - resumo.graves * 5);
}

// Nota de 0 a 100 para o histórico.
export function notaDaRodada(resumo) {
  if (!resumo.total) return 0;
  const base = (resumo.acertos / resumo.total) * 100 - resumo.graves * 10;
  return Math.max(0, Math.min(100, Math.round(base)));
}
