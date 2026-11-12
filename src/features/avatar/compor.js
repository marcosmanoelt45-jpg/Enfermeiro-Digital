// Monta a imagem do avatar a partir das camadas geradas no Flow (public/avatar, ver scripts/assets/montar-avatar.py).
// Cada peça pode ter até 4 arquivos: cor fixa (<peca>.webp) e sombras para tingir (.pele, .roupa, .cor).
// Tingir: cor_final = cor_escolhida * sombra / 170 (170 = tom médio da peça original).
import CAMADAS from "./camadas.json";
import { CORES_ACESSORIO, CORES_CABELO, CORES_ROUPA, PELES, normalizarAvatar } from "./pecas.js";

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

/** Monta o avatar e devolve a URL de uma imagem PNG transparente (fundo fica por conta de quem mostra). */
export function comporAvatar(avatar, lado = 256) {
  const a = normalizarAvatar(avatar);
  const chave = `${lado}|${JSON.stringify(a)}`;
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
      if (info.fixo) arquivos.push({ url: `${BASE_URL}${p}.webp` });
      if (info.pele) arquivos.push({ url: `${BASE_URL}${p}.pele.webp`, cor: cores.pele });
      if (info.roupa) arquivos.push({ url: `${BASE_URL}${p}.roupa.webp`, cor: cores.roupa });
      if (info.cor) arquivos.push({ url: `${BASE_URL}${p}.cor.webp`, cor: corDaPeca });
    }
    const ims = await Promise.all(arquivos.map((f) => carregar(f.url)));
    const tela = novaTela(lado);
    const ctx = tela.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ims.forEach((im, i) => {
      const cor = arquivos[i].cor;
      ctx.drawImage(cor ? tingida(im, lado, cor) : im, 0, 0, lado, lado);
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
