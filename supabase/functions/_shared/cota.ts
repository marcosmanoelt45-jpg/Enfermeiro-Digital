// Cota diária por aluno e por tipo de uso, guardada no banco (RPC `consumir_cota`, migration 010).
// DESLIGADA por enquanto: o app é gratuito e sem limites. Para ligar de novo, defina o secret COTAS_ATIVAS=1.
import { ErroApp } from "./erros.ts";

export type TipoCota = "llm" | "consulta" | "turno" | "stt" | "voz" | "avaliacao";

export const TIPOS_DE_COTA: TipoCota[] = ["llm", "consulta", "turno", "stt", "voz", "avaliacao"];

// Valores padrão (decisão D6 do plano). `turno` vale por dia (5 consultas de 40 falas); o limite de 40 falas
// por sessão fica na própria sessão (F3). `stt` conta minutos. `voz` e `avaliacao` não estavam na D6.
const PADROES: Record<TipoCota, number> = {
  consulta: 5,
  turno: 200,
  stt: 20,
  llm: 60,
  voz: 200,
  avaliacao: 10,
};

function lerEnvDoDeno(nome: string): string | undefined {
  // deno-lint-ignore no-explicit-any
  return (globalThis as any).Deno?.env?.get(nome);
}

// O limite pode ser trocado pelo env `COTA_<TIPO>` (ex.: COTA_LLM=3 para testar). Valor inválido é ignorado.
export function limiteDe(tipo: TipoCota, lerEnv: (nome: string) => string | undefined = lerEnvDoDeno): number {
  const bruto = lerEnv(`COTA_${tipo.toUpperCase()}`);
  if (bruto === undefined || bruto.trim() === "") return PADROES[tipo];
  const n = Number(bruto);
  return Number.isInteger(n) && n >= 0 ? n : PADROES[tipo];
}

export const LIMITES: Record<TipoCota, number> = Object.fromEntries(
  TIPOS_DE_COTA.map((tipo) => [tipo, limiteDe(tipo)]),
) as Record<TipoCota, number>;

export function mensagemDaCota(tipo: TipoCota, limite: number): string {
  switch (tipo) {
    case "consulta":
      return `Você usou suas ${limite} consultas de hoje. Volta amanhã!`;
    case "stt":
      return "Você usou seus minutos de transcrição de hoje. Volta amanhã!";
    case "llm":
      return "Você atingiu o limite diário de uso da IA. Volta amanhã!";
    default:
      return "Você atingiu o limite de hoje. Volta amanhã!";
  }
}

// Só o que a função precisa do cliente do Supabase (facilita testar sem banco).
export interface ClienteRpc {
  rpc(
    nome: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

// Consome `qtd` da cota. Se passar do limite lança COTA_EXCEDIDA; se o banco falhar, IA_INDISPONIVEL.
export function cotasAtivas(lerEnv: (nome: string) => string | undefined = lerEnvDoDeno): boolean {
  return lerEnv("COTAS_ATIVAS")?.trim() === "1";
}

export async function consumirCota(
  supabaseUsuario: ClienteRpc,
  tipo: TipoCota,
  limite: number,
  qtd = 1,
  ativas: boolean = cotasAtivas(),
): Promise<void> {
  if (!ativas) return; // sem limites: nem chama o banco
  const { data, error } = await supabaseUsuario.rpc("consumir_cota", {
    p_tipo: tipo,
    p_limite: limite,
    p_qtd: qtd,
  });
  if (error) {
    throw new ErroApp("IA_INDISPONIVEL", "Não foi possível conferir o seu limite de uso agora.");
  }
  if (data !== true) {
    throw new ErroApp("COTA_EXCEDIDA", mensagemDaCota(tipo, limite));
  }
}
