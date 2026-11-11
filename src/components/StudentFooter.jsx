import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";
import gotiLogoOficial from "@/assets/goti-icone-oficial.png";

// `showDock` (padrão: ligado) deixa as páginas sem o menu de baixo, como o PageShell com semDock.
export default function StudentFooter({ showDock = true }) {
  const navigate = useNavigate();

  return (
    <>
      <footer className={`mt-auto border-t border-[#1F3045] bg-[#0B131D] pt-6 ${showDock ? "pb-24" : "pb-6"} md:py-6 text-[#9FB3C6]`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <img
              src={gotiLogoOficial}
              alt="Goti"
              className="w-8 h-8 object-contain shrink-0"
            />
            <span className="font-extrabold text-[#EAF2F8]">Enfere</span>
            <span className="text-[#27394B]">•</span>
            <span className="text-[#20D5B5] font-medium">Raciocínio Clínico & Simulação de Enfermagem</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/privacidade-lgpd")}
              className="hover:text-[#20D5B5] flex items-center gap-1.5 transition-colors font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5]"
            >
              <ShieldCheck className="h-4 w-4 text-[#20D5B5]" />
              <span>Ajuda, FAQ & LGPD</span>
            </button>
            <span className="font-medium">
              Criador & Detentor dos Direitos: <strong className="text-[#EAF2F8]">Marcos Manoel Tavares Neumann</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Dock Inferior Móvel Estilo Orizon (Aparece em telas < md) */}
      {showDock && <MobileBottomDock />}
    </>
  );
}
