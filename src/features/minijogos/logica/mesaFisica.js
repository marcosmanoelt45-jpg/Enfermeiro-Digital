// Física leve da cena "mesa" (minijogo de arrastar com objetos de verdade sobre a mesa, vista de cima).
// Funções puras em coordenadas normalizadas (0..1 da largura e da altura da mesa), sem tela nem DOM.
// Cada objeto: { id, x, y, vx, vy, rot, vrot, h, vh, arrastando, raio }.
//   x, y  = centro; raio = metade do lado, em fração da largura;
//   h     = altura acima da mesa (0 = apoiado; > 0 = no ar), dá a escala e a sombra;
//   rot   = inclinação em graus (balanço ao arrastar).

export const PARAMS = {
  seguir: 0.38, // fração da distância até o dedo/mouse percorrida a cada quadro
  alturaErguido: 1, // h enquanto está na mão
  gravidade: 0.012, // aceleração de queda por quadro (em h)
  quique: 0.32, // energia que sobra no quique
  balanco: 1.6, // graus de inclinação por unidade de velocidade (x 100)
  balancoMax: 22,
  molaRot: 0.18, // rigidez da mola da inclinação
  amortRot: 0.72,
  atrito: 0.82, // amortecimento do deslize quando empurrado
  folga: 0.92, // fração do raio usada na colisão (sobreposição leve, como objetos reais)
};

// Layout da mesa: paisagem (objetos à esquerda e à direita) ou retrato (em cima e embaixo).
export function layoutDaMesa(largura) {
  const paisagem = largura >= 560;
  return paisagem
    ? { paisagem, proporcao: 16 / 10, bandeja: { x: 0.5, y: 0.5, w: 0.46, h: (0.46 * 1.6) / (4 / 3) }, lado: 0.115 }
    : { paisagem, proporcao: 4 / 5, bandeja: { x: 0.5, y: 0.5, w: 0.74, h: (0.74 * 0.8) / (4 / 3) }, lado: 0.19 };
}

// Gerador determinístico (mesma sessão, mesma arrumação).
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
  if (layout.paisagem) {
    const xs = [0.1, 0.205, 0.795, 0.9];
    const ys = [0.17, 0.4, 0.62, 0.84];
    for (const y of ys) for (const x of xs) vagas.push({ x, y });
  } else {
    const xs = [0.14, 0.38, 0.62, 0.86];
    const ys = [0.11, 0.24, 0.76, 0.89];
    for (const y of ys) for (const x of xs) vagas.push({ x, y });
  }
  // Embaralha e tira uma pequena variação para não parecer grade.
  for (let i = vagas.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [vagas[i], vagas[j]] = [vagas[j], vagas[i]];
  }
  return vagas.slice(0, n).map((v) => ({ x: v.x + (rnd() - 0.5) * 0.03, y: v.y + (rnd() - 0.5) * 0.03, rot: (rnd() - 0.5) * 30 }));
}

export function dentroDaBandeja(obj, bandeja) {
  return Math.abs(obj.x - bandeja.x) <= bandeja.w / 2 - 0.01 && Math.abs(obj.y - bandeja.y) <= bandeja.h / 2 - 0.01;
}

// Um quadro de simulação. `proporcao` = largura/altura da mesa (para colisão em distância real).
// `alvo` = posição do ponteiro para o objeto que está sendo arrastado.
export function passo(objs, { proporcao, alvo = null, params = PARAMS }) {
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
      // A inclinação volta ao repouso devagar.
      o.vrot = (o.vrot + ((o.rotRepouso ?? 0) - o.rot) * 0.08) * 0.75;
      o.rot += o.vrot;
    }
  }
  // Colisão: objetos apoiados se afastam; quem está na mão empurra, mas não é empurrado.
  for (let i = 0; i < objs.length; i++) {
    for (let j = i + 1; j < objs.length; j++) {
      const a = objs[i];
      const b = objs[j];
      if (a.h > 0.5 || b.h > 0.5) continue; // um deles está no ar: passa por cima
      const dx = (b.x - a.x) * proporcao;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1e-6;
      const min = (a.raio + b.raio) * proporcao * params.folga;
      if (dist >= min) continue;
      const empurra = (min - dist) / dist;
      const ex = (dx * empurra) / proporcao;
      const ey = dy * empurra;
      const pesoA = a.arrastando ? 0 : b.arrastando ? 1 : 0.5;
      const pesoB = b.arrastando ? 0 : a.arrastando ? 1 : 0.5;
      a.vx -= ex * pesoA * 0.5;
      a.vy -= ey * pesoA * 0.5;
      b.vx += ex * pesoB * 0.5;
      b.vy += ey * pesoB * 0.5;
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

// Está tudo parado? (para o laço de animação dormir quando não há nada acontecendo)
export function emRepouso(objs) {
  return objs.every((o) => !o.arrastando && o.h === 0 && o.vh === 0 && Math.abs(o.vx) + Math.abs(o.vy) < 1e-4 && Math.abs(o.vrot) < 0.01 && Math.abs((o.rotRepouso ?? 0) - o.rot) < 0.05);
}

// Ponto livre dentro da bandeja (para colocar pelo teclado), evitando os que já estão lá.
export function vagaNaBandeja(objs, bandeja, raio, proporcao) {
  const cols = 3;
  const rows = 3;
  let melhor = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Só o fundo da bandeja (78% do tamanho), longe da borda.
      const w = bandeja.w * 0.78;
      const h = bandeja.h * 0.78;
      const p = { x: bandeja.x - w / 2 + ((c + 0.5) * w) / cols, y: bandeja.y - h / 2 + ((r + 0.5) * h) / rows };
      const livre = Math.min(...objs.map((o) => Math.hypot((o.x - p.x) * proporcao, o.y - p.y)).concat([9]));
      if (!melhor || livre > melhor.livre) melhor = { ...p, livre };
    }
  }
  return melhor ? { x: melhor.x, y: melhor.y } : { x: bandeja.x, y: bandeja.y };
}
