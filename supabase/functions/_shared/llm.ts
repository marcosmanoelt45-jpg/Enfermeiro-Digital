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
  // Chave do OpenRouter usada como reserva quando o Gemini falha (nos testes, injetada; em produção vem do env).
  chaveReserva?: string;
  esperaRepeticaoMs?: number;
  fetchImpl?: typeof fetch;
}

export interface RespostaLLM {
  texto: string;
  modelo: string;
  truncado: boolean;
  uso: { entrada: number | null; saida: number | null } | null;
}

// OpenRouter (reserva): modelos rápidos e sem "raciocínio" primeiro.
export const MODELOS_PADRAO = ["openai/gpt-4o-mini", "google/gemini-2.5-flash-lite", "deepseek/deepseek-chat"];
// Modelos do Gemini direto (API compatível com OpenAI do Google AI Studio).
// Apelidos "-latest" primeiro (não são aposentados); os numerados ficam de reserva.
// O lite responde em cerca de 1 s; o flash "pensa" e levou de 10 a 25 s (timeouts). Os gemini-2.5 foram aposentados (404).
// gemini-flash-latest saiu: levava de 10 a 25 s e estourava o tempo. Se o lite falhar, cai no OpenRouter.
export const MODELOS_GEMINI = ["gemini-flash-lite-latest"];

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

let modelosGeminiDescobertos: string[] | null = null;

// Pergunta à conta quais modelos Gemini de texto existem e devolve os melhores, estáveis, do mais novo ao mais antigo.
// Apelidos "-latest" vêm primeiro (nunca são aposentados); depois versões numeradas; "flash" antes de "flash-lite".
export async function descobrirModelosGemini(apiKey: string, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  try {
    const r = await fetchImpl("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      logEvento("llm_listar_modelos_falhou", { status: r.status });
      return [];
    }
    const dados = await r.json();
    return ordenarModelosGemini(dados?.models ?? []);
  } catch (e) {
    logEvento("llm_listar_modelos_excecao", { tipo: e instanceof Error ? e.name : "Erro" });
    return [];
  }
}

// deno-lint-ignore no-explicit-any
export function ordenarModelosGemini(lista: any[]): string[] {
  const ruins = /preview|exp|tts|image|live|audio|thinking|robotics|computer|embedding|aqa|vision|learnlm|gemma|customtools/i;
  const candidatos = lista
    .filter((m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .map((m) => String(m.name ?? "").replace(/^models\//, ""))
    .filter((n) => /^gemini-.*flash/.test(n) && !ruins.test(n));
  const pontos = (n: string) => {
    const alias = /latest$/.test(n) ? 1000 : 0;
    const versao = Number(n.match(/^gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
    const lite = /lite/.test(n) ? -0.5 : 0;
    return alias + versao * 10 + lite;
  };
  return [...new Set(candidatos)].sort((a, b) => pontos(b) - pontos(a));
}

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

  let viu404 = false;
  const tentar = async (lista: string[]): Promise<RespostaLLM | null> => {
  for (const modelo of lista) {
    const inicio = Date.now();
    try {
      const corpo: Record<string, unknown> = {
        model: modelo,
        max_tokens: Math.min(Math.max(maxTokens, 400), 3000),
        temperature: temperatura,
        messages: mensagens,
      };
      if (json) corpo.response_format = { type: "json_object" };
      // Gemini "pensa" por padrão e isso gasta o limite de tokens (JSON cortado): reduz o raciocínio.
      if (provedor === "gemini" && /^gemini-2\.5-flash/.test(modelo)) corpo.reasoning_effort = "none";
      else if (provedor === "gemini" && (/^gemini-3/.test(modelo) || /flash(-lite)?-latest$/.test(modelo))) corpo.reasoning_effort = "low";

      const enviar = (c: Record<string, unknown>) =>
        fetchImpl(ENDPOINTS[provedor], {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...(provedor === "openrouter" ? { "HTTP-Referer": "https://enfermeirodigital.com.br", "X-Title": "Enfere Digital Edge AI" } : {}),
          },
          body: JSON.stringify(c),
          signal: AbortSignal.timeout(timeoutMs),
        });
      let resposta = await enviar(corpo);
      // Se o modelo recusa o parâmetro de raciocínio (400), repete sem ele.
      if (resposta.status === 400 && corpo.reasoning_effort) {
        const { reasoning_effort: _r, ...semRaciocinio } = corpo;
        resposta = await enviar(semRaciocinio);
      }
      // Gemini sobrecarregado (503) costuma passar em menos de 1 s: tenta mais uma vez antes de desistir.
      if (resposta.status === 503 && provedor === "gemini") {
        await new Promise((r) => setTimeout(r, opcoes.esperaRepeticaoMs ?? 700));
        resposta = await enviar(corpo);
      }

      if (!resposta.ok) {
        // Só o status: o corpo do erro pode repetir parte do que foi enviado.
        logEvento("llm_falha", { modelo, status: resposta.status, ms: Date.now() - inicio });
        if (resposta.status === 404) viu404 = true;
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
  return null;
  };

  // Modelos já descobertos nesta instância (ver abaixo) vêm na frente.
  const primeira = await tentar(provedor === "gemini" && !opcoes.modelos && modelosGeminiDescobertos ? modelosGeminiDescobertos : modelos);
  if (primeira) return primeira;

  // Gemini com 404 em todos os modelos: o nome pode ter sido aposentado. Pergunta à própria conta o que existe.
  if (provedor === "gemini" && !opcoes.modelos && viu404) {
    const descobertos = (await descobrirModelosGemini(apiKey, fetchImpl)).filter((m) => !modelos.includes(m)).slice(0, 3);
    if (descobertos.length) {
      logEvento("llm_modelos_descobertos", { modelos: descobertos.join(",") });
      modelosGeminiDescobertos = descobertos;
      const segunda = await tentar(descobertos);
      if (segunda) return segunda;
    }
  }

  // Gemini fora do ar: usa o OpenRouter como reserva, se a chave dele existir.
  const chaveReserva = opcoes.chaveReserva ?? (opcoes.apiKey ? undefined : lerEnv("OPENROUTER_API_KEY"));
  if (provedor === "gemini" && chaveReserva) {
    logEvento("llm_reserva_openrouter", {});
    return chamarLLM({ ...opcoes, provedor: "openrouter", apiKey: chaveReserva, modelos: MODELOS_PADRAO, chaveReserva: undefined });
  }

  throw new ErroApp("IA_INDISPONIVEL", "Todos os modelos de IA falharam.");
}
