import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { AnimatePresence, m as motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Janela de folha (prontuário, anotação) por cima da cena, como uma janela de navegador, mas sem moldura de
// computador: a própria prancheta (ou bloco) é a janela. Arrasta segurando a borda do desenho, muda de tamanho
// pelo canto e não cobre a conversa com fundo escuro. Tamanho com limite (nem minúscula
// nem maior que a tela) e sempre dentro da tela. Várias páginas: botão grande de virar a página no rodapé.
// Posição e tamanho ficam guardados na visita (sessionStorage) por janela.

const MIN_L = 300;
const MIN_A = 300;
const MARGEM = 8;
const EASE = [0.23, 1, 0.32, 1];

let topoZ = 60; // a janela tocada por último fica por cima
const proximoZ = () => ++topoZ;

const caber = (r) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxL = Math.min(760, vw - MARGEM * 2);
  const maxA = Math.min(900, vh - MARGEM * 2);
  const l = Math.max(Math.min(MIN_L, maxL), Math.min(r.l, maxL));
  const a = Math.max(Math.min(MIN_A, maxA), Math.min(r.a, maxA));
  const x = Math.min(Math.max(MARGEM, r.x), vw - l - MARGEM);
  const y = Math.min(Math.max(MARGEM, r.y), vh - a - MARGEM);
  return { x, y, l, a };
};

function inicial(lado) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw < 640) {
    // celular: ocupa a largura e metade de cima da tela (dá para continuar respondendo embaixo)
    // (a segunda janela abre um pouco mais abaixo, para as duas não ficarem exatamente uma sobre a outra)
    return caber({ x: MARGEM, y: lado === "direita" ? Math.round(vh * 0.12) : MARGEM, l: vw - MARGEM * 2, a: Math.round(vh * 0.55) });
  }
  const l = Math.min(460, vw * 0.42);
  const a = Math.min(640, vh - 120);
  return caber({ x: lado === "direita" ? vw - l - 24 : 24, y: 72, l, a });
}

function lerGuardado(id) {
  try {
    const r = JSON.parse(sessionStorage.getItem(`enfere_janela_${id}`) || "null");
    return r && ["x", "y", "l", "a"].every((k) => Number.isFinite(r[k])) ? caber(r) : null;
  } catch {
    return null;
  }
}

export default function JanelaFolha({ id, aberta, titulo, icone: Icone = null, tipo = "prancheta", lado = "esquerda", paginas, onFechar, pagina: paginaControlada, onPagina }) {
  const [ret, setRet] = useState(null);
  const [z, setZ] = useState(() => proximoZ());
  const [paginaInterna, setPaginaInterna] = useState(0);
  const pagina = paginaControlada ?? paginaInterna;
  const setPagina = onPagina ?? setPaginaInterna;
  const [direcao, setDirecao] = useState(1);
  const arrasto = useRef(null);
  const total = paginas.length;

  useLayoutEffect(() => {
    if (aberta && !ret) setRet(lerGuardado(id) ?? inicial(lado));
    if (aberta) setZ(proximoZ());
  }, [aberta]);

  useEffect(() => {
    if (!ret) return;
    try {
      sessionStorage.setItem(`enfere_janela_${id}`, JSON.stringify(ret));
    } catch {
      /* sem armazenamento */
    }
  }, [id, ret]);

  // a tela mudou de tamanho (girar o tablet): a janela volta para dentro
  useEffect(() => {
    const ajustar = () => setRet((r) => (r ? caber(r) : r));
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  useEffect(() => {
    if (!aberta) return undefined;
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberta, onFechar]);

  const comecar = (modo) => (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    arrasto.current = { modo, px: e.clientX, py: e.clientY, r: ret };
    setZ(proximoZ());
  };
  const mover = (e) => {
    const a = arrasto.current;
    if (!a) return;
    const dx = e.clientX - a.px;
    const dy = e.clientY - a.py;
    if (a.modo === "mover") setRet(caber({ ...a.r, x: a.r.x + dx, y: a.r.y + dy }));
    else setRet(caber({ ...a.r, l: a.r.l + dx, a: a.r.a + dy }));
  };
  const soltar = () => {
    arrasto.current = null;
  };

  const virar = useCallback(
    (passo) => {
      const nova = Math.min(total - 1, Math.max(0, pagina + passo));
      if (nova === pagina) return;
      setDirecao(passo);
      setPagina(nova);
    },
    [pagina, setPagina, total]
  );

  const atual = paginas[Math.min(pagina, total - 1)];

  if (typeof document === "undefined") return null;
  const bloco = tipo === "bloco";
  // Moldura = o próprio desenho (prancheta de madeira ou bloco amarelo). Segurar na moldura arrasta; o papel
  // não (dá para rolar, selecionar e escrever); o canto de baixo muda o tamanho.
  const moldura = bloco
    ? { backgroundColor: "#F2B53A", boxShadow: "inset 0 0 0 4px #D99A1E, 0 16px 36px rgba(0,0,0,0.55)" }
    : {
        backgroundColor: "#8A5E45",
        backgroundImage: "repeating-linear-gradient(176deg, rgba(0,0,0,0.10) 0 3px, transparent 3px 22px), repeating-linear-gradient(183deg, rgba(255,255,255,0.05) 0 6px, transparent 6px 37px)",
        boxShadow: "inset 0 0 0 5px #6B4A3A, 0 16px 36px rgba(0,0,0,0.55)",
      };
  const naoArrasta = (e) => e.stopPropagation();
  // no body: nenhum ancestral com transform atrapalha o position: fixed
  return createPortal(
    <AnimatePresence>
      {aberta && ret && (
        <motion.section
          role="dialog"
          aria-label={total > 1 ? `${titulo}: ${atual.titulo}` : titulo}
          className="fixed touch-none select-none"
          style={{ left: ret.x, top: ret.y, width: ret.l, height: ret.a, zIndex: z }}
          initial={{ opacity: 0, transform: "scale(0.96)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          exit={{ opacity: 0, transform: "scale(0.96)" }}
          transition={{ duration: 0.18, ease: EASE }}
        >
          <div
            className="relative flex h-full cursor-grab flex-col rounded-[20px] px-3 pb-2 pt-9 active:cursor-grabbing"
            style={moldura}
            onPointerDown={comecar("mover")}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          >
            {/* topo: prendedor de metal com o nome (prancheta) ou espiral (bloco) */}
            {bloco ? (
              <div className="pointer-events-none absolute inset-x-6 top-1.5 flex justify-between" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="h-6 w-2.5 rounded-full bg-gradient-to-b from-[#C9CED1] to-[#7E8589] shadow-[0_2px_0_rgba(0,0,0,0.25)]" />
                ))}
              </div>
            ) : (
              <div className="pointer-events-none absolute left-1/2 top-1 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-t-xl rounded-b-md bg-[#A6AAAA] px-4 shadow-[0_3px_0_#7A7F7D]" aria-hidden="true">
                {Icone && <Icone className="h-4 w-4 text-[#3B4140]" />}
                <span className="text-xs font-black uppercase tracking-wide text-[#3B4140]">{titulo}</span>
              </div>
            )}

            <button
              type="button"
              onPointerDown={naoArrasta}
              onClick={onFechar}
              className="absolute right-2 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0B131D]/80 text-[#EAF2F8] shadow-[0_2px_0_rgba(0,0,0,0.35)] transition-transform duration-100 active:scale-95"
              aria-label={`Fechar ${titulo}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* papel: rola, sem arrastar */}
            <div className={`relative min-h-0 flex-1 cursor-auto select-text overflow-y-auto overscroll-contain rounded-sm ${bloco ? "mt-5" : ""}`} onPointerDown={naoArrasta} style={{ touchAction: "pan-y" }}>
              <AnimatePresence mode="wait" initial={false} custom={direcao}>
                <motion.div
                  key={pagina}
                  className="h-full"
                  custom={direcao}
                  initial={{ opacity: 0, transform: `translateX(${direcao * 24}px)` }}
                  animate={{ opacity: 1, transform: "translateX(0px)" }}
                  exit={{ opacity: 0, transform: `translateX(${direcao * -24}px)` }}
                  transition={{ duration: 0.16, ease: EASE }}
                >
                  {atual.conteudo}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* pé da moldura: virar a página */}
            {total > 1 ? (
              <div className="flex shrink-0 items-center gap-2 pt-2" onPointerDown={naoArrasta}>
                <button
                  type="button"
                  onClick={() => virar(-1)}
                  disabled={pagina === 0}
                  className="flex h-10 items-center gap-1 rounded-xl bg-[#0B131D]/75 px-3 text-sm font-extrabold text-[#EAF2F8] disabled:opacity-35"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
                <span className="flex min-w-0 flex-1 justify-center gap-1.5" aria-label={`Página ${pagina + 1} de ${total}`}>
                  {paginas.map((p, i) => (
                    <button
                      key={p.titulo}
                      type="button"
                      onClick={() => virar(i - pagina)}
                      className={`h-2.5 rounded-full transition-[width] duration-200 ${i === pagina ? "w-6 bg-[#EAF2F8]" : "w-2.5 bg-[#0B131D]/45"}`}
                      aria-label={`Ir para ${p.titulo}`}
                      aria-current={i === pagina ? "page" : undefined}
                    />
                  ))}
                </span>
                <button
                  type="button"
                  onClick={() => virar(1)}
                  disabled={pagina === total - 1}
                  className="btn-3d-teal flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-extrabold disabled:opacity-40"
                  aria-label="Próxima página"
                >
                  <span className="hidden sm:inline">Virar página</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="h-3 shrink-0" />
            )}

            {/* canto: mudar o tamanho */}
            <div
              className="absolute -bottom-1 -right-1 z-10 h-7 w-7 cursor-nwse-resize"
              onPointerDown={(e) => {
                e.stopPropagation();
                comecar("tamanho")(e);
              }}
              onPointerMove={mover}
              onPointerUp={soltar}
              onPointerCancel={soltar}
              role="separator"
              aria-label="Arraste para mudar o tamanho"
            >
              <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
                <path d="M20 9 L9 20 M20 15 L15 20" stroke={bloco ? "#7A5208" : "#E9ECEB"} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.body
  );
}

JanelaFolha.propTypes = {
  id: PropTypes.string.isRequired,
  aberta: PropTypes.bool.isRequired,
  titulo: PropTypes.string.isRequired,
  icone: PropTypes.elementType,
  tipo: PropTypes.oneOf(["prancheta", "bloco"]),
  lado: PropTypes.oneOf(["esquerda", "direita"]),
  paginas: PropTypes.arrayOf(PropTypes.shape({ titulo: PropTypes.string.isRequired, conteudo: PropTypes.node })).isRequired,
  onFechar: PropTypes.func.isRequired,
  pagina: PropTypes.number,
  onPagina: PropTypes.func,
};
