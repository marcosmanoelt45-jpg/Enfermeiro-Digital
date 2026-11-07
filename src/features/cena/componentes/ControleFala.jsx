import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Mic, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TOQUE_CURTO_MS = 300;

/**
 * Entrada do aluno: segurar para falar (ou Espaço no computador) + caixa de texto que cresce.
 * Em `revisando_texto` mostra Enviar e Descartar. Sem microfone, só o teclado.
 */
export default function ControleFala({
  status,
  suportaVoz,
  segurando,
  nivel = 0,
  textoParcial = "",
  rascunho = "",
  permissao = "desconhecido",
  onSegurar,
  onSoltar,
  onEnviar,
  onDescartar,
  onPedirPermissao,
  desabilitado = false,
  placeholder,
}) {
  const [texto, setTexto] = useState("");
  const [dica, setDica] = useState(false);
  const inicioToque = useRef(0);
  const areaTexto = useRef(null);
  const podeFalar = suportaVoz && !desabilitado && status !== "processando";
  const revisando = status === "revisando_texto";
  // Só envia quando a cena está esperando o aluno; fora disso o texto fica na caixa (a transição seria ignorada).
  const podeEnviar = !desabilitado && (status === "aguardando_aluno" || status === "revisando_texto");

  // O rascunho da transcrição (ou o texto preservado após um erro) entra na caixa para editar.
  useEffect(() => {
    if (rascunho && (status === "revisando_texto" || status === "erro_recuperavel")) setTexto(rascunho);
  }, [rascunho, status]);

  // Mostra a fala parcial enquanto o aluno segura.
  const valor = segurando && textoParcial ? textoParcial : texto;

  useEffect(() => {
    const el = areaTexto.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [valor]);

  const comecar = useCallback(async () => {
    if (!podeFalar || segurando) return;
    if (permissao === "desconhecido") await onPedirPermissao?.();
    inicioToque.current = Date.now();
    onSegurar?.();
  }, [podeFalar, segurando, permissao, onPedirPermissao, onSegurar]);

  const terminar = useCallback(() => {
    if (!segurando) return;
    if (Date.now() - inicioToque.current < TOQUE_CURTO_MS) {
      setDica(true);
      setTimeout(() => setDica(false), 2000);
    }
    onSoltar?.();
  }, [segurando, onSoltar]);

  // Espaço no computador, fora da caixa de texto.
  useEffect(() => {
    const noTeclado = (e) => e.target?.tagName === "TEXTAREA" || e.target?.tagName === "INPUT";
    const baixo = (e) => {
      if (e.code !== "Space" || e.repeat || noTeclado(e)) return;
      e.preventDefault();
      comecar();
    };
    const cima = (e) => {
      if (e.code !== "Space" || noTeclado(e)) return;
      e.preventDefault();
      terminar();
    };
    window.addEventListener("keydown", baixo);
    window.addEventListener("keyup", cima);
    return () => {
      window.removeEventListener("keydown", baixo);
      window.removeEventListener("keyup", cima);
    };
  }, [comecar, terminar]);

  const enviar = () => {
    const t = texto.trim();
    if (!t || !podeEnviar) return;
    onEnviar?.(t);
    setTexto("");
  };

  const descartar = () => {
    setTexto("");
    onDescartar?.();
  };

  return (
    <div className="space-y-2">
      {dica && (
        <p className="text-center text-xs font-bold text-[#FFC247]" role="status">
          Segure o botão enquanto fala.
        </p>
      )}
      {permissao === "negado" && (
        <p className="text-center text-xs font-bold text-[#FF6B6B]" role="status">
          Microfone bloqueado. Libere no cadeado do navegador ou digite abaixo.
        </p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          ref={areaTexto}
          value={valor}
          readOnly={segurando}
          rows={1}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder={placeholder ?? (suportaVoz ? "Fale ou escreva sua pergunta" : "Escreva sua pergunta")}
          disabled={desabilitado || status === "processando"}
          className="min-h-[48px] max-h-[120px] resize-none bg-[#131F2E] border-[#27394B] text-[#EAF2F8]"
          aria-label="Sua fala"
        />
        {suportaVoz && (
          <button
            type="button"
            disabled={!podeFalar}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              comecar();
            }}
            onPointerUp={terminar}
            onPointerCancel={terminar}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={segurando ? "Solte para enviar" : "Segure para falar"}
            aria-pressed={segurando}
            className="btn-3d-teal relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center touch-none select-none disabled:opacity-50"
            style={segurando ? { transform: `scale(${1 + nivel * 0.18})`, transition: "transform 80ms linear" } : undefined}
          >
            <Mic size={22} aria-hidden="true" />
          </button>
        )}
        <Button variant="primary" size="icon" onClick={enviar} disabled={!texto.trim() || !podeEnviar} aria-label="Enviar">
          <Send size={20} aria-hidden="true" />
        </Button>
      </div>
      {revisando && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={descartar}>
            <X size={16} aria-hidden="true" /> Descartar
          </Button>
        </div>
      )}
    </div>
  );
}

ControleFala.propTypes = {
  status: PropTypes.string.isRequired,
  suportaVoz: PropTypes.bool,
  segurando: PropTypes.bool,
  nivel: PropTypes.number,
  textoParcial: PropTypes.string,
  rascunho: PropTypes.string,
  permissao: PropTypes.string,
  onSegurar: PropTypes.func,
  onSoltar: PropTypes.func,
  onEnviar: PropTypes.func,
  onDescartar: PropTypes.func,
  onPedirPermissao: PropTypes.func,
  desabilitado: PropTypes.bool,
  placeholder: PropTypes.string,
};
