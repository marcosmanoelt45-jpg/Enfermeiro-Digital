// Serviço de Transcrição de Áudio Clínico (AssemblyAI & Google Gemini Multimodal Audio)
// Suporta envio de áudio binário gravado à beira-leito com reconhecimento em português (pt-BR).
import { transcribeAudio } from "@/lib/assemblyai";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const audioTranscriptionService = {
  // Retorna a chave do AssemblyAI se configurada no localStorage do usuário
  getAssemblyAIKey() {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_assemblyai_api_key')) ||
      ''
    ).trim();
  },

  // Retorna a chave do Gemini pessoal (localStorage); chaves do projeto ficam só no servidor
  getGeminiKey() {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_gemini_api_key')) ||
      ''
    ).trim();
  },

  // Retorna a chave do OpenRouter pessoal (localStorage); chaves do projeto ficam só no servidor
  getOpenRouterKey() {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_openrouter_api_key')) ||
      ''
    ).trim();
  },

  // Identifica qual motor de transcrição está ativo por padrão
  getActiveEngine() {
    if (this.getAssemblyAIKey()) return 'AssemblyAI';
    if (this.getGeminiKey()) return 'Google Gemini (Multimodal)';
    if (this.getOpenRouterKey()) return 'OpenRouter (Multimodal)';
    return 'Navegador (Web Speech API)';
  },

  // Transcreve usando AssemblyAI
  async transcribeWithAssemblyAI(audioBlob, onProgress) {
    // Usa o cliente único da AssemblyAI (lib/assemblyai), que espera até 4 minutos por gravações longas.
    const text = await transcribeAudio(audioBlob, { apiKey: this.getAssemblyAIKey(), onStage: onProgress || undefined });
    return { text, engine: "AssemblyAI" };
  },

  // Transcreve usando Google Gemini Multimodal Audio
  async transcribeWithGemini(audioBlob, onProgress) {
    const apiKey = this.getGeminiKey();
    if (!apiKey) throw new Error('Chave do Google Gemini não configurada.');

    if (onProgress) onProgress('Codificando áudio para transcrição via Gemini...');
    const base64Audio = await blobToBase64(audioBlob);

    // Sanitiza o MIME type: remove parâmetros extras de codecs (ex.: audio/webm;codecs=opus -> audio/webm)
    const rawMime = (audioBlob.type || 'audio/webm').toLowerCase();
    const cleanMime = rawMime.split(';')[0].trim();
    const supportedMimes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/mp3', 'audio/flac'];
    const sanitizedMimeType = supportedMimes.includes(cleanMime) ? cleanMime : 'audio/webm';

    if (onProgress) onProgress('Transcrevendo áudio em alta fidelidade...');

    const prompt = `Você é um especialista em transcrição clínica de enfermagem e terminologia médica em português (pt-BR).
Ouça atentamente este áudio gravado por um enfermeiro à beira-leito.
Transcreva na íntegra e com máxima fidelidade tudo o que foi falado (sinais vitais, queixas, dor, histórico do paciente e observações).

Retorne EXCLUSIVAMENTE um objeto JSON válido no formato:
{
  "transcricao": "Texto completo transcrito exatamente como falado...",
  "resumo_clinico": "Breve síntese das informações relatadas"
}`;

    const savedModel = (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_gemini_model')) || null;
    const models = [
      ...(savedModel ? [savedModel] : []),
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-flash-latest'
    ].filter((v, i, a) => a.indexOf(v) === i);

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            // Chave no cabeçalho, não na URL (a URL fica em logs de proxy e no histórico).
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: sanitizedMimeType,
                        data: base64Audio,
                      },
                    },
                    { text: prompt },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Erro no modelo Gemini Audio ${model}:`, errText);
          continue;
        }

        const data = await response.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          let extractedText = '';
          let extractedSummary = '';
          try {
            const cleaned = textOutput.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
            const parsed = JSON.parse(cleaned);
            extractedText = parsed.transcricao || parsed.text || '';
            extractedSummary = parsed.resumo_clinico || parsed.summary || '';
          } catch {
            const match = textOutput.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                const parsed = JSON.parse(match[0]);
                extractedText = parsed.transcricao || parsed.text || '';
                extractedSummary = parsed.resumo_clinico || parsed.summary || '';
              } catch {}
            }
            if (!extractedText) {
              extractedText = textOutput.replace(/```(?:json)?\s*|\s*```/g, '').trim();
            }
          }

          if (extractedText) {
            return {
              text: extractedText,
              summary: extractedSummary,
              engine: `Google Gemini (${model})`,
            };
          }
        }
      } catch (e) {
        console.warn(`Falha na chamada Gemini Audio com ${model}:`, e);
      }
    }

    throw new Error('Não foi possível transcrever o áudio com nenhum dos modelos Gemini disponíveis.');
  },

  // Transcreve usando OpenRouter Multimodal Audio (Gemini 2.5 Flash / Gemini 2.0 Flash)
  async transcribeWithOpenRouter(audioBlob, onProgress) {
    const apiKey = this.getOpenRouterKey();
    if (!apiKey) throw new Error('Chave do OpenRouter não configurada.');

    // O OpenRouter recebe áudio como "input_audio" com o formato do arquivo. Formato que ele não aceita
    // (como o webm do Chrome) é recusado aqui, em vez de gastar três chamadas que falhariam.
    const cleanMime = (audioBlob.type || '').toLowerCase().split(';')[0].trim();
    const AUDIO_FORMATS = { 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/ogg': 'ogg', 'audio/flac': 'flac', 'audio/aac': 'aac', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a' };
    const audioFormat = AUDIO_FORMATS[cleanMime];
    if (!audioFormat) throw new Error(`O OpenRouter não aceita áudio em ${cleanMime || 'formato desconhecido'}.`);

    if (onProgress) onProgress('Codificando áudio para transcrição via OpenRouter...');
    const base64Audio = await blobToBase64(audioBlob);

    if (onProgress) onProgress('Transcrevendo áudio em alta fidelidade com IA...');

    const prompt = `Você é um especialista em transcrição clínica de enfermagem e terminologia médica em português (pt-BR).
Ouça atentamente este áudio gravado por um estudante ou enfermeiro.
Transcreva com fidelidade absoluta tudo o que foi falado.
Retorne EXCLUSIVAMENTE o texto transcrito, sem introduções ou explicações.`;

    const models = [
      'google/gemini-2.5-flash',
      'google/gemini-2.0-flash-001'
    ];

    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://enfermeirodigital.com.br',
            'X-Title': 'Enfermeiro Digital - Atendimento por Voz',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt
                  },
                  {
                    type: 'input_audio',
                    input_audio: { data: base64Audio, format: audioFormat }
                  }
                ]
              }
            ],
            temperature: 0.1
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Erro no OpenRouter Audio (${model}):`, errText);
          continue;
        }

        const data = await response.json();
        const textOutput = data?.choices?.[0]?.message?.content;
        if (textOutput && textOutput.trim()) {
          return {
            text: textOutput.trim().replace(/^["']|["']$/g, ''),
            engine: `OpenRouter (${model})`
          };
        }
      } catch (err) {
        console.warn(`Falha na chamada OpenRouter com ${model}:`, err);
      }
    }

    throw new Error('Não foi possível obter transcrição via OpenRouter.');
  },

  // Método principal que orquestra a transcrição em cascata
  async transcribe(audioBlob, existingTranscript = '', onProgress = null) {
    // 1. Se tem AssemblyAI configurado, prioriza AssemblyAI
    if (audioBlob && this.getAssemblyAIKey()) {
      try {
        return await this.transcribeWithAssemblyAI(audioBlob, onProgress);
      } catch (err) {
        console.warn('Falha na transcrição com AssemblyAI, tentando fallback:', err);
      }
    }

    // 2. Se tem Gemini configurado, tenta Gemini Multimodal Audio
    if (audioBlob && this.getGeminiKey()) {
      try {
        return await this.transcribeWithGemini(audioBlob, onProgress);
      } catch (err) {
        console.warn('Falha na transcrição com Gemini Audio, tentando fallback:', err);
      }
    }

    // 3. Se tem OpenRouter configurado, tenta OpenRouter Multimodal Audio
    if (audioBlob && this.getOpenRouterKey()) {
      try {
        return await this.transcribeWithOpenRouter(audioBlob, onProgress);
      } catch (err) {
        console.warn('Falha na transcrição com OpenRouter Audio, tentando fallback:', err);
      }
    }

    // 4. Se já temos transcrição da Web Speech API ou manual
    if (existingTranscript && existingTranscript.trim()) {
      return {
        text: existingTranscript.trim(),
        engine: 'Navegador (Web Speech API)',
      };
    }

    // 5. Se não conseguiu transcrever por nenhuma IA e não tem texto
    throw new Error(
      'Nenhuma transcrição foi gerada. Fale mais próximo ao microfone ou utilize a opção "Prefiro digitar".'
    );
  },

  // Testa conexão com AssemblyAI
  async testAssemblyAIConnection(key) {
    if (!key || !key.trim()) throw new Error('Chave vazia');
    const res = await fetch('https://api.assemblyai.com/v2/transcript?limit=1', {
      headers: { authorization: key.trim() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Chave do AssemblyAI inválida ou sem permissão.');
    }
    return true;
  },
};
