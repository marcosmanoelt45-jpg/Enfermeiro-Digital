// Monta a imagem do avatar a partir das camadas geradas no Flow (public/avatar, ver scripts/assets/montar-avatar.py).
// Cada peça pode ter até 4 arquivos: cor fixa (<peca>.webp) e sombras para tingir (.pele, .roupa, .cor).
// Tingir: cor_final = cor_escolhida * sombra / 170 (170 = tom médio da peça original).
import CAMADAS from "./camadas.json";
import { CORES_ACESSORIO, CORES_CABELO, CORES_MASCARA, CORES_ROUPA, PELES, normalizarAvatar } from "./pecas.js";
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
  if (a.mascara !== "nenhuma") lista.push(`mascara-${a.mascara}`);
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
// Onde o crachá fica conforme o que vai no pescoço: no lugar da arte (peito direito) o diafragma do estetoscópio
// batia em cima dele; com o cordão, o cordão terminava no meio do peito sem nada. Com estetoscópio, desce para o
// meio do peito (entre o tubo e o diafragma); com cordão, fica pendurado na ponta dele.
function centroDoCracha(a) {
  if (a.estetoscopio === "estetoscopio") return [256, 460];
  if (a.estetoscopio === "cordao") return [256, 462];
  return CRACHA_CENTRO;
}
const PLACAS = {
  // o cartão branco do desenho vai até ~x 355: a área do nome usa quase toda a largura dele
  classico: { x: 313, y: 444, l: 40, a: 19, fundo: "#FCFDFF", texto: "#2E3A55" },
  goti: { x: 293, y: 463, l: 53, a: 25, fundo: "#1D9B95", texto: "#FFFFFF" },
  arcoiris: { x: 289, y: 447, l: 56, a: 19, fundo: "#FEFDFC", texto: "#3A2C36" },
};
// Quanto a tiara sobe junto com o cabelo (1 = apoiada no alto do cabelo). Curto: afunda metade no cabelo (apoiada
// em cima, ela parecia flutuar acima da cabeça).
const SUBIDA_TIARA = { cacheado: 0.6, topete: 0.4, curto: 0.45 };
// Careca: a arte do coelho tem a tiara mais baixa que as outras e sobrava a cabeça aparecendo acima dela.
const AJUSTE_SEM_CABELO = { coelho: -15 };
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
  const { texto, tamanho, escalaX } = ajustarTexto(nome, placa.l - 4, placa.a - 2, medir);
  ctx.font = FONTE(tamanho);
  ctx.fillStyle = placa.texto;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // nome comprido: estreita a letra na horizontal (em vez de cortar)
  ctx.save();
  ctx.translate(placa.x + placa.l / 2, placa.y + placa.a / 2 + tamanho * 0.06);
  ctx.scale(escalaX, 1);
  ctx.fillText(texto, 0, 0);
  ctx.restore();
}

/**
 * Monta o avatar e devolve a URL de uma imagem PNG transparente (fundo fica por conta de quem mostra).
 * `nome` vai escrito no crachá (só o primeiro nome) quando o crachá tem lugar para nome.
 */
const chaveDe = (avatar, lado, nome) => {
  const a = normalizarAvatar(avatar);
  const nomeCracha = PLACAS[a.cracha] ? primeiroNome(nome) : "";
  return `${lado}|${nomeCracha}|${JSON.stringify(a)}`;
};
// URLs já prontas (sem esperar promessa): quem mostra o avatar começa com a imagem no 1º quadro, sem piscar.
const urlsProntas = new Map();
/** URL do avatar se ele já foi montado antes (síncrono), ou null. */
export function avatarJaPronto(avatar, lado = 256, nome = "") {
  return urlsProntas.get(chaveDe(avatar, lado, nome)) ?? null;
}

export function comporAvatar(avatar, lado = 256, nome = "") {
  const a = normalizarAvatar(avatar);
  const placa = PLACAS[a.cracha];
  const nomeCracha = placa ? primeiroNome(nome) : "";
  const chave = chaveDe(avatar, lado, nome);
  if (prontos.has(chave)) return prontos.get(chave);
  const cores = {
    pele: PELES[a.pele],
    roupa: CORES_ROUPA[a.corRoupa],
    cabelo: CORES_CABELO[a.corCabelo],
    acessorio: CORES_ACESSORIO[a.corAcessorio],
    mascara: CORES_MASCARA[a.corMascara],
  };
  const trabalho = (async () => {
    const pecas = pecasDoAvatar(a);
    const arquivos = [];
    // ajuste do acessório de cabeça ao cabelo escolhido (sobe até o topo do cabelo e alarga junto)
    const ajusteCabeca = CAMADAS._ajusteCabeca?.cabelos?.[`cabelo-${a.cabelo}`] || null;
    for (const p of pecas) {
      const info = CAMADAS[p];
      const corDaPeca = p.startsWith("cabelo-") || p.startsWith("barba-") ? cores.cabelo : p.startsWith("mascara-") ? cores.mascara : cores.acessorio;
      const onde = p.startsWith("cracha-") ? "cracha" : p.startsWith("cabeca-") ? "cabeca" : null;
      // primeiro apaga o que esta peça esconde (pijama saindo pelos lados do jaleco, cabelo acima da touca)
      const usaApaga = info.apaga && (p !== "cabeca-touca" || a.cabelo === "coque"); // touca só esconde o coque
      if (usaApaga) arquivos.push({ url: `${BASE_URL}${p}.apaga.webp`, apaga: true, onde });
      // tingidos primeiro (cada um se estende um pouco por baixo do próximo) e a cor fixa por cima: sem emenda
      if (info.pele) arquivos.push({ url: `${BASE_URL}${p}.pele.webp`, cor: cores.pele, onde });
      if (info.roupa) arquivos.push({ url: `${BASE_URL}${p}.roupa.webp`, cor: cores.roupa, onde });
      if (info.cor) arquivos.push({ url: `${BASE_URL}${p}.cor.webp`, cor: corDaPeca, onde });
      if (info.fixo) arquivos.push({ url: `${BASE_URL}${p}.webp`, onde });
    }
    const [ims] = await Promise.all([Promise.all(arquivos.map((f) => carregar(f.url))), nomeCracha ? fonteCarregada() : null]);
    const tela = novaTela(lado);
    const ctx = tela.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    const k = lado / 512;
    // desenha em coordenadas da arte (512) com o ajuste de cada lugar
    const em = (onde, desenhar) => {
      ctx.save();
      ctx.scale(k, k);
      if (onde === "cracha") {
        const [cx, cy] = CRACHA_CENTRO;
        const [nx, ny] = centroDoCracha(a);
        ctx.translate(nx, ny);
        ctx.scale(CRACHA_ESCALA, CRACHA_ESCALA);
        ctx.translate(-cx, -cy);
      } else if (onde === "cabeca" && !ajusteCabeca) {
        // sem cabelo para acompanhar (careca): só o acerto da arte de cada acessório
        ctx.translate(0, AJUSTE_SEM_CABELO[a.cabeca] ?? 0);
      } else if (onde === "cabeca") {
        const [ax, ay] = CAMADAS._ajusteCabeca.ancora;
        // touca cobre o alto do cabelo inteiro (sobe e alarga tudo); tiaras assentam dentro do volume, com só
        // as orelhinhas por cima (sobem pouco mais da metade e alargam menos)
        const touca = a.cabeca === "touca";
        const esc = touca ? ajusteCabeca.st ?? ajusteCabeca.s : 1 + (ajusteCabeca.s - 1) * 0.45;
        const topo = CAMADAS[`cabeca-${a.cabeca}`]?.topo ?? ay;
        // sem deixar o acessório sair por cima da imagem
        // quanto a tiara sobe: cabelo rente (curto, raspado, liso) = em cima do cabelo; volume grande = um pouco
        // dentro dele (só as orelhinhas por cima); topete = atrás do topete, perto da raiz
        const sobe = touca ? 1 : SUBIDA_TIARA[a.cabelo] ?? 1;
        const dy = Math.max(ajusteCabeca.dy * sobe, 3 - ay - esc * (topo - ay));
        ctx.translate(ax, ay + dy);
        ctx.scale(esc, esc);
        ctx.translate(-ax, -ay);
      }
      desenhar();
      ctx.restore();
    };
    ims.forEach((im, i) => {
      const { cor, onde, apaga } = arquivos[i];
      const fonte = cor ? tingida(im, lado, cor) : im;
      if (apaga) ctx.globalCompositeOperation = "destination-out";
      em(onde, () => ctx.drawImage(fonte, 0, 0, 512, 512));
      ctx.globalCompositeOperation = "source-over";
      // o nome entra logo depois do crachá, antes do que vem por cima (cabelo, acessórios)
      const proximo = arquivos[i + 1];
      if (onde === "cracha" && nomeCracha && (!proximo || proximo.onde !== "cracha")) em("cracha", () => escreverNome(ctx, placa, nomeCracha));
    });
    return tela.toDataURL("image/png");
  })();
  trabalho.then(
    (url) => {
      urlsProntas.set(chave, url);
      if (urlsProntas.size > LIMITE) urlsProntas.delete(urlsProntas.keys().next().value);
    },
    () => prontos.delete(chave)
  );
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
