// Regras do social que não dependem do servidor (testáveis no node): código de convite, ofensiva juntos,
// ordenação do pódio e textos de compartilhamento.

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I: fácil de ler e digitar

/** Código de convite de 8 letras (o mesmo formato que a tabela convites aceita). */
export function gerarCodigo(aleatorio = Math.random) {
  return Array.from({ length: 8 }, () => ALFABETO[Math.floor(aleatorio() * ALFABETO.length)]).join("");
}

export const codigoValido = (c) => /^[A-Z2-9]{8}$/.test(String(c || "").toUpperCase());

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Ofensiva juntos: dias seguidos em que os DOIS estudaram, contando de hoje para trás (ou de ontem, se hoje
 * algum dos dois ainda não estudou). Mesma ideia da ofensiva com amigos do Duolingo.
 */
export function ofensivaJuntos(diasA = [], diasB = [], hoje = new Date()) {
  const a = new Set(diasA);
  const b = new Set(diasB);
  const juntos = (d) => a.has(iso(d)) && b.has(iso(d));
  const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (!juntos(dia)) dia.setDate(dia.getDate() - 1);
  let n = 0;
  while (juntos(dia)) {
    n += 1;
    dia.setDate(dia.getDate() - 1);
  }
  return n;
}

/** Se a pessoa já estudou hoje (pelos dias do perfil público). */
export const estudouHojePerfil = (dias = [], hoje = new Date()) => dias.includes(iso(hoje));

export const METRICAS = {
  ofensiva: { rotulo: "Ofensiva", curto: "dias", campo: "ofensiva" },
  melhor_ofensiva: { rotulo: "Recorde", curto: "dias", campo: "melhor_ofensiva" },
  pe_semana: { rotulo: "PE da semana", curto: "PE", campo: "pe_semana" },
};

/**
 * Ordena o pódio pela métrica. PE da semana só vale se for desta semana (senão conta 0). Empate: quem tem a maior
 * ofensiva, depois o nome. Devolve [{ ...perfil, valor, posicao }] com posições iguais para empates.
 */
export function ordenarPodio(perfis = [], metrica = "ofensiva", semanaAtual = null) {
  const campo = METRICAS[metrica]?.campo ?? "ofensiva";
  const valor = (p) => (campo === "pe_semana" && semanaAtual && p.semana !== semanaAtual ? 0 : Number(p[campo]) || 0);
  const lista = perfis
    .map((p) => ({ ...p, valor: valor(p) }))
    .sort((x, y) => y.valor - x.valor || (Number(y.ofensiva) || 0) - (Number(x.ofensiva) || 0) || String(x.nome).localeCompare(String(y.nome), "pt-BR"));
  let posicao = 0;
  let anterior = null;
  return lista.map((p, i) => {
    if (p.valor !== anterior) {
      posicao = i + 1;
      anterior = p.valor;
    }
    return { ...p, posicao };
  });
}

/** Texto do convite para WhatsApp/Telegram. */
export function textoDoConvite(nome, link) {
  const quem = nome ? `${nome.split(" ")[0]} te chamou` : "Te chamaram";
  return `${quem} para estudar enfermagem junto no Enfere! Vamos manter a ofensiva lado a lado 🔥 Entre pelo link: ${link}`;
}

export const linkWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`;
export const linkTelegram = (link, texto) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(texto)}`;
