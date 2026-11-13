"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
// Logo ampliada (upscale de 2160 px reduzido a 512, para até 148 px em tela 3x): nítida e sem o granulado do PNG.
// Em public/ (endereço fixo): o index.html pré-carrega a mesma imagem para a abertura estática.
const logoEnfere = "/goti/logo-goti-512.webp";

/**
 * Enfere · tela de abertura (splash / onboarding)
 * 1. Abertura (~1 s, desenhada em código para rodar na taxa da tela): a logo cai como uma gota, achata ao tocar
 *    o chão, quica de leve e assenta; no toque, uma onda verde-água se abre atrás dela. O nome "Enfere" sobe letra
 *    por letra logo abaixo. Curta de propósito: a pessoa abre o app várias vezes por dia.
 * 2. Tela dos botões: o Goti de costas, de óculos, lendo um prontuário (loop). Por enquanto sem toque: o susto e
 *    o aceno (goti-susto, goti-oi) ficaram guardados em public/goti para voltar depois.
 * Vídeo WebM com transparência no Chrome/Android; WebP animado no Safari/iOS (que não mostra WebM transparente).
 * Arquivos gerados por scripts/assets/processar-goti-splash.py.
 */

export interface EnfereSplashProps {
  onGetStarted?: () => void;
  onHaveAccount?: () => void;
  /** Disparado uma vez quando a animação termina (ou é pulada). */
  onIntroComplete?: () => void;
  /** Indica se há usuário com sessão ativa */
  isAuthenticated?: boolean;
  /** Nome do usuário conectado para exibição calorosa */
  userName?: string;
  /** O login ainda está sendo conferido: a abertura roda, e os botões só entram quando virar false. */
  aguardando?: boolean;
  /** Sem uso enquanto o Goti não acena (mantido para não quebrar quem passa a prop). */
  waveSrc?: string;
  className?: string;
  style?: CSSProperties;
}

const FONT = '"Nunito Variable","Nunito",ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif';
const LENDO = "/goti/goti-lendo";

const CSS = `
.enfere-splash{position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#0B131D;font-family:${FONT};user-select:none;-webkit-user-select:none;touch-action:manipulation;box-sizing:border-box}
.enfere-splash *{box-sizing:border-box;margin:0}
.enfere-splash .es-intro{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;padding-bottom:12vh;background:#0B131D}
.enfere-splash .es-lw{position:relative;width:min(34vw,148px);aspect-ratio:1/1}
.enfere-splash .es-logo{position:relative;display:block;width:100%;height:100%;opacity:0;transform-origin:50% 100%}
.enfere-splash .es-onda{position:absolute;left:4%;right:4%;top:14%;bottom:-2%;border-radius:30%;border:2px solid #20D5B5;opacity:0;pointer-events:none}
.enfere-splash .es-ttl span{display:inline-block}
.enfere-splash .es-c2{position:absolute;left:0;right:0;top:29%;transform:translateY(-44%);display:flex;justify-content:center}
.enfere-splash .es-g2{position:relative;width:min(100vw,414px,54vh);aspect-ratio:1/1;opacity:0;transform-origin:50% 92%}
.enfere-splash .es-g2 video,.enfere-splash .es-g2 img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none}
.enfere-splash .es-g2 .on{opacity:1}
.enfere-splash .es-sh{position:absolute;left:31%;right:31%;bottom:17.5%;height:5%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),rgba(0,0,0,0))}
.enfere-splash .es-ttl{position:absolute;left:0;right:0;top:55%;text-align:center;font-size:3.2rem;font-weight:900;color:#20D5B5;letter-spacing:-0.03em;line-height:1;opacity:0;z-index:6;will-change:transform,opacity}
.enfere-splash .es-tag{position:absolute;left:0;right:0;top:55%;margin-top:3.6rem;text-align:center;font-size:1.05rem;font-weight:600;color:#9FB3C6;opacity:0;padding:0 20px}
.enfere-splash .es-btns{position:absolute;left:0;right:0;bottom:0;max-width:440px;margin:0 auto;padding:0 22px calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px;opacity:0;pointer-events:none}
.enfere-splash.es-ready .es-btns{pointer-events:auto}
.enfere-splash .es-btns button{font:800 1rem ${FONT};letter-spacing:.02em;border-radius:18px;padding:15px;cursor:pointer;border:0;background:#20D5B5;color:#06302E;transition:transform 110ms cubic-bezier(.23,1,.32,1), box-shadow 110ms cubic-bezier(.23,1,.32,1), filter 120ms ease;box-shadow:0 5px 0 #149F86}
.enfere-splash .es-btns button+button{background:#16222E;color:#EAF2F8;border:2px solid #27394B;box-shadow:0 5px 0 #0A1118}
.enfere-splash .es-btns button:hover{filter:brightness(1.06)}
.enfere-splash .es-btns button:active{transform:translateY(5px);box-shadow:0 0 0 #149F86}
.enfere-splash .es-btns button+button:active{box-shadow:0 0 0 #0A1118}
.enfere-splash .es-btns button:focus-visible{outline:3px solid #20D5B5;outline-offset:2px}
.enfere-splash .es-skip-hint{position:absolute;z-index:6;top:calc(1rem + env(safe-area-inset-top,0px));right:1rem;min-height:44px;font:700 0.8125rem ${FONT};color:rgba(255,255,255,0.8);background:rgba(22,34,46,0.8);border:1px solid rgba(255,255,255,0.12);padding:0 16px;border-radius:999px;opacity:0;transition:opacity 300ms ease;cursor:pointer;pointer-events:auto}
.enfere-splash.es-playing .es-skip-hint{opacity:1}
@media (min-width: 768px) {
  .enfere-splash .es-c2 { top: 30%; }
  /* tela larga e baixa (tablet deitado, notebook): o Goti também segue a altura, senão os pés descem no título */
  .enfere-splash .es-g2 { width: min(clamp(400px, 34vw, 514px), 50vh, 50dvh); max-height: 60vh; }
  .enfere-splash .es-ttl { top: 57%; font-size: 3.6rem; }
  .enfere-splash .es-tag { top: 57%; margin-top: 4.2rem; font-size: 1.25rem; }
  .enfere-splash .es-btns { bottom: 40px; max-width: 440px; }
  .enfere-splash .es-btns button { font-size: 1.05rem; padding: 16px; }
}
/* tela larga e bem baixa (tablet de 600-700 px de altura deitado): tudo um pouco mais junto para caber */
@media (min-width: 768px) and (max-height: 700px) {
  .enfere-splash .es-c2 { top: 28%; }
  .enfere-splash .es-g2 { width: min(clamp(300px, 34vw, 514px), 44vh, 44dvh); }
  .enfere-splash .es-ttl { top: 50%; font-size: 3rem; }
  .enfere-splash .es-tag { top: 50%; margin-top: 3.5rem; font-size: 1.1rem; }
  .enfere-splash .es-btns { bottom: 16px; }
}
`;

const MARKUP = `
<div class="es-intro"><div class="es-lw"><i class="es-onda" aria-hidden="true"></i><img class="es-logo" alt="" draggable="false" width="148" height="148" decoding="sync"></div></div>
<div class="es-c2">
  <div class="es-g2" role="img" aria-label="Goti, de costas, lendo um prontuário">
    <i class="es-sh" aria-hidden="true"></i>
    <video class="es-v-lendo" muted playsinline loop preload="auto" aria-hidden="true"></video>
    <img class="es-i-lendo" alt="" draggable="false">
  </div>
</div>
<h1 class="es-ttl" aria-label="Enfere"><span aria-hidden="true">E</span><span aria-hidden="true">n</span><span aria-hidden="true">f</span><span aria-hidden="true">e</span><span aria-hidden="true">r</span><span aria-hidden="true">e</span></h1><p class="es-tag">Enfermagem, passo a passo.</p>
<div class="es-btns"><button type="button" class="es-b1">Começar</button><button type="button" class="es-b2">Já tenho uma conta</button></div>
<button type="button" class="es-skip-hint" aria-label="Pular introdução">Pular</button>
`;

// ENGINE START
interface MountOpts {
  /** Lido na hora de mostrar os botões (o login pode terminar de carregar durante a abertura). */
  getAuth: () => { isAuthenticated?: boolean; userName?: string };
  /** O login ainda está sendo conferido: a abertura roda, mas os botões esperam liberar(). */
  aguardando: boolean;
  onGetStarted?: () => void;
  onHaveAccount?: () => void;
  onIntroComplete?: () => void;
}

const SPR = "cubic-bezier(.34,1.56,.64,1)";
const EASE_OUT = "cubic-bezier(.23,1,.32,1)";

/** Tira a abertura estática do index.html (a logo que cai antes de o JavaScript chegar). */
function removerAberturaEstatica() {
  const est = typeof document !== "undefined" ? document.getElementById("abertura-estatica") : null;
  est?.remove();
  if (typeof document !== "undefined") document.documentElement.style.background = "";
}
export { removerAberturaEstatica };

/** Monta a tela de splash dentro de `root`; devolve a limpeza e liberar() (o login terminou de carregar). */
function mountEnfereSplash(root: HTMLElement, o: MountOpts): { destroy: () => void; liberar: () => void } {
  root.innerHTML = MARKUP;
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const intro = $(".es-intro");
  const logo = $<HTMLImageElement>(".es-logo");
  const onda = $(".es-onda");
  logo.src = logoEnfere;
  const g2 = $(".es-g2");
  const vLendo = $<HTMLVideoElement>(".es-v-lendo");
  const iLendo = $<HTMLImageElement>(".es-i-lendo");
  const ttl = $(".es-ttl"), tag = $(".es-tag"), btns = $(".es-btns");
  const skipHint = $(".es-skip-hint");
  (btns as HTMLElement & { inert: boolean }).inert = true;
  const b1Btn = $<HTMLButtonElement>(".es-b1");
  const b2Btn = $<HTMLButtonElement>(".es-b2");

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const safari =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || /^((?!chrome|android).)*safari/i.test(navigator.userAgent));

  // Personalização para usuário autenticado vs visitante (na hora dos botões: o login pode chegar no meio).
  const aplicarTextos = () => {
    const { isAuthenticated, userName } = o.getAuth();
    if (!isAuthenticated) return;
    tag.textContent = userName
      ? `Olá, ${userName.split(" ")[0]}! Seu plantão está pronto.`
      : "Sessão ativa encontrada. Bem-vindo(a) ao seu plantão!";
    b1Btn.textContent = "Acessar Plataforma";
    b2Btn.textContent = "Trocar de Perfil";
  };

  // A logo do index.html já está caindo (ou caiu) desde o primeiro quadro: a abertura do app assume dela.
  const est = document.getElementById("abertura-estatica");
  const desdeEstatica = est ? performance.now() - ((window as Window & { __aberturaT0?: number }).__aberturaT0 ?? performance.now()) : 0;

  let timers: number[] = [];
  let anims: Animation[] = [];
  let finished = false;
  let fase: "abertura" | "lendo" = "abertura";
  let dyNome = 0;
  // O palco (Goti e botões) só entra com as duas coisas: o tempo mínimo da abertura e o login conferido.
  let tempoOk = false;
  let liberado = !o.aguardando;
  let pularPedido = false;

  const at = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
  };
  const A = (el: HTMLElement, kf: Keyframe[], opt: KeyframeAnimationOptions) => {
    const a = el.animate(kf, { fill: "forwards", easing: EASE_OUT, ...opt });
    anims.push(a);
    return a;
  };
  const clearAll = () => {
    timers.forEach(clearTimeout);
    timers = [];
    anims.forEach((a) => a.cancel());
    anims = [];
  };
  const tocar = (v: HTMLVideoElement) => {
    try {
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* sem vídeo: fica a imagem */
    }
  };
  const mostrar = (el: HTMLElement) => {
    [vLendo, iLendo].forEach((x) => x.classList.toggle("on", x === el));
  };

  // Fontes: WebM com alfa fora do Safari; WebP animado no Safari. Com movimento reduzido, quadro parado.
  if (reduzir) {
    iLendo.src = `${LENDO}-poster.webp`;
  } else if (safari) {
    iLendo.src = `${LENDO}.webp`;
  } else {
    vLendo.src = `${LENDO}.webm`;
    vLendo.muted = true;
    vLendo.defaultMuted = true;
    vLendo.playsInline = true;
    vLendo.addEventListener("error", () => {
      // Sem o vídeo: cai para o WebP.
      iLendo.src = `${LENDO}.webp`;
      if (vLendo.classList.contains("on")) mostrar(iLendo);
    });
  }

  const ficarLendo = () => {
    fase = "lendo";
    if (reduzir || safari) mostrar(iLendo);
    else {
      mostrar(vLendo);
      tocar(vLendo);
    }
  };

  const done = () => {
    if (!finished) {
      finished = true;
      o.onIntroComplete?.();
    }
  };

  const ready = () => {
    root.classList.add("es-ready");
    root.classList.remove("es-playing");
    skipHint.style.display = "none";
    (btns as HTMLElement & { inert: boolean }).inert = false;
    A(tag, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 100 });
    A(btns, [{ opacity: 0, transform: "translateY(48px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 150, easing: SPR });
    done();
  };

  // Mostra o Goti lendo e os botões (fim da abertura, pulo ou movimento reduzido).
  const palco = (comAnimacao: boolean) => {
    aplicarTextos();
    ficarLendo();
    if (comAnimacao) {
      // O mesmo "Enfere" que estava sob a logo desliza até o lugar do título: um movimento só, sem nome repetido.
      A(ttl, [{ opacity: 1, transform: `translateY(${dyNome}px)` }, { opacity: 1, transform: "none" }], { duration: 420 });
      // A logo sai primeiro (encolhe e some); o Goti só entra depois, para os dois não se misturarem.
      A((est?.querySelector(".ae-lw") as HTMLElement | null) ?? logo, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.85)" }], { duration: 160 });
      A(intro, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, delay: 60 });
      at(220, () => {
        intro.style.display = "none";
        removerAberturaEstatica();
      });
      A(g2, [
        { opacity: 0, transform: "translateY(20px) scale(.96)" },
        { opacity: 1, transform: "none" },
      ], { duration: 380, delay: 140, easing: SPR });
    } else {
      intro.style.display = "none";
      removerAberturaEstatica();
      g2.style.opacity = "1";
      ttl.style.opacity = "1";
      ttl.style.transform = "none";
    }
    ready();
  };

  // Entra no palco quando der: com animação no fim natural; sem animação se a pessoa pediu para pular.
  const tentarPalco = () => {
    if (fase !== "abertura" || !liberado) return;
    if (pularPedido) {
      clearAll();
      palco(false);
    } else if (tempoOk) palco(true);
  };

  const toEnd = () => {
    if (fase !== "abertura") return;
    pularPedido = true;
    tentarPalco();
  };

  const run = () => {
    if (reduzir) {
      toEnd();
      return;
    }
    root.classList.add("es-playing");
    // O título fica, durante a abertura, logo abaixo da logo; depois desliza para o lugar dele (palco).
    const rl = logo.getBoundingClientRect();
    dyNome = Math.round(rl.bottom + 14 - ttl.getBoundingClientRect().top);
    // Com a logo estática já na tela, a do app fica escondida (as duas estão no mesmo lugar) e o tempo da
    // abertura conta a partir de quando a estática começou a cair.
    const nomeEm = Math.max(0, 300 - desdeEstatica);
    const fimEm = Math.max(est ? 150 : 0, 1050 - desdeEstatica);
    if (!est) {
    // Logo: cai como uma gota (sem encolher a imagem, para ela não ser desenhada pequena e esticada depois),
    // achata ao tocar o chão, estica um pouco e assenta. A base fica presa embaixo (transform-origin 50% 100%).
    A(logo, [
      { opacity: 0, transform: "translateY(-36px) scale(1,1.04)", easing: "cubic-bezier(.55,0,1,.45)" },
      { opacity: 1, transform: "translateY(0) scale(1,1.03)", offset: 0.32, easing: "cubic-bezier(.23,1,.32,1)" },
      { opacity: 1, transform: "translateY(0) scale(1.07,.92)", offset: 0.48, easing: "cubic-bezier(.23,1,.32,1)" },
      { opacity: 1, transform: "translateY(-4px) scale(.98,1.02)", offset: 0.72, easing: "cubic-bezier(.23,1,.32,1)" },
      { opacity: 1, transform: "translateY(0) scale(1,1)" },
    ], { duration: 640, easing: "linear" });
    // A onda nasce no toque (~205 ms) e se abre devagar enquanto some.
    A(onda, [
      { opacity: 0, transform: "scale(1)" },
      { opacity: 0.4, transform: "scale(1.08)", offset: 0.14 },
      { opacity: 0, transform: "scale(1.55)" },
    ], { duration: 720, delay: 205 });
    }
    // Nome: aparece no lugar e cada letra sobe 12 px, uma depois da outra (35 ms entre elas).
    A(ttl, [{ opacity: 0, transform: `translateY(${dyNome}px)` }, { opacity: 1, transform: `translateY(${dyNome}px)` }], { duration: 1, delay: nomeEm });
    Array.from(ttl.children).forEach((letra, i) => {
      A(letra as HTMLElement, [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "none" },
      ], { duration: 320, delay: nomeEm + i * 35, fill: "both" }); // "both": escondida enquanto espera a vez
    });
    at(fimEm, () => {
      tempoOk = true;
      tentarPalco();
    });
  };

  const liberar = () => {
    if (liberado) return;
    liberado = true;
    tentarPalco();
  };

  const onPointerDown = () => {
    if (fase === "abertura") toEnd();
  };
  const b1 = (e: Event) => {
    e.stopPropagation();
    o.onGetStarted?.();
  };
  const b2 = (e: Event) => {
    e.stopPropagation();
    o.onHaveAccount?.();
  };
  const onSkip = (e: Event) => {
    e.stopPropagation();
    toEnd();
  };

  root.addEventListener("pointerdown", onPointerDown as EventListener);
  skipHint.addEventListener("click", onSkip);
  b1Btn.addEventListener("click", b1);
  b2Btn.addEventListener("click", b2);

  run();

  // Não tira a logo estática aqui: o StrictMode monta, desmonta e monta de novo, e ela sumiria antes da hora.
  // Quem tira é o palco (fim da abertura) ou o App, quando a abertura deixa de aparecer.
  const destroy = () => {
    clearAll();
    try { vLendo.pause(); } catch { /* nada */ }
    root.removeEventListener("pointerdown", onPointerDown as EventListener);
    skipHint.removeEventListener("click", onSkip);
    b1Btn.removeEventListener("click", b1);
    b2Btn.removeEventListener("click", b2);
    root.classList.remove("es-ready", "es-playing");
    root.innerHTML = "";
  };
  return { destroy, liberar };
}
// ENGINE END

export default function EnfereSplash({
  onGetStarted,
  onHaveAccount,
  onIntroComplete,
  isAuthenticated = false,
  userName = "",
  aguardando = false,
  waveSrc = "/goti/goti-oi.webm",
  className = "",
  style
}: EnfereSplashProps) {
  const ref = useRef<HTMLDivElement>(null);
  const motor = useRef<{ destroy: () => void; liberar: () => void } | null>(null);
  void waveSrc;
  const cb = useRef({ onGetStarted, onHaveAccount, onIntroComplete, isAuthenticated, userName });
  cb.current = { onGetStarted, onHaveAccount, onIntroComplete, isAuthenticated, userName };
  const aguardandoInicial = useRef(aguardando);

  useEffect(() => {
    if (!ref.current) return;
    motor.current = mountEnfereSplash(ref.current, {
      getAuth: () => ({ isAuthenticated: cb.current.isAuthenticated, userName: cb.current.userName }),
      aguardando: aguardandoInicial.current,
      onGetStarted: () => cb.current.onGetStarted?.(),
      onHaveAccount: () => cb.current.onHaveAccount?.(),
      onIntroComplete: () => cb.current.onIntroComplete?.(),
    });
    return () => {
      motor.current?.destroy();
      motor.current = null;
    };
  }, []); // Executa estritamente uma única vez por montagem da tela

  // O login terminou de carregar: os botões podem entrar (com o texto certo para quem já está logado).
  useEffect(() => {
    if (!aguardando) motor.current?.liberar();
  }, [aguardando]);

  return (
    <>
      <style>{CSS}</style>
      <div ref={ref} className={`enfere-splash ${className}`} style={style} />
    </>
  );
}
