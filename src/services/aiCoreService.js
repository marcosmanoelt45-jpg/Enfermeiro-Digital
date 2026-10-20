/**
 * aiCoreService.js
 * Motor Unificado de Inteligência Artificial Clínica do Enfere.
 * Arquitetura de Segurança Zero-Trust:
 * 1. Chaves corporativas e cotas gerenciadas residem unicamente nas Supabase Edge Functions.
 * 2. Suporte opcional para estudante/docente conectar sua própria chave pessoal via LocalStorage.
 * 3. Fallback gracioso para motores pedagógicos e taxonômicos determinísticos locais.
 */

import { supabase } from './supabaseClient.js';

/**
 * Obtém a chave pessoal do Google Gemini configurada pelo usuário no LocalStorage.
 * @returns {string}
 */
export function getGeminiKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = localStorage.getItem('enfermeiro_gemini_api_key');
      if (key && key.trim()) return key.trim();
    }
  } catch {}
  return '';
}

/**
 * Obtém a chave pessoal do OpenRouter configurada pelo usuário no LocalStorage.
 * @returns {string}
 */
export function getOpenRouterKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = localStorage.getItem('enfermeiro_openrouter_api_key');
      if (key && key.trim()) return key.trim();
    }
  } catch {}
  return '';
}

/**
 * Executa chamada direta caso o estudante tenha fornecido sua chave pessoal do Gemini.
 */
async function callPersonalGemini(apiKey, systemPrompt, userPrompt, options) {
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.35;
  const isJson = options.responseMimeType === 'application/json';

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const generationConfig = {
        temperature,
        maxOutputTokens: maxTokens,
      };
      if (isJson) {
        generationConfig.responseMimeType = 'application/json';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }]
            }
          ],
          generationConfig
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { text: text.trim(), provider: `Google Gemini Pessoal (${model})` };
        }
      }
    } catch {
      // Tenta o próximo modelo candidato
    }
  }
  return null;
}

/**
 * Executa chamada direta caso o estudante tenha fornecido sua chave pessoal do OpenRouter.
 */
async function callPersonalOpenRouter(apiKey, systemPrompt, userPrompt, options) {
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.35;
  const isJson = options.responseMimeType === 'application/json';

  const candidateModels = [
    'google/gemini-2.5-flash',
    'openai/gpt-4o-mini',
    'deepseek/deepseek-chat'
  ];

  for (const model of candidateModels) {
    try {
      const bodyPayload = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      };

      if (isJson) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://enfermeirodigital.com.br',
          'X-Title': 'Enfere Digital'
        },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        const data = await res.json();
        const choice = data?.choices?.[0];
        const text = choice?.message?.content;
        const finishReason = choice?.finish_reason;
        if (text && text.trim()) {
          return {
            text: text.trim(),
            provider: `OpenRouter Pessoal (${model})`,
            truncated: finishReason === 'length'
          };
        }
      }
    } catch {
      // Tenta o próximo modelo candidato
    }
  }
  return null;
}

/**
 * Invoca a Edge Function segura do Supabase (Zero-Trust com sanitização server-side).
 */
async function callSupabaseEdgeAI(systemPrompt, userPrompt, options) {
  try {
    const { data, error } = await supabase.functions.invoke('clinical-ai-sanitize', {
      body: {
        systemPrompt,
        userPrompt,
        options: {
          maxTokens: options.maxTokens || 1500,
          temperature: options.temperature ?? 0.35,
          responseMimeType: options.responseMimeType
        }
      }
    });

    if (error) {
      console.warn('[aiCoreService] Edge function reportou erro:', error);
      return null;
    }

    if (data?.success && data?.text) {
      return {
        text: data.text,
        provider: data.provider || 'Supabase Edge AI',
        truncated: Boolean(data.truncated)
      };
    }
  } catch (err) {
    console.warn('[aiCoreService] Falha ao invocar Edge Function:', err);
  }
  return null;
}

/**
 * Chama IA generativa com arquitetura resiliente e segura:
 * 1. Chaves pessoais configuradas localmente pelo próprio aluno (se houver).
 * 2. Edge Function centralizada no Supabase com autenticação JWT e DLP no servidor.
 * 3. Retorna null de forma limpa caso offline, acionando o motor determinístico local.
 *
 * @param {string} systemPrompt - Instrução de papel e diretrizes clínicas
 * @param {string} userPrompt - Pergunta ou caso do estudante
 * @param {object} options - Configurações opcionais (maxTokens, temperature, responseMimeType)
 * @returns {Promise<{ text: string, provider: string, truncated?: boolean } | null>}
 */
export async function callResilientAI(systemPrompt, userPrompt, options = {}) {
  // 1. Chave Pessoal do Estudante: Google Gemini
  const personalGemini = getGeminiKey();
  if (personalGemini) {
    const geminiRes = await callPersonalGemini(personalGemini, systemPrompt, userPrompt, options);
    if (geminiRes) return geminiRes;
  }

  // 2. Chave Pessoal do Estudante: OpenRouter
  const personalOpenRouter = getOpenRouterKey();
  if (personalOpenRouter) {
    const openRouterRes = await callPersonalOpenRouter(personalOpenRouter, systemPrompt, userPrompt, options);
    if (openRouterRes) return openRouterRes;
  }

  // 3. Padrão Institucional Seguro: Supabase Edge Function
  const edgeRes = await callSupabaseEdgeAI(systemPrompt, userPrompt, options);
  if (edgeRes) return edgeRes;

  // 4. Fallback Limpo para Motor Local Pedagógico
  return null;
}
