// Ação criar_consulta: escolhe o caso, gera a ficha-verdade (IA, com uma nova tentativa e reserva por
// template), guarda sessão e ficha e devolve só o briefing (o que a equipe sabe).
import { extrairJson } from "../../_shared/llm.ts";
import { logEvento } from "../../_shared/log.ts";
import { ErroApp } from "../../_shared/erros.ts";
// @ts-ignore: módulos JS puros compartilhados
import { buscarArquetipo } from "../../_shared/dados/arquetipos.js";
// @ts-ignore
import { buscarTema } from "../../_shared/dados/temas.js";
// @ts-ignore
import { resolverPersonalidade } from "../../_shared/dados/personalidades.js";
// @ts-ignore
import { CODIGOS_NANDA } from "../../_shared/dados/nanda-codigos.js";
// @ts-ignore
import { examesCandidatos, setorDe } from "../../_shared/dados/examesPorEspecialidade.js";
// @ts-ignore
import { nomeBloqueado } from "../../_shared/dados/bloqueioNomes.js";
// @ts-ignore
import { nomeFicticio } from "../../_shared/dados/nomes.js";
// @ts-ignore
import { arquetipoCompativel, arquetiposDoPaciente, idadeParaCaso, pacienteDaConsulta } from "../../_shared/dados/compatibilidade.js";
// @ts-ignore
import { validarFicha } from "../../_shared/logica/validarFicha.js";
// @ts-ignore
import { fichaDeTemplate } from "../../_shared/logica/fichaDeTemplate.js";
import { mensagensDeCorrecao, montarMensagensFicha, PARAMETROS_FICHA } from "../../_shared/prompts/ficha.ts";
import type { Dependencias, Dificuldade } from "./tipos.ts";

export interface EntradaCriar {
  arquetipoId: string | null;
  tema: string | null;
  idade: number;
  sexo: "M" | "F";
  personagemId: string;
  personalidadeId: string;
  dificuldade: Dificuldade;
  nome?: string | null;
}

// Sinais vitais do arquétipo com variação de ±5%, arredondados. A IA nunca define sinais vitais.
// deno-lint-ignore no-explicit-any
export function variarSinais(vitals: Record<string, number>, sorteio: () => number): Record<string, number> {
  const saida: Record<string, number> = {};
  for (const [campo, base] of Object.entries(vitals)) {
    const fator = 1 + (sorteio() * 2 - 1) * 0.05;
    saida[campo] = campo === "tax" ? Math.round(base * fator * 10) / 10 : Math.round(base * fator);
  }
  return saida;
}

// Junta a resposta da IA com o que só o servidor controla.
// deno-lint-ignore no-explicit-any
export function completarFicha(bruta: any, { arq, entrada, personalidadeId, sinais, sorteio }: any) {
  const id = bruta?.identificacao ?? {};
  let nome = String(id.nome ?? "").trim();
  if (nomeBloqueado(nome)) nome = nomeFicticio(entrada.sexo, sorteio(), sorteio());
  nome = nomeDoPaciente(entrada.nome, nome, entrada.sexo, sorteio);
  return {
    origem: "ia",
    arquetipoId: arq.id,
    identificacao: {
      nome,
      idade: entrada.idade,
      sexo: entrada.sexo,
      ocupacao: id.ocupacao ?? "",
      escolaridade: id.escolaridade ?? "fundamental",
      mora_com: id.mora_com ?? "",
    },
    setor: setorDe(arq.specialty),
    queixaPrincipal: String(bruta?.queixaPrincipal ?? "").trim(),
    sinaisVitais: sinais,
    fatos: Array.isArray(bruta?.fatos) ? bruta.fatos : [],
    examesDisponiveis: (bruta?.examesDisponiveis ?? []).filter((e: string) => examesCandidatos(arq.specialty).includes(e)),
    diagnosticosEsperados: bruta?.diagnosticosEsperados ?? [],
    intervencoesEsperadas: bruta?.intervencoesEsperadas ?? [],
    personalidadeId,
    dificuldade: entrada.dificuldade,
  };
}

// O rosto e a voz do paciente são fixos (Sr. Marcus, Dona Teresinha): o primeiro nome é sempre o dele e só o
// sobrenome vem da IA (ou do sorteio). Sem isso, a foto do Marcus aparecia com o nome "Antonio".
export function nomeDoPaciente(primeiro: string | null | undefined, nomeIA: string, sexo: "M" | "F", sorteio: () => number): string {
  if (!primeiro) return nomeIA;
  const partes = String(nomeIA ?? "").trim().split(/\s+/).filter(Boolean);
  let sobrenome = partes.length > 1 ? partes.slice(1).join(" ") : "";
  if (!sobrenome || nomeBloqueado(`${primeiro} ${sobrenome}`)) sobrenome = nomeFicticio(sexo, sorteio(), sorteio()).split(/\s+/).slice(1).join(" ");
  return `${primeiro} ${sobrenome}`.trim();
}

// Prazo total da IA para montar a ficha; depois disso vale o modelo pronto do caso.
// 20 s: o Gemini leva de 10 a 15 s para a ficha inteira e o app espera até 30 s. Com 12 s a ficha da IA
// quase sempre estourava e a consulta saía do modelo pronto, mais pobre.
export const PRAZO_FICHA_MS = 20000;

export async function criarConsulta(userId: string, entradaOriginal: EntradaCriar, { repo, llm, sorteio = Math.random, prazoFichaMs }: Dependencias) {
  const inicio = Date.now();
  let entrada = entradaOriginal;

  // 1. Escolhe o arquétipo (pedido, sorteado pelo tema, ou qualquer um), sempre entre os que cabem no paciente
  // (sexo e idade). Sem isso dava para escolher "Gestação" para o Sr. Marcus.
  const paciente = pacienteDaConsulta(entrada.personagemId) ?? { nome: null, sexo: entrada.sexo, idadeMin: 18, idadeMax: 95 };
  // deno-lint-ignore no-explicit-any
  let arq: any = entrada.arquetipoId ? buscarArquetipo(entrada.arquetipoId) : null;
  if (entrada.arquetipoId && !arq) throw new ErroApp("ENTRADA_INVALIDA", "Caso clínico desconhecido.");
  if (arq && !arquetipoCompativel(arq, paciente)) throw new ErroApp("ENTRADA_INVALIDA", "Este caso não combina com este paciente.");
  if (!arq) {
    const tema = entrada.tema ? buscarTema(entrada.tema) : null;
    if (entrada.tema && !tema) throw new ErroApp("ENTRADA_INVALIDA", "Tema desconhecido.");
    const candidatos = arquetiposDoPaciente(paciente, tema);
    if (!candidatos.length) throw new ErroApp("ENTRADA_INVALIDA", "Este assunto não combina com este paciente. Escolha outro.");
    arq = candidatos[Math.floor(sorteio() * candidatos.length)];
  }
  if (!arq) throw new ErroApp("ERRO_INTERNO", "Nenhum caso clínico disponível.");
  // A idade e o sexo vêm do paciente e do caso, não do que o app mandou.
  entrada = { ...entrada, sexo: paciente.sexo, idade: idadeParaCaso(arq, paciente, sorteio), nome: paciente.nome };

  // 2. "surpresa" vira uma personalidade real, que só o servidor conhece.
  const personalidade = resolverPersonalidade(entrada.personalidadeId, sorteio());
  if (!personalidade) throw new ErroApp("ENTRADA_INVALIDA", "Personalidade desconhecida.");

  const sinais = variarSinais(arq.vitals, sorteio);
  const exames = examesCandidatos(arq.specialty);
  const mensagens = montarMensagensFicha({ arquetipo: arq, idade: entrada.idade, sexo: entrada.sexo, nome: entrada.nome, personalidade, dificuldade: entrada.dificuldade, examesCandidatos: exames });
  const opcoesValidacao = { arquetipo: arq, dificuldade: entrada.dificuldade, personalidadeId: personalidade.id, codigosNanda: CODIGOS_NANDA };

  // 3. IA -> validação -> uma nova tentativa com os erros -> template.
  let ficha: unknown = null;
  let origem = "template";
  let modelo: string | null = null;
  let tentativas = 0;
  let mensagensAtuais = mensagens;
  // Prazo total para a IA: o aluno não pode esperar mais que isso (o cliente desiste em 30 s).
  // Passou do prazo ou a ficha veio inválida: usa o modelo pronto do caso, que é imediato.
  const prazoFinal = Date.now() + (prazoFichaMs ?? PRAZO_FICHA_MS);
  for (; tentativas < 2 && !ficha; tentativas++) {
    const restante = prazoFinal - Date.now();
    if (restante < 4000) break;
    try {
      const resp = await Promise.race([
        llm({ mensagens: mensagensAtuais, json: PARAMETROS_FICHA.json, temperatura: PARAMETROS_FICHA.temperatura, maxTokens: PARAMETROS_FICHA.maxTokens, timeoutMs: Math.min(PARAMETROS_FICHA.timeoutMs, restante) }),
        new Promise<never>((_, rejeitar) => setTimeout(() => rejeitar(new ErroApp("IA_INDISPONIVEL", "prazo da ficha")), restante)),
      ]);
      modelo = resp.modelo;
      const candidata = completarFicha(extrairJson(resp.texto), { arq, entrada, personalidadeId: personalidade.id, sinais, sorteio });
      const r = validarFicha(candidata, opcoesValidacao);
      if (r.ok) {
        ficha = candidata;
        origem = "ia";
      } else {
        logEvento("ficha_invalida", { tentativa: tentativas + 1, erros: r.erros.length });
        mensagensAtuais = mensagensDeCorrecao(mensagens, resp.texto, r.erros);
      }
    } catch (e) {
      logEvento("ficha_falhou", { tentativa: tentativas + 1, tipo: e instanceof Error ? e.name : "Erro" });
    }
  }
  if (!ficha) {
    ficha = fichaDeTemplate(arq, { idade: entrada.idade, sexo: entrada.sexo, personalidadeId: personalidade.id, dificuldade: entrada.dificuldade, sorteio1: sorteio(), sorteio2: sorteio() });
    // deno-lint-ignore no-explicit-any
    const fi = (ficha as any).identificacao;
    fi.nome = nomeDoPaciente(entrada.nome, fi.nome, entrada.sexo, sorteio);
  }

  // 4. Grava (service role) e devolve só o briefing.
  const sessao = await repo.criarSessao({
    userId,
    personagemId: entrada.personagemId,
    personalidadePublica: entrada.personalidadeId,
    tema: entrada.tema ?? arq.specialty,
    confianca: personalidade.confiancaInicial,
  });
  await repo.salvarFicha(sessao.id, ficha);

  // deno-lint-ignore no-explicit-any
  const f = ficha as any;
  logEvento("consulta_criada", { usuario: userId, sessao: sessao.id, origem, modelo: modelo ?? "nenhum", tentativas, ms: Date.now() - inicio });
  return {
    sessaoId: sessao.id,
    personagemId: entrada.personagemId,
    briefing: {
      nome: f.identificacao.nome,
      idade: f.identificacao.idade,
      sexo: f.identificacao.sexo,
      setor: f.setor,
      queixa: f.queixaPrincipal,
      sinaisVitais: f.sinaisVitais,
    },
  };
}
