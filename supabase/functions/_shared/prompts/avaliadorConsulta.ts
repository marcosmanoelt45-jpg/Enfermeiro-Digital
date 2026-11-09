// Prompt do avaliador (finalizar_consulta). O texto do system é o de docs/plano/ia/avaliador-consulta.md, sem alteração.
// A IA só pontua critérios de 0 a 2 com evidência; as notas finais saem de pontuacao.js.
// Este prompt recebe a ficha INTEIRA; o do paciente recebe a ficha sem as respostas (não misture).
import type { MensagemLLM } from "../llm.ts";

export const PARAMETROS_AVALIADOR = { json: true, temperatura: 0.2, maxTokens: 1200, timeoutMs: 25000 } as const;

export const CRITERIOS_COMUNICACAO = ["apresentacao", "perguntas_abertas", "escuta", "empatia", "linguagem", "organizacao", "confianca", "fechamento"] as const;
export const CRITERIOS_RACIOCINIO = ["achados_coerentes", "diagnosticos_sustentados", "intervencoes_seguras"] as const;

export const SYSTEM_AVALIADOR = `Você é preceptor(a) de enfermagem e avalia a COMUNICAÇÃO e o RACIOCÍNIO de um aluno numa anamnese simulada. Seja justo, específico e construtivo. Avalie apenas o que está nos turnos; nunca suponha falas que não existem.
Julgue pelo SENTIDO, não por palavras exatas: aceite as palavras do próprio aluno, sinônimos, abreviações e frases livres, sem exigir termos técnicos. Dê 1 quando a ideia aparece, mesmo incompleta; 2 quando está clara e consistente; 0 só quando está ausente ou errada. Não dê 2 sem evidência.

COMUNICAÇÃO: dê 0, 1 ou 2 para cada critério:
1. apresentacao: apresentou-se (nome e função) e confirmou a identificação do paciente.
2. perguntas_abertas: usou perguntas abertas no início e para explorar a queixa, sem só "sim/não".
3. escuta: retomou ou aproveitou o que o paciente disse; não ignorou pistas.
4. empatia: reconheceu sentimentos, desconforto ou preocupações do paciente.
5. linguagem: usou linguagem simples ou explicou termos técnicos.
6. organizacao: seguiu uma sequência lógica (queixa → história → antecedentes/medicações/alergias → hábitos).
7. confianca: criou um ambiente de confiança (explicou por que perguntava, não julgou, não apressou).
8. fechamento: resumiu ou checou entendimento e explicou o que viria a seguir.
0 = ausente; 1 = parcial ou inconsistente; 2 = claro e consistente.

RACIOCÍNIO: dê 0, 1 ou 2:
1. achados_coerentes: a evolução (achados) que o aluno escreveu bate com o que foi dito na conversa, mesmo escrita do jeito dele.
2. diagnosticos_sustentados: os diagnósticos escolhidos têm evidência no que foi descoberto.
3. intervencoes_seguras: as intervenções são coerentes, seguras e específicas para o caso.

EVIDÊNCIAS
- Para cada critério com nota 2 ou 0, cite UM trecho literal curto (até 15 palavras) de uma fala DO ALUNO, com o número do turno. Copie o trecho exatamente como está escrito. Se não houver fala para citar (critério ausente), deixe "trecho" vazio.
- Escolha até 3 "pontos_fortes" e até 3 "melhorar". Cada "melhorar" traz uma "sugestao": a frase que o aluno poderia ter dito, em linguagem natural.

SAÍDA: apenas JSON válido, sem markdown:
{
  "comunicacao": { "<criterio>": { "nota": 0|1|2, "turno": número|null, "trecho": "..." } , ... os 8 },
  "raciocinio":  { "<criterio>": { "nota": 0|1|2, "comentario": "uma frase" } , ... os 3 },
  "pontos_fortes": [ { "turno": n, "trecho": "...", "porque": "uma frase" } ],
  "melhorar": [ { "turno": n|null, "trecho": "...", "sugestao": "...", "porque": "uma frase" } ],
  "comentario_geral": "2 frases, tom encorajador e direto"
}`;

export interface EntradaAvaliador {
  // deno-lint-ignore no-explicit-any
  ficha: any;
  personalidadeNome: string;
  turnos: Array<{ ordem: number; autor: "aluno" | "paciente"; texto: string }>;
  descobertos: Array<{ id: string; texto: string }>;
  escondidos: Array<{ id: string; texto: string }>;
  diagnosticos: { certos: string[]; faltando: string[]; extras: string[] };
  registro: { achados: string; diagnosticos: string[]; intervencoes: string[]; examesFeitos?: Array<{ minijogoId: string; resultado?: unknown }>; indicadores?: Array<{ codigo: string; fatores: string[]; caracteristicas: string[] }> };
  nomeDx: (codigo: string) => string;
}

// A numeração da conversa é por TURNO DE ALUNO (T1, T2...), a mesma que a validação das citações usa:
// aqui `ordem` do banco é por mensagem, então convertemos para o número do turno do aluno.
export function numerarTurnos(turnos: EntradaAvaliador["turnos"]): Array<{ numero: number; autor: "aluno" | "paciente"; texto: string; ordem: number }> {
  let n = 0;
  return turnos.map((t) => {
    if (t.autor === "aluno") n++;
    return { numero: Math.max(1, n), autor: t.autor, texto: t.texto, ordem: t.ordem };
  });
}

export function montarMensagensAvaliador(e: EntradaAvaliador): MensagemLLM[] {
  const f = e.ficha;
  const conversa = numerarTurnos(e.turnos).map((t) => `T${t.numero} ${t.autor === "aluno" ? "ALUNO" : "PACIENTE"}: ${t.texto}`).join("\n");
  const lista = (itens: Array<{ id: string; texto: string }>) => (itens.length ? itens.map((i) => `[${i.id}] ${i.texto}`).join("; ") : "nenhum");
  const dx = (cods: string[]) => (cods.length ? cods.map((c) => `${c} ${e.nomeDx(c)}`).join("; ") : "nenhum");
  const user = [
    "CASO (verdade completa):",
    `Queixa: ${f.queixaPrincipal}`,
    `Fatos: ${f.fatos.map((x: { id: string; tema: string; texto: string; peso: number }) => `[${x.id}] (${x.tema}, peso ${x.peso}) ${x.texto}`).join(" | ")}`,
    `Diagnósticos esperados: ${dx(f.diagnosticosEsperados)}`,
    `Intervenções esperadas: ${f.intervencoesEsperadas.join("; ")}`,
    "",
    `PERSONALIDADE DO PACIENTE: ${e.personalidadeNome}: isso explica respostas curtas ou evasivas; não penalize o aluno pela personalidade, só pela forma de lidar com ela.`,
    "",
    "CONVERSA (numerada):",
    conversa,
    "",
    "O QUE O CÓDIGO JÁ CALCULOU (não recalcule):",
    `- fatos descobertos: ${lista(e.descobertos)}; não descobertos: ${lista(e.escondidos)}`,
    `- diagnósticos certos: ${dx(e.diagnosticos.certos)}; faltando: ${dx(e.diagnosticos.faltando)}; extras: ${dx(e.diagnosticos.extras)}`,
    "",
    "REGISTRO DO ALUNO:",
    `- achados: ${e.registro.achados || "(vazio)"}`,
    `- diagnósticos: ${dx(e.registro.diagnosticos)}`,
    ...(e.registro.indicadores ?? []).map((i) => `  - ${i.codigo}: fatores ${i.fatores.length ? i.fatores.join("; ") : "(nenhum)"} | características ${i.caracteristicas.length ? i.caracteristicas.join("; ") : "(nenhuma)"}`),
    `- intervenções: ${e.registro.intervencoes.length ? e.registro.intervencoes.join("; ") : "(nenhuma)"}`,
    `- exames feitos à beira do leito: ${e.registro.examesFeitos?.length ? e.registro.examesFeitos.map((x) => `${x.minijogoId}: ${typeof x.resultado === "string" ? x.resultado : JSON.stringify(x.resultado ?? "")}`).join("; ") : "(nenhum)"}`,
  ].join("\n");
  return [
    { role: "system", content: SYSTEM_AVALIADOR },
    { role: "user", content: user },
  ];
}
