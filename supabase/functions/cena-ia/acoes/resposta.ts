// Monta a resposta final de uma ação. O campo interno `_debug` (usado só pela bateria de comportamento, no
// branch do Supabase) sai da resposta a menos que o secret CENA_IA_DEBUG seja exatamente "1". Em produção
// esse secret não existe, então `_debug` nunca vai para o cliente.
export function montarResposta(env: { CENA_IA_DEBUG?: string }, dados: Record<string, unknown>): Record<string, unknown> {
  const { _debug, ...publico } = dados;
  return env.CENA_IA_DEBUG === "1" && _debug !== undefined ? { ...publico, _debug } : publico;
}
