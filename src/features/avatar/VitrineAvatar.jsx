import React from "react";
import AvatarPessoa from "./AvatarPessoa.jsx";
import { CATEGORIAS, PADRAO, sortearAvatar } from "./pecas.js";

// Vitrine só de desenvolvimento (rota /dev/avatar): o avatar padrão, sorteados e cada opção de cada categoria,
// para conferir o desenho de todas as peças de uma vez.
export default function VitrineAvatar() {
  const grupos = CATEGORIAS.flatMap((c) => c.grupos.filter((g) => g.tipo !== "cor"));
  return (
    <div className="min-h-screen bg-[#0B131D] p-4 text-[#EAF2F8]">
      <div className="flex flex-wrap gap-3">
        <AvatarPessoa avatar={PADRAO} tamanho={200} />
        {Array.from({ length: 11 }, (_, i) => (
          <AvatarPessoa key={i} avatar={sortearAvatar(`v${i}`)} tamanho={130} redondo={i % 3 === 0} />
        ))}
      </div>
      {grupos.map((g) => (
        <div key={g.campo} className="mt-4">
          <p className="mb-1 text-sm font-black">{g.rotulo}</p>
          <div className="flex flex-wrap gap-2">
            {g.opcoes.map((o) => (
              <div key={o.id} className="text-center text-[10px] font-bold text-[#9FB3C6]">
                <AvatarPessoa avatar={{ ...PADRAO, cabeca: g.campo === "cabelo" || g.campo === "barba" ? "nenhum" : PADRAO.cabeca, [g.campo]: o.id }} tamanho={92} />
                {o.rotulo}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
