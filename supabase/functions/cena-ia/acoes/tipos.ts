// Contratos internos da função cena-ia. As ações só falam com o banco e com a IA por estas interfaces,
// o que permite testá-las no Node com um repositório em memória e uma IA falsa.
import type { OpcoesLLM, RespostaLLM } from "../../_shared/llm.ts";

export type Dificuldade = "facil" | "normal" | "dificil";

export interface SessaoDb {
  id: string;
  user_id: string;
  personagem_id: string;
  personalidade_publica: string;
  tema: string | null;
  status: "ativa" | "encerrada";
  turnos_aluno: number;
  confianca: number;
  contagem_temas: Record<string, number>;
  notas_memoria: string[];
}

export interface TurnoDb {
  id: string;
  ordem: number;
  autor: "aluno" | "paciente";
  texto: string;
  canal?: string | null;
  emocao?: string | null;
  revelados?: string[];
  confianca_depois?: number | null;
}

export interface RegistroTurno {
  sessaoId: string;
  turnoAlunoId: string;
  textoAluno: string;
  canal: string;
  fala: string;
  emocao: string;
  revelados: string[];
  confianca: number;
  contagemTemas: Record<string, number>;
  notas: string[];
}

export interface Repositorio {
  criarSessao(d: { userId: string; personagemId: string; personalidadePublica: string; tema: string | null; confianca: number }): Promise<{ id: string }>;
  salvarFicha(sessaoId: string, ficha: unknown): Promise<void>;
  carregarSessao(sessaoId: string, userId: string): Promise<SessaoDb | null>;
  // deno-lint-ignore no-explicit-any
  carregarFicha(sessaoId: string): Promise<any | null>;
  carregarTurnos(sessaoId: string): Promise<TurnoDb[]>;
  // Turno do aluno já gravado com este id (idempotência) e a resposta do paciente que veio depois dele.
  respostaSalva(turnoId: string, sessaoId: string): Promise<{ fala: string; emocao: string; confianca: number; turnosAluno: number } | null>;
  // false = o turno já existia (nada foi gravado).
  registrarTurno(r: RegistroTurno): Promise<boolean>;
}

export type ChamarLLM = (o: OpcoesLLM) => Promise<RespostaLLM>;

export interface Dependencias {
  repo: Repositorio;
  llm: ChamarLLM;
  // Sorteios injetáveis (0 <= n < 1) para testar sem acaso.
  sorteio?: () => number;
  agora?: () => number;
}

export const MAX_TURNOS_ALUNO = 40;
