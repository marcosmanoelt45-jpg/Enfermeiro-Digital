/**
 * aiCoreService.js
 * Motor Unificado de Inteligência Artificial Clínica do Enfere.
 * Implementa arquitetura em cascata resiliente:
 * 1. Google Gemini Oficial (chave direta configurada pelo usuário ou env)
 * 2. OpenRouter API (chave ativa do projeto com limite seguro de tokens)
 * 3. Retorna null de forma limpa para acionamento do motor local pedagógico
 */

export function getGeminiKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = localStorage.getItem('enfermeiro_gemini_api_key');
      if (key && key.trim()) return key.trim();
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY.trim();
    }
  } catch {}
  return '';
}

export function getOpenRouterKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = localStorage.getItem('enfermeiro_openrouter_api_key');
      if (key && key.trim()) return key.trim();
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTER_API_KEY) {
      return import.meta.env.VITE_OPENROUTER_API_KEY.trim();
    }
  } catch {}
  return '';
}

/**
 * Chama IA generativa com fallback automático entre Google Gemini e OpenRouter.
 * @param {string} systemPrompt - Instrução de papel e diretrizes clínicas
 * @param {string} userPrompt - Pergunta ou caso do estudante
 * @param {object} options - Configurações opcionais (maxTokens, temperature, responseMimeType)
 * @returns {Promise<{ text: string, provider: string } | null>}
 */
export async function callResilientAI(systemPrompt, userPrompt, options = {}) {
  const geminiKey = getGeminiKey();
  const openRouterKey = getOpenRouterKey();
  const maxTokens = options.maxTokens || 850;
  const temperature = options.temperature || 0.4;
  const isJson = options.responseMimeType === 'application/json';

  // 1. TENTATIVA GOOGLE GEMINI DIRETO
  if (geminiKey) {
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const generationConfig = {
          temperature,
          maxOutputTokens: maxTokens
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
            return { text: text.trim(), provider: `Google Gemini (${model})` };
          }
        }
      } catch {
        // Tenta o próximo modelo
      }
    }
  }

  // 2. TENTATIVA OPENROUTER (MULTI-MODELO COM CRÉDITOS DO PROJETO)
  if (openRouterKey) {
    const candidateOpenRouterModels = [
      'google/gemini-2.5-flash',
      'openai/gpt-4o-mini',
      'deepseek/deepseek-chat'
    ];

    for (const model of candidateOpenRouterModels) {
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
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://enfermeirodigital.com.br',
            'X-Title': 'Enfere Digital'
          },
          body: JSON.stringify(bodyPayload)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            return { text: text.trim(), provider: `OpenRouter (${model})` };
          }
        }
      } catch {
        // Tenta o próximo modelo
      }
    }
  }

  // Se ambos os provedores externos falharem ou estiverem sem chave, retorna null
  return null;
}
