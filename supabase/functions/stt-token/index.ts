// ==============================================================================
// stt-token/index.ts
// Token temporário da AssemblyAI (streaming) para o navegador abrir o WebSocket sem a chave permanente.
// Cada token custa 1 minuto da cota "stt". Os parâmetros da conexão ficam aqui, não no cliente:
// dá para trocar o modelo (STT_MODEL) sem publicar o app.
// Doc: POST https://token.assemblyai.com/v1/token { product, expires_in_seconds, max_session_duration_seconds }
// ==============================================================================
import { responderOptions } from "../_shared/cors.ts";
import { exigirUsuario } from "../_shared/auth.ts";
import { consumirCota, limiteDe } from "../_shared/cota.ts";
import { ErroApp, erroDeExcecao, ok } from "../_shared/erros.ts";
import { logEvento } from "../_shared/log.ts";

const URL_TOKEN = "https://token.assemblyai.com/v1/token";
const WS_URL = "wss://streaming.assemblyai.com/v3/ws";
const JANELA_SEG = 300; // tempo para abrir o WebSocket
const SESSAO_MAX_SEG = 60; // teto da conversa aberta com este token

Deno.serve(async (req) => {
  const preVoo = responderOptions(req);
  if (preVoo) return preVoo;

  try {
    if (req.method !== "POST") throw new ErroApp("ENTRADA_INVALIDA", "Use POST.");
    const usuario = await exigirUsuario(req);

    const chave = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!chave) throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");

    await consumirCota(usuario.supabaseUsuario, "stt", limiteDe("stt"), 1);

    let resposta: Response;
    try {
      resposta = await fetch(URL_TOKEN, {
        method: "POST",
        headers: { authorization: chave, "content-type": "application/json" },
        body: JSON.stringify({
          product: "streaming",
          expires_in_seconds: JANELA_SEG,
          max_session_duration_seconds: SESSAO_MAX_SEG,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (e) {
      logEvento("stt_token_rede", { tipo: e instanceof Error ? e.name : "Erro" });
      throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");
    }
    if (!resposta.ok) {
      logEvento("stt_token_falhou", { status: resposta.status });
      throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");
    }
    const { token } = await resposta.json();
    if (typeof token !== "string" || !token) throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");

    const modelo = Deno.env.get("STT_MODEL") || "universal-3-6-pro";
    logEvento("stt_token", { usuario: usuario.userId, modelo });
    return ok({
      token,
      expiraEm: Date.now() + JANELA_SEG * 1000,
      wsUrl: WS_URL,
      parametros: {
        sample_rate: "16000",
        encoding: "pcm_s16le",
        speech_model: modelo,
        language_codes: '["pt"]',
      },
    });
  } catch (e) {
    return erroDeExcecao(e);
  }
});
