"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/**
 * Enfere · tela de abertura (splash / onboarding)
 * Renderização em alta fidelidade:
 * - Olhos SVG do Goti despertando no fundo azul clássico #1B6DB5.
 * - Anéis brancos e expansão radial.
 * - Goti em Ultra HD no Canvas com vídeo WebM nativo transparente (/goti/goti-wave.webm),
 *   eliminando 100% de ruídos, artefatos de dithering e bordas cortadas.
 * - Suporte dinâmico para usuário autenticado (boas-vindas com nome) e visitante (Começar / Já tenho conta).
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
  /** Caminho do WebM com canal alfa transparente */
  waveSrc?: string;
  className?: string;
  style?: CSSProperties;
}

const FONT = '"Baloo 2","Nunito",ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif';

const CSS = `
.enfere-splash{position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#0B131D;font-family:${FONT};user-select:none;-webkit-user-select:none;touch-action:manipulation;box-sizing:border-box}
.enfere-splash *{box-sizing:border-box;margin:0}
.enfere-splash .es-bg,.enfere-splash .es-paper,.enfere-splash .es-rings{position:absolute;top:0;right:0;bottom:0;left:0}
.enfere-splash .es-bg{background:#0B131D}
.enfere-splash .es-paper{background:#0E1720;clip-path:circle(0% at 50% 50%)}
.enfere-splash .es-rings{display:grid;place-items:center;pointer-events:none}
.enfere-splash .es-rings i{grid-area:1/1;width:130px;height:130px;border-radius:50%;border:4px solid #20D5B5;opacity:0}
.enfere-splash .es-mark{position:absolute;left:0;right:0;bottom:calc(2.2rem + env(safe-area-inset-bottom,0px));text-align:center;font-size:2.3rem;font-weight:800;color:#20D5B5;opacity:.35}
.enfere-splash .es-c1{position:absolute;top:0;right:0;bottom:0;left:0;display:grid;place-items:center;pointer-events:none}
.enfere-splash .es-g1{width:min(68vw,290px);transform-origin:50% 50%;transform:translateY(0px) scale(.7);filter:brightness(.8)}
.enfere-splash .es-g1 svg{display:block;width:100%;overflow:visible}
.enfere-splash .es-c2{position:absolute;left:0;right:0;top:32%;transform:translateY(-50%);display:flex;justify-content:center;pointer-events:none}
.enfere-splash .es-g2{position:relative;width:min(64vw,260px,36vh);aspect-ratio:1/1;opacity:0;transform-origin:50% 92%}
.enfere-splash .es-wave-canvas{display:block;width:100%;height:100%;object-fit:contain;position:relative}
.enfere-splash .es-wave-fallback{display:none;width:100%;height:100%;object-fit:contain;position:relative}
.enfere-splash .es-sh{position:absolute;left:14%;right:14%;bottom:1%;height:7%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.6),rgba(0,0,0,0));opacity:0}
.enfere-splash .pu{transition:transform .38s cubic-bezier(.25,1,.5,1)}
.enfere-splash .eye{transform-box:fill-box;transform-origin:center;transition:transform 110ms ease-in-out,opacity 90ms}
.enfere-splash .blink .eye{transform:scaleY(.08)}
.enfere-splash .arc{opacity:0;transition:opacity 90ms}
.enfere-splash .happy .eye{opacity:0}
.enfere-splash .happy .arc{opacity:1}
.enfere-splash .es-ttl{position:absolute;left:0;right:0;top:53%;text-align:center;font-size:3.2rem;font-weight:900;color:#20D5B5;letter-spacing:-0.03em;line-height:1;opacity:0;text-shadow:0 0 30px rgba(32,213,181,0.25)}
.enfere-splash .es-tag{position:absolute;left:0;right:0;top:53%;margin-top:3.6rem;text-align:center;font-size:1.05rem;font-weight:600;color:#9FB3C6;opacity:0;padding:0 20px}
.enfere-splash .es-btns{position:absolute;left:0;right:0;bottom:0;max-width:440px;margin:0 auto;padding:0 22px calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px;opacity:0;pointer-events:none}
.enfere-splash.es-ready .es-btns{pointer-events:auto}
.enfere-splash .es-btns button{font:800 1rem ${FONT};letter-spacing:.02em;border-radius:18px;padding:15px;cursor:pointer;border:0;border-bottom:5px solid #149F86;background:#20D5B5;color:#06302E;transition:transform 120ms ease, filter 120ms ease, border-width 120ms ease;box-shadow:0 4px 14px rgba(32,213,181,0.25)}
.enfere-splash .es-btns button+button{background:#16222E;color:#EAF2F8;border:2px solid #27394B;border-bottom:5px solid #0A1118;box-shadow:0 4px 14px rgba(0,0,0,0.3)}
.enfere-splash .es-btns button:hover{filter:brightness(1.06)}
.enfere-splash .es-btns button:active{transform:translateY(3px);border-bottom-width:2px}
.enfere-splash .es-btns button:focus-visible{outline:3px solid #20D5B5;outline-offset:2px}
.enfere-splash .es-skip-hint{position:absolute;top:calc(1rem + env(safe-area-inset-top,0px));right:1rem;font-size:0.75rem;font-weight:700;color:rgba(255,255,255,0.7);background:rgba(22,34,46,0.8);border:1px solid rgba(255,255,255,0.1);padding:4px 12px;border-radius:999px;opacity:0;transition:opacity 300ms ease;cursor:pointer;pointer-events:auto}
.enfere-splash.es-playing .es-skip-hint{opacity:1}
@media (min-width: 768px) {
  .enfere-splash .es-g1 { width: min(40vw, 360px); }
  .enfere-splash .es-c2 { top: 34%; }
  .enfere-splash .es-g2 { width: clamp(280px, 24vw, 380px); max-height: 44vh; }
  .enfere-splash .es-ttl { top: 56%; font-size: 3.6rem; }
  .enfere-splash .es-tag { top: 56%; margin-top: 4.2rem; font-size: 1.25rem; }
  .enfere-splash .es-btns { bottom: 40px; max-width: 440px; }
  .enfere-splash .es-btns button { font-size: 1.05rem; padding: 16px; }
}
@media (min-width: 1280px) {
  .enfere-splash .es-g2 { width: clamp(300px, 22vw, 400px); max-height: 46vh; }
  .enfere-splash .es-ttl { font-size: 4rem; }
}
`;

const MARKUP = `
<div class="es-bg"></div><div class="es-paper"></div>
<div class="es-rings" aria-hidden="true"><i></i><i></i></div>
<p class="es-mark" aria-hidden="true">Enfere</p>
<div class="es-c1"><div class="es-g1" role="img" aria-label="Olhos do Goti"></div></div>
<div class="es-c2">
  <div class="es-g2">
    <i class="es-sh"></i>
    <video class="es-wave-video" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1" playsinline muted loop preload="auto"></video>
    <canvas class="es-wave-canvas" role="img" aria-label="Goti acenando"></canvas>
    <img class="es-wave-fallback" alt="Goti acenando" draggable="false">
  </div>
</div>
<h1 class="es-ttl">Enfere</h1><p class="es-tag">Enfermagem, passo a passo.</p>
<div class="es-btns"><button type="button" class="es-b1">Começar</button><button type="button" class="es-b2">Já tenho uma conta</button></div>
<div class="es-skip-hint" role="button" aria-label="Pular introdução">Pular ✕</div>
`;

// ENGINE START
const EYES = [
  { cx: 205, cy: 301, r: 61, px: 215, py: 302, pr: 43 },
  { cx: 388, cy: 301, r: 61, px: 380, py: 301, pr: 42 },
];

/** Olhos do Goti em SVG com esclera, pupilas móveis, brilhos e sombra superior. */
function eyesSvg(): string {
  let s =
    '<svg viewBox="130 225 330 150"><defs>' +
    '<radialGradient id="es-pg" cx=".38" cy=".33" r=".8"><stop offset="0" stop-color="#2F4A8F"/><stop offset="1" stop-color="#16214D"/></radialGradient>' +
    '<linearGradient id="es-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E6EBE" stop-opacity=".30"/><stop offset=".4" stop-color="#1E6EBE" stop-opacity="0"/></linearGradient></defs>';
  EYES.forEach((e, i) => {
    s +=
      `<clipPath id="es-c${i}"><circle cx="${e.cx}" cy="${e.cy}" r="${e.r}"/></clipPath>` +
      `<g class="eye"><circle cx="${e.cx}" cy="${e.cy}" r="${e.r}" fill="#fff"/>` +
      `<circle cx="${e.cx}" cy="${e.cy}" r="${e.r}" fill="url(#es-lid)"/>` +
      `<g clip-path="url(#es-c${i})"><g class="pu">` +
      `<circle cx="${e.px}" cy="${e.py}" r="${e.pr}" fill="url(#es-pg)"/>` +
      `<circle cx="${e.px - 21}" cy="${e.py - 20}" r="14.5" fill="#fff"/>` +
      `<circle cx="${e.px + 17}" cy="${e.py + 15}" r="7" fill="#fff"/>` +
      `<circle cx="${e.px + 30}" cy="${e.py + 2}" r="2.6" fill="#fff" opacity=".7"/>` +
      `</g></g></g>` +
      `<path class="arc" fill="none" stroke="#1B2A5C" stroke-width="15" stroke-linecap="round" d="M${e.cx - e.r * 0.7} ${e.cy + e.r * 0.25}Q${e.cx} ${e.cy - e.r * 0.95} ${e.cx + e.r * 0.7} ${e.cy + e.r * 0.25}"/>`;
  });
  return s + "</svg>";
}

interface MountOpts {
  waveSrc: string;
  isAuthenticated?: boolean;
  userName?: string;
  onGetStarted?: () => void;
  onHaveAccount?: () => void;
  onIntroComplete?: () => void;
}

const SPR = "cubic-bezier(.34,1.56,.64,1)";
const tf = (s: number, y = 0) => `translateY(${y}px) scale(${s})`;

/** Monta a tela de splash dentro de `root` e devolve a função de limpeza. */
function mountEnfereSplash(root: HTMLElement, o: MountOpts): () => void {
  root.innerHTML = MARKUP;
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const bg = $(".es-bg"), paper = $(".es-paper"), mark = $(".es-mark");
  const g1 = $(".es-g1"), g2 = $(".es-g2"), sh = $(".es-sh");
  const video = $<HTMLVideoElement>(".es-wave-video");
  const canvas = $<HTMLCanvasElement>(".es-wave-canvas");
  const fallback = $<HTMLImageElement>(".es-wave-fallback");
  const ttl = $(".es-ttl"), tag = $(".es-tag"), btns = $(".es-btns");
  const skipHint = $(".es-skip-hint");
  const b1Btn = $<HTMLButtonElement>(".es-b1");
  const b2Btn = $<HTMLButtonElement>(".es-b2");
  const rings = Array.from(root.querySelectorAll<HTMLElement>(".es-rings i"));

  g1.innerHTML = eyesSvg();

  // Personalização para usuário autenticado vs visitante
  if (o.isAuthenticated) {
    tag.textContent = o.userName
      ? `Olá, ${o.userName.split(" ")[0]}! Seu plantão está pronto.`
      : "Sessão ativa encontrada. Bem-vindo(a) ao seu plantão!";
    b1Btn.textContent = "Acessar Plataforma";
    b2Btn.textContent = "Trocar de Perfil";
  } else {
    tag.textContent = "Enfermagem, passo a passo.";
    b1Btn.textContent = "Começar";
    b2Btn.textContent = "Já tenho uma conta";
  }

  // Configuração do vídeo transparente em WebM
  video.src = o.waveSrc || "/goti/goti-wave.webm";

  let timers: number[] = [];
  let anims: Animation[] = [];
  let animFrameId: number | null = null;
  let isVideoPlaying = false;
  let finished = false;

  const at = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
  };

  const A = (el: HTMLElement, kf: Keyframe[], opt: KeyframeAnimationOptions) => {
    const a = el.animate(kf, { fill: "forwards", easing: "ease", ...opt });
    anims.push(a);
    return a;
  };

  const look = (x: number, y: number) => {
    g1.querySelectorAll<SVGGElement>(".pu").forEach((p) => {
      p.style.transform = `translate(${x}px,${y}px)`;
    });
  };

  const blink = () => {
    g1.classList.add("blink");
    at(130, () => g1.classList.remove("blink"));
  };

  const clearAll = () => {
    timers.forEach(clearTimeout);
    timers = [];
    anims.forEach((a) => a.cancel());
    anims = [];
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    isVideoPlaying = false;
    try {
      video.pause();
    } catch {}
  };

  // Motor de renderização do Canvas para o vídeo WebM transparente (Ultra HD sem dithering)
  const startCanvasLoop = () => {
    if (isVideoPlaying) return;
    isVideoPlaying = true;

    video.play().catch(() => {
      // Fallback gracioso para ilustração nítida caso o navegador bloqueie autoplay
      canvas.style.display = "none";
      fallback.style.display = "block";
      fallback.src = "/goti/goti-pose-happy.png";
    });

    const ctx = canvas.getContext("2d", { alpha: true });

    const render = () => {
      if (!isVideoPlaying) return;
      if (video.readyState >= 2 && ctx) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (vw > 0 && vh > 0) {
          const isWidescreen = vw >= 1400 && vh >= 700;
          const sDim = isWidescreen ? Math.min(vw, Math.floor(vh * 0.96)) : Math.min(vw, vh);
          const sx = isWidescreen ? Math.floor((vw - sDim) / 2) : 0;
          const sy = isWidescreen ? Math.floor(vh * 0.03) : 0;
          const sw = sDim;
          const sh = sDim;

          if (canvas.width !== sw || canvas.height !== sh) {
            canvas.width = sw;
            canvas.height = sh;
          }
          ctx.clearRect(0, 0, sw, sh);
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        }
      }
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
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
    if (skipHint) skipHint.style.display = "none";

    A(ttl, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 400 });
    A(tag, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 100 });
    A(btns, [{ opacity: 0, transform: "translateY(48px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 150, easing: SPR });

    // Mantém a tela no estado final com os botões visíveis, aguardando a interação do usuário
    done();
  };

  // Pular ou reduzir movimento: vai direto ao estado final com Goti pronto
  const toEnd = () => {
    clearAll();
    bg.style.background = "#0E1720";
    paper.style.clipPath = "circle(150% at 50% 50%)";
    mark.style.opacity = "0";
    g1.style.opacity = "0";
    g2.style.opacity = "1";
    g2.style.transform = "none";
    sh.style.opacity = "1";
    startCanvasLoop();
    ready();
  };

  const run = () => {
    root.classList.add("es-playing");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      toEnd();
      return;
    }

    // 0s: Olhos com brilho total
    A(bg, [{ background: "#0B131D" }, { background: "#0E1720" }], { duration: 180 });
    A(mark, [{ opacity: 0.35 }, { opacity: 0.8 }], { duration: 180 });
    A(g1, [{ transform: tf(0.9), filter: "brightness(.9)" }, { transform: tf(1), filter: "brightness(1)" }], { duration: 220, easing: SPR });

    // Olhos olham suavemente para a esquerda e para a direita uma única vez
    at(350, () => look(-18, 2));
    at(1050, () => look(18, 2));
    at(1650, () => look(0, 0));

    // ~1,85s: Os olhos encolhem suavemente até virar o ponto luminoso
    at(1850, () => {
      A(g1, [
        { transform: tf(1), opacity: 1 },
        { transform: tf(1.08), opacity: 1, offset: 0.2 },
        { transform: tf(0.03), opacity: 1, offset: 0.95 },
        { transform: tf(0.03), opacity: 0 },
      ], { duration: 320, easing: "cubic-bezier(.6,0,.9,.4)" });
      A(mark, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    });

    // 2,15s: O pontinho vira o círculo que se expande
    at(2150, () => {
      A(paper, [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(150% at 50% 50%)" }], { duration: 600, easing: "cubic-bezier(.65,0,.2,1)" });
      rings.forEach((r, i) =>
        A(r, [{ opacity: 0.9, transform: "scale(.4)" }, { opacity: 0, transform: "scale(8)" }], { duration: 750, delay: i * 90, easing: "cubic-bezier(.2,.7,.2,1)" }));
    });

    // 2,45s: O Goti surge acenando
    at(2450, () => {
      g2.style.opacity = "1";
      startCanvasLoop();

      A(g2, [
        { opacity: 0, transform: "translateY(50px) scale(.95,1.05)" },
        { opacity: 1, transform: "translateY(-12px) scale(.98,1.03)", offset: 0.35 },
        { opacity: 1, transform: "none" },
      ], { duration: 600, easing: "cubic-bezier(.33,0,.2,1)" });

      A(sh, [
        { opacity: 0, transform: "scale(.3)" },
        { opacity: 1, transform: "scale(1)" },
      ], { duration: 600 });
    });

    at(2900, ready);
  };

  const onPointerDown = (e: MouseEvent | TouchEvent) => {
    if (root.classList.contains("es-ready")) return;
    toEnd();
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

  root.addEventListener("pointerdown", onPointerDown as any);
  if (skipHint) skipHint.addEventListener("click", onSkip);
  b1Btn.addEventListener("click", b1);
  b2Btn.addEventListener("click", b2);

  run();

  return () => {
    clearAll();
    root.removeEventListener("pointerdown", onPointerDown as any);
    if (skipHint) skipHint.removeEventListener("click", onSkip);
    b1Btn.removeEventListener("click", b1);
    b2Btn.removeEventListener("click", b2);
    root.classList.remove("es-ready", "es-playing");
    root.innerHTML = "";
  };
}
// ENGINE END

export default function EnfereSplash({
  onGetStarted,
  onHaveAccount,
  onIntroComplete,
  isAuthenticated = false,
  userName = "",
  waveSrc = "/goti/goti-wave.webm",
  className = "",
  style
}: EnfereSplashProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef({ onGetStarted, onHaveAccount, onIntroComplete, waveSrc, isAuthenticated, userName });
  cb.current = { onGetStarted, onHaveAccount, onIntroComplete, waveSrc, isAuthenticated, userName };

  useEffect(() => {
    if (!ref.current) return;
    return mountEnfereSplash(ref.current, {
      waveSrc: cb.current.waveSrc,
      isAuthenticated: cb.current.isAuthenticated,
      userName: cb.current.userName,
      onGetStarted: () => cb.current.onGetStarted?.(),
      onHaveAccount: () => cb.current.onHaveAccount?.(),
      onIntroComplete: () => cb.current.onIntroComplete?.(),
    });
  }, []); // Executa estritamente uma única vez por montagem da tela

  return (
    <>
      <style>{CSS}</style>
      <div ref={ref} className={`enfere-splash ${className}`} style={style} />
    </>
  );
}
