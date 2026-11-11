"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import logoEnfere from "@/assets/goti-icone-oficial.png";

/**
 * Enfere · tela de abertura (splash / onboarding)
 * 1. Abertura (~1 s, desenhada em código para rodar na taxa da tela): a logo salta com mola e o nome
 *    "Enfere" sobe logo abaixo. Curta de propósito: a pessoa abre o app várias vezes por dia.
 * 2. Tela dos botões: o Goti de costas, de óculos, lendo um prontuário (loop).
 *    Tocar nele: leva um susto, derruba a prancheta e os óculos, vira de frente e passa a acenar ("Oi").
 * Vídeos WebM com transparência no Chrome/Android; WebP animado no Safari/iOS (que não mostra WebM transparente).
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
  /** Caminho do vídeo do Goti acenando (depois do susto) */
  waveSrc?: string;
  className?: string;
  style?: CSSProperties;
}

const FONT = '"Nunito Variable","Nunito",ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif';
const LENDO = "/goti/goti-lendo";
const SUSTO = "/goti/goti-susto";
const SUSTO_MS = 2450; // duração do susto (3 s do Flow tocados a 1,25x)

const CSS = `
.enfere-splash{position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#0B131D;font-family:${FONT};user-select:none;-webkit-user-select:none;touch-action:manipulation;box-sizing:border-box}
.enfere-splash *{box-sizing:border-box;margin:0}
.enfere-splash .es-intro{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#0B131D}
.enfere-splash .es-logo{width:min(34vw,148px);height:auto;opacity:0;will-change:transform,opacity}
.enfere-splash .es-nome{font-size:2.6rem;font-weight:900;color:#20D5B5;letter-spacing:-0.02em;line-height:1;opacity:0;will-change:transform,opacity}
.enfere-splash .es-c2{position:absolute;left:0;right:0;top:32%;transform:translateY(-50%);display:flex;justify-content:center}
.enfere-splash .es-g2{position:relative;width:min(70vw,290px,38vh);aspect-ratio:1/1;opacity:0;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transform-origin:50% 92%}
.enfere-splash .es-g2:focus-visible{outline:3px solid #20D5B5;outline-offset:6px;border-radius:24px}
.enfere-splash .es-g2 video,.enfere-splash .es-g2 img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none}
.enfere-splash .es-g2 .on{opacity:1}
.enfere-splash .es-sh{position:absolute;left:18%;right:18%;bottom:0;height:7%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),rgba(0,0,0,0))}
.enfere-splash .es-ttl{position:absolute;left:0;right:0;top:55%;text-align:center;font-size:3.2rem;font-weight:900;color:#20D5B5;letter-spacing:-0.03em;line-height:1;opacity:0}
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
  .enfere-splash .es-c2 { top: 33%; }
  .enfere-splash .es-g2 { width: clamp(280px, 24vw, 360px); max-height: 42vh; }
  .enfere-splash .es-ttl { top: 57%; font-size: 3.6rem; }
  .enfere-splash .es-tag { top: 57%; margin-top: 4.2rem; font-size: 1.25rem; }
  .enfere-splash .es-btns { bottom: 40px; max-width: 440px; }
  .enfere-splash .es-btns button { font-size: 1.05rem; padding: 16px; }
}
`;

const MARKUP = `
<div class="es-intro"><img class="es-logo" alt="" draggable="false"><p class="es-nome" aria-label="Enfere">Enfere</p></div>
<div class="es-c2">
  <button type="button" class="es-g2" aria-label="Goti lendo um prontuário. Toque para chamar a atenção dele.">
    <i class="es-sh" aria-hidden="true"></i>
    <video class="es-v-lendo" muted playsinline loop preload="auto" aria-hidden="true"></video>
    <video class="es-v-susto" muted playsinline preload="auto" aria-hidden="true"></video>
    <video class="es-v-oi" muted playsinline loop preload="auto" aria-hidden="true"></video>
    <img class="es-i-lendo" alt="" draggable="false"><img class="es-i-susto" alt="" draggable="false"><img class="es-i-oi" alt="" draggable="false">
  </button>
</div>
<h1 class="es-ttl">Enfere</h1><p class="es-tag">Enfermagem, passo a passo.</p>
<div class="es-btns"><button type="button" class="es-b1">Começar</button><button type="button" class="es-b2">Já tenho uma conta</button></div>
<button type="button" class="es-skip-hint" aria-label="Pular introdução">Pular</button>
`;

// ENGINE START
interface MountOpts {
  waveSrc: string;
  isAuthenticated?: boolean;
  userName?: string;
  onGetStarted?: () => void;
  onHaveAccount?: () => void;
  onIntroComplete?: () => void;
}

const SPR = "cubic-bezier(.34,1.56,.64,1)";
const EASE_OUT = "cubic-bezier(.23,1,.32,1)";

/** Monta a tela de splash dentro de `root` e devolve a função de limpeza. */
function mountEnfereSplash(root: HTMLElement, o: MountOpts): () => void {
  root.innerHTML = MARKUP;
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const intro = $(".es-intro");
  const logo = $<HTMLImageElement>(".es-logo");
  const nome = $(".es-nome");
  logo.src = logoEnfere;
  const g2 = $<HTMLButtonElement>(".es-g2");
  const vLendo = $<HTMLVideoElement>(".es-v-lendo"), vSusto = $<HTMLVideoElement>(".es-v-susto"), vOi = $<HTMLVideoElement>(".es-v-oi");
  const iLendo = $<HTMLImageElement>(".es-i-lendo"), iSusto = $<HTMLImageElement>(".es-i-susto"), iOi = $<HTMLImageElement>(".es-i-oi");
  const ttl = $(".es-ttl"), tag = $(".es-tag"), btns = $(".es-btns");
  const skipHint = $(".es-skip-hint");
  (btns as HTMLElement & { inert: boolean }).inert = true;
  const b1Btn = $<HTMLButtonElement>(".es-b1");
  const b2Btn = $<HTMLButtonElement>(".es-b2");

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const safari =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || /^((?!chrome|android).)*safari/i.test(navigator.userAgent));

  // Personalização para usuário autenticado vs visitante
  if (o.isAuthenticated) {
    tag.textContent = o.userName
      ? `Olá, ${o.userName.split(" ")[0]}! Seu plantão está pronto.`
      : "Sessão ativa encontrada. Bem-vindo(a) ao seu plantão!";
    b1Btn.textContent = "Acessar Plataforma";
    b2Btn.textContent = "Trocar de Perfil";
  }

  let timers: number[] = [];
  let anims: Animation[] = [];
  let finished = false;
  let fase: "abertura" | "lendo" | "susto" | "oi" = "abertura";
  const urls: string[] = [];

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
    [vLendo, vSusto, vOi, iLendo, iSusto, iOi].forEach((x) => x.classList.toggle("on", x === el));
  };

  // Fontes: WebM com alfa fora do Safari; WebP animado no Safari. Com movimento reduzido, quadros parados.
  if (reduzir) {
    iLendo.src = `${LENDO}-poster.webp`;
    iOi.src = "/goti/goti-pose-happy.png";
  } else if (safari) {
    iLendo.src = `${LENDO}.webp`;
    // O aceno (WebP pesado) só é pedido quando o susto começa.
    // O WebP do susto toca uma vez: um endereço novo (blob) a cada toque faz ele começar do 1º quadro.
    fetch(`${SUSTO}.webp`).then((r) => r.blob()).then((b) => { (iSusto as HTMLImageElement & { _blob?: Blob })._blob = b; }).catch(() => {});
  } else {
    vLendo.src = `${LENDO}.webm`;
    vSusto.src = `${SUSTO}.webm`;
    vOi.src = o.waveSrc;
    [vLendo, vSusto, vOi].forEach((v) => {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.addEventListener("error", () => {
        // Sem o vídeo: cai para o WebP equivalente.
        const img = v === vLendo ? iLendo : v === vSusto ? iSusto : iOi;
        img.src = v === vLendo ? `${LENDO}.webp` : v === vSusto ? `${SUSTO}.webp` : "/goti/goti-oi.webp";
        if (v.classList.contains("on")) mostrar(img);
      });
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

  const acenar = () => {
    fase = "oi";
    g2.setAttribute("aria-label", "Goti acenando");
    if (reduzir || safari) mostrar(iOi);
    else {
      tocar(vOi);
      mostrar(vOi);
    }
  };

  // Toque no Goti enquanto ele lê: susto, derruba tudo, vira e dá oi.
  const cutucar = (e: Event) => {
    e.stopPropagation();
    if (fase !== "lendo") return;
    fase = "susto";
    if (reduzir) {
      acenar();
      return;
    }
    if (safari) {
      if (!iOi.src) iOi.src = "/goti/goti-oi.webp";
      const blob = (iSusto as HTMLImageElement & { _blob?: Blob })._blob;
      if (blob) {
        const u = URL.createObjectURL(blob);
        urls.push(u);
        iSusto.src = u;
        mostrar(iSusto);
        at(SUSTO_MS, acenar);
      } else acenar();
      return;
    }
    tocar(vSusto);
    // Troca para o susto só quando ele já está rodando, para não piscar.
    const trocar = () => mostrar(vSusto);
    if (vSusto.readyState >= 2) trocar();
    else vSusto.addEventListener("playing", trocar, { once: true });
    vSusto.addEventListener("ended", acenar, { once: true });
    at(SUSTO_MS + 800, () => fase === "susto" && acenar()); // reserva, se o `ended` não vier
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
    A(ttl, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 400 });
    A(tag, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 100 });
    A(btns, [{ opacity: 0, transform: "translateY(48px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 150, easing: SPR });
    done();
  };

  // Mostra o Goti lendo e os botões (fim da abertura, pulo ou movimento reduzido).
  const palco = (comAnimacao: boolean) => {
    ficarLendo();
    if (comAnimacao) {
      A(intro, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 });
      at(220, () => { intro.style.display = "none"; });
      A(g2, [
        { opacity: 0, transform: "translateY(20px) scale(.96)" },
        { opacity: 1, transform: "none" },
      ], { duration: 380, easing: SPR });
    } else {
      intro.style.display = "none";
      g2.style.opacity = "1";
    }
    ready();
  };

  const toEnd = () => {
    if (fase !== "abertura") return;
    clearAll();
    palco(false);
  };

  const run = () => {
    if (reduzir) {
      toEnd();
      return;
    }
    root.classList.add("es-playing");
    // Logo: salta de 0,6 com mola (passa um pouco de 1 e assenta). Nome: sobe 14 px logo depois.
    A(logo, [
      { opacity: 0, transform: "scale(.6)" },
      { opacity: 1, transform: "scale(1.06)", offset: 0.6 },
      { opacity: 1, transform: "scale(1)" },
    ], { duration: 420, easing: "cubic-bezier(.23,1,.32,1)" });
    A(nome, [
      { opacity: 0, transform: "translateY(14px)" },
      { opacity: 1, transform: "none" },
    ], { duration: 320, delay: 180 });
    at(950, () => fase === "abertura" && palco(true));
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
  g2.addEventListener("click", cutucar);
  b1Btn.addEventListener("click", b1);
  b2Btn.addEventListener("click", b2);

  run();

  return () => {
    clearAll();
    [vLendo, vSusto, vOi].forEach((v) => { try { v.pause(); } catch { /* nada */ } });
    urls.forEach((u) => URL.revokeObjectURL(u));
    root.removeEventListener("pointerdown", onPointerDown as EventListener);
    skipHint.removeEventListener("click", onSkip);
    g2.removeEventListener("click", cutucar);
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
  waveSrc = "/goti/goti-oi.webm",
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
