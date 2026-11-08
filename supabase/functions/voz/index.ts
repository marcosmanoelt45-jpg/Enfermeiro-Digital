// ==============================================================================
// voz/index.ts
// Voz ao vivo hospedada (D4). Sem VOZ_AO_VIVO_URL a função responde 204 e o cliente usa a voz do navegador.
// Com ela: cota "voz", limite de 400 caracteres, cache no Storage (bucket privado "vozes-cache") e
// POST {VOZ_AO_VIVO_URL}/generate. Devolve o WAV do VoiceBox como veio (sem converter para mp3 no Deno):
// o navegador toca WAV normalmente. Perfis: secret VOZ_PERFIS = {"marcus":"<profile_id>", ...}.
// ==============================================================================
import { corsHeaders, responderOptions } from "../_shared/cors.ts";
import { exigirUsuario } from "../_shared/auth.ts";
import { consumirCota, limiteDe } from "../_shared/cota.ts";
import { ErroApp, erroDeExcecao } from "../_shared/erros.ts";
import { logEvento } from "../_shared/log.ts";
import { z } from "../_shared/schemas.ts";
import { chaveCacheGemini, executarLote, falarComGemini } from "../_shared/vozGemini.ts";
import falasFixas from "../_shared/falasFixas.json" with { type: "json" };

const MAX_CARACTERES = 400;
const BUCKET = "vozes-cache";

// deno-lint-ignore no-explicit-any
type Admin = any;

// Lote diário das falas fixas com a cota grátis do Gemini (10 áudios por dia). Roda no máximo uma vez por dia
// (marcador no bucket, pelo dia do Pacífico, quando a cota do Google zera) e em segundo plano: responde na hora.
async function iniciarLote(admin: Admin, chave: string): Promise<Response> {
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const marcador = await admin.storage.from(BUCKET).upload(`lote/${dia}.txt`, new TextEncoder().encode(dia), { contentType: "text/plain", upsert: false });
  if (marcador.error) return new Response(JSON.stringify({ lote: "ja_rodou" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const tarefa = (async () => {
    const existentes = new Set<string>();
    for (let offset = 0; offset < 20000; offset += 1000) {
      const { data } = await admin.storage.from(BUCKET).list("", { limit: 1000, offset, search: "g2-" });
      for (const o of data ?? []) existentes.add(o.name);
      if (!data || data.length < 1000) break;
    }
    const r = await executarLote({
      lista: falasFixas as { p: string; t: string }[],
      existentes,
      gerar: (texto, personagemId) => falarComGemini({ texto, personagemId, chave, maxEsperaMs: 15000 }),
      salvar: async (nome, wav) => {
        await admin.storage.from(BUCKET).upload(nome, wav, { contentType: "audio/wav", upsert: true });
      },
    });
    logEvento("voz_lote", { gerados: r.gerados, faltam: r.faltam, parou: r.parouPorFalha });
  })().catch((e) => logEvento("voz_lote_excecao", { tipo: e instanceof Error ? e.name : "Erro" }));

  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(tarefa);
  else await tarefa;
  return new Response(JSON.stringify({ lote: "iniciado" }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const Entrada = z.object({
  texto: z.string().trim().min(1).max(MAX_CARACTERES),
  personagemId: z.string().regex(/^[a-z0-9-]{2,40}$/),
});

async function sha1(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function paraBase64Bytes(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function respostaAudio(bytes: Uint8Array, cache: boolean): Response {
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    // octet-stream: o supabase-js só entrega Blob para esse tipo (audio/wav chegava como texto e se perdia).
    headers: { ...corsHeaders, "Content-Type": "application/octet-stream", "X-Voz-Cache": cache ? "hit" : "miss" },
  });
}

function lerPerfis(): Record<string, string> {
  try {
    const bruto = JSON.parse(Deno.env.get("VOZ_PERFIS") ?? "{}");
    return bruto && typeof bruto === "object" ? bruto : {};
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  const preVoo = responderOptions(req);
  if (preVoo) return preVoo;

  try {
    if (req.method !== "POST") throw new ErroApp("ENTRADA_INVALIDA", "Use POST.");
    const usuario = await exigirUsuario(req);

    // Sem servidor próprio (VOZ_AO_VIVO_URL): usa o Gemini TTS, se houver chave. Sem nenhum dos dois: 204
    // e o cliente cai na voz do navegador.
    const base = Deno.env.get("VOZ_AO_VIVO_URL");
    const chaveGemini = Deno.env.get("GEMINI_API_KEY");
    if (!base && !chaveGemini) return new Response(null, { status: 204, headers: corsHeaders });

    let corpo: unknown = null;
    try {
      corpo = await req.json();
    } catch {
      corpo = null;
    }
    if (!base && chaveGemini && (corpo as { acao?: string } | null)?.acao === "lote") {
      return await iniciarLote(usuario.supabaseAdmin, chaveGemini);
    }
    const entrada = Entrada.safeParse(corpo);
    if (!entrada.success) {
      throw new ErroApp("ENTRADA_INVALIDA", `Informe texto (até ${MAX_CARACTERES} caracteres) e personagemId.`);
    }
    const { texto, personagemId } = entrada.data;

    if (!base && chaveGemini) {
      const admin = usuario.supabaseAdmin;
      const chaveCache = await chaveCacheGemini(personagemId, texto);
      try {
        const { data } = await admin.storage.from(BUCKET).download(chaveCache);
        if (data) return respostaAudio(new Uint8Array(await data.arrayBuffer()), true);
      } catch {
        // sem cache: segue
      }
      await consumirCota(usuario.supabaseUsuario, "voz", limiteDe("voz"));
      const wav = await falarComGemini({ texto, personagemId, chave: chaveGemini });
      if (!wav) return new Response(null, { status: 204, headers: corsHeaders });
      try {
        await admin.storage.from(BUCKET).upload(chaveCache, wav, { contentType: "audio/wav", upsert: true });
      } catch {
        // cache é otimização
      }
      return respostaAudio(wav, false);
    }

    if (!base) return new Response(null, { status: 204, headers: corsHeaders });
    const perfil = lerPerfis()[personagemId];
    if (!perfil) return new Response(null, { status: 204, headers: corsHeaders });

    // Cache primeiro: texto repetido não gasta cota nem o PC do dono.
    const chaveCache = `${await sha1(`${perfil}|${texto}`)}.wav`;
    const admin = usuario.supabaseAdmin;
    try {
      const { data } = await admin.storage.from(BUCKET).download(chaveCache);
      if (data) return respostaAudio(new Uint8Array(await data.arrayBuffer()), true);
    } catch {
      // bucket ausente ou indisponível: segue sem cache
    }

    await consumirCota(usuario.supabaseUsuario, "voz", limiteDe("voz"));

    const inicio = Date.now();
    let gerado: Response;
    try {
      gerado = await fetch(`${base.replace(/\/$/, "")}/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${Deno.env.get("VOZ_AO_VIVO_TOKEN") ?? ""}`,
        },
        body: JSON.stringify({ text: texto, profile_id: perfil }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (e) {
      logEvento("voz_rede", { tipo: e instanceof Error ? e.name : "Erro" });
      throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");
    }
    if (!gerado.ok) {
      logEvento("voz_falhou", { status: gerado.status });
      throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");
    }

    const tipo = gerado.headers.get("content-type") ?? "";
    let wav: Uint8Array;
    if (tipo.includes("application/json")) {
      const json = await gerado.json();
      const b64 = json.audio ?? json.audio_base64 ?? json.wav;
      if (typeof b64 !== "string") throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");
      wav = paraBase64Bytes(b64);
    } else {
      wav = new Uint8Array(await gerado.arrayBuffer());
    }
    if (wav.byteLength === 0) throw new ErroApp("IA_INDISPONIVEL", "Voz indisponível no momento.");

    try {
      await admin.storage.from(BUCKET).upload(chaveCache, wav, { contentType: "audio/wav", upsert: true });
    } catch {
      // cache é otimização
    }

    logEvento("voz", { usuario: usuario.userId, personagem: personagemId, chars: texto.length, bytes: wav.byteLength, ms: Date.now() - inicio });
    return respostaAudio(wav, false);
  } catch (e) {
    return erroDeExcecao(e);
  }
});
