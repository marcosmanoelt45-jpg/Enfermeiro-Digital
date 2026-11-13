// Erros e respostas no formato do contrato C5: HTTP 4xx/5xx com `{ erro: { codigo, mensagem } }`.
import { corsHeaders } from "./cors.ts";

export type CodigoErro =
  | "NAO_AUTENTICADO"
  | "SESSAO_DEMO"
  | "COTA_EXCEDIDA"
  | "ENTRADA_INVALIDA"
  | "SESSAO_ENCERRADA"
  | "TURNO_DUPLICADO"
  | "IA_INDISPONIVEL"
  | "SEM_PERMISSAO"
  | "NAO_ENCONTRADO"
  | "CONFLITO"
  | "ERRO_INTERNO";

export const STATUS_POR_CODIGO: Record<CodigoErro, number> = {
  NAO_AUTENTICADO: 401,
  SESSAO_DEMO: 403,
  COTA_EXCEDIDA: 429,
  ENTRADA_INVALIDA: 400,
  SESSAO_ENCERRADA: 409,
  TURNO_DUPLICADO: 200, // idempotência: a interface recebe a resposta já salva, sem erro
  IA_INDISPONIVEL: 503,
  SEM_PERMISSAO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  ERRO_INTERNO: 500,
};

export class ErroApp extends Error {
  codigo: CodigoErro;
  status: number;

  constructor(codigo: CodigoErro, mensagem: string, status?: number) {
    super(mensagem);
    this.name = "ErroApp";
    this.codigo = codigo;
    this.status = status ?? STATUS_POR_CODIGO[codigo];
  }
}

export function corpoDeErro(codigo: CodigoErro, mensagem: string) {
  return { erro: { codigo, mensagem } };
}

const JSON_CORS = { ...corsHeaders, "Content-Type": "application/json" };

export function erro(codigo: CodigoErro, mensagem: string, status?: number): Response {
  return new Response(JSON.stringify(corpoDeErro(codigo, mensagem)), {
    status: status ?? STATUS_POR_CODIGO[codigo],
    headers: JSON_CORS,
  });
}

export function ok(dados: unknown, status = 200): Response {
  return new Response(JSON.stringify(dados), { status, headers: JSON_CORS });
}

// Converte qualquer exceção em resposta. Erro que não é nosso vira ERRO_INTERNO sem vazar detalhes.
export function erroDeExcecao(e: unknown): Response {
  if (e instanceof ErroApp) return erro(e.codigo, e.message, e.status);
  return erro("ERRO_INTERNO", "Erro interno no servidor.");
}
