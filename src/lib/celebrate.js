/**
 * Confete leve em canvas (sem dependências, ~2 KB).
 *
 * Usado só em momentos raros (acerto de questão, meta do dia, fim de caso).
 * Cria um canvas temporário fixo sobre a tela, anima por ~1.6s e remove a si mesmo.
 * Respeita prefers-reduced-motion: nesse caso não faz nada.
 */
import { prefersReducedMotion } from "@/lib/motion";

const PALETTE = ["#20D5B5", "#3DD68C", "#FFC247", "#8B8FFF", "#FF8F8F", "#EAF2F8"];

let activeCanvas = null;

export function celebrate({ x = 0.5, y = 0.35, count = 70, spread = 70 } = {}) {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  if (activeCanvas) activeCanvas.remove();
  const canvas = document.createElement("canvas");
  activeCanvas = canvas;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "9999",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const originX = width * x;
  const originY = height * y;
  const particles = Array.from({ length: count }, () => {
    const angle = (-90 + (Math.random() - 0.5) * spread * 2) * (Math.PI / 180);
    const speed = 7 + Math.random() * 7;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      round: Math.random() > 0.6,
    };
  });

  const start = performance.now();
  const lifetime = 1600;

  const frame = (now) => {
    const elapsed = now - start;
    if (elapsed > lifetime || canvas !== activeCanvas) {
      canvas.remove();
      if (canvas === activeCanvas) activeCanvas = null;
      return;
    }
    ctx.clearRect(0, 0, width, height);
    const fade = elapsed > lifetime * 0.7 ? 1 - (elapsed - lifetime * 0.7) / (lifetime * 0.3) : 1;
    ctx.globalAlpha = Math.max(fade, 0);
    for (const p of particles) {
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
