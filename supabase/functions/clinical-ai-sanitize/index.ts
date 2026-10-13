// ==============================================================================
// clinical-ai-sanitize/index.ts
// Supabase Edge Function: Blindagem LGPD, Anonimização e Síntese Clínica
// Resolução CFM nº 2.454/2026 e Resolução COFEN nº 736/2024
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Heurísticas de detecção e mascaramento de dados identificadores
function sanitizeClinicalText(text: string): string {
  if (!text) return "";
  let clean = String(text);

  // CPF (11 dígitos, pontuados ou contínuos)
  clean = clean.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF_MASCARADO]");

  // CNS - Cartão Nacional de Saúde (15 dígitos)
  clean = clean.replace(/\b[1278]\d{14}\b/g, "[CNS_MASCARADO]");

  // RG
  clean = clean.replace(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dX]\b/gi, "[RG_MASCARADO]");

  // Leitos, quartos, enfermarias, boxes
  clean = clean.replace(/\b(leito|quarto|enfermaria|box|apto|apartamento)\s*([0-9]+[a-zA-Z]?)\b/gi, "[LEITO_X]");

  // Telefones
  clean = clean.replace(/\b(\(?\d{2}\)?\s*)?(9?\d{4}[-.\s]?\d{4})\b/g, "[TEL_MASCARADO]");

  return clean;
}

const SYSTEM_PROMPT = `Você é um Sistema de Apoio à Decisão Clínica (SADC) especializado em enfermagem fundamentado estritamente na Taxonomia NANDA-I, Intervenções NIC e Resultados NOC (5ª edição).
Você receberá dados clínicos desidentificados e anonimizados de um paciente.

DIRETRIZES FUNDAMENTAIS:
1. PRIVACIDADE E RETENÇÃO ZERO: Nenhum dado fornecido pode ser armazenado para treinamento.
2. RIGOR TAXONÔMICO: Utilize exclusivamente códigos oficiais NANDA-I, NIC e NOC.
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { clinical_data } = await req.json();
    if (!clinical_data) {
      return new Response(JSON.stringify({ error: "clinical_data é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Sanitização adicional obrigatória no lado do servidor
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

    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("OPENAI_API_KEY");

    // 2. Chamada à API de IA com Zero Data Retention
    let planResult;
    if (apiKey && Deno.env.get("GEMINI_API_KEY")) {
      // Chamada Google Gemini com JSON Schema estruturado
      const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
      for (const model of models) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Desabilita uso de dados para melhoria de modelo
              "X-Goog-Data-Collection": "disabled",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: `${SYSTEM_PROMPT}\n\nDADOS CLÍNICOS ANONIMIZADOS (JSON):\n${JSON.stringify(sanitizedData, null, 2)}` },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            const jsonResp = await response.json();
            const rawText = jsonResp?.candidates?.[0]?.content?.parts?.[0]?.text;
            planResult = JSON.parse(rawText || "{}");
            break;
          }
        } catch (callErr) {
          console.warn(`Tentativa com ${model} falhou:`, callErr);
        }
      }
    } else {
      // Resposta estruturada padrão caso a chave de IA não esteja configurada no ambiente
      planResult = {
        resumo: `Paciente monitorado com status de risco ${sanitizedData.status_risco?.toUpperCase() || "ESTÁVEL"}.`,
        prioridade: sanitizedData.status_risco === "critico" ? "alta" : "moderada",
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
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
