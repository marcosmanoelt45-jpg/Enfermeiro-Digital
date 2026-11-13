// Regras puras da função `admin` (testadas em regras.test.mjs, sem rede).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

export interface ContaResumo {
  id: string;
  email: string;
  nome: string;
  criadoEm: string | null;
  ultimoAcesso: string | null;
  provedor: string | null;
}

// deno-lint-ignore no-explicit-any
export function resumirConta(u: any, nomes: Record<string, string> = {}): ContaResumo {
  const meta = u?.user_metadata ?? {};
  return {
    id: String(u?.id ?? ""),
    email: String(u?.email ?? ""),
    nome: nomes[u?.id] || meta.full_name || meta.name || "",
    criadoEm: u?.created_at ?? null,
    ultimoAcesso: u?.last_sign_in_at ?? null,
    provedor: u?.app_metadata?.provider ?? null,
  };
}

// Busca simples por e-mail ou nome, sem diferenciar maiúsculas nem acentos.
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filtrarContas(contas: ContaResumo[], busca: unknown): ContaResumo[] {
  const termo = typeof busca === "string" ? normalizar(busca.trim()) : "";
  if (!termo) return contas;
  return contas.filter((c) => normalizar(`${c.email} ${c.nome}`).includes(termo));
}

// Mais recentes primeiro (último acesso; sem acesso, pela criação).
export function ordenarContas(contas: ContaResumo[]): ContaResumo[] {
  const t = (c: ContaResumo) => new Date(c.ultimoAcesso || c.criadoEm || 0).getTime() || 0;
  return [...contas].sort((a, b) => t(b) - t(a));
}

// Atividades do histórico do progresso: só os campos de exibição, nada do formulário preenchido.
// deno-lint-ignore no-explicit-any
export function resumirAtividades(lista: any, limite = 100) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, limite).map((a) => ({
    id: typeof a?.id === "string" ? a.id : null,
    modulo: typeof a?.moduleType === "string" ? a.moduleType : null,
    titulo: typeof a?.title === "string" ? a.title.slice(0, 200) : "",
    status: typeof a?.status === "string" ? a.status : null,
    nota: typeof a?.score === "number" ? a.score : null,
    em: a?.finishedAt || a?.updatedAt || null,
  }));
}

// Por que a deleção não pode seguir (ou null se pode).
export function motivoParaRecusarDelecao(
  { adminId, alvoId, alvoEmail, emailDigitado, alvoEhAdmin }:
    { adminId: string; alvoId: string; alvoEmail: string; emailDigitado: unknown; alvoEhAdmin: boolean },
): string | null {
  if (alvoId === adminId) return "Você não pode apagar a própria conta por aqui.";
  if (alvoEhAdmin) return "Esta conta é de administrador e não pode ser apagada por aqui.";
  const digitado = typeof emailDigitado === "string" ? emailDigitado.trim().toLowerCase() : "";
  if (!alvoEmail || digitado !== alvoEmail.trim().toLowerCase()) return "O e-mail digitado não confere.";
  return null;
}
