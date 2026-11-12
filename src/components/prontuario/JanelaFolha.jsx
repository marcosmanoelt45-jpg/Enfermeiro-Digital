import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { AnimatePresence, m as motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GripHorizontal, X } from "lucide-react";

// Janela de folha (prontuário, anotação) por cima da cena, como uma janela de navegador: arrasta pela barra de
// título, muda de tamanho pelo canto e não cobre a conversa com fundo escuro. Tamanho com limite (nem minúscula
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

export default function JanelaFolha({ id, aberta, titulo, icone: Icone = null, cor = "#20D5B5", lado = "esquerda", paginas, onFechar, pagina: paginaControlada, onPagina }) {
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
  // no body: nenhum ancestral com transform atrapalha o position: fixed
  return createPortal(
    <AnimatePresence>
      {aberta && ret && (
        <motion.section
          role="dialog"
          aria-label={titulo}
          className="fixed flex flex-col overflow-hidden rounded-2xl border-2 bg-[#0B131D] shadow-[0_18px_44px_rgba(0,0,0,0.6)]"
          style={{ left: ret.x, top: ret.y, width: ret.l, height: ret.a, zIndex: z, borderColor: cor }}
          initial={{ opacity: 0, transform: "scale(0.96)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          exit={{ opacity: 0, transform: "scale(0.96)" }}
          transition={{ duration: 0.18, ease: EASE }}
          onPointerDown={() => setZ(proximoZ())}
        >
          {/* barra de título: arrastar */}
          <header
            className="flex shrink-0 cursor-grab touch-none select-none items-center gap-2 px-3 py-2 active:cursor-grabbing"
            style={{ backgroundColor: cor }}
            onPointerDown={comecar("mover")}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          >
            {Icone && <Icone className="h-5 w-5 shrink-0 text-[#0B131D]" aria-hidden="true" />}
            <h2 className="min-w-0 flex-1 truncate text-sm font-black text-[#0B131D]">
              {titulo}
              {total > 1 && <span className="font-extrabold opacity-70"> · {atual.titulo}</span>}
            </h2>
            <GripHorizontal className="h-4 w-4 shrink-0 text-[#0B131D]/60" aria-hidden="true" />
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onFechar}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B131D]/15 text-[#0B131D] transition-colors hover:bg-[#0B131D]/25"
              aria-label={`Fechar ${titulo}`}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          {/* conteúdo da página */}
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
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

          {/* rodapé: virar a página (botões grandes) */}
          {total > 1 && (
            <footer className="flex shrink-0 items-center gap-2 border-t border-[#27394B] bg-[#131F2E] px-2 py-2">
              <button
                type="button"
                onClick={() => virar(-1)}
                disabled={pagina === 0}
                className="btn-3d-outline flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-extrabold disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <span className="truncate text-xs font-black text-[#EAF2F8]">{atual.titulo}</span>
                <span className="flex gap-1.5 pt-1" aria-label={`Página ${pagina + 1} de ${total}`}>
                  {paginas.map((p, i) => (
                    <button
                      key={p.titulo}
                      type="button"
                      onClick={() => virar(i - pagina)}
                      className={`h-2.5 rounded-full transition-[width,background-color] duration-200 ${i === pagina ? "w-6" : "w-2.5 bg-[#27394B]"}`}
                      style={i === pagina ? { backgroundColor: cor } : undefined}
                      aria-label={`Ir para ${p.titulo}`}
                      aria-current={i === pagina ? "page" : undefined}
                    />
                  ))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => virar(1)}
                disabled={pagina === total - 1}
                className="btn-3d-teal flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-extrabold disabled:opacity-40"
                aria-label="Próxima página"
              >
                <span className="hidden sm:inline">Virar página</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </footer>
          )}

          {/* canto: mudar o tamanho */}
          <div
            className="absolute bottom-0 right-0 z-10 h-6 w-6 cursor-nwse-resize touch-none"
            onPointerDown={comecar("tamanho")}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            role="separator"
            aria-label="Arraste para mudar o tamanho da janela"
          >
            <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
              <path d="M22 10 L10 22 M22 16 L16 22" stroke={cor} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
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
  cor: PropTypes.string,
  lado: PropTypes.oneOf(["esquerda", "direita"]),
  paginas: PropTypes.arrayOf(PropTypes.shape({ titulo: PropTypes.string.isRequired, conteudo: PropTypes.node })).isRequired,
  onFechar: PropTypes.func.isRequired,
  pagina: PropTypes.number,
  onPagina: PropTypes.func,
};
