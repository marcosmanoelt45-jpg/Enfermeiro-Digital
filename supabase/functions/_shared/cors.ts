// CORS comum das Edge Functions. Os cabeçalhos são os mesmos que a clinical-ai-sanitize já usava.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Resposta ao pré-voo do navegador (OPTIONS). Devolve null para qualquer outro método.
export function responderOptions(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : null;
}
