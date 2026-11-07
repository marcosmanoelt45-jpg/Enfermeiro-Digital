import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/surface";
import { vibrate } from "@/lib/motion";

const MAX_CARACTERES = 8;
const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "apagar"];

/**
 * Teclado numérico 3D. Mostra sempre vírgula decimal (a conversão para ponto é da lógica).
 * Resposta inteira (gotas, ampolas) desabilita a vírgula. Funciona também com o teclado físico.
 */
export default function TecladoCalculo({ unidade, inteiro = false, desabilitado = false, onConferir, onQuestionar }) {
  const [valor, setValor] = useState("");

  const digitar = useCallback(
    (tecla) => {
      if (desabilitado) return;
      vibrate(8);
      setValor((v) => {
        if (tecla === "apagar") return v.slice(0, -1);
        if (tecla === ",") return inteiro || v.includes(",") ? v : `${v || "0"},`;
        if (v.length >= MAX_CARACTERES) return v;
        return v === "0" ? tecla : v + tecla;
      });
    },
    [desabilitado, inteiro]
  );

  const conferir = useCallback(() => {
    const limpo = valor.replace(/,$/, "");
    if (!limpo || desabilitado) return;
    onConferir(limpo);
    setValor("");
  }, [valor, desabilitado, onConferir]);

  useEffect(() => {
    const noTeclado = (e) => {
      const alvo = e.target?.tagName;
      if (alvo === "INPUT" || alvo === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) digitar(e.key);
      else if (e.key === "," || e.key === ".") digitar(",");
      else if (e.key === "Backspace") digitar("apagar");
      else if (e.key === "Enter") conferir();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", noTeclado);
    return () => window.removeEventListener("keydown", noTeclado);
  }, [digitar, conferir]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          role="status"
          aria-label={`Resposta em ${unidade}: ${valor || "vazia"}`}
          className="flex h-14 flex-1 items-center justify-end rounded-2xl border border-[#27394B] bg-[#0E1722] px-4 text-2xl font-black tabular-nums"
        >
          {valor || <span className="text-[#27394B]">0</span>}
        </div>
        <Chip tone="info" className="shrink-0 text-sm normal-case" aria-label={`Unidade: ${unidade}`}>{unidade}</Chip>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado numérico">
        {TECLAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => digitar(t)}
            disabled={desabilitado || (t === "," && inteiro)}
            aria-label={t === "apagar" ? "Apagar" : t === "," ? "Vírgula" : t}
            className="btn-3d-outline flex h-12 items-center justify-center rounded-2xl text-xl font-black disabled:opacity-40"
          >
            {t === "apagar" ? <Delete size={22} aria-hidden="true" /> : t}
          </button>
        ))}
      </div>

      <Button variant="primary" size="lg" className="w-full" onClick={conferir} disabled={desabilitado || !valor.replace(/,$/, "")}>
        Conferir
      </Button>
      <Button variant="warning" size="sm" className="w-full" onClick={onQuestionar} disabled={desabilitado}>
        Questionar prescrição
      </Button>
    </div>
  );
}

TecladoCalculo.propTypes = {
  unidade: PropTypes.string.isRequired,
  inteiro: PropTypes.bool,
  desabilitado: PropTypes.bool,
  onConferir: PropTypes.func.isRequired,
  onQuestionar: PropTypes.func.isRequired,
};
