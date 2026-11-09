import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/motion";
import PacienteMaca from "../ausculta/PacienteMaca.jsx";
import MaoEstetoscopio from "../ausculta/MaoEstetoscopio.jsx";
import { criarSomPulmonar, RUIDOS } from "../../audio/somPulmonar.js";
import { FOCOS, RAIO_ACERTO, dicaDeDirecao, distancia, qualidadeDoSom, ruidoNoFoco, sequencia } from "../../logica/ausculta.js";

const SEGURAR_MS = 1400;

// "Câmera" em primeira pessoa: a cena desliza um pouco com a mão. Para acertar o foco, a posição da mão é levada
// para o desenho do paciente (já deslocado), senão o aluno miraria num lugar e o jogo conferiria outro.
const cameraPara = (p, encostado) => ({ x: (200 - p.x) * 0.05, y: (250 - p.y) * 0.03, s: encostado ? 1.05 : 1 });
const noPaciente = (p, encostado) => {
  const c = cameraPara(p, encostado);
  return { x: p.x - c.x / c.s, y: p.y - c.y / c.s };
};
const VB = { w: 400, h: 500 };
const OPCOES = [
  ["normal", RUIDOS.normal],
  ["crepitantes_finos", "Estertores crepitantes"],
  ["sibilos", RUIDOS.sibilos],
  ["roncos", RUIDOS.roncos],
];

/**
 * Ausculta pulmonar em primeira pessoa: a mão com o estetoscópio segue o mouse/dedo; segurar sobre o tórax
 * ausculta. Quanto mais perto do foco certo, mais nítido o som. Os focos seguem a sequência da aula (frente e/ou
 * costas, comparando direita e esquerda). No fim, o aluno diz qual ruído ouviu.
 * def.ausculta = { achado, paciente, vistas }.
 */
export default function Ausculta({ definicao, conferir }) {
  const { achado, paciente = "marcus", vistas: vistasPedidas = ["costas"] } = definicao.ausculta;
  // Na frente só o Sr. Marcus; a Dona Teresinha é auscultada pelas costas.
  const vistas = useMemo(() => (paciente === "teresinha" ? ["costas"] : vistasPedidas), [paciente, vistasPedidas]);
  const passos = useMemo(() => vistas.flatMap((v) => sequencia(v)), [vistas]);
  const [indice, setIndice] = useState(0);
  const [fase, setFase] = useState("auscultar"); // auscultar | identificar
  const [mao, setMao] = useState({ x: 300, y: 300 });
  const [encostado, setEncostado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [feitos, setFeitos] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [errosFoco, setErrosFoco] = useState(0);
  const [escolha, setEscolha] = useState(null);
  const errosTotal = useRef(0);
  const som = useRef(null);
  const svg = useRef(null);
  const segurando = useRef(null);

  const alvo = passos[indice];
  const vista = fase === "auscultar" ? alvo?.vista ?? vistas[0] : vistas[vistas.length - 1];

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

  // Som do lugar onde o diafragma está: na fase de auscultar, a nitidez é a distância ao foco pedido;
  // na de identificar (ouvir livre), ao foco mais próximo.
  const atualizarSom = useCallback(
    (p) => {
      if (!som.current) return;
      const focosDaVista = FOCOS[vista];
      const perto = focosDaVista.reduce((a, b) => (distancia(a, p) <= distancia(b, p) ? a : b));
      const referencia = fase === "auscultar" ? alvo : perto;
      som.current.definir({ tipo: ruidoNoFoco(achado, perto), qualidade: qualidadeDoSom(distancia(referencia, p)) });
      // p aqui já está nas coordenadas do paciente (noPaciente).
    },
    [achado, alvo, fase, vista]
  );

  const soltar = useCallback(() => {
    if (segurando.current) cancelAnimationFrame(segurando.current.raf);
    segurando.current = null;
    setEncostado(false);
    setProgresso(0);
    som.current?.parar();
  }, []);

  const confirmarFoco = useCallback(
    (p) => {
      const d = distancia(alvo, p);
      if (d <= RAIO_ACERTO) {
        vibrate(15);
        setFeitos((f) => [...f, alvo]);
        setErrosFoco(0);
        setMensagem(null);
        if (indice + 1 >= passos.length) {
          setFase("identificar");
          setMensagem({ tom: "info", texto: "Pronto. Se quiser, ausculte de novo à vontade antes de responder." });
        } else {
          setIndice(indice + 1);
        }
      } else {
        vibrate([30, 40, 30]);
        errosTotal.current += 1;
        const n = errosFoco + 1;
        setErrosFoco(n);
        setMensagem({ tom: "alerta", texto: n >= 2 ? `Ainda fora do foco: ${dicaDeDirecao(alvo, p)}.` : "Fora do foco. Repare no som: perto do lugar certo ele fica mais nítido." });
      }
    },
    [alvo, errosFoco, indice, passos.length]
  );

  const aoEncostar = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = ponto(e);
    if (!p) return;
    setMao(p);
    setEncostado(true);
    atualizarSom(noPaciente(p, true));
    som.current?.tocar();
    if (fase !== "auscultar") return;
    const inicio = performance.now();
    const passo = () => {
      const t = Math.min(1, (performance.now() - inicio) / SEGURAR_MS);
      setProgresso(t);
      if (t >= 1) {
        const atual = segurando.current?.p ?? p;
        soltar();
        confirmarFoco(noPaciente(atual, true));
        return;
      }
      segurando.current.raf = requestAnimationFrame(passo);
    };
    segurando.current = { p, raf: requestAnimationFrame(passo) };
  };

  const aoMover = (e) => {
    const p = ponto(e);
    if (!p) return;
    setMao(p);
    if (encostado) {
      atualizarSom(noPaciente(p, true));
      if (segurando.current) segurando.current.p = p;
    }
  };

  const responder = () => {
    if (!escolha) return;
    soltar();
    const r = conferir({ focosCertos: passos.length, focosErros: errosTotal.current, ruido: escolha });
    if (!r?.concluido) setEscolha(null);
  };

  const camera = cameraPara(mao, encostado);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
        {fase === "auscultar" ? (
          <p>
            Foco {indice + 1} de {passos.length} · {alvo.vista === "frente" ? "tórax anterior" : "tórax posterior"} ·{" "}
            <span className="text-[#20D5B5]">
              nível {alvo.nivel}, lado {alvo.lado} do paciente
            </span>
            <span className="block text-xs font-semibold text-[#9FB3C6]">{alvo.nome}. Segure o estetoscópio no lugar para auscultar.</span>
          </p>
        ) : (
          <p>Qual ruído você ouviu neste paciente?</p>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border border-[#27394B] bg-gradient-to-b from-[#DCE7EE] to-[#C8D6DF]">
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
          aria-label="Tórax do paciente: mova e segure o estetoscópio para auscultar"
        >
          <motion.g animate={{ x: camera.x, y: camera.y, scale: camera.s }} transition={{ type: "spring", stiffness: 320, damping: 30 }} style={{ originX: `${mao.x}px`, originY: `${mao.y}px` }}>
            <PacienteMaca paciente={paciente} vista={vista} />
            {feitos
              .filter((f) => f.vista === vista)
              .map((f, i) => (
                <g key={f.id} transform={`translate(${f.x} ${f.y})`} aria-hidden="true">
                  <circle r="8" fill="#20D5B5" opacity="0.85" />
                  <text y="3.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0B131D">{f.nivel}</text>
                  <title>{`${i + 1}`}</title>
                </g>
              ))}
          </motion.g>
          <MaoEstetoscopio x={mao.x} y={mao.y} encostado={encostado} progresso={progresso} />
        </svg>
      </div>

      {mensagem && (
        <p role="status" aria-live="polite" className={`rounded-xl border px-3 py-2 text-sm font-bold ${mensagem.tom === "alerta" ? "border-[#FFC247]/50 bg-[#FFC247]/10 text-[#FFE2A3]" : "border-[#27394B] bg-[#131F2E]"}`}>
          {mensagem.texto}
        </p>
      )}

      {fase === "identificar" && (
        <div className="space-y-2">
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
      )}
    </div>
  );
}

Ausculta.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
