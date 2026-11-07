// Chamada resiliente à IA, com a chave só no servidor: Gemini direto (secret GEMINI_API_KEY) ou OpenRouter
// (secret OPENROUTER_API_KEY). O provedor vem de LLM_PROVIDER, ou do que tiver chave (Gemini primeiro).
import { ErroApp } from "./erros.ts";
import { logEvento } from "./log.ts";

export interface MensagemLLM {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpcoesLLM {
  mensagens: MensagemLLM[];
  maxTokens?: number;
  temperatura?: number;
  json?: boolean;
  timeoutMs?: number;
  // Os três abaixo existem para testar sem rede e sem segredos.
  apiKey?: string;
  modelos?: string[];
  provedor?: Provedor;
  fetchImpl?: typeof fetch;
}

export interface RespostaLLM {
  texto: string;
  modelo: string;
  truncado: boolean;
  uso: { entrada: number | null; saida: number | null } | null;
}

export const MODELOS_PADRAO = ["google/gemini-2.5-flash", "openai/gpt-4o-mini", "deepseek/deepseek-chat"];
// Modelos do Gemini direto (API compatível com OpenAI do Google AI Studio).
export const MODELOS_GEMINI = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

export type Provedor = "gemini" | "openrouter";

// Gemini se há GEMINI_API_KEY (ou LLM_PROVIDER=gemini); senão OpenRouter. LLM_PROVIDER força um dos dois.
export function escolherProvedor(forcado: string | undefined, temChaveGemini: boolean): Provedor {
  const f = (forcado ?? "").trim().toLowerCase();
  if (f === "gemini" || f === "openrouter") return f;
  return temChaveGemini ? "gemini" : "openrouter";
}

const ENDPOINTS: Record<Provedor, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

// A ordem dos modelos pode ser trocada pelo env LLM_MODELOS (lista separada por vírgula).
export function modelosConfigurados(csv: string | undefined): string[] {
  const lista = (csv ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  return lista.length ? lista : MODELOS_PADRAO;
}

// Tira a cerca de código (```json) e pega do primeiro `{` ao último `}`. Se não der para ler, IA_INDISPONIVEL.
export function extrairJson(texto: string): unknown {
  const semCerca = String(texto ?? "").replace(/```(?:json)?/gi, "");
  const inicio = semCerca.indexOf("{");
  const fim = semCerca.lastIndexOf("}");
  if (inicio < 0 || fim <= inicio) {
    throw new ErroApp("IA_INDISPONIVEL", "A IA não devolveu um JSON válido.");
  }
  try {
    return JSON.parse(semCerca.slice(inicio, fim + 1));
  } catch {
    throw new ErroApp("IA_INDISPONIVEL", "A IA devolveu um JSON inválido.");
  }
}

// deno-lint-ignore no-explicit-any
const lerEnv = (nome: string): string | undefined => (globalThis as any).Deno?.env?.get(nome);

export async function chamarLLM(opcoes: OpcoesLLM): Promise<RespostaLLM> {
  const {
    mensagens,
    maxTokens = 1500,
    temperatura = 0.3,
    json = false,
    timeoutMs = 12000,
    fetchImpl = fetch,
  } = opcoes;

  // Com `apiKey` injetada (testes) o padrão continua OpenRouter, a menos que `provedor` diga outro.
  const provedor: Provedor = opcoes.provedor ?? (opcoes.apiKey ? "openrouter" : escolherProvedor(lerEnv("LLM_PROVIDER"), Boolean(lerEnv("GEMINI_API_KEY"))));
  const apiKey = opcoes.apiKey ?? lerEnv(provedor === "gemini" ? "GEMINI_API_KEY" : "OPENROUTER_API_KEY");
  if (!apiKey) throw new ErroApp("IA_INDISPONIVEL", "Chave da IA não configurada no servidor.");
  const csv = lerEnv("LLM_MODELOS");
  const modelos = opcoes.modelos ?? (provedor === "gemini" ? (csv?.trim() ? modelosConfigurados(csv) : MODELOS_GEMINI) : modelosConfigurados(csv));

  for (const modelo of modelos) {
    const inicio = Date.now();
    try {
      const corpo: Record<string, unknown> = {
        model: modelo,
        max_tokens: Math.min(Math.max(maxTokens, 400), 3000),
        temperature: temperatura,
        messages: mensagens,
      };
      if (json) corpo.response_format = { type: "json_object" };
      // Gemini 2.5 "pensa" por padrão e isso gasta o limite de tokens (JSON cortado): desliga o raciocínio.
      if (provedor === "gemini" && /^gemini-2\.5-flash/.test(modelo)) corpo.reasoning_effort = "none";

      const resposta = await fetchImpl(ENDPOINTS[provedor], {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(provedor === "openrouter" ? { "HTTP-Referer": "https://enfermeirodigital.com.br", "X-Title": "Enfere Digital Edge AI" } : {}),
        },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!resposta.ok) {
        // Só o status: o corpo do erro pode repetir parte do que foi enviado.
        logEvento("llm_falha", { modelo, status: resposta.status, ms: Date.now() - inicio });
        continue;
      }

      const dados = await resposta.json();
      const escolha = dados?.choices?.[0];
      const texto = String(escolha?.message?.content ?? "").trim();
      if (!texto) {
        logEvento("llm_vazio", { modelo, ms: Date.now() - inicio });
        continue;
      }

      const truncado = escolha?.finish_reason === "length";
      logEvento("llm_ok", { modelo, truncado, ms: Date.now() - inicio });
      return {
        texto, // não acrescenta nota quando trunca: só marca `truncado`
        modelo,
        truncado,
        uso: dados?.usage
          ? { entrada: dados.usage.prompt_tokens ?? null, saida: dados.usage.completion_tokens ?? null }
          : null,
      };
    } catch (e) {
      const nome = e instanceof Error ? e.name : "Erro";
      logEvento("llm_excecao", { modelo, tipo: nome, ms: Date.now() - inicio });
    }
  }

  throw new ErroApp("IA_INDISPONIVEL", "Todos os modelos de IA falharam.");
}
