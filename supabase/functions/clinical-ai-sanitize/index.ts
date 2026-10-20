// ==============================================================================
// clinical-ai-sanitize/index.ts
// Supabase Edge Function: Blindagem LGPD, Autenticação JWT, Rate Limiting & IA
// Resolução CFM nº 2.454/2026 e Resolução COFEN nº 736/2024
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ------------------------------------------------------------------------------
// 1. Sanitização e DLP Server-Side (LGPD)
// ------------------------------------------------------------------------------
function sanitizeClinicalText(text: unknown): string {
  if (!text) return "";
  let clean = String(text);

  // CPF (11 dígitos, pontuados ou contínuos)
  clean = clean.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF_MASCARADO]");

  // CNS - Cartão Nacional de Saúde (15 dígitos)
  clean = clean.replace(/\b[1278]\d{14}\b/g, "[CNS_MASCARADO]");

  // RG
  clean = clean.replace(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dX]\b/gi, "[RG_MASCARADO]");

  // Leitos, quartos, enfermarias, boxes
  clean = clean.replace(/\b(leito|quarto|enfermaria|box|apto|apartamento)\s*([0-9]+[a-zA-Z]?)\b/gi, "[LEITO_MASCARADO]");

  // Telefones
  clean = clean.replace(/\b(\(?\d{2}\)?\s*)?(9?\d{4}[-.\s]?\d{4})\b/g, "[TEL_MASCARADO]");

  return clean;
}

// ------------------------------------------------------------------------------
// 2. Rate Limiting em Memória (por usuário)
// ------------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 30; // máximo de 30 requisições por janela
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // janela de 1 minuto

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// ------------------------------------------------------------------------------
// 3. System Prompt Padrão para Plano NANDA-I / NIC / NOC
// ------------------------------------------------------------------------------
const CARE_PLAN_SYSTEM_PROMPT = `Você é um Sistema de Apoio à Decisão Clínica (SADC) especializado em enfermagem fundamentado estritamente na Taxonomia NANDA-I (13ª Edição 2024-2026), Intervenções NIC e Resultados NOC (5ª edição).
Você receberá dados clínicos desidentificados e anonimizados de um paciente.

DIRETRIZES FUNDAMENTAIS:
1. PRIVACIDADE E RETENÇÃO ZERO: Nenhum dado fornecido pode ser armazenado para treinamento.
2. RIGOR TAXONÔMICO: Utilize exclusivamente códigos e nomenclaturas oficiais NANDA-I, NIC e NOC.
3. HUMAN-IN-THE-LOOP: O retorno é uma sugestão de apoio técnico e deve ser submetido à revisão e assinatura do enfermeiro responsável.

Retorne SEMPRE em formato JSON com o seguinte esquema:
{
  "resumo": "Síntese clínica objetiva do caso",
  "prioridade": "alta" | "moderada" | "baixa",
  "diagnosticos": [
    {
      "code": "Código NANDA-I (ex: 00047)",
      "title": "Título oficial do diagnóstico",
      "domain": "Domínio",
      "class": "Classe",
      "defining_characteristics": ["..."],
      "related_factors": ["..."],
      "interventions": [
        { "code": "Código NIC", "title": "Título", "description": "Descrição da conduta" }
      ],
      "outcomes": [
        { "code": "Código NOC", "title": "Título", "description": "Indicador esperado" }
      ]
    }
  ]
}`;

// ------------------------------------------------------------------------------
// 4. Chamada Resiliente ao OpenRouter no Servidor
// ------------------------------------------------------------------------------
async function callOpenRouterBackend({
  apiKey,
  systemPrompt,
  userPrompt,
  maxTokens = 1500,
  temperature = 0.3,
  isJson = false,
}: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  isJson?: boolean;
}) {
  const models = [
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini",
    "deepseek/deepseek-chat",
  ];

  for (const model of models) {
    try {
      const payload: Record<string, unknown> = {
        model,
        max_tokens: Math.min(Math.max(maxTokens, 400), 3000),
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      };

      if (isJson) {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://enfermeirodigital.com.br",
          "X-Title": "Enfere Digital Edge AI",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Edge AI] Modelo ${model} falhou (${response.status}):`, errText);
        continue;
      }

      const jsonResp = await response.json();
      const choice = jsonResp?.choices?.[0];
      const text = choice?.message?.content || "";
      const finishReason = choice?.finish_reason || "stop";

      let treatedText = text.trim();
      if (finishReason === "length") {
        console.warn("[Edge AI] Resposta truncada por limite de tokens (finish_reason = length).");
        treatedText += "\n\n*(Nota: Resposta atingiu o limite de extensão configurado).*";
      }

      return {
        text: treatedText,
        finishReason,
        truncated: finishReason === "length",
        provider: `OpenRouter (${model})`,
      };
    } catch (err) {
      console.warn(`[Edge AI] Erro na requisição para ${model}:`, err);
    }
  }

  throw new Error("Todos os modelos configurados no OpenRouter falharam.");
}

// ------------------------------------------------------------------------------
// 5. Servidor HTTP Deno
// ------------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 5.1 Validação de Autenticação / Autorização da Aplicação
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    if (!authHeader && !apiKeyHeader) {
      return new Response(
        JSON.stringify({ error: "Cabeçalho Authorization ou apikey obrigatório." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    // Identificador único para controle de taxa (User ID ou IP do cliente)
    let callerIdentifier = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-client";

    if (authHeader) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          callerIdentifier = user.id;
        }
      } catch {
        // Mantém IP como identificador para controle de taxa
      }
    }

    // 5.2 Validação de Rate Limiting por Usuário / IP
    if (!checkRateLimit(callerIdentifier)) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Aguarde 1 minuto antes de tentar novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5.3 Leitura da Chave de Servidor
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY não configurada no Supabase Secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5.4 Tratamento do Payload da Requisição
    const requestData = await req.json();

    // Cenário A: Requisição de Plano de Cuidados Estruturado (clinical_data)
    if (requestData.clinical_data) {
      const { clinical_data } = requestData;
      const sanitizedData = {
        ...clinical_data,
        paciente: {
          ...clinical_data.paciente,
          nome: "[PACIENTE_DESIDENTIFICADO]",
          doencas_previas: sanitizeClinicalText(clinical_data.paciente?.doencas_previas),
          historico_previo: sanitizeClinicalText(clinical_data.paciente?.historico_previo),
          anamnese_previa: sanitizeClinicalText(clinical_data.paciente?.anamnese_previa),
          observacoes: sanitizeClinicalText(clinical_data.paciente?.observacoes),
        },
      };

      const aiResponse = await callOpenRouterBackend({
        apiKey: openRouterApiKey,
        systemPrompt: CARE_PLAN_SYSTEM_PROMPT,
        userPrompt: `DADOS CLÍNICOS ANONIMIZADOS (JSON):\n${JSON.stringify(sanitizedData, null, 2)}`,
        maxTokens: 2000,
        temperature: 0.2,
        isJson: true,
      });

      let planResult;
      try {
        planResult = JSON.parse(aiResponse.text);
      } catch {
        planResult = {
          resumo: aiResponse.text,
          prioridade: "moderada",
          diagnosticos: [],
        };
      }

      return new Response(
        JSON.stringify({
          success: true,
          plan: {
            ...planResult,
            is_preliminary_draft: true,
            lgpd_sanitized: true,
            generated_at: new Date().toISOString(),
          },
          provider: aiResponse.provider,
          truncated: aiResponse.truncated,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cenário B: Requisição Geral de Inferência (systemPrompt + userPrompt / options)
    const { systemPrompt, userPrompt, options = {} } = requestData;
    if (!userPrompt) {
      return new Response(
        JSON.stringify({ error: "userPrompt ou clinical_data é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitização DLP do conteúdo textual antes do envio à IA externa
    const sanitizedSystemPrompt = sanitizeClinicalText(systemPrompt || "");
    const sanitizedUserPrompt = sanitizeClinicalText(userPrompt);

    const isJson = options.responseMimeType === "application/json";
    const maxTokens = Number(options.maxTokens) || 1500;
    const temperature = Number(options.temperature) || 0.4;

    const result = await callOpenRouterBackend({
      apiKey: openRouterApiKey,
      systemPrompt: sanitizedSystemPrompt,
      userPrompt: sanitizedUserPrompt,
      maxTokens,
      temperature,
      isJson,
    });

    return new Response(
      JSON.stringify({
        success: true,
        text: result.text,
        provider: result.provider,
        truncated: result.truncated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Edge AI Exception]:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno no servidor de IA." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
