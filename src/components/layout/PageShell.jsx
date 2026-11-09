import React from "react";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";

// Largura da coluna principal. "xl" é uma coluna de celular em qualquer tela; "4xl" cresce a partir do md,
// como a página de Procedimentos.
const LARGURAS = { xl: "max-w-xl", "4xl": "max-w-xl md:max-w-4xl", "6xl": "max-w-xl md:max-w-4xl lg:max-w-6xl" };

/**
 * PageShell: esqueleto das páginas novas. Cabeçalho só no computador, coluna central, rodapé e menu de baixo.
 * Props: `activeTab` (aba marcada no cabeçalho), `semDock` (sem o menu de baixo), `larguraMax` ("xl" | "4xl" | "6xl"),
 * `className` (acrescentada à coluna central).
 * As páginas que já existem não migram para ele: só as novas o usam.
 */
export default function PageShell({ activeTab = "hub", semDock = false, larguraMax = "xl", className = "", children }) {
  return (
    <div className={`min-h-screen bg-[#0B131D] text-[#EAF2F8] flex flex-col ${semDock ? "pb-8" : "pb-28 md:pb-8"}`}>
      <div className="hidden md:block">
        <StudentHeader activeTab={activeTab} />
      </div>

      <main
        className={`flex-1 mx-auto ${LARGURAS[larguraMax] || LARGURAS.xl} w-full px-4 sm:px-6 py-4 space-y-5 ${className}`.trim()}
      >
        {children}
      </main>

      <StudentFooter showDock={!semDock} />
    </div>
  );
}
