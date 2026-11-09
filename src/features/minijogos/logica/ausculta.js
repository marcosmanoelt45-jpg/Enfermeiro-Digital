// Lógica pura do minijogo de ausculta pulmonar (sem tela nem áudio).
// Ausculta livre: o aluno explora o tórax e procura o PONTO DE MELHOR AUSCULTA do caso. Os campos pulmonares e os
// pontos de referência seguem a aula de exame físico do tórax (Barros, E. et al., Anamnese e exame físico):
// ápices acima da clavícula/escápula, bases na região infraescapular; roncos de vias aéreas maiores (centrais),
// sibilos de brônquios menores (difusos), crepitantes nos alvéolos (bases, na congestão).
// Coordenadas no viewBox da cena (400 x 500). Na FRENTE o lado direito do paciente fica à esquerda da tela;
// nas COSTAS, à direita.

// Campos pulmonares (elipses) por vista, antes da variação de anatomia de cada paciente.
const PULMOES = {
  frente: [
    { lado: "direito", cx: 166, cy: 262, rx: 34, ry: 50 },
    { lado: "esquerdo", cx: 236, cy: 266, rx: 30, ry: 46 }, // um pouco menor: o coração ocupa espaço
  ],
  costas: [
    { lado: "esquerdo", cx: 164, cy: 270, rx: 34, ry: 56 },
    { lado: "direito", cx: 236, cy: 270, rx: 34, ry: 56 },
  ],
};

export const RAIO_MAXIMO = 16; // perto assim do ponto de melhor ausculta, o som está no máximo
export const SEGURAR_MS = 1500; // tempo parado no som máximo para marcar o ponto
export const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Gerador simples com semente, para o mesmo caso ter a mesma anatomia numa rodada.
export function gerador(semente = 1) {
  let s = semente >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Monta o paciente da rodada: campos pulmonares levemente deslocados (cada um tem a sua anatomia) e os pontos de
 * melhor ausculta conforme o achado. Devolve { pulmoes: {frente, costas}, pontos: [{vista, x, y, lado}], achado }.
 */
export function montarCaso(achado, { rng = Math.random, vistas = ["costas"] } = {}) {
  const desloca = () => (rng() * 2 - 1) * 7;
  const dx = desloca();
  const dy = desloca();
  const pulmoes = Object.fromEntries(
    Object.entries(PULMOES).map(([v, lista]) => [v, lista.map((p) => ({ ...p, cx: p.cx + dx * (p.lado === "direito" ? 1 : -1) * 0.5, cy: p.cy + dy, rx: p.rx * (0.94 + rng() * 0.1), ry: p.ry * (0.94 + rng() * 0.1) }))])
  );
  const pontos = [];
  const lado = rng() < 0.5 ? "direito" : "esquerdo";
  for (const v of vistas) {
    const doLado = pulmoes[v].find((p) => p.lado === lado);
    const outro = pulmoes[v].find((p) => p.lado !== lado);
    if (achado === "crepitantes_finos" || achado === "crepitantes_grossos") {
      // bases: terço inferior do campo pulmonar (na frente, na linha axilar; atrás, infraescapular)
      if (v === "costas") pontos.push({ vista: v, lado, x: doLado.cx + (rng() * 2 - 1) * 8, y: doLado.cy + doLado.ry * 0.62 });
      else pontos.push({ vista: v, lado, x: doLado.cx + (lado === "direito" ? -1 : 1) * doLado.rx * 0.45, y: doLado.cy + doLado.ry * 0.55 });
    } else if (achado === "roncos") {
      // vias aéreas maiores: perto do hilo (interescapular atrás; 2º espaço junto ao esterno na frente)
      const hilo = v === "costas" ? { x: (doLado.cx + 200) / 2, y: doLado.cy - doLado.ry * 0.3 } : { x: (doLado.cx + 200) / 2, y: doLado.cy - doLado.ry * 0.45 };
      pontos.push({ vista: v, lado, ...hilo });
    } else if (achado === "sibilos") {
      // difusos, mais fortes no meio dos campos (os dois lados)
      pontos.push({ vista: v, lado, x: doLado.cx, y: doLado.cy });
      pontos.push({ vista: v, lado: outro.lado, x: outro.cx, y: outro.cy });
    } else {
      // normal: murmúrio vesicular bem audível no meio de qualquer campo
      for (const p of pulmoes[v]) pontos.push({ vista: v, lado: p.lado, x: p.cx, y: p.cy + p.ry * 0.2 });
    }
  }
  return { achado, pulmoes, pontos };
}

// 1 no meio do campo pulmonar, caindo até a borda; fora do pulmão (coluna, escápula, abdome) o som é abafado.
export function dentroDoPulmao(caso, vista, p) {
  let melhor = 0;
  for (const e of caso.pulmoes[vista]) {
    const k = ((p.x - e.cx) / e.rx) ** 2 + ((p.y - e.cy) / e.ry) ** 2; // < 1 dentro da elipse
    melhor = Math.max(melhor, k <= 1 ? 1 - 0.35 * k : Math.max(0, 1 - (Math.sqrt(k) - 1) * 2.2) * 0.4);
  }
  return melhor;
}

export function pontoMaisProximo(caso, vista, p) {
  const daVista = caso.pontos.filter((x) => x.vista === vista);
  if (!daVista.length) return { ponto: null, d: Infinity };
  return daVista.reduce((a, x) => (distancia(x, p) < a.d ? { ponto: x, d: distancia(x, p) } : a), { ponto: null, d: Infinity });
}

/**
 * O que se ouve com o diafragma em p: { tipo, qualidade, noMaximo }.
 * qualidade: nitidez geral (pulmão x fora dele) somada à proximidade do ponto de melhor ausculta.
 */
export function somNoPonto(caso, vista, p) {
  const pulmao = dentroDoPulmao(caso, vista, p);
  const { d } = pontoMaisProximo(caso, vista, p);
  const perto = Number.isFinite(d) ? Math.max(0, 1 - d / 75) : 0;
  const advent = caso.achado !== "normal";
  const tipo = advent && perto > 0.25 ? caso.achado : "normal";
  const qualidade = Math.max(0, Math.min(1, advent ? pulmao * (0.45 + 0.55 * perto) : pulmao * (0.6 + 0.4 * perto)));
  return { tipo, qualidade, noMaximo: d <= RAIO_MAXIMO && pulmao > 0.5 };
}

// Achado do caso a partir do texto (prontuário/lacuna): "crepitações finas em bases" -> crepitantes_finos.
export function achadoDoTexto(texto = "") {
  const t = String(texto).toLowerCase();
  if (/sibil/.test(t) && !/sem sibil/.test(t)) return "sibilos";
  if (/ronco/.test(t)) return "roncos";
  if (/(crepita|estertor)/.test(t) && !/sem (crepita|estertor)/.test(t)) return /(grosso|bolhos)/.test(t) ? "crepitantes_grossos" : "crepitantes_finos";
  return "normal";
}

export const ONDE = {
  normal: "Murmúrio vesicular presente nos dois campos, sem ruídos adventícios.",
  crepitantes_finos: "Crepitantes finos nas bases (alvéolos), no fim da inspiração, como na congestão pulmonar.",
  crepitantes_grossos: "Crepitantes grossos (bolhosos) nas bases, na inspiração e na expiração (secreção em vias menores).",
  sibilos: "Sibilos difusos, agudos e musicais, mais na expiração (brônquios médios e menores estreitados).",
  roncos: "Roncos graves e ressonantes, mais perto das vias aéreas centrais (brônquios maiores com secreção).",
};

// Os crepitantes finos e grossos contam como a mesma resposta "crepitantes" na identificação.
export const familia = (r) => (r?.startsWith("crepitantes") ? "crepitantes" : r);

// Avaliação (formato do C11): achou o ponto de melhor ausculta? acertou o ruído?
export function avaliarAusculta(def, acao) {
  const { achouPonto = false, ruido = null } = acao ?? {};
  const ok = familia(ruido) === familia(def.ausculta.achado);
  return {
    acertos: (achouPonto ? 1 : 0) + (ok ? 1 : 0),
    erros: ok ? 0 : 1,
    concluido: ok,
    achouPonto,
    detalhes: [{ id: "ruido", ok, feedback: ok ? "" : "Esse não é o ruído deste paciente. Procure o ponto onde o som fica mais forte e ouça de novo." }],
  };
}
