// Notas da consulta, calculadas por CÓDIGO (C10). A IA só pontua critérios de 0 a 2 com evidência;
// as notas finais saem destas fórmulas, então são estáveis e explicáveis.

/** Anamnese = round(100 × Σpeso(revelados) / Σpeso(todos)). */
export function notaAnamnese(fatos, reveladosIds) {
  const rev = new Set(reveladosIds);
  const total = fatos.reduce((s, f) => s + f.peso, 0);
  if (!total) return 0;
  const ganho = fatos.filter((f) => rev.has(f.id)).reduce((s, f) => s + f.peso, 0);
  return Math.round((100 * ganho) / total);
}

/** Segurança = (alergias? 40) + (medicações? 40) + (identificou? 20). */
export function notaSeguranca({ identificou, alergias, medicacoes }) {
  return (alergias ? 40 : 0) + (medicacoes ? 40 : 0) + (identificou ? 20 : 0);
}

// Segurança a partir da ficha e do que foi revelado: alergias e medicações (ou adesão) descobertas,
// e identificação do paciente conferida (tema "identificacao" perguntado ao menos uma vez).
export function segurancaDaSessao(fatos, reveladosIds, contagemTemas = {}) {
  const rev = new Set(reveladosIds);
  const doTema = (t) => fatos.some((f) => f.tema === t && rev.has(f.id));
  return {
    identificou: (contagemTemas.identificacao ?? 0) > 0,
    alergias: doTema("alergias"),
    medicacoes: doTema("medicacoes") || doTema("adesao"),
  };
}

/** Comunicação = round(100 × Σ(8 critérios, 0 a 2) / 16). */
export function notaComunicacao(criterios) {
  const soma = Object.values(criterios).reduce((s, c) => s + (Number(c?.nota) || 0), 0);
  return Math.round((100 * soma) / 16);
}

/** Nota da IA no raciocínio = round(100 × Σ(3 critérios, 0 a 2) / 6). */
export function notaIaRaciocinio(criterios) {
  const soma = Object.values(criterios).reduce((s, c) => s + (Number(c?.nota) || 0), 0);
  return Math.round((100 * soma) / 6);
}

// Separa os diagnósticos escolhidos em certos, faltando e extras. "Extra sem relação" é o que nem
// sequer está entre os candidatos do caso (os extras plausíveis não são punidos).
/**
 * @param {{ esperados: string[], escolhidos: string[], candidatos?: string[] }} p
 */
export function classificarDiagnosticos({ esperados, escolhidos, candidatos = [] }) {
  const esp = new Set(esperados);
  const esc = [...new Set(escolhidos)];
  const cand = new Set(candidatos);
  const certos = esc.filter((c) => esp.has(c));
  const extras = esc.filter((c) => !esp.has(c));
  return {
    certos,
    faltando: esperados.filter((c) => !esc.includes(c)),
    extras,
    extrasSemRelacao: extras.filter((c) => !cand.has(c)),
  };
}

/** Raciocínio = round(70 × certos/esperados + 30 × notaIA/100) − 10 × extrasSemRelação, mínimo 0.
 *  Sem a IA, a parte de código vale 100%: round(100 × certos/esperados) − penalidade. */
/**
 * @param {{ certos: number, esperados: number, notaIA?: number | null, extrasSemRelacao?: number }} p
 */
export function notaRaciocinio({ certos, esperados, notaIA = null, extrasSemRelacao = 0 }) {
  const parteCodigo = esperados ? certos / esperados : 0;
  const bruto = notaIA === null ? Math.round(100 * parteCodigo) : Math.round(70 * parteCodigo + 30 * (notaIA / 100));
  return Math.max(0, bruto - 10 * extrasSemRelacao);
}

/** Geral = round(0,35 anamnese + 0,25 comunicação + 0,2 segurança + 0,2 raciocínio).
 *  Sem comunicação (IA fora do ar), os outros três pesos são renormalizados. */
/**
 * @param {{ anamnese: number, comunicacao?: number | null, seguranca: number, raciocinio: number }} p
 */
export function notaGeral({ anamnese, comunicacao = null, seguranca, raciocinio }) {
  if (comunicacao === null) return Math.round((0.35 * anamnese + 0.2 * seguranca + 0.2 * raciocinio) / 0.75);
  return Math.round(0.35 * anamnese + 0.25 * comunicacao + 0.2 * seguranca + 0.2 * raciocinio);
}

const ROTULOS_TEMA = {
  hda: "a queixa e como começou", antecedentes: "doenças e internações anteriores", medicacoes: "medicações", alergias: "alergias",
  habitos: "hábitos", familia: "a família", social: "a vida social", sintomas_associados: "outros sintomas", adesao: "como toma os remédios",
  sono: "o sono", eliminacoes: "as eliminações", alimentacao: "a alimentação",
};

/** Por que um fato ficou escondido (gerado por código, a partir da regra e do estado final). */
export function motivoNaoRevelado(fato, { confiancaFinal, contagemTemas = {} }) {
  const rotulo = ROTULOS_TEMA[fato.tema] ?? fato.tema;
  const perguntou = contagemTemas[fato.tema] ?? 0;
  if (fato.revelacao === "confianca") {
    if (confiancaFinal < fato.confiancaMin) return `Precisava de mais confiança (chegou a ${confiancaFinal}, eram necessários ${fato.confiancaMin}).`;
    return perguntou ? `A confiança já bastava, mas a pergunta sobre ${rotulo} não foi específica o bastante.` : `Você não perguntou sobre ${rotulo}.`;
  }
  if (fato.revelacao === "esquecido") {
    return perguntou >= 2 ? `O paciente já lembraria, mas faltou perguntar de novo sobre ${rotulo}.` : `Ele não lembrava de primeira: era preciso insistir mais de uma vez sobre ${rotulo} (você perguntou ${perguntou}).`;
  }
  return `Você não perguntou sobre ${rotulo}.`;
}

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Uma citação só vale se o turno existe, é do ALUNO e o trecho está contido no texto dele
 *  (sem acento, sem diferenciar maiúsculas, com espaços colapsados). Trecho vazio é "sem citação". */
export function citacaoValida(turnos, ordem, trecho) {
  const t = norm(trecho);
  if (!t) return false;
  const turno = turnos.find((x) => x.ordem === ordem);
  return Boolean(turno && turno.autor === "aluno" && norm(turno.texto).includes(t));
}

// Remove citações inventadas, mantendo as notas. Devolve a avaliação limpa e a contagem de citações ruins.
export function limparCitacoes(avaliacao, turnos) {
  let total = 0;
  let invalidas = 0;
  const confere = (item) => {
    if (!item || !String(item.trecho ?? "").trim()) return item;
    total++;
    if (citacaoValida(turnos, item.turno, item.trecho)) return item;
    invalidas++;
    return { ...item, trecho: "", turno: null };
  };
  const comunicacao = Object.fromEntries(Object.entries(avaliacao.comunicacao ?? {}).map(([k, v]) => [k, confere(v)]));
  const fortes = (avaliacao.pontos_fortes ?? []).map(confere).filter((p) => p.trecho);
  const melhorar = (avaliacao.melhorar ?? []).map(confere);
  return { avaliacao: { ...avaliacao, comunicacao, pontos_fortes: fortes, melhorar }, total, invalidas };
}
