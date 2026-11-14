// Acessórios de cabeça desenhados em vetor (canvas), em coordenadas da arte de 512 px. Substituem as peças do Flow
// de orelhas de gato, urso e coelho, laço e anteninhas: a arte rosa era quase da cor da pele, o recorte tirava
// pedaços (buraco na base da orelha do coelho, tiara das anteninhas vazada) e tudo saía borrado. Aqui sai nítido
// em qualquer tamanho, chapado como o resto do avatar, e o ajuste ao cabelo continua o mesmo (compor.js).

// Cabeça da arte: elipse com centro (256, 180) e raios 94 x 95 (topo em y 85).
const CX = 256;
const CY = 180;
const RX = 97; // tiara um pouco por fora da cabeça
const RY = 98;

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (r, g, b) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
const escuro = (cor, f = 0.7) => hex(...rgb(cor).map((v) => v * f));
const claro = (cor, f = 0.45) => hex(...rgb(cor).map((v) => v + (255 - v) * f));
const rosado = (cor) => {
  // parte de dentro das orelhas: a cor clareada puxando para o rosa
  const [r, g, b] = rgb(cor).map((v) => v + (255 - v) * 0.5);
  return hex(r * 0.55 + 246 * 0.45, g * 0.55 + 178 * 0.45, b * 0.55 + 196 * 0.45);
};

// ponto na tiara: θ em graus a partir do topo (positivo para a direita); n = direção para fora; t = tangente
function naTiara(graus, folga = 0) {
  const a = (graus * Math.PI) / 180;
  const x = CX + (RX + folga) * Math.sin(a);
  const y = CY - (RY + folga) * Math.cos(a);
  const n = [Math.sin(a), -Math.cos(a)];
  return { x, y, n, t: [Math.cos(a), Math.sin(a)], a };
}

function tiara(ctx, cor, largura = 9) {
  const ini = -Math.PI / 2 - 1.32;
  const fim = -Math.PI / 2 + 1.32;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX, RY, 0, ini, fim);
  ctx.strokeStyle = escuro(cor, 0.72);
  ctx.lineWidth = largura + 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX, RY, 0, ini, fim);
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.stroke();
}

function poligono(ctx, pts, preenchimento, contorno, espessura) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.lineJoin = "round";
  if (contorno) {
    ctx.strokeStyle = contorno;
    ctx.lineWidth = espessura;
    ctx.stroke();
  }
  ctx.fillStyle = preenchimento;
  ctx.fill();
}

function gato(ctx, cor) {
  for (const lado of [-1, 1]) {
    const p = naTiara(38 * lado, -2);
    const base = 27;
    const a = [p.x - p.t[0] * base, p.y - p.t[1] * base];
    const b = [p.x + p.t[0] * base, p.y + p.t[1] * base];
    const ponta = [p.x + p.n[0] * 60 + p.t[0] * 10 * lado, p.y + p.n[1] * 60 + p.t[1] * 10 * lado];
    poligono(ctx, [a, ponta, b], cor, escuro(cor, 0.72), 7);
    // dentro da orelha
    const m = (q, k) => [p.x + (q[0] - p.x) * k + p.n[0] * 7, p.y + (q[1] - p.y) * k + p.n[1] * 7];
    poligono(ctx, [m(a, 0.55), m(ponta, 0.62), m(b, 0.55)], rosado(cor));
  }
  tiara(ctx, cor);
}

function urso(ctx, cor) {
  for (const lado of [-1, 1]) {
    const p = naTiara(43 * lado);
    const cx = p.x + p.n[0] * 17;
    const cy = p.y + p.n[1] * 17;
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = cor;
    ctx.strokeStyle = escuro(cor, 0.72);
    ctx.lineWidth = 3.5;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + p.n[0] * 3, cy + p.n[1] * 3, 17, 0, Math.PI * 2);
    ctx.fillStyle = rosado(cor);
    ctx.fill();
  }
  tiara(ctx, cor);
}

function coelho(ctx, cor) {
  for (const lado of [-1, 1]) {
    const p = naTiara(17 * lado, -4);
    const giro = p.a + 0.14 * lado;
    const cx = p.x + Math.sin(giro) * 50;
    const cy = p.y - Math.cos(giro) * 50;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 17, 53, giro, 0, Math.PI * 2);
    ctx.fillStyle = cor;
    ctx.strokeStyle = escuro(cor, 0.72);
    ctx.lineWidth = 3.5;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + Math.sin(giro) * 4, cy - Math.cos(giro) * 4, 8.5, 39, giro, 0, Math.PI * 2);
    ctx.fillStyle = rosado(cor);
    ctx.fill();
  }
  tiara(ctx, cor);
}

function laco(ctx, cor) {
  const p = naTiara(40, -6);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.a * 0.85);
  ctx.scale(1.65, 1.65);
  const contorno = escuro(cor, 0.72);
  const dobra = escuro(cor, 0.84);
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.4;
  // pontas que caem
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(10 * lado, 30);
    ctx.lineTo(4 * lado, 27);
    ctx.lineTo(1 * lado, 33);
    ctx.lineTo(-4 * lado + 2 * lado, 8);
    ctx.closePath();
    ctx.fillStyle = dobra;
    ctx.strokeStyle = contorno;
    ctx.stroke();
    ctx.fill();
  }
  // as duas alças
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(14 * lado, -26, 38 * lado, -22, 36 * lado, -2);
    ctx.bezierCurveTo(38 * lado, 18, 14 * lado, 22, 0, 0);
    ctx.closePath();
    ctx.fillStyle = cor;
    ctx.strokeStyle = contorno;
    ctx.stroke();
    ctx.fill();
    // dobra dentro da alça
    ctx.beginPath();
    ctx.moveTo(6 * lado, -2);
    ctx.quadraticCurveTo(20 * lado, -6, 27 * lado, -1);
    ctx.strokeStyle = dobra;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 2.4;
  }
  // nó
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = dobra;
  ctx.strokeStyle = contorno;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

function antenas(ctx, cor) {
  const fio = "#2F3542";
  for (const lado of [-1, 1]) {
    const p = naTiara(24 * lado);
    // mola: do arco para cima e para fora
    const d = [p.n[0] + p.t[0] * 0.35 * lado, p.n[1] + p.t[1] * 0.35 * lado];
    const tam = Math.hypot(d[0], d[1]);
    const u = [d[0] / tam, d[1] / tam];
    const perp = [-u[1], u[0]];
    const comp = 62;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const s = i / 80;
      const onda = Math.sin(s * Math.PI * 2 * 4.5) * 5.5 * Math.min(1, s * 6, (1 - s) * 6);
      const x = p.x + u[0] * comp * s + perp[0] * onda;
      const y = p.y + u[1] * comp * s + perp[1] * onda;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = fio;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    // bolinha
    ctx.beginPath();
    ctx.arc(p.x + u[0] * (comp + 9), p.y + u[1] * (comp + 9), 13, 0, Math.PI * 2);
    ctx.fillStyle = cor;
    ctx.strokeStyle = escuro(cor, 0.72);
    ctx.lineWidth = 3.5;
    ctx.fill();
    ctx.stroke();
  }
  tiara(ctx, fio, 6);
}

const DESENHOS = { gato, urso, coelho, laco, antenas };

/** Altura do ponto mais alto de cada acessório (px da arte), para não sair por cima da imagem. */
export const TOPO_VETOR = { gato: 22, urso: 30, coelho: 8, laco: 40, antenas: 22 };

export const ehVetor = (id) => Boolean(DESENHOS[id]);

export function desenharAcessorio(ctx, id, cor) {
  ctx.save();
  DESENHOS[id]?.(ctx, cor);
  ctx.restore();
}

// claro() fica exportado para futuros acessórios
export { claro };

/**
 * Crachá arco-íris em vetor (coordenadas da arte, onde a peça original ficava: cartão de 286,428 a 348,467).
 * A arte trazia a faixa colorida borrada e torta; aqui é um cartão branco com um arco-íris nítido em cima e o
 * nome embaixo (o nome é escrito por compor.js na plaquinha).
 */
export function desenharCrachaArcoiris(ctx) {
  ctx.save();
  // presilha
  ctx.fillStyle = "#8C95A3";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(311, 419, 13, 13, 3);
  else ctx.rect(311, 419, 13, 13);
  ctx.fill();
  // cartão
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(286, 428, 62, 40, 6);
  else ctx.rect(286, 428, 62, 40);
  ctx.fillStyle = "#FEFDFC";
  ctx.fill();
  ctx.strokeStyle = "#D6D0DA";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // arco-íris
  const cores = ["#F0524F", "#F7943B", "#F9CF3A", "#5CC77A", "#4A9BE8", "#9B6BDB"];
  ctx.lineWidth = 2.6;
  ctx.lineCap = "butt";
  cores.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(317, 447, 16 - i * 2.4, Math.PI, 0);
    ctx.strokeStyle = c;
    ctx.stroke();
  });
  ctx.restore();
}
