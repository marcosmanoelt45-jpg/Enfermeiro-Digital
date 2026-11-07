// Roteiro do Plantão: a enfermeira faz as perguntas em ordem SBAR e o código decide a reação.
// Função pura (sem tela, voz ou rede). Sem IA por turno: as falas da enfermeira são fixas.
import { parseVitalsFromTranscript } from "../../../lib/vitalsParser.js";

// Tolerância de cada sinal vital para a conferência por código.
export const TOLERANCIAS = { pa_sistolica: 5, pa_diastolica: 5, fc: 5, fr: 2, sat: 1, tax: 0.2 };

export function criarRoteiro(cenario) {
  return {
    cenario,
    indice: 0,
    lacunas: {}, // campo -> { valor } quando preenchida pelo minijogo/exame
    respostas: [],
    parcial: null, // { texto, valores } enquanto espera o complemento de números
    finalizado: false,
  };
}

export function perguntaAtual(estado) {
  return estado.finalizado ? null : estado.cenario.perguntas[estado.indice] ?? null;
}

export function lacunasAbertas(estado) {
  return estado.cenario.lacunas.filter((l) => !estado.lacunas[l.campo]);
}

export function preencherLacuna(estado, campo, valor) {
  if (!estado.cenario.lacunas.some((l) => l.campo === campo)) return estado;
  return { ...estado, lacunas: { ...estado.lacunas, [campo]: { valor } } };
}

// "ok" | "errado" | "nao_informado" por campo pedido.
export function conferirNumeros(campos, valoresDoAluno, vitalsDoCenario) {
  const saida = {};
  for (const campo of campos) {
    const dito = valoresDoAluno?.[campo];
    if (dito === undefined || dito === null) saida[campo] = "nao_informado";
    else saida[campo] = Math.abs(dito - vitalsDoCenario[campo]) <= (TOLERANCIAS[campo] ?? 0) + 1e-9 ? "ok" : "errado";
  }
  return saida;
}

function avancar(estado, resposta, reacao) {
  const respostas = [...estado.respostas, resposta];
  const indice = estado.indice + 1;
  const finalizado = indice >= estado.cenario.perguntas.length;
  return { estado: { ...estado, respostas, indice, parcial: null, finalizado }, reacao: finalizado ? "encerrar" : reacao, concluida: finalizado };
}

/**
 * Registra a resposta do aluno à pergunta atual. Devolve { estado, reacao, concluida }.
 * reacao: "ok" | "faltou_numero" | "nao_avaliou" | "encerrar" | null (resposta vazia: nada muda).
 */
export function responder(estado, textoDoAluno, analisar = parseVitalsFromTranscript) {
  const pergunta = perguntaAtual(estado);
  const texto = String(textoDoAluno ?? "").trim();
  if (!pergunta || !texto) return { estado, reacao: null, concluida: false };
  const base = { perguntaId: pergunta.id, letra: pergunta.letra, texto };

  // Pergunta que depende de uma lacuna ainda não examinada.
  if (pergunta.dependeDe && !estado.lacunas[pergunta.dependeDe]) {
    return avancar(estado, { ...base, semAvaliacao: true, dependeDe: pergunta.dependeDe }, "nao_avaliou");
  }

  if (pergunta.espera.tipo === "numero") {
    const agora = analisar(texto);
    const valores = { ...(estado.parcial?.valores ?? {}), ...Object.fromEntries(pergunta.espera.campos.filter((c) => agora[c] != null).map((c) => [c, agora[c]])) };
    const conferencia = conferirNumeros(pergunta.espera.campos, valores, estado.cenario.vitals);
    const faltou = Object.values(conferencia).includes("nao_informado");
    // Uma chance de complementar o que faltou.
    if (faltou && !estado.parcial) {
      return { estado: { ...estado, parcial: { texto, valores } }, reacao: "faltou_numero", concluida: false };
    }
    const textoFinal = estado.parcial ? `${estado.parcial.texto}. ${texto}` : texto;
    return avancar(estado, { ...base, texto: textoFinal, conferenciaNumerica: conferencia }, "ok");
  }

  return avancar(estado, base, "ok");
}

// Respostas no formato da ação avaliar_plantao: [{ perguntaId, letra, texto, conferenciaNumerica, semAvaliacao }].
export function respostasParaAvaliacao(estado) {
  return estado.respostas.map((r) => ({
    perguntaId: r.perguntaId,
    letra: r.letra,
    texto: r.texto,
    ...(r.conferenciaNumerica ? { conferenciaNumerica: r.conferenciaNumerica } : {}),
    ...(r.semAvaliacao ? { semAvaliacao: true } : {}),
  }));
}

// Lacunas no formato da ação: campo -> { avaliada, achado }.
export function lacunasParaAvaliacao(estado) {
  return Object.fromEntries(
    estado.cenario.lacunas.map((l) => [l.campo, { avaliada: Boolean(estado.lacunas[l.campo]), ...(estado.lacunas[l.campo] ? { achado: estado.lacunas[l.campo].valor } : {}) }])
  );
}

// Escolhe uma fala fixa da enfermeira (prefixo plt.r.ok., plt.r.nao_avaliou., ...) sem repetir a anterior.
export function falaDaEnfermeira(reacao, falas, rng = Math.random, ultimas = {}) {
  const opcoes = falas.filter((f) => f.id.startsWith(`plt.r.${reacao}.`));
  if (!opcoes.length) return null;
  const candidatas = opcoes.length > 1 ? opcoes.filter((f) => f.id !== ultimas[reacao]) : opcoes;
  const f = candidatas[Math.floor(rng() * candidatas.length)];
  return { id: f.id, texto: f.texto, origem: "fixa" };
}
