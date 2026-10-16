// Serviço de Transcrição de Áudio Clínico (AssemblyAI & Google Gemini Multimodal Audio)
// Suporta envio de áudio binário gravado à beira-leito com reconhecimento em português (pt-BR).

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
  // Retorna a chave do AssemblyAI se configurada
  getAssemblyAIKey() {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_assemblyai_api_key')) ||
      import.meta.env.VITE_ASSEMBLYAI_API_KEY ||
      ''
    ).trim();
  },

  // Retorna a chave do Gemini se configurada
  getGeminiKey() {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_gemini_api_key')) ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      ''
    ).trim();
  },

  // Retorna a chave do OpenRouter se configurada
  getOpenRouterKey() {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_openrouter_api_key')) ||
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OPENROUTER_API_KEY) ||
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
    const apiKey = this.getAssemblyAIKey();
    if (!apiKey) throw new Error('Chave da API do AssemblyAI não configurada.');

    if (onProgress) onProgress('Enviando arquivo de áudio para o AssemblyAI...');

    // 1. Upload do áudio binário
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        authorization: apiKey,
      },
      body: audioBlob,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error || 'Falha no upload do áudio para o AssemblyAI.');
    }

    const { upload_url } = await uploadRes.json();
    if (!upload_url) throw new Error('URL de upload não retornada pelo AssemblyAI.');

    if (onProgress) onProgress('Processando transcrição em português com AssemblyAI...');

    // 2. Disparo da transcrição
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: 'pt',
        punctuate: true,
        format_text: true,
      }),
    });

    if (!transcriptRes.ok) {
      const err = await transcriptRes.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao solicitar transcrição ao AssemblyAI.');
    }

    const { id: transcriptId } = await transcriptRes.json();

    // 3. Polling até conclusão (máximo 35s)
    const startTime = Date.now();
    while (Date.now() - startTime < 35000) {
      await new Promise((r) => setTimeout(r, 1500));

      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: apiKey },
      });

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      if (pollData.status === 'completed') {
        return {
          text: pollData.text || '',
          engine: 'AssemblyAI',
          confidence: pollData.confidence,
        };
      }

      if (pollData.status === 'error') {
        throw new Error(pollData.error || 'Erro no processamento do áudio pelo AssemblyAI.');
      }

      if (onProgress) onProgress('Transcrevendo áudio em alta fidelidade...');
    }

    throw new Error('Tempo limite excedido na transcrição do AssemblyAI.');
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
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

    throw new Error('Não foi possível obter transcrição via Google Gemini.');
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

    // 3. Se já temos transcrição da Web Speech API ou manual
    if (existingTranscript && existingTranscript.trim()) {
      return {
        text: existingTranscript.trim(),
        engine: 'Navegador (Web Speech API)',
      };
    }

    // 4. Se não conseguiu transcrever por nenhuma IA e não tem texto
    throw new Error(
      'Nenhuma chave de IA foi detectada para transcrição do áudio gravado. Configure uma chave do Google Gemini na página Minha Conta ou fale pausadamente usando o Google Chrome.'
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
