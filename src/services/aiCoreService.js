/**
 * aiCoreService.js
 * Motor Unificado de Inteligência Artificial Clínica do Enfere.
 * Arquitetura de Segurança Zero-Trust:
 * 1. Chaves corporativas e cotas gerenciadas residem unicamente nas Supabase Edge Functions.
 * 2. Suporte opcional para estudante/docente conectar sua própria chave pessoal via LocalStorage ou Env.
 * 3. Fallback gracioso para motores pedagógicos e taxonômicos determinísticos locais.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Obtém a chave pessoal do Google Gemini configurada pelo usuário no LocalStorage ou Env.
 * @returns {string}
 */
const safeGetEnv = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {}
  return '';
};

export function getGeminiKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = localStorage.getItem('enfermeiro_gemini_api_key');
      if (key && key.trim()) return key.trim();
    }
  } catch {}
  return safeGetEnv('VITE_GEMINI_API_KEY').trim();
}

/**
 * Obtém a chave pessoal do OpenRouter configurada pelo usuário no LocalStorage ou Env.
 * @returns {string}
 */
export function getOpenRouterKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = localStorage.getItem('enfermeiro_openrouter_api_key');
      if (key && key.trim()) return key.trim();
    }
  } catch {}
  return (
    safeGetEnv('VITE_OPENROUTER_API_KEY') ||
    safeGetEnv('OPENROUTER_API_KEY')
  ).trim();
}

/**
 * Executa chamada direta caso o estudante tenha fornecido sua chave pessoal do Gemini.
 * Utiliza timeout estrito de 7s por tentativa para evitar travamentos infinitos.
 */
async function callPersonalGemini(apiKey, systemPrompt, userPrompt, options) {
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.35;
  const isJson = options.responseMimeType === 'application/json';

  let preferredModel = '';
  try {
    if (typeof localStorage !== 'undefined') {
      preferredModel = (localStorage.getItem('enfermeiro_gemini_model') || '').trim();
    }
  } catch {}

  // Modelos válidos da API v1beta pública do Google Gemini
  const defaultModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  const candidateModels = preferredModel && !preferredModel.includes('2.5')
    ? [preferredModel, ...defaultModels.filter((m) => m !== preferredModel)]
    : defaultModels;

  for (const model of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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
        signal: controller.signal,
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

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { text: text.trim(), provider: `Google Gemini Pessoal (${model})` };
        }
      }
    } catch {
      clearTimeout(timeoutId);
      // Tenta o próximo modelo candidato ou segue para o próximo provider
    }
  }
  return null;
}

/**
 * Executa chamada direta caso o estudante tenha fornecido sua chave pessoal do OpenRouter.
 * Utiliza timeout estrito de 7s por tentativa.
 */
async function callPersonalOpenRouter(apiKey, systemPrompt, userPrompt, options) {
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.35;
  const isJson = options.responseMimeType === 'application/json';

  const candidateModels = [
    'google/gemini-2.0-flash-001',
    'google/gemini-flash-1.5',
    'openai/gpt-4o-mini',
    'deepseek/deepseek-chat'
  ];

  for (const model of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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
        signal: controller.signal,
        body: JSON.stringify(bodyPayload)
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      // Tenta o próximo modelo candidato
    }
  }
  return null;
}

/**
 * Invoca a Edge Function segura do Supabase (Zero-Trust com sanitização server-side).
 * Configurada com timeout estrito de 10s e fallback automático.
 */
async function callSupabaseEdgeAI(systemPrompt, userPrompt, options) {
  if (!isSupabaseConfigured({ ignoreDemoSession: true })) {
    return null;
  }

  const supabaseAnonKey = safeGetEnv('VITE_SUPABASE_ANON_KEY');

  try {
    // Timeout de 10 segundos via Promise.race para blindar a Edge Function
    const invokePromise = supabase.functions.invoke('clinical-ai-sanitize', {
      headers: supabaseAnonKey ? {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      } : {},
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

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout Edge Function (10s)')), 10000)
    );

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    if (error) {
      console.warn('[aiCoreService] Edge function reportou erro ou indisponibilidade:', error);
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
    console.warn('[aiCoreService] Falha ou timeout ao invocar Edge Function institucional:', err?.message || err);
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
