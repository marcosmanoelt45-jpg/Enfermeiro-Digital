import { useRef, useEffect, useState } from 'react';

/**
 * useDragScroll
 * Habilita arrasto horizontal intuitivo com o mouse (desktop) e mantém
 * a fluidez nativa de gestos por toque (mobile).
 * Previne disparos acidentais de clique ao arrastar.
 * Devolve uma ref de callback: liga os eventos quando o elemento aparece (ex.: gaveta aberta depois).
 */
export function useDragScroll() {
  const [el, setEl] = useState(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    if (!el) return;

    const onMouseDown = (e) => {
      // Ignora clique secundário (botão direito)
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      startXRef.current = e.pageX - el.offsetLeft;
      scrollLeftRef.current = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * 1.3;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = scrollLeftRef.current - walk;
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
    };

    const onMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        el.style.cursor = 'grab';
        el.style.removeProperty('user-select');
      }
    };

    // Previne disparo de clique caso tenha ocorrido arraste
    const onClickCapture = (e) => {
      if (hasMovedRef.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    el.style.cursor = 'grab';

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('click', onClickCapture, true);
      el.style.removeProperty('cursor');
    };
  }, [el]);

  return setEl;
}
