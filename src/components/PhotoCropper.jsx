import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const CONTAINER = 240;

export default function PhotoCropper({ file, onConfirm, onCancel }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgEl, setImgEl] = useState(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [busy, setBusy] = useState(false);

  // Fechar com Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel]);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result);
    reader.readAsDataURL(file);
  }, [file]);

  const onImgLoad = useCallback((e) => {
    const el = e.target;
    setImgEl(el);
    // Calcula zoom inicial de cobertura proporcional (case-studio-30)
    const scale = Math.max(CONTAINER / el.naturalWidth, CONTAINER / el.naturalHeight);
    setBaseScale(scale);
    setZoom(scale);
    setOffset({ x: 0, y: 0 });
  }, []);

  function onPointerDown(e) {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }
  function onPointerUp() { setDragging(false); }

  async function handleConfirm() {
    if (!imgEl) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");

      const scale = zoom;
      const drawW = imgEl.naturalWidth * scale;
      const drawH = imgEl.naturalHeight * scale;
      const destX = (CONTAINER - drawW) / 2 + offset.x;
      const destY = (CONTAINER - drawH) / 2 + offset.y;

      const srcX = -destX / scale;
      const srcY = -destY / scale;
      const srcSize = CONTAINER / scale;

      ctx.drawImage(imgEl, srcX, srcY, srcSize, srcSize, 0, 0, 400, 400);

      canvas.toBlob((blob) => {
        if (!blob) {
          setBusy(false);
          toast({ variant: "destructive", title: "Erro ao processar imagem", description: "Não foi possível recortar a foto." });
          return;
        }
        const croppedFile = new File([blob], "foto-perfil.jpg", { type: "image/jpeg" });
        onConfirm(croppedFile);
      }, "image/jpeg", 0.9);
    } catch {
      setBusy(false);
    }
  }

  const relativeZoom = baseScale > 0 ? zoom / baseScale : 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1722] border border-[#1F3045] p-6 shadow-2xl text-[#EAF2F8]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZoomIn className="h-5 w-5 text-[#20D5B5]" />
            <h2 id="cropper-title" className="text-base font-black text-white">Ajustar foto</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Fechar recorte"
            className="p-1 rounded-lg text-[#9FB3C6] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mb-4 text-xs text-[#9FB3C6]">
          Arraste para posicionar o rosto e use o controle deslizante para aproximar.
        </p>

        <div className="mx-auto flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-2xl bg-[#0B131D] border border-[#27394B] touch-none select-none"
            style={{ width: CONTAINER, height: CONTAINER }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imgSrc && (
              <img
                src={imgSrc}
                onLoad={onImgLoad}
                alt="preview"
                draggable={false}
                className="absolute max-w-none pointer-events-none"
                style={{
                  width: imgEl ? imgEl.naturalWidth * zoom : 0,
                  height: imgEl ? imgEl.naturalHeight * zoom : 0,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#20D5B5]/60 shadow-[0_0_0_2000px_rgba(11,19,29,0.6)]" />
          </div>

          {/* Slider relativo (1x a 4x da escala base) */}
          <div className="flex w-full items-center gap-3 px-2">
            <span className="text-xs font-bold text-[#9FB3C6]">1x</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={relativeZoom}
              onChange={(e) => setZoom(baseScale * Number(e.target.value))}
              aria-label="Nível de zoom da imagem"
              className="flex-1 accent-[#20D5B5] h-1.5 rounded-lg bg-[#16222E] cursor-pointer"
            />
            <span className="text-xs font-bold text-[#9FB3C6]">4x</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={busy || !imgEl}
            loading={busy}
            className="flex-1 font-black"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
