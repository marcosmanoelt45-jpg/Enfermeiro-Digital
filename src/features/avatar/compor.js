// Monta a imagem do avatar a partir das camadas geradas no Flow (public/avatar, ver scripts/assets/montar-avatar.py).
// Cada peça pode ter até 4 arquivos: cor fixa (<peca>.webp) e sombras para tingir (.pele, .roupa, .cor).
// Tingir: cor_final = cor_escolhida * sombra / 170 (170 = tom médio da peça original).
import CAMADAS from "./camadas.json";
import { CORES_ACESSORIO, CORES_CABELO, CORES_ROUPA, PELES, normalizarAvatar } from "./pecas.js";
import { ajustarTexto, primeiroNome } from "./nomeNoCracha.js";

const REF = 170;
const BASE_URL = `${import.meta.env.BASE_URL || "/"}avatar/`;

/** Lista de peças, na ordem de desenho, para um avatar normalizado. */
export function pecasDoAvatar(a) {
  const lista = ["base"];
  if (a.estampa !== "lisa") lista.push(`estampa-${a.estampa}`);
  if (a.jaleco !== "nenhum") lista.push(a.jaleco);
  if (a.estetoscopio !== "nenhum") lista.push(a.estetoscopio);
  if (a.cracha !== "nenhum") lista.push(`cracha-${a.cracha}`);
  if (a.cabelo !== "careca") lista.push(`cabelo-${a.cabelo}`);
  if (a.oculos !== "nenhum") lista.push(`oculos-${a.oculos}`);
  if (a.olhos !== "cilios") lista.push(`olhos-${a.olhos}`);
  if (a.boca !== "sorriso") lista.push(`boca-${a.boca}`);
  if (a.barba !== "nenhuma") lista.push(`barba-${a.barba}`);
  if (a.cabeca !== "nenhum") lista.push(`cabeca-${a.cabeca}`);
  return lista.filter((p) => CAMADAS[p]);
}

const imagens = new Map();
function carregar(url) {
  if (!imagens.has(url)) {
    imagens.set(
      url,
      new Promise((ok, falha) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => ok(im);
        im.onerror = () => {
          imagens.delete(url);
          falha(new Error(`camada não carregou: ${url}`));
        };
        im.src = url;
      }),
    );
  }
  return imagens.get(url);
}

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function novaTela(lado) {
  const c = document.createElement("canvas");
  c.width = lado;
  c.height = lado;
  return c;
}

let rascunho = null;
function tingida(im, lado, cor) {
  if (!rascunho || rascunho.width !== lado) rascunho = novaTela(lado);
  const ctx = rascunho.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, lado, lado);
  ctx.drawImage(im, 0, 0, lado, lado);
  const dados = ctx.getImageData(0, 0, lado, lado);
  const p = dados.data;
  const [r, g, b] = rgb(cor);
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue;
    const f = p[i] / REF;
    p[i] = Math.min(255, r * f);
    p[i + 1] = Math.min(255, g * f);
    p[i + 2] = Math.min(255, b * f);
  }
  ctx.putImageData(dados, 0, 0);
  return rascunho;
}

const prontos = new Map(); // chave -> Promise<string> (URL da imagem pronta)
const LIMITE = 160;

// Crachá: desenhado 30% maior que na arte (em volta do ponto do clipe) para o nome caber legível.
// Plaquinha do nome em coordenadas da arte (512 px), cobrindo as linhas de "nome" que a arte trazia.
const CRACHA_ESCALA = 1.3;
const CRACHA_CENTRO = [318, 457];
const PLACAS = {
  classico: { x: 314, y: 444, l: 34, a: 19, fundo: "#FCFDFF", texto: "#2E3A55" },
  goti: { x: 293, y: 463, l: 53, a: 25, fundo: "#1D9B95", texto: "#FFFFFF" },
  arcoiris: { x: 289, y: 447, l: 56, a: 19, fundo: "#FEFDFC", texto: "#3A2C36" },
};
const FONTE = (tam) => `900 ${tam}px Nunito, "Nunito Fallback", system-ui, sans-serif`;

async function fonteCarregada() {
  try {
    await document.fonts?.load(FONTE(20), "Aa");
  } catch {
    /* sem a fonte, usa a do sistema */
  }
}

function escreverNome(ctx, placa, nome) {
  const r = 3;
  ctx.fillStyle = placa.fundo;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(placa.x, placa.y, placa.l, placa.a, r);
  else ctx.rect(placa.x, placa.y, placa.l, placa.a);
  ctx.fill();
  const medir = (t, tam) => {
    ctx.font = FONTE(tam);
    return ctx.measureText(t).width;
  };
  const { texto, tamanho } = ajustarTexto(nome, placa.l - 4, placa.a - 2, medir);
  ctx.font = FONTE(tamanho);
  ctx.fillStyle = placa.texto;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, placa.x + placa.l / 2, placa.y + placa.a / 2 + tamanho * 0.06);
}

/**
 * Monta o avatar e devolve a URL de uma imagem PNG transparente (fundo fica por conta de quem mostra).
 * `nome` vai escrito no crachá (só o primeiro nome) quando o crachá tem lugar para nome.
 */
export function comporAvatar(avatar, lado = 256, nome = "") {
  const a = normalizarAvatar(avatar);
  const placa = PLACAS[a.cracha];
  const nomeCracha = placa ? primeiroNome(nome) : "";
  const chave = `${lado}|${nomeCracha}|${JSON.stringify(a)}`;
  if (prontos.has(chave)) return prontos.get(chave);
  const cores = {
    pele: PELES[a.pele],
    roupa: CORES_ROUPA[a.corRoupa],
    cabelo: CORES_CABELO[a.corCabelo],
    acessorio: CORES_ACESSORIO[a.corAcessorio],
  };
  const trabalho = (async () => {
    const pecas = pecasDoAvatar(a);
    const arquivos = [];
    for (const p of pecas) {
      const info = CAMADAS[p];
      const corDaPeca = p.startsWith("cabelo-") || p.startsWith("barba-") ? cores.cabelo : cores.acessorio;
      const cracha = p.startsWith("cracha-");
      if (info.fixo) arquivos.push({ url: `${BASE_URL}${p}.webp`, cracha });
      if (info.pele) arquivos.push({ url: `${BASE_URL}${p}.pele.webp`, cor: cores.pele, cracha });
      if (info.roupa) arquivos.push({ url: `${BASE_URL}${p}.roupa.webp`, cor: cores.roupa, cracha });
      if (info.cor) arquivos.push({ url: `${BASE_URL}${p}.cor.webp`, cor: corDaPeca, cracha });
    }
    const [ims] = await Promise.all([Promise.all(arquivos.map((f) => carregar(f.url))), nomeCracha ? fonteCarregada() : null]);
    const tela = novaTela(lado);
    const ctx = tela.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    const k = lado / 512;
    const [cx, cy] = CRACHA_CENTRO;
    const noCracha = (desenhar) => {
      ctx.save();
      ctx.scale(k, k);
      ctx.translate(cx, cy);
      ctx.scale(CRACHA_ESCALA, CRACHA_ESCALA);
      ctx.translate(-cx, -cy);
      desenhar();
      ctx.restore();
    };
    ims.forEach((im, i) => {
      const { cor, cracha } = arquivos[i];
      const fonte = cor ? tingida(im, lado, cor) : im;
      if (cracha) noCracha(() => ctx.drawImage(fonte, 0, 0, 512, 512));
      else ctx.drawImage(fonte, 0, 0, lado, lado);
      // o nome entra logo depois do crachá, antes do que vem por cima (cabelo, acessórios)
      const proximo = arquivos[i + 1];
      if (cracha && nomeCracha && (!proximo || !proximo.cracha)) noCracha(() => escreverNome(ctx, placa, nomeCracha));
    });
    return tela.toDataURL("image/png");
  })();
  trabalho.catch(() => prontos.delete(chave));
  prontos.set(chave, trabalho);
  if (prontos.size > LIMITE) prontos.delete(prontos.keys().next().value);
  return trabalho;
}

/** Lado do canvas para um tamanho em tela (considera a densidade da tela; 128, 256 ou 512). */
export function ladoPara(tamanho) {
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 2;
  const px = tamanho * dpr;
  return px <= 128 ? 128 : px <= 256 ? 256 : 512;
}
