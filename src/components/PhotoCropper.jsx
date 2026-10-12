import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn } from "lucide-react";

const CONTAINER = 240;

export default function PhotoCropper({ file, onConfirm, onCancel }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgEl, setImgEl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result);
    reader.readAsDataURL(file);
  }, [file]);

  const onImgLoad = useCallback((e) => {
    const el = e.target;
    setImgEl(el);
    // centraliza e calcula zoom inicial para cobrir o container
    const scale = Math.max(CONTAINER / el.naturalWidth, CONTAINER / el.naturalHeight);
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
      // posição da imagem no container: centro + offset
      // no espaço da imagem original: (centroContainer - offset) / scale
      const drawW = imgEl.naturalWidth * scale;
      const drawH = imgEl.naturalHeight * scale;
      const destX = (CONTAINER - drawW) / 2 + offset.x;
      const destY = (CONTAINER - drawH) / 2 + offset.y;

      // mapeia o retângulo visível do container de volta para a imagem original
      const srcX = -destX / scale;
      const srcY = -destY / scale;
      const srcSize = CONTAINER / scale;

      ctx.drawImage(imgEl, srcX, srcY, srcSize, srcSize, 0, 0, 400, 400);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], "foto-perfil.jpg", { type: "image/jpeg" });
        onConfirm(croppedFile);
      }, "image/jpeg", 0.9);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <ZoomIn className="h-5 w-5 text-teal-600" />
          <h2 className="text-base font-semibold text-slate-800">Ajustar foto</h2>
        </div>
        <p className="mb-3 text-xs text-slate-400">Arraste para posicionar e use o controle para aproximar.</p>

        <div className="mx-auto flex flex-col items-center gap-3">
          <div
            className="relative overflow-hidden rounded-2xl bg-slate-100 touch-none select-none"
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
                className="absolute max-w-none"
                style={{
                  width: imgEl ? imgEl.naturalWidth * zoom : 0,
                  height: imgEl ? imgEl.naturalHeight * zoom : 0,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            )}
            {/* overlay com moldura quadrada */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/80 shadow-[0_0_0_2000px_rgba(0,0,0,0.35)]" />
          </div>

          <div className="flex w-full items-center gap-3 px-2">
            <span className="text-xs text-slate-400">-</span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-teal-600"
            />
            <span className="text-xs text-slate-400">+</span>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl" disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700" disabled={busy || !imgEl}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
