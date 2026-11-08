// Física leve da cena "mesa" (minijogo de arrastar com objetos de verdade sobre a mesa, vista de cima).
// Funções puras em coordenadas normalizadas (0..1 da largura e da altura da mesa), sem tela nem DOM.
// Cada objeto: { id, x, y, vx, vy, rot, vrot, h, vh, arrastando, raio, rotRepouso }.
//   x, y  = centro; raio = metade do lado, em fração da largura (na altura vale raio * proporcao);
//   h     = altura acima da mesa (0 = apoiado; > 0 = no ar), dá a escala e a sombra;
//   rot   = inclinação em graus (balanço ao arrastar).
// A bandeja tem parede: quem está dentro fica inteiro no fundo dela; quem está fora não fica em cima da borda.

export const PARAMS = {
  seguir: 0.38, // fração da distância até o ponteiro percorrida a cada quadro
  alturaErguido: 1, // h enquanto está na mão
  gravidade: 0.012, // aceleração de queda por quadro (em h)
  quique: 0.32, // energia que sobra no quique
  balanco: 1.6, // graus de inclinação por unidade de velocidade (x 100)
  balancoMax: 22,
  molaRot: 0.18,
  amortRot: 0.72,
  atrito: 0.8, // amortecimento do deslize quando empurrado
  folga: 0.9, // fração do raio usada na colisão entre objetos (encostam um pouco, como de verdade)
  parede: 0.35, // rapidez com que a parede da bandeja corrige quem está encostado nela
};

// Fundo da bandeja = parte interna, sem a borda (a imagem tem borda de ~9% de cada lado).
export const FUNDO = 0.82;

// Layout da mesa: paisagem (objetos à esquerda e à direita) ou retrato (em cima e embaixo).
export function layoutDaMesa(largura) {
  const paisagem = largura >= 560;
  return paisagem
    ? { paisagem, proporcao: 16 / 10, bandeja: { x: 0.5, y: 0.5, w: 0.54, h: (0.54 * 1.6) / (4 / 3) }, lado: 0.098 }
    : { paisagem, proporcao: 4 / 5, bandeja: { x: 0.5, y: 0.5, w: 0.86, h: (0.86 * 0.8) / (4 / 3) }, lado: 0.165 };
}

export function fundoDa(bandeja) {
  return { x: bandeja.x, y: bandeja.y, w: bandeja.w * FUNDO, h: bandeja.h * FUNDO };
}

// Gerador determinístico (mesma semente, mesma arrumação).
export function aleatorio(semente = 1) {
  let s = semente >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Vagas fora da bandeja para os objetos começarem espalhados pela mesa.
export function vagasIniciais(n, layout, semente = 7) {
  const rnd = aleatorio(semente);
  const vagas = [];
  const xs = layout.paisagem ? [0.075, 0.165, 0.835, 0.925] : [0.12, 0.373, 0.627, 0.88];
  const ys = layout.paisagem ? [0.14, 0.38, 0.62, 0.86] : [0.07, 0.17, 0.83, 0.93];
  for (const y of ys) for (const x of xs) vagas.push({ x, y });
  for (let i = vagas.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [vagas[i], vagas[j]] = [vagas[j], vagas[i]];
  }
  return vagas.slice(0, n).map((v) => ({ x: v.x + (rnd() - 0.5) * 0.02, y: v.y + (rnd() - 0.5) * 0.015, rot: (rnd() - 0.5) * 30 }));
}

// Está dentro da bandeja? (critério do centro dentro do retângulo da bandeja)
export function dentroDaBandeja(obj, bandeja) {
  return Math.abs(obj.x - bandeja.x) < bandeja.w / 2 && Math.abs(obj.y - bandeja.y) < bandeja.h / 2;
}

// Parede da bandeja para um objeto apoiado: dentro, fica inteiro no fundo; fora, não fica em cima da borda.
// Devolve o ponto corrigido (ou o mesmo, se já estiver bem).
export function aplicarParede(o, bandeja, proporcao) {
  const rx = o.raio;
  const ry = o.raio * proporcao;
  if (dentroDaBandeja(o, bandeja)) {
    const f = fundoDa(bandeja);
    const minX = f.x - f.w / 2 + rx;
    const maxX = f.x + f.w / 2 - rx;
    const minY = f.y - f.h / 2 + ry;
    const maxY = f.y + f.h / 2 - ry;
    return { x: Math.min(maxX, Math.max(minX, o.x)), y: Math.min(maxY, Math.max(minY, o.y)) };
  }
  // Fora: se o quadrado do objeto invade a bandeja, sai pelo lado mais perto.
  const esq = bandeja.x - bandeja.w / 2 - rx;
  const dir = bandeja.x + bandeja.w / 2 + rx;
  const cima = bandeja.y - bandeja.h / 2 - ry;
  const baixo = bandeja.y + bandeja.h / 2 + ry;
  if (o.x <= esq || o.x >= dir || o.y <= cima || o.y >= baixo) return { x: o.x, y: o.y };
  const saidas = [
    { d: (o.x - esq) * proporcao, p: { x: esq, y: o.y } },
    { d: (dir - o.x) * proporcao, p: { x: dir, y: o.y } },
    { d: o.y - cima, p: { x: o.x, y: cima } },
    { d: baixo - o.y, p: { x: o.x, y: baixo } },
  ];
  return saidas.sort((a, b) => a.d - b.d)[0].p;
}

// Distância real (em largura) entre centros e a mínima permitida.
function sobreposicao(a, b, proporcao, folga) {
  const dx = (b.x - a.x) * proporcao;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1e-6;
  const min = (a.raio + b.raio) * proporcao * folga;
  return { dx, dy, dist, min };
}

// Um quadro de simulação. `alvo` = posição do ponteiro para o objeto que está sendo arrastado.
// `bandeja` (opcional) liga a parede da bandeja.
export function passo(objs, { proporcao, alvo = null, bandeja = null, params = PARAMS }) {
  for (const o of objs) {
    if (o.arrastando && alvo) {
      const nx = o.x + (alvo.x - o.x) * params.seguir;
      const ny = o.y + (alvo.y - o.y) * params.seguir;
      o.vx = nx - o.x;
      o.vy = ny - o.y;
      o.x = nx;
      o.y = ny;
      o.h += (params.alturaErguido - o.h) * 0.3;
      o.vh = 0;
      // Balanço: inclina para o lado do movimento, como um objeto pendurado na mão.
      const alvoRot = Math.max(-params.balancoMax, Math.min(params.balancoMax, o.vx * 100 * params.balanco));
      o.vrot = (o.vrot + (alvoRot - o.rot) * params.molaRot) * params.amortRot;
      o.rot += o.vrot;
    } else {
      // Queda com gravidade e quique.
      if (o.h > 0 || o.vh !== 0) {
        o.vh -= params.gravidade;
        o.h += o.vh;
        if (o.h <= 0) {
          o.h = 0;
          o.vh = Math.abs(o.vh) > 0.02 ? -o.vh * params.quique : 0;
        }
      }
      // Deslize (empurrado por outro objeto) com atrito.
      o.x += o.vx;
      o.y += o.vy;
      o.vx *= params.atrito;
      o.vy *= params.atrito;
      if (Math.abs(o.vx) < 1e-5) o.vx = 0;
      if (Math.abs(o.vy) < 1e-5) o.vy = 0;
      // A inclinação volta ao repouso.
      o.vrot = (o.vrot + ((o.rotRepouso ?? 0) - o.rot) * 0.08) * 0.75;
      o.rot += o.vrot;
    }
  }
  // Colisão entre objetos: todos se empurram; quem está na mão empurra, mas não é empurrado.
  for (let i = 0; i < objs.length; i++) {
    for (let j = i + 1; j < objs.length; j++) {
      const a = objs[i];
      const b = objs[j];
      const { dx, dy, dist, min } = sobreposicao(a, b, proporcao, params.folga);
      if (dist >= min) continue;
      const empurra = (min - dist) / dist;
      const ex = (dx * empurra) / proporcao;
      const ey = dy * empurra;
      const pesoA = a.arrastando ? 0 : b.arrastando ? 1 : 0.5;
      const pesoB = b.arrastando ? 0 : a.arrastando ? 1 : 0.5;
      // Metade corrige a posição já, metade vira velocidade (desliza um pouco depois).
      a.x -= ex * pesoA * 0.5;
      a.y -= ey * pesoA * 0.5;
      b.x += ex * pesoB * 0.5;
      b.y += ey * pesoB * 0.5;
      a.vx -= ex * pesoA * 0.25;
      a.vy -= ey * pesoA * 0.25;
      b.vx += ex * pesoB * 0.25;
      b.vy += ey * pesoB * 0.25;
    }
  }
  // Parede da bandeja (só para quem está apoiado ou caindo; na mão, passa por cima da borda).
  if (bandeja) {
    for (const o of objs) {
      if (o.arrastando) continue;
      const p = aplicarParede(o, bandeja, proporcao);
      if (p.x !== o.x || p.y !== o.y) {
        // Corrige em poucos quadros (desliza para dentro/fora), e encaixa quando falta pouco.
        o.x = Math.abs(p.x - o.x) < 1e-3 ? p.x : o.x + (p.x - o.x) * params.parede;
        o.y = Math.abs(p.y - o.y) < 1e-3 ? p.y : o.y + (p.y - o.y) * params.parede;
        o.vx *= 0.5;
        o.vy *= 0.5;
      }
    }
  }
  // Ninguém sai da mesa.
  for (const o of objs) {
    const rx = o.raio;
    const ry = o.raio * proporcao;
    if (o.x < rx) { o.x = rx; o.vx = Math.abs(o.vx) * 0.3; }
    if (o.x > 1 - rx) { o.x = 1 - rx; o.vx = -Math.abs(o.vx) * 0.3; }
    if (o.y < ry) { o.y = ry; o.vy = Math.abs(o.vy) * 0.3; }
    if (o.y > 1 - ry) { o.y = 1 - ry; o.vy = -Math.abs(o.vy) * 0.3; }
  }
  return objs;
}

// Algum par de objetos ainda encostado demais, ou alguém fora do lugar na parede?
export function haConflito(objs, { proporcao, bandeja = null, params = PARAMS }) {
  for (let i = 0; i < objs.length; i++) {
    for (let j = i + 1; j < objs.length; j++) {
      const { dist, min } = sobreposicao(objs[i], objs[j], proporcao, params.folga);
      if (min - dist > 0.002) return true;
    }
  }
  if (bandeja) {
    for (const o of objs) {
      if (o.arrastando) continue;
      const p = aplicarParede(o, bandeja, proporcao);
      if (Math.abs(p.x - o.x) + Math.abs(p.y - o.y) > 0.001) return true;
    }
  }
  return false;
}

// Está tudo parado e resolvido? (o laço de animação dorme só aí)
export function emRepouso(objs, opcoes = null) {
  const parado = objs.every((o) => !o.arrastando && o.h === 0 && o.vh === 0 && Math.abs(o.vx) + Math.abs(o.vy) < 1e-4 && Math.abs(o.vrot) < 0.01 && Math.abs((o.rotRepouso ?? 0) - o.rot) < 0.05);
  return parado && !(opcoes && haConflito(objs, opcoes));
}

// Ponto livre no fundo da bandeja (para colocar pelo teclado), longe dos que já estão lá.
export function vagaNaBandeja(objs, bandeja, raio, proporcao) {
  const f = fundoDa(bandeja);
  const cols = 4;
  const rows = 3;
  const w = Math.max(0, f.w - 2 * raio);
  const h = Math.max(0, f.h - 2 * raio * proporcao);
  let melhor = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = { x: f.x - w / 2 + (c * w) / (cols - 1), y: f.y - h / 2 + (r * h) / (rows - 1) };
      const livre = Math.min(...objs.map((o) => Math.hypot((o.x - p.x) * proporcao, o.y - p.y)).concat([9]));
      if (!melhor || livre > melhor.livre) melhor = { ...p, livre };
    }
  }
  return melhor ? { x: melhor.x, y: melhor.y } : { x: f.x, y: f.y };
}
