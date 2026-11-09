// Lógica pura do minijogo de ausculta pulmonar (sem tela nem áudio): focos, ordem, distância e avaliação.
// Focos e sequência: Barros, E. et al. "Anamnese e exame físico", como na aula de exame físico do tórax
// (frente: 5 níveis; costas: 9 níveis; sempre comparando direita e esquerda, em zigue-zague).
// Coordenadas no viewBox da cena (400 x 500). Na FRENTE o lado direito do paciente fica à esquerda da tela;
// nas COSTAS, à direita.

const D = "direito";
const E = "esquerdo";

// [nível, lado, x, y, nome]
const FRENTE = [
  [1, D, 162, 198, "região infraclavicular (ápice)"],
  [1, E, 238, 198, "região infraclavicular (ápice)"],
  [2, D, 166, 226, "2º espaço intercostal, linha hemiclavicular"],
  [2, E, 234, 226, "2º espaço intercostal, linha hemiclavicular"],
  [3, D, 168, 254, "4º espaço intercostal, linha hemiclavicular"],
  [3, E, 232, 254, "4º espaço intercostal, linha hemiclavicular"],
  [4, D, 156, 286, "6º espaço intercostal, linha hemiclavicular"],
  [4, E, 244, 286, "6º espaço intercostal, linha hemiclavicular"],
  [5, D, 118, 314, "base lateral, linha axilar média"],
  [5, E, 282, 314, "base lateral, linha axilar média"],
];

const COSTAS = [
  [1, D, 240, 198, "região supraescapular"],
  [1, E, 160, 198, "região supraescapular"],
  [2, D, 218, 222, "região interescapulovertebral superior"],
  [2, E, 182, 222, "região interescapulovertebral superior"],
  [3, D, 218, 242, "região interescapulovertebral"],
  [3, E, 182, 242, "região interescapulovertebral"],
  [4, D, 218, 262, "região interescapulovertebral"],
  [4, E, 182, 262, "região interescapulovertebral"],
  [5, D, 218, 282, "região interescapulovertebral inferior"],
  [5, E, 182, 282, "região interescapulovertebral inferior"],
  [6, D, 252, 302, "região infraescapular"],
  [6, E, 148, 302, "região infraescapular"],
  [7, D, 236, 324, "região infraescapular inferior"],
  [7, E, 164, 324, "região infraescapular inferior"],
  [8, D, 282, 326, "linha axilar posterior"],
  [8, E, 118, 326, "linha axilar posterior"],
  [9, D, 228, 352, "base pulmonar"],
  [9, E, 172, 352, "base pulmonar"],
];

const montar = (vista, lista) =>
  lista.map(([nivel, lado, x, y, nome]) => ({ id: `${vista}-${nivel}${lado[0]}`, vista, nivel, lado, x, y, nome }));

export const FOCOS = { frente: montar("frente", FRENTE), costas: montar("costas", COSTAS) };

// Zigue-zague da figura: níveis ímpares direita -> esquerda; pares, esquerda -> direita.
export function sequencia(vista) {
  const porNivel = new Map();
  for (const f of FOCOS[vista]) {
    if (!porNivel.has(f.nivel)) porNivel.set(f.nivel, []);
    porNivel.get(f.nivel).push(f);
  }
  return [...porNivel.entries()]
    .sort((a, b) => a[0] - b[0])
    .flatMap(([nivel, par]) => {
      const dir = par.find((f) => f.lado === D);
      const esq = par.find((f) => f.lado === E);
      return nivel % 2 ? [dir, esq] : [esq, dir];
    });
}

export const RAIO_ACERTO = 17; // unidades do viewBox (~um dedo na tela)
export const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// 1 = em cima do foco; 0 = longe (o som fica abafado).
export function qualidadeDoSom(d) {
  if (d <= 8) return 1;
  return Math.max(0, Math.min(1, 1 - (d - 8) / 60));
}

// Bases (onde os crepitantes de congestão aparecem): frente 4–5; costas 7–9.
export const ehBase = (foco) => (foco.vista === "frente" ? foco.nivel >= 4 : foco.nivel >= 7);

// O que se ouve num foco, dado o achado do caso.
export function ruidoNoFoco(achado, foco) {
  if (achado === "crepitantes_finos" || achado === "crepitantes_grossos") return ehBase(foco) ? achado : "normal";
  return achado; // normal, sibilos e roncos: difusos
}

// Dica de direção quando o aluno erra o mesmo foco duas vezes.
export function dicaDeDirecao(alvo, ponto) {
  const dx = alvo.x - ponto.x;
  const dy = alvo.y - ponto.y;
  const vertical = Math.abs(dy) > 12 ? (dy < 0 ? "mais para cima" : "mais para baixo") : "";
  const horizontal = Math.abs(dx) > 12 ? (dx < 0 ? "mais para a esquerda" : "mais para a direita") : "";
  return [vertical, horizontal].filter(Boolean).join(" e ") || "quase lá, ajuste um pouquinho";
}

// Achado do caso a partir do texto (prontuário/lacuna): "crepitações finas em bases" -> crepitantes_finos.
export function achadoDoTexto(texto = "") {
  const t = String(texto).toLowerCase();
  if (/sibil/.test(t) && !/sem sibil/.test(t)) return "sibilos";
  if (/ronco/.test(t)) return "roncos";
  if (/(crepita|estertor)/.test(t) && !/sem (crepita|estertor)/.test(t)) return /(grosso|bolhos)/.test(t) ? "crepitantes_grossos" : "crepitantes_finos";
  return "normal";
}

// Avaliação (formato do C11): focos certos e errados + o ruído escolhido no fim.
// Os crepitantes finos e grossos contam como a mesma resposta "crepitantes" no teste de identificação.
export const familia = (r) => (r?.startsWith("crepitantes") ? "crepitantes" : r);
export function avaliarAusculta(def, acao) {
  const { focosCertos = 0, focosErros = 0, ruido = null } = acao ?? {};
  const ok = familia(ruido) === familia(def.ausculta.achado);
  return {
    acertos: focosCertos + (ok ? 1 : 0),
    erros: focosErros + (ruido && !ok ? 1 : 0),
    concluido: ok,
    detalhes: [{ id: "ruido", ok, feedback: ok ? "" : "Esse não é o ruído deste paciente. Ausculte de novo, comparando os dois lados e as bases." }],
  };
}
