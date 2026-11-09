import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/motion";
import MaoEstetoscopio from "../ausculta/MaoEstetoscopio.jsx";
import { criarSomPulmonar, RUIDOS } from "../../audio/somPulmonar.js";
import { CENA, IMAGENS, SEGURAR_MS, gerador, montarCaso, somNoPonto } from "../../logica/ausculta.js";

const VB = CENA;
const ESCALA_MAO = 2.24;
const OPCOES = [
  ["normal", RUIDOS.normal],
  ["crepitantes_finos", "Estertores crepitantes"],
  ["sibilos", RUIDOS.sibilos],
  ["roncos", RUIDOS.roncos],
];

// "Câmera" em primeira pessoa: a cena desliza um pouco com a mão. A posição da mão é levada para o desenho do
// paciente (já deslocado), senão o aluno miraria num lugar e o jogo ouviria outro.
const cameraPara = (p, encostado) => ({ x: (VB.w / 2 - p.x) * 0.05, y: (VB.h / 2 - p.y) * 0.03, s: encostado ? 1.05 : 1 });
const noPaciente = (p, encostado) => {
  const c = cameraPara(p, encostado);
  return { x: p.x - c.x / c.s, y: p.y - c.y / c.s };
};

/**
 * Ausculta pulmonar livre, em primeira pessoa: a mão com o estetoscópio segue o mouse/dedo; encostar (segurar)
 * ausculta. O som fica nítido dentro dos campos pulmonares e mais forte perto do ponto de melhor ausculta do caso.
 * Ficar parado no som máximo por 1,5 s marca o ponto. O aluno responde o ruído quando quiser.
 * def.ausculta = { achado, paciente, vistas }.
 */
export default function Ausculta({ definicao, conferir }) {
  const { achado, paciente = "marcus", vistas: vistasPedidas = ["costas"] } = definicao.ausculta;
  // Na frente só o Sr. Marcus; a Dona Teresinha é auscultada pelas costas.
  const vistas = useMemo(() => (paciente === "teresinha" ? ["costas"] : vistasPedidas), [paciente, vistasPedidas]);
  // Anatomia e pontos do caso: estáveis durante a rodada.
  const caso = useMemo(() => montarCaso(achado, { rng: gerador(Math.floor(Math.random() * 1e9)), vistas, paciente }), [achado, vistas]);
  const [vista, setVista] = useState(vistas.includes("costas") ? "costas" : vistas[0]);
  const [mao, setMao] = useState({ x: 680, y: 720 });
  const [encostado, setEncostado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [marcado, setMarcado] = useState(null);
  const [escolha, setEscolha] = useState(null);
  const [aviso, setAviso] = useState(null);
  const som = useRef(null);
  const svg = useRef(null);
  const maximo = useRef(null);
  const posicao = useRef(null);

  useEffect(() => {
    som.current = criarSomPulmonar();
    return () => som.current?.fechar();
  }, []);

  const ponto = useCallback((e) => {
    const el = svg.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VB.w, y: ((e.clientY - r.top) / r.height) * VB.h };
  }, []);

  const pararMaximo = () => {
    if (maximo.current) cancelAnimationFrame(maximo.current.raf);
    maximo.current = null;
    setProgresso(0);
  };

  // Atualiza o som e, se estiver no máximo, conta o tempo parado para marcar o ponto.
  const ouvir = useCallback(
    (pTela) => {
      const p = noPaciente(pTela, true);
      posicao.current = p;
      const s = somNoPonto(caso, vista, p);
      som.current?.definir({ tipo: s.tipo, qualidade: s.qualidade });
      if (!s.noMaximo) {
        if (maximo.current) pararMaximo();
        return;
      }
      if (maximo.current) return;
      const desde = performance.now();
      const passo = () => {
        const t = Math.min(1, (performance.now() - desde) / SEGURAR_MS);
        setProgresso(t);
        if (t >= 1) {
          maximo.current = null;
          setProgresso(0);
          vibrate(15);
          setMarcado({ vista, ...(posicao.current ?? p) });
          setAviso("Esse é o ponto onde o som fica mais forte. Que ruído é esse?");
          return;
        }
        maximo.current.raf = requestAnimationFrame(passo);
      };
      maximo.current = { desde, raf: requestAnimationFrame(passo) };
    },
    [caso, vista]
  );

  const soltar = useCallback(() => {
    pararMaximo();
    setEncostado(false);
    som.current?.parar();
  }, []);

  const aoEncostar = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = ponto(e);
    if (!p) return;
    setMao(p);
    setEncostado(true);
    som.current?.tocar();
    ouvir(p);
  };

  const aoMover = (e) => {
    const p = ponto(e);
    if (!p) return;
    setMao(p);
    if (encostado) ouvir(p);
  };

  const responder = () => {
    if (!escolha) return;
    soltar();
    const r = conferir({ achouPonto: Boolean(marcado), ruido: escolha });
    if (!r?.concluido) setEscolha(null);
  };

  const camera = cameraPara(mao, encostado);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#9FB3C6]">Encoste o estetoscópio e procure onde o som fica mais forte. Fora dos pulmões ele fica abafado.</p>
        {vistas.length > 1 && (
          <div className="flex gap-1 rounded-xl border border-[#27394B] p-1" role="tablist" aria-label="Vista do tórax">
            {vistas.map((v) => (
              <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)} className={`rounded-lg px-3 py-1 text-xs font-bold ${vista === v ? "bg-[#20D5B5] text-[#0B131D]" : "text-[#9FB3C6]"}`}>
                {v === "frente" ? "Frente" : "Costas"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-3xl border border-[#27394B]">
        <svg
          ref={svg}
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="block h-auto w-full touch-none select-none"
          style={{ cursor: "none" }}
          onPointerDown={aoEncostar}
          onPointerMove={aoMover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onPointerLeave={() => encostado && soltar()}
          role="application"
          aria-label="Tórax do paciente: encoste e segure o estetoscópio para auscultar"
        >
          <motion.g animate={{ x: camera.x, y: camera.y, scale: camera.s }} transition={{ type: "spring", stiffness: 320, damping: 30 }} style={{ originX: `${mao.x}px`, originY: `${mao.y}px` }}>
            <image href={IMAGENS[`${paciente}-${vista}`]} width={VB.w} height={VB.h} preserveAspectRatio="xMidYMid slice" />
            {marcado && marcado.vista === vista && (
              <g transform={`translate(${marcado.x} ${marcado.y})`} aria-hidden="true">
                <circle r="24" fill="none" stroke="#20D5B5" strokeWidth="6" />
                <circle r="9" fill="#20D5B5" />
              </g>
            )}
          </motion.g>
          <MaoEstetoscopio x={mao.x} y={mao.y} encostado={encostado} progresso={progresso} escala={ESCALA_MAO} />
        </svg>
      </div>

      {aviso && (
        <p role="status" aria-live="polite" className="rounded-xl border border-[#20D5B5]/40 bg-[#20D5B5]/10 px-3 py-2 text-sm font-bold">
          {aviso}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-extrabold">Qual ruído você ouviu?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPCOES.map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              aria-pressed={escolha === id}
              onClick={() => setEscolha(id)}
              className={`rounded-2xl border-2 px-3 py-3 text-left text-sm font-bold transition-colors ${escolha === id ? "border-[#20D5B5] bg-[#20D5B5]/10" : "border-[#27394B] bg-[#131F2E]"}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <Button variant="primary" size="lg" className="w-full" disabled={!escolha} onClick={responder}>
          Confirmar
        </Button>
      </div>
    </div>
  );
}

Ausculta.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
