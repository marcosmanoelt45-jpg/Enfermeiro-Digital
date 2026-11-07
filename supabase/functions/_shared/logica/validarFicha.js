// Invariantes da ficha-verdade (C7). Devolve { ok, erros[] } com mensagens que podem voltar à IA numa nova tentativa.
import { TEMAS_FATO } from "./regras.js";

const REVELACOES = ["livre", "pergunta_direta", "confianca", "esquecido"];

const FAIXAS_VITAIS = {
  pa_sistolica: [50, 260],
  pa_diastolica: [20, 160],
  fc: [20, 220],
  fr: [4, 70],
  sat: [50, 100],
  tax: [32, 42.5],
  dor: [0, 10],
};

const conta = (fatos, r) => fatos.filter((f) => f.revelacao === r).length;

// Regras de distribuição por dificuldade (tabela de ia/paciente.md e ficha.md) e por personalidade.
// A dificuldade manda: o máximo de "confianca" de colaborativo/ansioso não vale no difícil, e o mínimo de
// "esquecido" da personalidade esquecido não vale no fácil (que proíbe esse tipo).
/**
 * @param {any[]} fatos
 * @param {string} dificuldade
 * @param {string} personalidadeId
 * @returns {string[]}
 */
export function errosDeDistribuicao(fatos, dificuldade, personalidadeId) {
  /** @type {string[]} */
  const erros = [];
  const n = fatos.length;
  const livre = conta(fatos, "livre");
  const direta = conta(fatos, "pergunta_direta");
  const conf = conta(fatos, "confianca");
  const esq = conta(fatos, "esquecido");

  if (dificuldade === "facil") {
    if (livre < n * 0.5) erros.push(`fácil: pelo menos 50% dos fatos devem ser "livre" (há ${livre} de ${n})`);
    if (conf > 1) erros.push(`fácil: no máximo 1 fato "confianca" (há ${conf})`);
    if (esq > 0) erros.push(`fácil: nenhum fato "esquecido" (há ${esq})`);
  } else if (dificuldade === "normal") {
    if (livre < n * 0.2 || livre > n * 0.35) erros.push(`normal: "livre" entre 20% e 35% (há ${livre} de ${n})`);
    if (direta < n * 0.35) erros.push(`normal: pelo menos 35% "pergunta_direta" (há ${direta} de ${n})`);
    if (conf < 1 || conf > 2) erros.push(`normal: 1 a 2 fatos "confianca" (há ${conf})`);
    if (esq > 1) erros.push(`normal: no máximo 1 "esquecido" (há ${esq})`);
  } else if (dificuldade === "dificil") {
    if (livre > n * 0.2) erros.push(`difícil: no máximo 20% "livre" (há ${livre} de ${n})`);
    if (conf < 2 || conf > 3) erros.push(`difícil: 2 a 3 fatos "confianca" (há ${conf})`);
    if (esq < 1 || esq > 2) erros.push(`difícil: 1 a 2 fatos "esquecido" (há ${esq})`);
    if (conf + esq < n * 0.4) erros.push(`difícil: pelo menos 40% "confianca" ou "esquecido" (há ${conf + esq} de ${n})`);
  }

  if ((personalidadeId === "colaborativo" || personalidadeId === "ansioso") && dificuldade !== "dificil" && conf > 1) {
    erros.push(`personalidade ${personalidadeId}: no máximo 1 fato "confianca" (há ${conf})`);
  }
  if (["desconfiado", "envergonhado", "minimizador"].includes(personalidadeId) && conf < 1) {
    erros.push(`personalidade ${personalidadeId}: pelo menos 1 fato "confianca"`);
  }
  if (personalidadeId === "esquecido" && dificuldade !== "facil" && esq < 1) erros.push('personalidade esquecido: pelo menos 1 fato "esquecido"');
  return erros;
}

// opcoes: { arquetipo (vitals, para comparar ±10%), dificuldade, personalidadeId, codigosNanda (Set) }
/**
 * @param {any} ficha
 * @param {any} [opcoes]
 * @returns {{ ok: boolean, erros: string[] }}
 */
export function validarFicha(ficha, opcoes = {}) {
  const { arquetipo = null, dificuldade, personalidadeId, codigosNanda = null } = opcoes;
  const erros = [];
  const fatos = Array.isArray(ficha?.fatos) ? ficha.fatos : [];

  if (fatos.length < 8 || fatos.length > 14) erros.push(`a ficha precisa ter de 8 a 14 fatos (tem ${fatos.length})`);
  fatos.forEach((f, i) => {
    if (f.id !== `f${i + 1}`) erros.push(`ids devem ser sequenciais f1, f2…: o fato ${i + 1} tem id "${f.id}"`);
    if (!TEMAS_FATO.includes(f.tema)) erros.push(`${f.id}: tema inválido "${f.tema}"`);
    if (![1, 2, 3].includes(f.peso)) erros.push(`${f.id}: peso deve ser 1, 2 ou 3`);
    if (!REVELACOES.includes(f.revelacao)) erros.push(`${f.id}: revelacao inválida "${f.revelacao}"`);
    if (!String(f.texto ?? "").trim()) erros.push(`${f.id}: texto vazio`);
    if (!String(f.perguntaQueRevela ?? "").trim()) erros.push(`${f.id}: falta perguntaQueRevela`);
    if (f.revelacao === "confianca") {
      if (!String(f.versaoFalsa ?? "").trim()) erros.push(`${f.id}: fato "confianca" precisa de versaoFalsa`);
      if (!(f.confiancaMin >= 40 && f.confiancaMin <= 85)) erros.push(`${f.id}: confiancaMin deve ficar entre 40 e 85`);
    }
  });

  if (!fatos.some((f) => f.peso === 3 && (f.tema === "alergias" || f.tema === "medicacoes"))) {
    erros.push("falta pelo menos 1 fato de peso 3 sobre alergias ou medicacoes");
  }

  const v = ficha?.sinaisVitais;
  if (!v || typeof v !== "object") erros.push("faltam os sinais vitais");
  else {
    for (const [campo, [min, max]] of Object.entries(FAIXAS_VITAIS)) {
      if (v[campo] == null) continue;
      if (!(v[campo] >= min && v[campo] <= max)) erros.push(`sinal vital fora da faixa fisiológica: ${campo}=${v[campo]}`);
    }
    if (arquetipo?.vitals) {
      for (const [campo, base] of Object.entries(arquetipo.vitals)) {
        if (v[campo] == null) {
          erros.push(`falta o sinal vital ${campo}`);
        } else if (Math.abs(v[campo] - base) > Math.abs(base) * 0.1 + 1e-9) {
          erros.push(`sinal vital ${campo}=${v[campo]} difere mais de 10% do arquétipo (${base})`);
        }
      }
    }
  }

  const dx = ficha?.diagnosticosEsperados;
  if (!Array.isArray(dx) || dx.length < 2 || dx.length > 4) erros.push("diagnosticosEsperados deve ter de 2 a 4 códigos");
  else if (codigosNanda) for (const c of dx) if (!codigosNanda.has(c)) erros.push(`código NANDA inexistente: ${c}`);

  const iv = ficha?.intervencoesEsperadas;
  if (!Array.isArray(iv) || iv.length < 3 || iv.length > 6) erros.push("intervencoesEsperadas deve ter de 3 a 6 itens");

  if (fatos.length) erros.push(...errosDeDistribuicao(fatos, dificuldade, personalidadeId));
  return { ok: erros.length === 0, erros };
}

// Texto das exigências de distribuição para o prompt da ficha.
export function textoDeExigencias(dificuldade, personalidadeId) {
  const base = {
    facil: '8 a 14 fatos; "livre" em pelo menos metade; "confianca" no máximo 1; nenhum "esquecido"; o restante "pergunta_direta"',
    normal: '8 a 14 fatos; "livre" de 20% a 35%; "pergunta_direta" em pelo menos 35%; "confianca" 1 a 2; "esquecido" 0 a 1',
    dificil: '8 a 12 fatos; "livre" em no máximo 20%; "confianca" 2 a 3; "esquecido" 1 a 2; juntos, pelo menos 40% dos fatos',
  }[dificuldade];
  const extra = [];
  if ((personalidadeId === "colaborativo" || personalidadeId === "ansioso") && dificuldade !== "dificil") extra.push('no máximo 1 fato "confianca"');
  if (["desconfiado", "envergonhado", "minimizador"].includes(personalidadeId)) extra.push('pelo menos 1 fato "confianca"');
  if (personalidadeId === "esquecido" && dificuldade !== "facil") extra.push('pelo menos 1 fato "esquecido"');
  return extra.length ? `${base}; ${extra.join("; ")}` : base;
}
