// ==============================================================================
// transcrever/index.ts
// Transcrição de áudio por arquivo, em duas etapas, com a chave da AssemblyAI só no servidor
// (secret ASSEMBLYAI_API_KEY). O limite de tempo das Edge Functions não comporta esperar uma transcrição
// longa, então o trabalho fica dividido:
//   1. POST multipart/form-data (acao=iniciar, duracaoSeg, audio de até 25 MB) -> { id }
//   2. POST { acao: "status", id } -> { status: "processando" | "pronto" | "erro", texto? }
// O cliente consulta a cada 3 s, por até 4 min. Esta função não guarda o áudio.
// ==============================================================================
import { responderOptions } from "../_shared/cors.ts";
import { exigirUsuario } from "../_shared/auth.ts";
import type { Usuario } from "../_shared/auth.ts";
import { consumirCota, limiteDe } from "../_shared/cota.ts";
import { ErroApp, erroDeExcecao, ok } from "../_shared/erros.ts";
import { logEvento } from "../_shared/log.ts";
import { z } from "../_shared/schemas.ts";

const API = "https://api.assemblyai.com/v2";
const LIMITE_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 40_000;

const EntradaIniciar = z.object({
  acao: z.literal("iniciar"),
  duracaoSeg: z.coerce.number().int().min(1).max(3600),
});

const EntradaStatus = z.object({
  acao: z.literal("status"),
  id: z.string().regex(/^[\w-]{6,80}$/),
});

// Chamada à AssemblyAI com a chave do servidor e tempo-limite. Falha de rede vira IA_INDISPONIVEL.
async function chamarAssembly(url: string, chave: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      headers: { ...init.headers, authorization: chave },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    logEvento("transcrever_rede", { tipo: e instanceof Error ? e.name : "Erro" });
    throw new ErroApp("IA_INDISPONIVEL", "Não foi possível falar com o serviço de transcrição.");
  }
}

// LGPD: depois de ler o texto, apaga a transcrição (e o áudio enviado) na AssemblyAI. Em segundo plano,
// para não atrasar a resposta; se falhar, só registra (a AssemblyAI apaga sozinha depois do prazo dela).
function apagarNaAssembly(id: string, chave: string) {
  const tarefa = chamarAssembly(`${API}/transcript/${id}`, chave, { method: "DELETE" })
    .then((r) => {
      if (!r.ok) logEvento("transcrever_apagar_falhou", { status: r.status });
    })
    .catch(() => logEvento("transcrever_apagar_falhou", { status: 0 }));
  // deno-lint-ignore no-explicit-any
  (globalThis as any).EdgeRuntime?.waitUntil?.(tarefa);
}

async function iniciar(req: Request, chave: string, usuario: Usuario): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ErroApp("ENTRADA_INVALIDA", "Envio inválido.");
  }

  const entrada = EntradaIniciar.safeParse({ acao: form.get("acao"), duracaoSeg: form.get("duracaoSeg") });
  if (!entrada.success) {
    throw new ErroApp("ENTRADA_INVALIDA", "Informe acao=iniciar e duracaoSeg entre 1 e 3600.");
  }
  const audio = form.get("audio");
  if (!(audio instanceof File)) throw new ErroApp("ENTRADA_INVALIDA", "Envie o áudio no campo audio.");
  if (audio.size === 0 || audio.size > LIMITE_BYTES) {
    throw new ErroApp("ENTRADA_INVALIDA", "O áudio precisa ter de 1 byte a 25 MB.");
  }

  // Valida primeiro e só então cobra a cota: pedido inválido não gasta os minutos do aluno.
  const minutos = Math.min(10, Math.ceil(entrada.data.duracaoSeg / 60));
  await consumirCota(usuario.supabaseUsuario, "stt", limiteDe("stt"), minutos);

  const inicio = Date.now();
  const envio = await chamarAssembly(`${API}/upload`, chave, {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: await audio.arrayBuffer(),
  });
  if (!envio.ok) {
    logEvento("transcrever_upload_falhou", { status: envio.status });
    throw new ErroApp("IA_INDISPONIVEL", "Falha ao enviar o áudio para transcrição.");
  }
  const { upload_url: urlDoAudio } = await envio.json();
  if (!urlDoAudio) throw new ErroApp("IA_INDISPONIVEL", "Falha ao enviar o áudio para transcrição.");

  const tarefa = await chamarAssembly(`${API}/transcript`, chave, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audio_url: urlDoAudio, language_code: "pt" }),
  });
  if (!tarefa.ok) {
    logEvento("transcrever_criar_falhou", { status: tarefa.status });
    throw new ErroApp("IA_INDISPONIVEL", "Não foi possível iniciar a transcrição.");
  }
  const { id } = await tarefa.json();
  if (!id) throw new ErroApp("IA_INDISPONIVEL", "Não foi possível iniciar a transcrição.");

  logEvento("transcrever_iniciar", { usuario: usuario.userId, bytes: audio.size, minutos, ms: Date.now() - inicio });
  return ok({ id });
}

async function consultar(req: Request, chave: string): Promise<Response> {
  let corpo: unknown = null;
  try {
    corpo = await req.json();
  } catch {
    corpo = null;
  }
  const entrada = EntradaStatus.safeParse(corpo);
  if (!entrada.success) throw new ErroApp("ENTRADA_INVALIDA", "Informe acao=status e o id da transcrição.");

  const resposta = await chamarAssembly(`${API}/transcript/${entrada.data.id}`, chave, { method: "GET" });
  if (resposta.status === 404) return ok({ status: "erro" });
  if (!resposta.ok) throw new ErroApp("IA_INDISPONIVEL", "Não foi possível consultar a transcrição.");

  const dados = await resposta.json();
  if (dados.status === "completed") {
    const texto = String(dados.text ?? "").trim();
    apagarNaAssembly(entrada.data.id, chave);
    return ok({ status: "pronto", texto });
  }
  if (dados.status === "error") {
    logEvento("transcrever_erro_do_servico", {});
    apagarNaAssembly(entrada.data.id, chave);
    return ok({ status: "erro" });
  }
  return ok({ status: "processando" });
}

Deno.serve(async (req) => {
  const preVoo = responderOptions(req);
  if (preVoo) return preVoo;

  try {
    if (req.method !== "POST") throw new ErroApp("ENTRADA_INVALIDA", "Use POST.");
    const usuario = await exigirUsuario(req);

    const chave = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!chave) throw new ErroApp("IA_INDISPONIVEL", "Transcrição indisponível no momento.");

    const tipo = req.headers.get("content-type") ?? "";
    return tipo.includes("multipart/form-data")
      ? await iniciar(req, chave, usuario)
      : await consultar(req, chave);
  } catch (e) {
    return erroDeExcecao(e);
  }
});
