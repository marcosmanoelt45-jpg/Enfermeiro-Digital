import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { dentroDaBandeja, emRepouso, layoutDaMesa, PARAMS, passo, vagaNaBandeja, vagasIniciais } from "../../logica/mesaFisica.js";

// Cena "mesa": a mesa vista de cima, a bandeja no centro e os objetos de verdade em volta. Arrastar pega o objeto
// (a mão fecha), ele balança na mão, cai com gravidade ao soltar e empurra quem estiver no caminho. A bandeja tem
// parede: o que cai dentro fica inteiro no fundo, o que está fora não fica em cima da borda. O nome do objeto
// flutua acima dele (como um apelido) ao passar o mouse ou enquanto está na mão. Só transform e opacity são
// animados. Teclado e leitor de tela: cada objeto é um botão; Enter/Espaço põe ou tira da bandeja.
const PARAMS_REDUZIDO = { ...PARAMS, seguir: 1, balanco: 0, gravidade: 1, quique: 0, parede: 1 };

export default function MesaBandeja({ definicao, conferir, feedback }) {
  const { alvos, itens, cena } = definicao.arrastar;
  const alvo = alvos[0];
  const mesaRef = useRef(null);
  const etiquetaRef = useRef(null);
  const [largura, setLargura] = useState(0);
  const layout = useMemo(() => layoutDaMesa(largura || 800), [largura]);
  const paisagem = layout.paisagem;
  // Arrumação diferente a cada rodada (o componente remonta a cada "Tentar de novo").
  const [semente] = useState(() => Math.floor(Math.random() * 1e9));

  const objs = useRef([]);
  const els = useRef({}); // id -> { obj, sombra }
  const alvoPonteiro = useRef(null);
  const quadro = useRef(0);
  const [pegando, setPegando] = useState(null);
  const [sobre, setSobre] = useState(null); // objeto com o mouse por cima
  const ativoRef = useRef(null); // objeto cujo nome aparece
  const [ordem, setOrdem] = useState(() => itens.map((i) => i.id));
  const reduzido = useRef(false);
  const layoutDaMesaAnterior = useRef(null);
  const porId = useMemo(() => new Map(itens.map((i) => [i.id, i])), [itens]);
  const ativo = pegando ?? sobre;
  ativoRef.current = ativo;

  useEffect(() => {
    try {
      reduzido.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduzido.current = false;
    }
  }, []);

  // Tamanho da mesa.
  useLayoutEffect(() => {
    const el = mesaRef.current;
    if (!el) return undefined;
    const medir = () => setLargura(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const desenhar = useCallback(() => {
    const el = mesaRef.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const lado = layout.lado * W;
    for (const o of objs.current) {
      const ref = els.current[o.id];
      if (!ref?.obj) continue;
      const x = o.x * W - lado / 2;
      const y = o.y * H - lado / 2;
      const escala = 1 + o.h * 0.14;
      ref.obj.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${o.rot.toFixed(2)}deg) scale(${escala.toFixed(3)})`;
      if (ref.sombra) {
        ref.sombra.style.transform = `translate3d(${(x + o.h * lado * 0.1).toFixed(2)}px, ${(y + lado * 0.06 + o.h * lado * 0.16).toFixed(2)}px, 0) scale(${(0.86 + o.h * 0.12).toFixed(3)})`;
        ref.sombra.style.opacity = String(Math.max(0.12, 0.38 - o.h * 0.18));
      }
    }
    // O nome acompanha o objeto ativo, sempre em pé e acima dele (some ao subir demais, vira para baixo).
    const et = etiquetaRef.current;
    const o = objs.current.find((x) => x.id === ativoRef.current);
    if (et && o) {
      const cx = o.x * W;
      const topo = o.y * H - (lado / 2) * (1 + o.h * 0.14);
      const embaixo = topo < 34;
      const ty = embaixo ? o.y * H + (lado / 2) * (1 + o.h * 0.14) + 6 : topo - 6;
      et.style.transform = `translate3d(${cx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) translate(-50%, ${embaixo ? "0" : "-100%"})`;
    }
  }, [layout]);

  // Laço de animação: roda enquanto algo se mexe ou ainda está encostado, e dorme quando tudo se resolve.
  const animar = useCallback(() => {
    if (quadro.current) return;
    const opcoes = { proporcao: layout.proporcao, bandeja: layout.bandeja };
    const tick = () => {
      passo(objs.current, { ...opcoes, alvo: alvoPonteiro.current, params: reduzido.current ? PARAMS_REDUZIDO : PARAMS });
      desenhar();
      quadro.current = emRepouso(objs.current, opcoes) ? 0 : requestAnimationFrame(tick);
    };
    quadro.current = requestAnimationFrame(tick);
  }, [desenhar, layout]);
  const animarRef = useRef(animar);
  useEffect(() => {
    animarRef.current = animar;
  }, [animar]);

  // Arrumação inicial (e rearrumação quando muda de paisagem para retrato).
  useEffect(() => {
    const vagas = vagasIniciais(itens.length, layout, semente);
    const anteriores = new Map(objs.current.map((o) => [o.id, o]));
    const bandejaAntes = layoutDaMesaAnterior.current?.bandeja ?? layout.bandeja;
    const novos = [];
    itens.forEach((item, i) => {
      const antes = anteriores.get(item.id);
      const base = { id: item.id, vx: 0, vy: 0, vrot: 0, h: 0, vh: 0, arrastando: false, raio: layout.lado / 2, origem: vagas[i] };
      if (antes && dentroDaBandeja(antes, bandejaAntes)) {
        // Continua na bandeja, cada um na sua vaga (calculada contra os que já foram recolocados).
        novos.push({ ...base, ...vagaNaBandeja(novos, layout.bandeja, layout.lado / 2, layout.proporcao), rot: antes.rot, rotRepouso: antes.rotRepouso ?? 0 });
      } else {
        novos.push({ ...base, x: vagas[i].x, y: vagas[i].y, rot: vagas[i].rot, rotRepouso: vagas[i].rot });
      }
    });
    objs.current = novos;
    layoutDaMesaAnterior.current = layout;
    cancelAnimationFrame(quadro.current);
    quadro.current = 0;
    desenhar();
    // Se algo ficou encostado, a física resolve.
    requestAnimationFrame(() => animarRef.current?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paisagem, itens]);

  useEffect(() => {
    desenhar();
  }, [largura, desenhar, ativo]);

  useEffect(() => () => cancelAnimationFrame(quadro.current), []);

  const pontoNaMesa = (e) => {
    const r = mesaRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const pegar = (id, e) => {
    if (feedback) return;
    e.preventDefault();
    const o = objs.current.find((x) => x.id === id);
    if (!o) return;
    o.arrastando = true;
    alvoPonteiro.current = pontoNaMesa(e);
    mesaRef.current.setPointerCapture?.(e.pointerId);
    setPegando(id);
    setOrdem((ord) => [...ord.filter((x) => x !== id), id]); // o que está na mão fica por cima
    animar();
  };

  const mover = (e) => {
    if (!pegando) return;
    alvoPonteiro.current = pontoNaMesa(e);
  };

  const soltar = () => {
    if (!pegando) return;
    const o = objs.current.find((x) => x.id === pegando);
    if (o) {
      o.arrastando = false;
      o.vh = 0.015;
      o.rotRepouso = Math.max(-14, Math.min(14, o.rot * 0.4));
    }
    alvoPonteiro.current = null;
    setPegando(null);
    animar();
  };

  // Teclado: põe na bandeja ou devolve para o lugar de origem.
  const alternar = (id) => {
    if (feedback) return;
    const o = objs.current.find((x) => x.id === id);
    if (!o) return;
    const destino = dentroDaBandeja(o, layout.bandeja) ? o.origem : vagaNaBandeja(objs.current.filter((x) => x !== o), layout.bandeja, o.raio, layout.proporcao);
    o.x = destino.x;
    o.y = destino.y;
    o.h = 0.6;
    o.vh = 0;
    setOrdem((ord) => [...ord.filter((x) => x !== id), id]);
    animar();
  };

  const enviar = () => conferir(Object.fromEntries(itens.map((i) => {
    const o = objs.current.find((x) => x.id === i.id);
    return [i.id, o && dentroDaBandeja(o, layout.bandeja) ? alvo.id : null];
  })));

  const estado = (id) => feedback?.detalhes?.find((d) => d.id === id)?.estado;
  const b = layout.bandeja;
  const nomeAtivo = ativo ? porId.get(ativo)?.label : null;

  return (
    <div className="space-y-4">
      <div
        ref={mesaRef}
        className={`mesa-bandeja relative w-full select-none overflow-hidden rounded-3xl border-2 border-[#27394B] ${pegando ? "mesa-pegando" : ""}`}
        style={{ aspectRatio: String(layout.proporcao), backgroundImage: cena?.fundo ? `url(${cena.fundo})` : undefined, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#B97A57", touchAction: "none" }}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        role="group"
        aria-label={`Mesa com a ${alvo.label.toLowerCase()} no centro e os materiais em volta`}
      >
        {/* Bandeja */}
        <img
          src={cena?.bandeja ?? alvo.imagem}
          alt=""
          draggable={false}
          className="pointer-events-none absolute"
          style={{ left: `${(b.x - b.w / 2) * 100}%`, top: `${(b.y - b.h / 2) * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%`, objectFit: "fill", filter: "drop-shadow(0 10px 12px rgba(0,0,0,.28))" }}
        />

        {/* Sombras (debaixo de todos os objetos) */}
        {ordem.map((id) => (
          <div
            key={`s-${id}`}
            ref={(el) => { els.current[id] = { ...els.current[id], sombra: el }; }}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 rounded-full"
            style={{ width: `${layout.lado * 100}%`, aspectRatio: "1", background: "radial-gradient(closest-side, rgba(0,0,0,.55), rgba(0,0,0,0))", opacity: 0.3, willChange: "transform, opacity" }}
          />
        ))}

        {/* Objetos */}
        {ordem.map((id) => {
          const item = porId.get(id);
          const st = estado(id);
          return (
            <button
              key={id}
              type="button"
              ref={(el) => { els.current[id] = { ...els.current[id], obj: el }; }}
              onPointerDown={(e) => pegar(id, e)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setSobre(id)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setSobre((s) => (s === id ? null : s))}
              onFocus={() => setSobre(id)}
              onBlur={() => setSobre((s) => (s === id ? null : s))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  alternar(id);
                }
              }}
              aria-label={`${item.label}. Enter para colocar ou tirar da bandeja.`}
              className="mesa-objeto absolute left-0 top-0 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#20D5B5]"
              style={{ width: `${layout.lado * 100}%`, aspectRatio: "1", willChange: "transform", touchAction: "none" }}
            >
              <img src={item.imagemTopo ?? item.imagem} alt="" draggable={false} className="pointer-events-none h-full w-full object-contain" />
              {st && <span aria-hidden="true" className={`pointer-events-none absolute inset-[-6%] rounded-full border-4 ${st === "certo" ? "border-[#3DD68C]" : "border-[#FF6B6B]"}`} />}
            </button>
          );
        })}

        {/* Nome flutuante do objeto ativo (o "apelido" de quem está na mão ou sob o mouse) */}
        <div ref={etiquetaRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-50" style={{ willChange: "transform" }}>
          <span
            key={ativo ?? "nenhum"}
            className={`mesa-etiqueta block whitespace-nowrap rounded-full border-2 border-white/90 bg-[#0B131D]/90 px-3 py-1 text-[12px] font-extrabold text-white shadow-lg ${nomeAtivo ? "mesa-etiqueta-on" : "opacity-0"}`}
          >
            {nomeAtivo ?? ""}
          </span>
        </div>
      </div>

      <Button variant="primary" className="w-full" onClick={enviar} disabled={Boolean(pegando)}>Conferir</Button>
    </div>
  );
}

MesaBandeja.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
