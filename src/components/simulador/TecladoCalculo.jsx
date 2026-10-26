import React from "react";
import PropTypes from "prop-types";
import { Delete } from "lucide-react";

/**
 * TecladoCalculo
 *
 * Display de resposta com unidade clínica e teclado numérico virtual
 * próprio (1–9, vírgula, 0, backspace) com botões táteis 3D.
 */
export default function TecladoCalculo({
  valor = "",
  unidade = "mL",
  onKeyPress
}) {
  const keys = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    ",", "0", "BACKSPACE"
  ];

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Display do Valor Inserido */}
      <div className="flex items-center justify-between h-14 px-4 rounded-2xl border-2 border-[#2AD3C1] border-b-[5px] border-b-[#17A99A] bg-[#16222E]">
        <span
          className={`text-xl font-black ${
            valor ? "text-[#EAF2F8]" : "text-[#9FB3C6]/60"
          }`}
        >
          {valor || "Sua resposta"}
        </span>
        <span className="text-sm font-black text-[#9FB3C6] uppercase tracking-wider">
          {unidade}
        </span>
      </div>

      {/* Grade do Teclado 3x4 */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onKeyPress(k)}
            className="h-12 rounded-[14px] border-2 border-[#27394B] border-b-[4px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8] font-black text-xl flex items-center justify-center active:translate-y-[2px] active:border-b-2 hover:bg-[#1E2E3E] transition-all cursor-pointer"
          >
            {k === "BACKSPACE" ? (
              <Delete className="w-6 h-6 stroke-[2.3] text-[#9FB3C6]" />
            ) : (
              k
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

TecladoCalculo.propTypes = {
  valor: PropTypes.string,
  unidade: PropTypes.string,
  onKeyPress: PropTypes.func.isRequired
};
