// Prompt da ficha (criar_consulta). O texto do system é o de docs/plano/ia/ficha.md, sem alteração.
import type { MensagemLLM } from "../llm.ts";
// @ts-ignore: módulos JS puros compartilhados com o cliente
import { tendenciasEmTexto } from "../dados/personalidades.js";
// @ts-ignore
import { EXAMES_ROTULOS } from "../dados/examesPorEspecialidade.js";
// @ts-ignore
import { textoDeExigencias } from "../logica/validarFicha.js";

export const PARAMETROS_FICHA = { json: true, temperatura: 0.7, maxTokens: 1800, timeoutMs: 25000 } as const;

export const SYSTEM_FICHA = `Você é roteirista clínico de simulações de enfermagem. Sua tarefa é transformar um caso clínico-base em uma "ficha de paciente" para um paciente simulado conversar com um aluno.

REGRAS CLÍNICAS (obrigatórias)
- Use SOMENTE as informações clínicas do caso-base: doença, história, medicações, alergias e notas. Não acrescente doenças, exames, medicações ou alergias que não estejam no caso-base.
- Você pode acrescentar detalhes de vida coerentes e simples: profissão, com quem mora, rotina, hábitos compatíveis com a história, sentimentos.
- Escreva cada fato como algo que o PACIENTE diria ou sabe, em linguagem leiga e curta (até 20 palavras). Ex.: "parou de tomar o remédio de urina há duas semanas porque fazia levantar de noite".
- Inclua obrigatoriamente: a queixa principal e como começou; alergias (ou a ausência delas); as medicações que usa e como usa (adesão); pelo menos 1 hábito; pelo menos 1 sintoma associado.
- A IDADE e o SEXO são os do bloco PACIENTE. Nunca cite outra idade em nenhum fato. Se o caso-base falar em outra idade, em "jovem" ou em "gestante", adapte a história de vida a essa idade sem mudar a doença.
- O NOME: use exatamente o primeiro nome dado no bloco PACIENTE e invente só um sobrenome brasileiro comum.
- Os fatos de peso 3 são os críticos para segurança e diagnóstico (alergia, medicação crítica, não adesão, sintoma de alarme). Peso 2 é importante e peso 1 é contexto.

REGRAS DE REVELAÇÃO
- "livre": o paciente conta sem ser perguntado, se o assunto surgir.
- "pergunta_direta": só conta se perguntarem sobre o tema.
- "confianca": até a confiança chegar a "confiancaMin", o paciente conta a "versaoFalsa", que deve ser plausível e combinar com a personalidade (quem minimiza diminui; quem tem vergonha nega ou desvia). Use esta regra em fatos sensíveis: não adesão, álcool, fumo, automedicação, situação social.
- "esquecido": o paciente não lembra até o aluno insistir ou buscar outra fonte. Use em datas, nomes de remédio e alergias antigas. Todo fato "esquecido" precisa ter uma fonte plausível para o aluno conseguir a informação: a receita ou o papel do posto que o paciente trouxe na bolsa, a caixinha do remédio, o registro de uma internação anterior no hospital ou um familiar que pode ser chamado por telefone. Inclua em "social" um fato "livre" dizendo quem pode ser contatado (mesmo quem mora sozinho tem um filho, vizinho ou cuidador) e o que o paciente trouxe consigo.
- Para TODOS os fatos, escreva "perguntaQueRevela": uma pergunta aberta e em linguagem simples que um bom enfermeiro faria para obter aquela informação.

SAÍDA
Responda APENAS com JSON válido, sem markdown, exatamente neste formato:
{
  "identificacao": { "nome": "o primeiro nome dado + um sobrenome brasileiro comum, fictício", "ocupacao": "...", "escolaridade": "fundamental|medio|superior", "mora_com": "..." },
  "queixaPrincipal": "em palavras do paciente, até 15 palavras",
  "fatos": [ { "id": "f1", "tema": "hda|antecedentes|medicacoes|alergias|habitos|familia|social|sintomas_associados|adesao|sono|eliminacoes|alimentacao", "texto": "...", "peso": 1|2|3, "revelacao": "livre|pergunta_direta|confianca|esquecido", "confiancaMin": 40-85 (só em confianca), "versaoFalsa": "..." (só em confianca), "perguntaQueRevela": "..." } ],
  "examesDisponiveis": ["ids escolhidos dentre os candidatos"],
  "diagnosticosEsperados": ["2 a 4 códigos escolhidos dentre os candidatos"],
  "intervencoesEsperadas": ["3 a 6 intervenções de enfermagem curtas e específicas"]
}
Entre 8 e 14 fatos, com ids sequenciais f1, f2, …`;

export interface EntradaFicha {
  // deno-lint-ignore no-explicit-any
  arquetipo: any;
  idade: number;
  sexo: "M" | "F";
  nome?: string | null;
  // deno-lint-ignore no-explicit-any
  personalidade: any;
  dificuldade: "facil" | "normal" | "dificil";
  examesCandidatos: string[];
}

export function montarMensagensFicha(e: EntradaFicha): MensagemLLM[] {
  const a = e.arquetipo;
  const user = [
    "CASO-BASE (não altere a clínica):",
    `Doença: ${a.disease}`,
    `Anamnese: ${a.anamnesis}`,
    `História médica: ${a.medicalHistory}`,
    `Medicações: ${a.medications}`,
    `Alergias: ${a.allergies}`,
    `Notas: ${a.notes}`,
    "",
    `PACIENTE: ${e.nome ? `primeiro nome ${e.nome}, ` : ""}${e.idade} anos, sexo ${e.sexo === "F" ? "feminino" : "masculino"}.`,
    `PERSONALIDADE: ${e.personalidade.nome}: ${e.personalidade.descricao} Tendências: ${tendenciasEmTexto(e.personalidade.tendencias)}`,
    `DIFICULDADE: ${e.dificuldade}`,
    `EXIGÊNCIAS DE DISTRIBUIÇÃO: ${textoDeExigencias(e.dificuldade, e.personalidade.id)}`,
    `DIAGNÓSTICOS CANDIDATOS (escolha 2 a 4 códigos): ${a.nandaCandidatos.map((c: { codigo: string; nome: string }) => `${c.codigo} — ${c.nome}`).join("; ")}`,
    `EXAMES CANDIDATOS (escolha 0 a 2 ids): ${e.examesCandidatos.length ? e.examesCandidatos.map((id) => `${id} — ${EXAMES_ROTULOS[id] ?? id}`).join("; ") : "nenhum"}`,
  ].join("\n");
  return [
    { role: "system", content: SYSTEM_FICHA },
    { role: "user", content: user },
  ];
}

// Nova tentativa (uma só): as mesmas mensagens + a resposta anterior + os problemas encontrados.
export function mensagensDeCorrecao(original: MensagemLLM[], respostaAnterior: string, erros: string[]): MensagemLLM[] {
  return [
    ...original,
    { role: "assistant", content: respostaAnterior },
    { role: "user", content: `A ficha tem estes problemas: ${erros.join("; ")}. Corrija e responda só o JSON completo.` },
  ];
}
