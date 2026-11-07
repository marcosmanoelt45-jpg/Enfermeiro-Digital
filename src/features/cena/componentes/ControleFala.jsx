import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Mic, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";


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
  const areaTexto = useRef(null);
  const podeFalar = suportaVoz && !desabilitado && status !== "processando";
  const revisando = status === "revisando_texto";
  // Só envia quando a cena está esperando o aluno; fora disso o texto fica na caixa (a transição seria ignorada).
  // Pode enviar também enquanto o personagem fala (a fala é interrompida); só não durante o processamento.
  const podeEnviar = !desabilitado && (status === "aguardando_aluno" || status === "revisando_texto" || status === "personagem_falando");

  // O rascunho da transcrição (ou o texto preservado após um erro) entra na caixa para editar.
  useEffect(() => {
    if (rascunho && (status === "revisando_texto" || status === "erro_recuperavel")) setTexto(rascunho);
  }, [rascunho, status]);

  // Mostra a fala parcial enquanto o aluno segura.
  // A transcrição não pode piscar: o parcial fica até a final chegar e, em revisão, o rascunho aparece no mesmo quadro.
  const [editado, setEditado] = useState(false);
  useEffect(() => {
    setEditado(false);
  }, [rascunho]);
  const valor = textoParcial || (texto === "" && revisando && !editado ? rascunho : texto);

  useEffect(() => {
    const el = areaTexto.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [valor]);

  const comecar = useCallback(async () => {
    if (!podeFalar || segurando) return;
    if (permissao === "desconhecido") await onPedirPermissao?.();
    onSegurar?.();
  }, [podeFalar, segurando, permissao, onPedirPermissao, onSegurar]);

  const terminar = useCallback(() => {
    if (!segurando) return;
    onSoltar?.();
  }, [segurando, onSoltar]);

  // Um clique começa a gravar e o próximo clique para e envia a fala para revisão.
  const alternar = useCallback(() => {
    if (segurando) terminar();
    else comecar();
  }, [segurando, terminar, comecar]);

  // Espaço no computador (fora da caixa de texto) também alterna.
  useEffect(() => {
    const noTeclado = (e) => e.target?.tagName === "TEXTAREA" || e.target?.tagName === "INPUT";
    const baixo = (e) => {
      if (e.code !== "Space" || e.repeat || noTeclado(e)) return;
      e.preventDefault();
      alternar();
    };
    window.addEventListener("keydown", baixo);
    return () => window.removeEventListener("keydown", baixo);
  }, [alternar]);

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
      {segurando && (
        <p className="text-center text-xs font-bold text-[#20D5B5]" role="status">
          Ouvindo… clique no microfone de novo para enviar.
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
          onChange={(e) => {
            setEditado(true);
            setTexto(e.target.value);
          }}
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
            onClick={alternar}
            aria-label={segurando ? "Parar e enviar" : "Clique para falar"}
            aria-pressed={segurando}
            className="btn-3d-teal relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center select-none disabled:opacity-50"
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
