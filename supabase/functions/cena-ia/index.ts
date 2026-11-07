// ==============================================================================
// cena-ia/index.ts
// Roteador das cenas com IA, por `acao` no corpo JSON. A F3 traz criar_consulta, turno_consulta e
// retomar_consulta; as próximas fases acrescentam ações em ./acoes.
// ==============================================================================
import { responderOptions } from "../_shared/cors.ts";
import { exigirUsuario } from "../_shared/auth.ts";
import { consumirCota, limiteDe } from "../_shared/cota.ts";
import { ErroApp, erroDeExcecao, ok } from "../_shared/erros.ts";
import { chamarLLM } from "../_shared/llm.ts";
import { z } from "../_shared/schemas.ts";
import { criarConsulta } from "./acoes/criarConsulta.ts";
import { turnoConsulta } from "./acoes/turnoConsulta.ts";
import { retomarConsulta } from "./acoes/retomarConsulta.ts";
import { montarResposta } from "./acoes/resposta.ts";
import { criarRepositorio } from "./repositorio.ts";

const PERSONALIDADES = ["colaborativo", "ansioso", "desconfiado", "esquecido", "minimizador", "poliqueixoso", "envergonhado", "surpresa"] as const;

const Entrada = z.discriminatedUnion("acao", [
  z.object({
    acao: z.literal("criar_consulta"),
    arquetipoId: z.string().regex(/^[a-z0-9_]{2,60}$/).nullable().optional(),
    tema: z.string().regex(/^[a-z_]{2,40}$/).nullable().optional(),
    idade: z.number().int().min(18).max(95),
    sexo: z.enum(["M", "F"]),
    personagemId: z.string().regex(/^[a-z0-9-]{2,40}$/),
    personalidadeId: z.enum(PERSONALIDADES),
    dificuldade: z.enum(["facil", "normal", "dificil"]),
  }),
  z.object({
    acao: z.literal("turno_consulta"),
    sessaoId: z.string().uuid(),
    turnoId: z.string().uuid(),
    texto: z.string().trim().min(1).max(600),
    canal: z.enum(["voz", "texto"]),
  }),
  z.object({ acao: z.literal("retomar_consulta"), sessaoId: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  const preVoo = responderOptions(req);
  if (preVoo) return preVoo;

  try {
    if (req.method !== "POST") throw new ErroApp("ENTRADA_INVALIDA", "Use POST.");
    const usuario = await exigirUsuario(req);

    let corpo: unknown = null;
    try {
      corpo = await req.json();
    } catch {
      corpo = null;
    }
    const entrada = Entrada.safeParse(corpo);
    if (!entrada.success) throw new ErroApp("ENTRADA_INVALIDA", "Pedido inválido para a cena.");
    const dados = entrada.data;

    const repo = criarRepositorio(usuario.supabaseAdmin);
    const deps = { repo, llm: chamarLLM };

    switch (dados.acao) {
      case "criar_consulta": {
        await consumirCota(usuario.supabaseUsuario, "consulta", limiteDe("consulta"));
        return ok(await criarConsulta(usuario.userId, { ...dados, arquetipoId: dados.arquetipoId ?? null, tema: dados.tema ?? null }, deps));
      }
      case "turno_consulta": {
        const cota = () => consumirCota(usuario.supabaseUsuario, "turno", limiteDe("turno"));
        const resposta = await turnoConsulta(usuario.userId, dados, { ...deps, cota });
        return ok(montarResposta({ CENA_IA_DEBUG: Deno.env.get("CENA_IA_DEBUG") }, resposta));
      }
      case "retomar_consulta":
        return ok(await retomarConsulta(usuario.userId, dados, deps));
    }
  } catch (e) {
    return erroDeExcecao(e);
  }
});
