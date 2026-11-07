// ==============================================================================
// clinical-ai-sanitize/index.ts
// Supabase Edge Function: Blindagem LGPD, autenticação por sessão, cota diária e IA
// Resolução CFM nº 2.454/2026 e Resolução COFEN nº 736/2024
//
// A resposta continua a mesma de antes ({ success, text | plan, provider, truncated }) e os erros seguem
// no formato antigo { error: "..." }: os clientes de hoje (Goti, plano de cuidados, tutores) dependem dele.
// ==============================================================================

import { corsHeaders, responderOptions } from "../_shared/cors.ts";
import { exigirUsuario } from "../_shared/auth.ts";
import { consumirCota, limiteDe } from "../_shared/cota.ts";
import { ErroApp } from "../_shared/erros.ts";
import { chamarLLM, extrairJson } from "../_shared/llm.ts";
import { logEvento } from "../_shared/log.ts";
import { sanitizeClinicalText } from "../_shared/dlp.ts";

// ------------------------------------------------------------------------------
// 1. Sanitização e DLP Server-Side (LGPD): sanitizeClinicalText fica em ../_shared/dlp.ts
// ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------
// 2. System Prompt Padrão para Plano NANDA-I / NIC / NOC
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
// 3. Respostas no formato antigo
// ------------------------------------------------------------------------------
const JSON_CORS = { ...corsHeaders, "Content-Type": "application/json" };

function responder(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: JSON_CORS });
}

function responderErro(e: unknown): Response {
  if (e instanceof ErroApp) return responder({ error: e.message }, e.status);
  console.error("[Edge AI] erro inesperado:", e instanceof Error ? e.name : "desconhecido");
  return responder({ error: "Erro interno no servidor de IA." }, 500);
}

// ------------------------------------------------------------------------------
// 4. Servidor HTTP Deno
// ------------------------------------------------------------------------------
Deno.serve(async (req) => {
  const preVoo = responderOptions(req);
  if (preVoo) return preVoo;

  try {
    // 4.1 Sessão de usuário válida (a chave anon é pública) e cota diária no banco, por usuário.
    const { userId, supabaseUsuario } = await exigirUsuario(req);
    await consumirCota(supabaseUsuario, "llm", limiteDe("llm"));

    // 4.2 Corpo da requisição
    // deno-lint-ignore no-explicit-any
    let requestData: Record<string, any> | null = null;
    try {
      requestData = await req.json();
    } catch {
      requestData = null;
    }
    if (!requestData || typeof requestData !== "object") {
      return responder({ error: "Corpo da requisição inválido." }, 400);
    }

    const inicio = Date.now();

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

      const resposta = await chamarLLM({
        mensagens: [
          { role: "system", content: CARE_PLAN_SYSTEM_PROMPT },
          { role: "user", content: `DADOS CLÍNICOS ANONIMIZADOS (JSON):\n${JSON.stringify(sanitizedData, null, 2)}` },
        ],
        maxTokens: 2000,
        temperatura: 0.2,
        json: true,
      });

      let planResult: Record<string, unknown>;
      try {
        planResult = extrairJson(resposta.texto) as Record<string, unknown>;
      } catch {
        planResult = { resumo: resposta.texto, prioridade: "moderada", diagnosticos: [] };
      }

      logEvento("clinical_ai", { cenario: "A", usuario: userId, modelo: resposta.modelo, truncado: resposta.truncado, ms: Date.now() - inicio });
      return responder({
        success: true,
        plan: {
          ...planResult,
          is_preliminary_draft: true,
          lgpd_sanitized: true,
          generated_at: new Date().toISOString(),
        },
        provider: `OpenRouter (${resposta.modelo})`,
        truncated: resposta.truncado,
      });
    }

    // Cenário B: Requisição Geral de Inferência (systemPrompt + userPrompt / options)
    const { systemPrompt, userPrompt } = requestData;
    const options = requestData.options && typeof requestData.options === "object" ? requestData.options : {};
    if (!userPrompt) {
      return responder({ error: "userPrompt ou clinical_data é obrigatório." }, 400);
    }

    // Sanitização DLP do conteúdo textual antes do envio à IA externa
    const resposta = await chamarLLM({
      mensagens: [
        { role: "system", content: sanitizeClinicalText(systemPrompt || "") },
        { role: "user", content: sanitizeClinicalText(userPrompt) },
      ],
      maxTokens: Number(options.maxTokens) || 1500,
      temperatura: Number(options.temperature) || 0.4,
      json: options.responseMimeType === "application/json",
    });

    logEvento("clinical_ai", { cenario: "B", usuario: userId, modelo: resposta.modelo, truncado: resposta.truncado, ms: Date.now() - inicio });
    return responder({
      success: true,
      text: resposta.texto,
      provider: `OpenRouter (${resposta.modelo})`,
      truncated: resposta.truncado,
    });
  } catch (e) {
    return responderErro(e);
  }
});
